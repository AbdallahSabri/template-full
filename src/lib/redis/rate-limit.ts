import "server-only";
import { getRedisClient } from "@/lib/redis/client";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

// Per-instance, in-process fallback — NOT durable and NOT shared across
// instances. See CLAUDE.md in this directory before "fixing" this into
// something that assumes otherwise.
const memoryStore = new Map<string, number[]>();

// Sliding-window rate limit: at most `limit` calls per `windowSeconds` per
// key. Redis-backed (sorted-set sliding-window log) when REDIS_URL is
// configured; an equivalent in-memory sliding window otherwise. A Redis
// failure mid-check fails open (allowed: true) — a broken rate limiter
// should not itself take the app down or lock everyone out.
export async function rateLimit(
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number },
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const now = Date.now();
  const windowStartMs = now - windowSeconds * 1000;

  if (redis) {
    try {
      const redisKey = `ratelimit:${key}`;
      const pipeline = redis.multi();
      pipeline.zremrangebyscore(redisKey, 0, windowStartMs);
      pipeline.zadd(
        redisKey,
        now,
        `${now}-${Math.random().toString(36).slice(2)}`,
      );
      pipeline.zcard(redisKey);
      pipeline.expire(redisKey, windowSeconds);
      const results = await pipeline.exec();
      const count = (results?.[2]?.[1] as number | undefined) ?? 0;
      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        retryAfterSeconds: windowSeconds,
      };
    } catch (error) {
      console.error(`[rate-limit] Redis check failed for key=${key}:`, error);
      return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
    }
  }

  const timestamps = (memoryStore.get(key) ?? []).filter(
    (t) => t > windowStartMs,
  );
  timestamps.push(now);
  if (timestamps.length > 0) {
    memoryStore.set(key, timestamps);
  } else {
    memoryStore.delete(key);
  }

  const count = timestamps.length;
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: windowSeconds,
  };
}
