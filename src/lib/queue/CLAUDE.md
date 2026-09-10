# src/lib/queue — publish() contract & the inline fallback

`client.ts`'s `getQueueChannel()` is feature-detected on `RABBITMQ_URL`
alone and returns `null` when unset. Never check `env.RABBITMQ_URL` at a
call site — always go through `publish()`.

## `publish(topic, payload, inlineHandler)`

When RabbitMQ is configured, publishes `payload` as JSON to a durable
queue named `topic`. When it isn't, or the publish itself fails,
`inlineHandler(payload)` runs **synchronously, in-process, right now**
instead. Both paths produce the same observable effect from the caller's
perspective — the entire point is that call sites never know or care
which one happened.

**Why the handler travels with every call**, instead of `publish()` just
taking a topic and payload: the inline path needs _something_ to run
immediately when there's no queue to defer to, and that has to be a real
function reference, not a topic string. This is different from `cache`
and `rate-limit`, which don't need a caller-supplied fallback because
"skip the cache" and "fail open" are total, parameter-free behaviors.

## The consumer side has its own dispatch table — keep them in sync

`consumer.ts` is a **separate worker process** (`pnpm queue:worker`), not
part of the Next.js server. When it actually receives a published
message, it can't run the `inlineHandler` closure that was in scope at
the original `publish()` call site — a function reference can't cross a
process boundary over AMQP. So `consumer.ts` looks the topic up in
`handlers/index.ts`'s `queueHandlers` map instead.

**This means every topic needs its handler defined once, as a named
export in `handlers/`, and referenced from both places** — the
`inlineHandler` argument at the `publish()` call site, and the
`queueHandlers` entry `consumer.ts` reads. They must be the literal same
function (import it, don't reimplement it), or the queued path and the
inline path will silently diverge in behavior. Adding a new topic means:
one handler file in `handlers/`, one entry in `handlers/index.ts`, and a
`publish("your-topic", payload, yourHandler)` call site — in that order,
so the dispatch table never lags behind what a call site actually needs.

## Running the consumer

`pnpm queue:worker` runs `consumer.ts` directly via `tsx` (not through
Next's build — this is a standalone long-lived process, not a route). It
no-ops immediately if `RABBITMQ_URL` is unset, since nothing was ever
published for it to consume. In production this needs to run as its own
process/service alongside the Next.js server (see the deploy checklist) —
it is not started automatically by `pnpm dev` or `pnpm start`.

**Why the script passes `--tsconfig tsconfig.worker.json`:** every server
module the worker imports (`email/send.ts`, this directory's `client.ts`,
…) carries `import "server-only"` for protection inside the real Next.js
app. That package only becomes a no-op when Next's own bundler resolves
it; run through plain `tsx`/Node, it unconditionally throws. Rather than
strip the guard from shared modules (weakening it for the actual app),
`tsconfig.worker.json` remaps the bare `server-only` specifier to
`scripts/noop-server-only.ts` — but only for this one tsx invocation. The
app's own `tsconfig.json` is untouched, so `server-only` still throws
correctly if a client component ever tries to import one of these
modules. Don't add a plain `import "server-only"` to `consumer.ts` itself
expecting it to protect anything — nothing imports the worker back.

**Why the script also passes `--env-file-if-exists=.env`:** unlike
`next dev`/`next build`, plain `tsx` doesn't load `.env` on its own —
`src/lib/env.ts` would see an empty `process.env` and throw immediately.
`--env-file-if-exists` (not `--env-file`, which errors when the file is
missing) loads it locally and is a silent no-op in production, where
Coolify injects runtime env vars directly into the process rather than
writing a `.env` file to disk.

A handler that throws gets its message `nack`'d without requeueing
(`channel.nack(message, false, false)`) — a handler that fails on a given
payload will fail again immediately on redelivery, so requeueing just
spins forever instead of draining the queue. This template has no
dead-letter exchange; add one if a topic actually needs retry semantics
beyond "drop and log."
