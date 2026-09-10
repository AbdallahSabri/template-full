# src/lib/redis — cache & rate-limit fallback behavior

`client.ts`'s `getRedisClient()` is feature-detected on `REDIS_URL` alone
and returns `null` when unset. `cache.ts` and `rate-limit.ts` both branch
on that return value internally — never check `env.REDIS_URL` at a call
site, always go through `wrap()` / `rateLimit()`.

## `cache.wrap(key, fn, ttlSeconds)`

Cache-aside: on a miss (Redis absent, or a genuine cache miss, or a failed
Redis read) it calls `fn()` and best-effort writes the result back. A
Redis error during read or write is caught and logged, never thrown — the
cache is an optimization, and a broken cache should make a request
slower, not fail it.

## `rateLimit(key, { limit, windowSeconds })`

Sliding-window log. Redis-backed (a sorted set per key: score = timestamp,
member = unique per call, trimmed with `ZREMRANGEBYSCORE` and counted with
`ZCARD`) when configured. **When `REDIS_URL` is unset, it falls back to an
in-memory `Map<string, number[]>`** — this fallback is:

- **Per-instance.** Two app instances behind a load balancer each enforce
  the limit independently, so the _effective_ limit is `limit × instance
count`, not `limit`. Fine for a single-instance deploy or a dev
  environment; not a real guarantee once you scale horizontally.
- **Not durable.** A restart/redeploy clears it. Someone mid-lockout gets
  a clean slate.
- **Not bounded beyond what active keys imply.** Each key's timestamp
  array is pruned to the current window on every access, and an
  empty-after-pruning key is deleted — but a key that was hit once and
  never checked again lingers in the `Map` forever. Acceptable for a
  rate limiter (keys are bounded by "distinct IPs that have hit this
  route," which is small), not something to build a general-purpose cache
  on top of.

**Do not "fix" this by making the in-memory path assume single-instance
deployment is fine forever, and do not silently swap it for something
that pretends to be durable.** If real cross-instance rate limiting
matters, that means Redis is no longer optional for this deployment —
document that requirement wherever the deploy checklist lives, don't
paper over it here.

A Redis error mid-check (not "unconfigured", an actual failure against a
configured instance) fails **open** (`allowed: true`) — a broken rate
limiter must not itself take the app down or lock every user out.

## Where it's applied

`src/app/api/auth/[...all]/route.ts` wraps Better Auth's generated `POST`
handler to rate-limit `sign-in/email` and `sign-up/email` specifically,
keyed by `${pathname}:${ip}`, before delegating to Better Auth. Better
Auth's catch-all handles every `/api/auth/*` path through one handler, so
this is the one place able to gate specific auth sub-paths without
touching Better Auth internals.
