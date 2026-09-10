import "server-only";
import { getQueueChannel } from "@/lib/queue/client";

// Publishes to RabbitMQ (queue name = topic) when configured; otherwise
// runs `inlineHandler(payload)` directly, in-process, right now. Call
// sites never branch on RABBITMQ_URL — see CLAUDE.md in this directory
// for why the signature carries the handler instead of only a topic
// string, and for the consumer-side counterpart of this contract.
export async function publish<T>(
  topic: string,
  payload: T,
  inlineHandler: (payload: T) => Promise<void> | void,
): Promise<void> {
  const channel = await getQueueChannel();
  if (!channel) {
    await inlineHandler(payload);
    return;
  }

  try {
    await channel.assertQueue(topic, { durable: true });
    channel.sendToQueue(topic, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
    });
  } catch (error) {
    console.error(
      `[queue] publish failed for topic=${topic}, running inline instead:`,
      error,
    );
    await inlineHandler(payload);
  }
}
