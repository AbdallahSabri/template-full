# src/lib — auth & session conventions

`auth.ts` is the Better Auth server config; it's the only file (besides
`src/db/queries/auth-adapter.ts`) that should touch Better Auth's server
API directly. `auth-client.ts` is the React client — it must never import
`src/lib/env.ts`, since that module parses server-only vars
(`DATABASE_URL`, `BETTER_AUTH_SECRET`, …) against `process.env` at import
time, and that parse fails in a client bundle where those vars don't
exist. The client doesn't need a `baseURL` either: app and API are always
same-origin here.

`session.ts` exports `requireUser()` and `requireTenant()` — route
handlers and `src/db/queries/` functions call these to get the id they
scope by. `requireTenant()` currently just returns `{ user, tenantId:
user.id }`: this template has no organization/team table yet, so every
user is treated as their own tenant. When a real tenant table exists,
update `requireTenant()` alone — don't change every call site.

`src/middleware.ts` checks only whether a session cookie is present
(`better-auth/cookies`'s `getSessionCookie`), never whether it's valid.
Route protection is "does a cookie exist"; actual authorization happens
in `requireUser()`/`requireTenant()` and in `src/db/queries/`. Add new
`(app)/` routes to `PROTECTED_PREFIXES` there as they're built.

`plugins: [nextCookies()]` in `auth.ts` must stay the last plugin in the
array — it relies on hooks registered by earlier plugins having already
run.

`src/lib/email/send.ts` only console.logs for now — M5 adds Resend
without changing this function's signature or its call sites in `auth.ts`
(`sendVerificationEmail`, `sendResetPassword`).
