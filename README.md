# template-full

A reusable full-stack starter: Next.js 16 (App Router, TypeScript strict),
Postgres, Drizzle ORM, Better Auth, and Tailwind + shadcn/ui, deployed on
Coolify via a multi-stage Docker build. Redis, RabbitMQ, S3-compatible
storage, and Resend are optional and feature-detected from env vars — the
app boots and runs correctly with **zero** of them set.

Forking this for a new project? Start with
[`docs/fork-checklist.md`](docs/fork-checklist.md), not this README.

## Stack

| Layer               | Choice                                                  | Required? |
| ------------------- | ------------------------------------------------------- | --------- |
| Framework           | Next.js 16 (App Router), TypeScript strict              | required  |
| Styling             | Tailwind + shadcn/ui                                    | required  |
| Icons               | lucide-react                                            | required  |
| Theming             | next-themes (light / dark / system)                     | required  |
| Database            | Postgres                                                | required  |
| ORM                 | Drizzle + drizzle-kit                                   | required  |
| Auth                | Better Auth (Drizzle adapter)                           | required  |
| Validation          | Zod                                                     | required  |
| Cache / rate-limit  | Redis                                                   | optional  |
| Queue               | RabbitMQ                                                | optional  |
| Object storage      | S3-compatible (AWS S3 prod / MinIO dev)                 | optional  |
| Transactional email | Resend + react-email                                    | optional  |
| Deploy              | Coolify, multi-stage Dockerfile, `output: 'standalone'` | required  |

See [`SPEC.md`](SPEC.md) for the full milestone plan and file structure,
and [`CLAUDE.md`](CLAUDE.md) for the standing conventions and gates that
apply across the whole repo.

## Getting started

Requires Node.js, [pnpm](https://pnpm.io), and a running Postgres instance.

```bash
pnpm install
cp .env.example .env   # fill in DATABASE_URL, BETTER_AUTH_SECRET, etc.
pnpm db:migrate
pnpm dev
```

The app is available at http://localhost:3000. Optional services (Redis,
RabbitMQ, MinIO for S3) can be run locally via the dev compose file:

```bash
docker compose -f docker-compose.dev.yml --profile redis --profile queue --profile storage up
```

Leave any of those `--profile` flags off (and the matching env vars unset)
to run without that service — every optional integration falls back to a
safe no-op or a clear typed error rather than crashing.

## Environment variables

See [`.env.example`](.env.example) for the full list with descriptions.
All vars are validated once in `src/lib/env.ts` — required vars missing
throws at boot, optional vars are truly optional.

- **Required, build-time:** `NEXT_PUBLIC_APP_URL`
- **Required, runtime:** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- **Optional:** Google OAuth (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`),
  S3 storage (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`S3_BUCKET`/`S3_REGION`/`S3_ENDPOINT`),
  Resend email (`RESEND_API_KEY`/`EMAIL_FROM`), Redis (`REDIS_URL`),
  RabbitMQ (`RABBITMQ_URL`)

## Commands

```bash
pnpm dev                  # local dev server
pnpm build                 # production build, output: standalone
pnpm start                 # run the production build
pnpm lint                  # eslint, includes the db-import restriction
pnpm format                # prettier --write
pnpm db:generate            # drizzle-kit generate (writes to drizzle/)
pnpm db:migrate             # apply pending migrations
pnpm queue:worker            # RabbitMQ consumer — separate long-lived process, no-ops if unconfigured
```

## Project structure

```
├── CLAUDE.md                # root: stack rules & gates that apply everywhere
├── SPEC.md                  # milestone plan and full file structure
├── PROGRESS.md              # milestone checklist status
├── docs/
│   ├── deploy-checklist.md  # pre-deploy verification on Coolify
│   └── fork-checklist.md    # turning this template into a real project
├── drizzle/                 # generated SQL migrations (committed)
├── _features/                # active feature work — see "Feature workflow" below
│   ├── CLAUDE.md             # the _features/ protocol
│   ├── INDEX.md              # feature | status | last touched | notes
│   └── <YYYY-MM-DD>_<slug>/  # one folder per in-flight feature
├── _shipped/                 # completed features, moved here as-is, nothing deleted
├── .claude/
│   ├── agents/               # subagent definitions (build-ui, implement-logic, db-migration, deploy-reviewer)
│   └── commands/              # /feature-create, /feature-plan, /feature-build-tasks, /feature-implement-tasks
└── src/
    ├── middleware.ts        # session-cookie presence check only, not authz
    ├── app/
    │   ├── (auth)/           # sign-in, sign-up, verify-email, reset-password
    │   ├── (app)/            # authenticated dashboard shell
    │   └── api/              # Better Auth handler, health check, uploads
    ├── components/           # app shell + shadcn/ui components
    ├── db/
    │   ├── index.ts          # Drizzle client — imported only from db/queries/
    │   ├── schema/
    │   └── queries/          # the entire authorization layer; every query is session/tenant-scoped
    └── lib/                  # env validation, auth, cache, queue, storage, email
```

Several modules under `src/lib/` and `src/db/` have their own scoped
`CLAUDE.md` with module-specific conventions — read those before changing
that module's code.

## Feature workflow

New feature work goes through four slash commands in order, each producing
one set of artifacts in `_features/<YYYY-MM-DD>_<feature-slug>/`. Don't skip
a stage — each command reads the previous stage's output.

| Command                                       | Input                                        | Produces                                                        | Feature status after      |
| --------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------- | ------------------------- |
| `/feature-create <description>`               | free-text description                        | `SPEC.md`                                                       | `spec`                    |
| `/feature-plan <path to SPEC.md>`             | `SPEC.md`                                    | `PLAN.md` (may also touch `SPEC.md`)                            | `planned`                 |
| `/feature-build-tasks <path to PLAN.md>`      | `PLAN.md`, `SPEC.md`                         | `TASKS.md`, `STATE.md`, `MIGRATION.md` (only if schema changes) | `ready to build`          |
| `/feature-implement-tasks <path to TASKS.md>` | `TASKS.md`, `STATE.md`, `PLAN.md`, `SPEC.md` | code, one milestone at a time                                   | `in progress` → `shipped` |

1. **`/feature-create`** — describe the feature in plain English. It derives
   a kebab-case slug, creates `_features/<date>_<slug>/`, explores the
   codebase to ground the spec in what already exists, and writes `SPEC.md`
   (what & why, acceptance criteria, out of scope, files likely touched,
   assumptions). It stops and asks first if the description leaves a real
   scope or approach decision open. Adds a row to `_features/INDEX.md`.
2. **`/feature-plan`** — point it at that `SPEC.md`. It explores the actual
   code (not just the spec's guesses) and writes an ordered, file-level
   `PLAN.md`: approach, steps, key decisions/trade-offs, risks. May adjust
   `SPEC.md` if planning reveals the scope needs to change.
3. **`/feature-build-tasks`** — point it at `PLAN.md`. It writes
   `TASKS.md` (a milestone-ordered checklist, each milestone sized to one
   focused session) and `STATE.md` (the running source of truth for
   progress/blockers/decisions). `MIGRATION.md` is added only if the
   feature actually touches the schema.
4. **`/feature-implement-tasks`** — point it at `TASKS.md` to start, resume,
   or continue. Each invocation implements exactly one unchecked milestone:
   - Delegates the actual implementation per task to the owning subagent
     (`db-migration` for schema, `implement-logic` for route
     handlers/`db/queries/`, `build-ui` for pages/components, `deploy-reviewer`
     for Dockerfile/Coolify/env-var work), implementing directly only when a
     task fits none of them.
   - Runs the milestone's gate (`pnpm lint`, `pnpm build`, any manual check)
     before checking anything off — never commits on a failing gate.
   - Commits per milestone as `feat(<feature-slug>/m<N>): <milestone name>`,
     then updates `STATE.md` and `_features/INDEX.md` and stops — one
     milestone per invocation, run it again to continue.
   - When the last milestone finishes, moves the whole feature folder as-is
     to `_shipped/<same-folder-name>/` (nothing deleted) and marks it
     `shipped` in `INDEX.md`.

`_features/CLAUDE.md` holds the underlying protocol these commands follow
(folder naming, when each file is created, what merges into `STATE.md`).
`_features/INDEX.md` is the at-a-glance status table across all features,
active and shipped.

## Core conventions

The full rules live in [`CLAUDE.md`](CLAUDE.md); the two that matter most
day to day:

1. **`src/db/index.ts` is imported only inside `src/db/queries/`.** No
   route handler, component, or lib file touches the Drizzle client
   directly — enforced by an ESLint rule.
2. **Every function in `src/db/queries/` takes a session (or explicit
   tenant/owner id) and scopes its query by it internally.** There is no
   RLS underneath — this is the entire authorization layer.

Optional services are always used through their shared interface
(`cache.wrap(...)`, `publish(...)`, `sendEmail(...)`, `storage.*`) —
call sites never branch on whether the underlying env var is set.

## Deploying

Deployed on [Coolify](https://coolify.io) via the multi-stage
[`Dockerfile`](Dockerfile) with `output: 'standalone'`. Before deploying,
walk through [`docs/deploy-checklist.md`](docs/deploy-checklist.md) —
it covers the required/optional env var split and what to verify before
and after the deploy.
