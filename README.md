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
├── .claude/agents/          # subagent definitions (build-ui, implement-logic, db-migration, deploy-reviewer)
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
