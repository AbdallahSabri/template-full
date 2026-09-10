import "server-only";
import { getRedisClient } from "@/lib/redis/client";

// Cache-aside wrapper: on a miss (including when Redis isn't configured),
// calls fn() and stores the result for ttlSeconds. Never throws on a
// Redis failure — a cache is an optimization, not a source of truth, so a
// broken cache should make a request slower, not fail it outright.
export async function wrap<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number,
): Promise<T> {
  const redis = getRedisClient();
  if (!redis) return fn();

  try {
    const cached = await redis.get(key);
    if (cached !== null) return JSON.parse(cached) as T;
  } catch (error) {
    console.error(`[cache] read failed for key=${key}:`, error);
  }

  const value = await fn();

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    console.error(`[cache] write failed for key=${key}:`, error);
  }

  return value;
}
