// `server-only`'s real implementation unconditionally throws unless
// Next.js's bundler is the one resolving it (it aliases the package to a
// no-op specifically in server bundles, and to the throwing version in
// client bundles). src/lib/queue/consumer.ts runs as a standalone worker
// process via `pnpm queue:worker`, outside Next's bundler entirely, but
// still imports modules (email/send.ts, redis/client.ts, etc.) that carry
// `import "server-only"` for protection inside the actual Next.js app.
//
// tsconfig.worker.json remaps the bare `server-only` specifier to this
// empty file — ONLY for that one tsx invocation — so the worker can run
// without weakening the guard for the real app, which still resolves
// `server-only` normally through Next.
export {};
