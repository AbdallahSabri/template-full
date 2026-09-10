# SPEC — Reusable Full-Stack Template

Next.js 16 + Postgres + Drizzle + Better Auth, with optional Redis, RabbitMQ,
AWS S3, and Resend, deployed on Coolify.

This spec is milestone-gated: each milestone has a **gate** that must pass
before the next one starts. Do not skip a gate to "come back to it later."

---

## 0. Goals & Non-Negotiables

- Fork this repo → new project running on Coolify in under a day.
- **Postgres is the only hard dependency.** Redis, RabbitMQ, S3, and Resend
  are feature-detected from env vars — the app must boot and run correctly
  with none of them set.
- No RLS. Authorization lives in one place: `src/db/queries/`. Nothing else
  is allowed to import the raw db client.
- Every optional integration is used through a stable interface
  (`cache.*`, `publish()`, `storage.*`, `sendEmail()`) — call sites never
  branch on whether the service is configured.
- **Documentation stays scoped.** Root `CLAUDE.md` holds only rules that
  apply everywhere. Module-specific detail goes in a `CLAUDE.md` inside
  that module's directory, created/updated as that milestone is built — see
  CLAUDE.md's "Documentation maintenance" section.

---

## 1. Tech Stack

| Layer | Choice | Required? |
|---|---|---|
| Framework | Next.js 16 (App Router), TypeScript strict | required |
| Styling | Tailwind + shadcn/ui | required |
| Icons | lucide-react | required |
| Theming | next-themes (light / dark / system) | required |
| Database | Postgres (Coolify-managed container) | required |
| ORM | Drizzle + drizzle-kit | required |
| Auth | Better Auth (Drizzle adapter) | required |
| Validation | Zod | required |
| Cache / rate-limit | Redis (`node-redis`) | optional |
| Queue | RabbitMQ (`amqplib`) | optional |
| Object storage | S3-compatible (AWS S3 prod / MinIO dev) | optional |
| Transactional email | Resend + react-email | optional |
| Deploy | Coolify, multi-stage Dockerfile, `output: 'standalone'` | required |
| Monitoring | Uptime Kuma (health route), Beszel | required |

---

## 2. File Structure

```
├── CLAUDE.md                     # root: rules that apply everywhere
├── SPEC.md                       # this file
├── .env.example
├── docker-compose.dev.yml        # postgres + optional redis/rabbitmq/minio profiles
├── Dockerfile                    # multi-stage, standalone output
├── drizzle.config.ts
├── docs/
│   ├── deploy-checklist.md
│   └── fork-checklist.md
├── .claude/agents/
│   ├── build-ui.md
│   ├── implement-logic.md
│   ├── db-migration.md
│   └── deploy-reviewer.md
├── drizzle/                      # generated SQL migrations (committed)
└── src/
    ├── middleware.ts             # session-cookie check only, not authz
    ├── app/
    │   ├── (auth)/
    │   │   ├── sign-in/
    │   │   ├── sign-up/
    │   │   ├── verify-email/
    │   │   └── reset-password/
    │   ├── (app)/                # authenticated shell
    │   │   ├── layout.tsx         # composes AppShell (header + sidebar)
    │   │   └── dashboard/
    │   ├── api/
    │   │   ├── auth/[...all]/    # Better Auth handler
    │   │   ├── uploads/          # presign + confirm (only if S3 configured)
    │   │   └── health/           # Uptime Kuma target
    │   └── layout.tsx             # root layout, ThemeProvider
    ├── db/
    │   ├── CLAUDE.md               # scoped rules: query chokepoint conventions
    │   ├── schema/
    │   │   ├── auth.ts           # Better Auth tables
    │   │   └── app.ts            # domain tables
    │   ├── queries/               # ⚠ ONLY place allowed to import db client
    │   └── index.ts
    ├── lib/
    │   ├── env.ts                 # Zod-validated env, fails fast at boot
    │   ├── auth.ts                 # Better Auth server config
    │   ├── auth-client.ts
    │   ├── session.ts              # requireUser() / requireTenant()
    │   ├── storage/
    │   │   ├── CLAUDE.md            # scoped rules: presign flow, key structure
    │   │   ├── client.ts           # null if S3 env vars absent
    │   │   ├── presign.ts
    │   │   └── keys.ts
    │   ├── redis/
    │   │   ├── CLAUDE.md            # scoped rules: cache/rate-limit fallback behavior
    │   │   ├── client.ts           # lazy singleton, null if REDIS_URL absent
    │   │   ├── cache.ts            # get/set/wrap() — no-op fallback
    │   │   └── rate-limit.ts       # Redis sliding window, else in-memory
    │   ├── queue/
    │   │   ├── CLAUDE.md            # scoped rules: publish() contract, inline fallback
    │   │   ├── client.ts           # null if RABBITMQ_URL absent
    │   │   ├── publish.ts          # publish(topic, payload, inlineHandler)
    │   │   └── consumer.ts         # worker entrypoint, no-ops if unconfigured
    │   └── email/
    │       ├── client.ts           # null if RESEND_API_KEY absent
    │       ├── send.ts             # sendEmail() — logs to console if unconfigured
    │       └── templates/          # react-email components
    └── components/
        ├── ui/                     # shadcn
        └── layout/
            ├── app-shell.tsx        # composes header + sidebar + content
            ├── header.tsx           # top bar: title, theme toggle, user menu
            ├── sidebar.tsx           # desktop rail/expanded + mobile drawer
            ├── sidebar-nav.tsx       # nav item config + active-state logic
            ├── theme-toggle.tsx      # light / dark / system switcher
            └── theme-provider.tsx    # next-themes wrapper
```

---

## 3. Environment Variables

```bash
# --- required, build-time (baked into Docker image) ---
NEXT_PUBLIC_APP_URL=

# --- required, runtime ---
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# --- optional, runtime ---
REDIS_URL=
RABBITMQ_URL=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=
S3_REGION=
S3_ENDPOINT=              # set for MinIO in dev, omit for AWS S3

RESEND_API_KEY=
EMAIL_FROM=

# --- optional, build-time ---
NEXT_PUBLIC_ASSET_BASE_URL=
```

`src/lib/env.ts` validates both sets with Zod. Required vars missing → throw
at boot. Optional vars are `.optional()` and every downstream client checks
for `undefined`, never assumes presence.

---

## 4. Milestones

### M0 — Bootstrap
- Next.js 16 + TypeScript strict + Tailwind + shadcn init.
- ESLint + Prettier + `prettier-plugin-tailwindcss` + Husky + lint-staged.
- `src/lib/env.ts` with Zod schema for the required vars only (optional ones
  added in their own milestones).
- **Gate:** `pnpm build` succeeds with only `DATABASE_URL`,
  `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` set.

### M1 — Database & Drizzle
- Postgres via `docker-compose.dev.yml`.
- `src/db/schema/app.ts` with one example domain table.
- `drizzle-kit generate` + `migrate` scripts in `package.json`.
- Create `src/db/CLAUDE.md`: states the query-chokepoint rule for anyone
  (human or agent) working in this directory.
- **Gate:** `pnpm db:migrate` runs clean against a fresh container; a
  generated SQL file exists in `drizzle/` and is reviewable in a diff.

### M2 — Auth (complete)
- Better Auth wired to Drizzle (`src/lib/auth.ts`), tables in
  `src/db/schema/auth.ts`.
- Email/password, session cookie, email verification, password reset.
- OAuth provider(s) — at least one (Google) behind env vars, optional per
  fork.
- `src/lib/session.ts`: `requireUser()`, `requireTenant()` helpers used by
  route handlers and `queries/`.
- `src/db/queries/` chokepoint established; ESLint `no-restricted-imports`
  rule forbids importing `src/db/index.ts` from anywhere else.
- Sign-in / sign-up / verify / reset pages in `(auth)/`.
- **Gate:** sign up → verify email (console-logged if Resend unconfigured) →
  sign in → hit a protected route → sign out, all working locally. Lint
  rule fails the build if `db/index.ts` is imported outside `queries/`.

### M3 — Dashboard Shell
- `app-shell.tsx` composing a fixed **header** and **sidebar** around the
  `(app)/` route group's content.
- **Header:** page title/breadcrumb slot, theme toggle, user avatar with a
  dropdown (profile link, sign out via Better Auth).
- **Sidebar:** icon + label nav items (lucide-react), active-route
  highlighting, collapsible to an icon-only rail on desktop; becomes a
  slide-out drawer (shadcn `Sheet`) below the `md` breakpoint, triggered by
  a hamburger button in the header.
- **Theming:** `next-themes` `ThemeProvider` in the root layout, `light` /
  `dark` / `system` options, `suppressHydrationWarning` on `<html>` to
  avoid a flash of wrong theme on load. Toggle is a single control in the
  header (icon button + dropdown, not three separate buttons).
- Nav items and their icons defined in one config array in
  `sidebar-nav.tsx` — adding a page to the dashboard means adding one
  entry, not editing markup in three places.
- Visual bar: no default shadcn/Tailwind look-and-feel left unstyled —
  deliberate spacing, type scale, and either an accent color or a
  neutral+one-accent palette. Follow the frontend-design conventions used
  elsewhere in this stack, not framework defaults.
- **Gate:** resize from desktop to mobile — sidebar collapses to a drawer,
  no layout shift or overflow. Toggle through light → dark → system with no
  flash. Every nav item has a visible focus state (keyboard-navigable).
  Sign-out from the header user menu actually ends the session.

### M4 — Storage (optional, S3-compatible)
- `src/lib/storage/client.ts` returns `null` if `S3_BUCKET` unset.
- Two-phase upload: `POST /api/uploads` → `PENDING` row + presigned PUT →
  client uploads directly → `PATCH /api/uploads/:id` → `UPLOADED`.
- Cron/sweep note for orphaned `PENDING` rows (documented, not necessarily
  implemented as a running job in the template).
- Local dev uses MinIO via the `storage` compose profile; prod uses AWS S3 —
  same code path, only `S3_ENDPOINT` differs.
- Create `src/lib/storage/CLAUDE.md`: documents the presign flow and key
  structure (`{tenant}/{entity}/{id}/...`) for anyone extending it.
- **Gate:** upload flow works end-to-end against MinIO locally; API routes
  return a clear error (not a crash) if storage env vars are absent.

### M5 — Email (optional, Resend)
- `src/lib/email/send.ts`: if `RESEND_API_KEY` unset, logs the email to
  console instead of sending — never throws.
- react-email templates for verification and password reset, wired into
  Better Auth's `sendVerificationEmail` / `sendResetPassword` hooks.
- **Gate:** verification email actually delivers via Resend when configured;
  falls back to console log with no error when not.

### M6 — Redis (optional)
- `src/lib/redis/client.ts`, `cache.ts` (`wrap(key, fn, ttl)`), `rate-limit.ts`.
- Rate-limit applied to sign-in and sign-up routes: Redis sliding window if
  configured, in-memory `Map` fallback if not (document the fallback is
  per-instance, not durable).
- Create `src/lib/redis/CLAUDE.md`: documents the fallback behavior so
  nobody "fixes" the in-memory limiter into something that silently
  assumes Redis is always there.
- **Gate:** app behaves identically with `REDIS_URL` set and unset — only
  difference is cache hits/misses and whether rate-limit state survives a
  restart.

### M7 — RabbitMQ (optional)
- `src/lib/queue/client.ts`, `publish.ts`.
- `publish(topic, payload, inlineHandler)`: publishes to RabbitMQ if
  configured, otherwise awaits `inlineHandler(payload)` directly in-process.
- One example use: fire a "welcome" side-effect after sign-up through
  `publish()`.
- Create `src/lib/queue/CLAUDE.md`: documents the `publish()` contract and
  why inline fallback exists, so new topics are added consistently.
- **Gate:** the welcome side-effect fires identically whether
  `RABBITMQ_URL` is set or not; no call site branches on configuration.

### M8 — Deployment
- Multi-stage `Dockerfile`, `output: 'standalone'`.
- `/api/health` route for Uptime Kuma.
- Beszel agent notes in `docs/deploy-checklist.md`.
- Coolify service definition: env var list split into build-time vs runtime,
  matching Section 3.
- **Gate:** image builds and runs on the Coolify server end-to-end with only
  the required env vars set, and again with all optional ones set.

### M9 — Subagents & Docs
- Subagents defined per Section 5.
- `docs/fork-checklist.md`: steps for spinning up a new project from this
  template (rename, new Postgres DB, new Better Auth secret, DNS/SSL,
  Resend sending domain if used, S3 bucket if used).
- Confirm every module-level `CLAUDE.md` created in earlier milestones
  (`db/`, `lib/storage/`, `lib/redis/`, `lib/queue/`) is present and
  current — this milestone doesn't create new ones, it audits.
- **Gate:** a fresh fork, following only `docs/fork-checklist.md`, reaches a
  working deployed sign-up/sign-in flow with no undocumented steps.

---

## 5. Subagents (`.claude/agents/`)

- **`build-ui`** — scaffolds pages/components against the shadcn design
  system and the dashboard shell; never touches `src/db/` or
  `src/lib/auth.ts`.
- **`implement-logic`** — writes route handlers and `src/db/queries/`
  functions; every query function must take a session and scope by
  owner/tenant internally; forbidden from importing `src/db/index.ts`
  anywhere outside `queries/`.
- **`db-migration`** — runs `drizzle-kit generate`, reviews the resulting
  SQL for destructive operations before it's applied.
- **`deploy-reviewer`** — checks `docs/deploy-checklist.md` and the
  required/optional env var split before a Coolify deploy.

---

## 6. Explicit Non-Goals

- No RLS, no Supabase.
- No serverless/edge deployment target — this template assumes a
  long-lived Node process on Coolify.
- No multi-region or read-replica support in the base template.