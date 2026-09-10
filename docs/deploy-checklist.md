# Deploy checklist (Coolify)

This is the checklist for standing up **this app** as a Coolify service —
not for forking the template into a new project (that's
`docs/fork-checklist.md`). Run through it before every deploy that
touches the Dockerfile, env vars, or Coolify service config.

## 1. Coolify service definition

Create the service as a **Dockerfile-based** application (Coolify builds
`Dockerfile` directly — no `docker-compose.yml` needed for the app
itself; `docker-compose.dev.yml` is local-dev-only and never deployed).

Coolify splits env vars into **Build Variables** (baked into the image at
`docker build`) and **Environment Variables** (injected into the
container at runtime). Get this split wrong and a var either fails to
take effect (set at runtime, but the app only ever reads the build-time
value) or gets baked into the image when it should have stayed a secret
injected at deploy time. Matches SPEC.md Section 3:

**Build Variables** — only `NEXT_PUBLIC_*` vars belong here. They're
baked into the client JS bundle; nothing else needs to be, and nothing
else should be (a secret set as a Build Variable ends up readable in the
image's layers).

| Var                          | Required                     |
| ---------------------------- | ---------------------------- |
| `NEXT_PUBLIC_APP_URL`        | yes                          |
| `NEXT_PUBLIC_ASSET_BASE_URL` | no (optional CDN/asset base) |

**Environment Variables** (runtime) — everything else. The Dockerfile's
builder stage sets placeholder values for `DATABASE_URL`,
`BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` just so `next build` can get
through evaluating the app's module graph (see the comment block in the
Dockerfile) — **do not** set these as Build Variables in Coolify. Set
them here instead; the standalone `server.js` reads `process.env` fresh
when the container boots, completely independent of whatever the image
was built with.

| Var                                                                                       | Required | Notes                                                                |
| ----------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------- |
| `DATABASE_URL`                                                                            | yes      |                                                                      |
| `BETTER_AUTH_SECRET`                                                                      | yes      | Generate a new one per fork/environment — never reuse the dev value. |
| `BETTER_AUTH_URL`                                                                         | yes      | Must match the public URL this service is reachable at.              |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`                                               | no       | Both or neither.                                                     |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `S3_BUCKET` / `S3_REGION` / `S3_ENDPOINT` | no       | `S3_BUCKET` gates the feature; omit `S3_ENDPOINT` for real AWS S3.   |
| `RESEND_API_KEY` / `EMAIL_FROM`                                                           | no       | Both or neither.                                                     |
| `REDIS_URL`                                                                               | no       |                                                                      |
| `RABBITMQ_URL`                                                                            | no       |                                                                      |

**Known-benign build warning:** `docker build` prints
`SecretsUsedInArgOrEnv` for `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL`. That's
BuildKit's linter flagging the _placeholder_ values in the builder
stage — it can't know they're dummy sentinels overridden at runtime, not
real secrets. Expected; don't chase it.

## 2. Migrations

This template does **not** auto-run migrations on container boot (running
`drizzle-kit migrate` on every instance start is riskier than it sounds
once there's more than one instance, and it removes the chance to review
the generated SQL before it hits a real database). Before deploying a
release that includes a new migration:

1. Review the generated SQL in `drizzle/` (already done at PR time, per
   `src/db/CLAUDE.md` — this step is about actually _applying_ it).
2. Run `pnpm db:migrate` against the target database — either from a
   machine with network access to it (e.g. via Coolify's terminal into a
   running instance, or a one-off Coolify "Command" execution), or as a
   pre-deployment step if Coolify's deploy hooks are configured for it.
3. Only then deploy the new image.

## 3. Health check

`/api/health` checks the one hard dependency (Postgres) and returns
`{"status":"ok"}` / 200, or `{"status":"error"}` / 503. Point Coolify's
own health check and Uptime Kuma (or whatever external monitor) at this
path. Confirm it returns 200 **after** a deploy, before assuming traffic
is safe to route to the new instance.

## 4. Beszel agent (host-level monitoring)

Beszel is separate from the app-level health check above — it monitors
the VPS itself (CPU/RAM/disk/network), not this service specifically.
Coolify has a one-click template for it:

1. In the Coolify dashboard, **New Resource → search "Beszel"** and
   select **Beszel Agent** (only deploy the full hub if this project is
   also hosting the shared monitoring dashboard — most forks should point
   their agent at an existing hub instead).
2. On first deploy the agent container shows unhealthy/restarting — this
   is expected until it's paired with a hub.
3. From the Beszel hub's dashboard, **Add a new System**, generate its
   key, and set the agent's `KEY`/`HUB_URL`/`TOKEN` env vars in Coolify
   to match.
4. If deploying the hub itself on Coolify: uncheck **"Enable gzip
   compression"** in the hub service's settings — Coolify's proxy and the
   hub's own compression conflict.

## 5. Zero-optional / all-optional sanity check

Before marking a deploy done, confirm both of these still hold (this is
the actual milestone gate — re-run it whenever the Dockerfile or env
handling changes):

- With only the required env vars set, the app boots, `/api/health`
  returns 200, and sign-up/sign-in work (every optional integration falls
  back to its documented degraded behavior — console-logged email,
  in-memory rate limiting, inline queue handlers, a clear 503 from
  `/api/uploads` — none of it crashes).
- With every optional env var also set, the app boots identically and
  each integration is actually exercised (not silently skipped) — cheapest
  way to check: sign up a user and confirm the welcome email attempt hits
  Resend's API (visible in logs, even with a bad key it's a real 401, not
  silence) and the message lands in RabbitMQ's `welcome` queue instead of
  running inline.
