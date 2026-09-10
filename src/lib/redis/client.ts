import "server-only";
import { Redis } from "ioredis";
import { env } from "@/lib/env";

let cached: Redis | null | undefined;

// Feature-detected on REDIS_URL alone. Returns null when unset — cache.ts
// and rate-limit.ts both fall back to safe no-op/in-memory behavior on
// null rather than throwing (see CLAUDE.md in this directory).
export function getRedisClient(): Redis | null {
  if (cached !== undefined) return cached;

  if (!env.REDIS_URL) {
    cached = null;
    return cached;
  }

  cached = new Redis(env.REDIS_URL, {
    // ioredis emits an unhandled 'error' event on every failed connection
    // attempt by default, which crashes the process if nothing listens.
    // A transient Redis outage should degrade (callers already tolerate a
    // null client; a rejected command surfaces the same way), not take
    // the whole app down with it.
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });
  cached.on("error", (error) => {
    console.error("[redis] connection error:", error.message);
  });
  cached.connect().catch(() => {
    // Already logged by the 'error' listener above.
  });

  return cached;
}
