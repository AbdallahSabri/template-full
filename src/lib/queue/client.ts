import "server-only";
import amqp, { type Channel } from "amqplib";
import { env } from "@/lib/env";

let cached: Promise<Channel | null> | undefined;

// Feature-detected on RABBITMQ_URL alone. Returns null when unset —
// publish.ts falls back to running its inline handler directly rather
// than throwing (see CLAUDE.md in this directory). Caches the connect
// promise itself (not just its resolved value) so concurrent callers
// during startup share one in-flight connection attempt instead of
// racing to open several.
export function getQueueChannel(): Promise<Channel | null> {
  if (cached) return cached;

  if (!env.RABBITMQ_URL) {
    cached = Promise.resolve(null);
    return cached;
  }

  cached = amqp
    .connect(env.RABBITMQ_URL)
    .then(async (connection) => {
      // Both the connection and the channel emit 'error' — an unhandled
      // 'error' event on an EventEmitter crashes the process, and a
      // dropped AMQP connection is not something a publish() caller
      // should be able to take the app down with.
      connection.on("error", (error) => {
        console.error("[queue] connection error:", error.message);
      });
      const channel = await connection.createChannel();
      channel.on("error", (error) => {
        console.error("[queue] channel error:", error.message);
      });
      return channel;
    })
    .catch((error: unknown) => {
      console.error("[queue] failed to connect:", error);
      cached = undefined; // allow a later publish() to retry
      return null;
    });

  return cached;
}
