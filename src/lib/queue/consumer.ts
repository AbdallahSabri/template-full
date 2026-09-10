import amqp from "amqplib";
import { env } from "@/lib/env";
import { queueHandlers } from "@/lib/queue/handlers";

// Worker entrypoint — run with `pnpm queue:worker`, as its own long-lived
// process, separate from the Next.js server. No-ops if RABBITMQ_URL isn't
// configured: there's nothing published to consume, since publish() has
// already been running every handler inline instead. See CLAUDE.md in
// this directory for the publish()/consumer contract.
async function main() {
  if (!env.RABBITMQ_URL) {
    console.log(
      "[queue] RABBITMQ_URL not set — consumer has nothing to do, exiting.",
    );
    return;
  }

  const connection = await amqp.connect(env.RABBITMQ_URL);
  connection.on("error", (error) => {
    console.error("[queue] connection error:", error.message);
  });

  const channel = await connection.createChannel();
  channel.on("error", (error) => {
    console.error("[queue] channel error:", error.message);
  });

  for (const [topic, handler] of Object.entries(queueHandlers)) {
    await channel.assertQueue(topic, { durable: true });
    await channel.consume(topic, async (message) => {
      if (!message) return;
      try {
        const payload = JSON.parse(message.content.toString());
        await handler(payload);
        channel.ack(message);
      } catch (error) {
        console.error(`[queue] handler for topic=${topic} failed:`, error);
        // Don't requeue — a handler that fails on this payload will fail
        // again immediately, so requeueing just spins forever instead of
        // draining the queue. Losing the message is the template's
        // default; a dead-letter exchange is the real fix if a topic
        // needs it.
        channel.nack(message, false, false);
      }
    });
    console.log(`[queue] consuming topic=${topic}`);
  }
}

main().catch((error: unknown) => {
  console.error("[queue] consumer crashed:", error);
  process.exit(1);
});
