# CLAUDE.md — Stack Rules & Gates

Read `SPEC.md` for the milestone plan. This file is the standing rules that
apply across all milestones and all forks of this template.

---

## Stack

Next.js 16 (App Router, TypeScript strict) · Postgres · Drizzle ORM ·
Better Auth · Tailwind + shadcn/ui · lucide-react · next-themes · Zod.
Optional, feature-detected from env vars: Redis, RabbitMQ, S3-compatible
storage, Resend. Deployed on Coolify via multi-stage Docker,
`output: 'standalone'`.

Do not introduce: Supabase, Prisma, TypeORM, NextAuth/Auth.js, or any ORM
other than Drizzle, without an explicit instruction to swap it.

---

## Documentation maintenance

This root `CLAUDE.md` stays high-level: stack rules and gates that apply
everywhere. It does **not** grow to hold module-specific detail.

When a task builds out or meaningfully changes a module that has its own
conventions or gotchas (the query layer, storage, redis, queue, and any
new module that earns one) — create or update a `CLAUDE.md` **inside that
module's directory** as part of the task, without being asked. Root
`CLAUDE.md` gets a one-line pointer to it if needed, not the detail itself.

Rules for scoped `CLAUDE.md` files:

- Keep them short — the fallback behavior, the contract other code relies
  on, the one thing someone will get wrong if they don't read it. Not a
  full design doc.
- Update in place when the module's behavior changes; don't let it drift
  out of sync with the code.
- If a module never grows real conventions beyond "obvious from reading
  it," it doesn't need a `CLAUDE.md` — don't create one just to have one.

---

## Non-negotiable conventions

1. **`src/db/index.ts` is imported only inside `src/db/queries/`.** No route
   handler, component, or lib file touches the Drizzle client directly.
   Enforced by an ESLint `no-restricted-imports` rule — if it fires, fix the
   import, don't disable the rule.

2. **Every function in `src/db/queries/` takes a session (or explicit
   tenant/owner id) and scopes its query by it internally.** This is the
   entire authorization layer — there is no RLS underneath it. A query
   function that returns rows without checking ownership is a bug, not a
   style issue.

3. **`src/middleware.ts` checks only whether a session cookie exists.** It
   never makes an authorization decision — that happens in `queries/` where
   the row's owner is actually visible.

4. **Optional services are used through their interface, never checked
   inline at the call site.**
   - Cache: `cache.wrap(key, fn, ttl)` — never `if (getRedis())`.
   - Queue: `publish(topic, payload, inlineHandler)` — never
     `if (getRabbitMQ())`.
   - Email: `sendEmail(...)` — logs to console if Resend isn't configured,
     never throws.
   - Storage: `storage.*` helpers return a clear typed error if S3 env vars
     are absent; API routes surface that error, they don't crash.
     The rule: the app must run correctly, not just "not crash," with zero
     optional env vars set. If a feature only makes sense with an optional
     service present (e.g. uploads with no storage configured), fail with a
     clear message — don't silently pretend it worked.

5. **Env vars are validated once, in `src/lib/env.ts`, with Zod.** Required
   vars missing → throw at boot, not at first use. Optional vars are
   `.optional()`; nothing downstream assumes they're set.

6. **Migrations are generated, not hand-written.** `drizzle-kit generate`
   produces the SQL in `drizzle/`; review the diff before applying,
   especially for anything dropping a column or table.

7. **Build-time vs runtime env vars stay separated.** Only
   `NEXT_PUBLIC_*` values need to be present at `docker build`; everything
   else is injected by Coolify at runtime. Don't add a new
   `NEXT_PUBLIC_*` var without checking it actually needs to be
   client-visible.

8. **Theme and layout state stay client-side and simple.** `next-themes`
   owns light/dark/system — don't add a second theme mechanism or persist
   it anywhere but its own storage. Sidebar collapse/expand state doesn't
   need to survive a reload; don't over-engineer it into the database.

---

## Green gates (must be true before a milestone is marked done)

- `pnpm build` succeeds.
- `pnpm lint` passes, including the `no-restricted-imports` rule on
  `src/db/index.ts`.
- The feature works with **zero** optional env vars set, and again with
  **all** of them set — both runs are part of the gate, not just one.
- Any new query function in `src/db/queries/` takes a session/tenant
  argument and is scoped by it — check this by reading the function, not
  by trusting the diff description.
- Any module that got a scoped `CLAUDE.md` in this milestone has it
  committed and accurate — not deferred to "later."

## Red gates (stop and flag, don't push through)

- A component, route handler, or lib file outside `src/db/queries/`
  imports `src/db/index.ts`.
- A query function returns rows without filtering by the session's
  user/tenant.
- A call site branches on `REDIS_URL` / `RABBITMQ_URL` / `S3_BUCKET` /
  `RESEND_API_KEY` being set, instead of going through the shared
  interface.
- A migration in `drizzle/` drops or alters a column with no corresponding
  note in the PR/commit about data impact.
- A secret (API key, `DATABASE_URL`, `BETTER_AUTH_SECRET`) appears in a
  client component, a `NEXT_PUBLIC_*` var, or a committed file.
- Root `CLAUDE.md` picks up module-specific detail that belongs in a
  scoped `CLAUDE.md` instead.

---

## Commands

```bash
pnpm dev                 # local dev server
pnpm db:generate          # drizzle-kit generate (writes to drizzle/)
pnpm db:migrate           # apply pending migrations
pnpm lint                 # eslint, includes db-import restriction
pnpm build                # production build, output: standalone
pnpm queue:worker          # RabbitMQ consumer — separate long-lived process, no-ops if unconfigured
docker compose -f docker-compose.dev.yml --profile redis --profile queue --profile storage up
```

---

## Subagents

- `build-ui` — UI only (including the dashboard shell), never touches
  `src/db/` or `src/lib/auth.tsx`.
- `implement-logic` — route handlers + `src/db/queries/`, must follow
  conventions 1–3 above.
- `db-migration` — generates and reviews migrations before they're applied.
- `deploy-reviewer` — checks `docs/deploy-checklist.md` and the env var
  split before a Coolify deploy.

Full definitions live in `.claude/agents/`.

---

## When forking this template for a new project

Follow `docs/fork-checklist.md`. Do not skip the checklist to move faster —
it exists because the things it lists (new `BETTER_AUTH_SECRET`, new
Postgres database, DNS/SSL, Resend sending domain if used) are exactly the
things that fail silently three weeks later if skipped.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
