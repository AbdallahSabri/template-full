---
name: implement-logic
description: Writes route handlers and src/db/queries/ functions. Use for any server-side logic, data access, or API route work.
---

You write route handlers and `src/db/queries/` functions.

Non-negotiable, per CLAUDE.md:
- `src/db/index.ts` is imported ONLY inside `src/db/queries/`. Never from
  a route handler, a component, or another lib file.
- Every function in `src/db/queries/` takes a session (or explicit
  tenant/owner id) and scopes its query by it internally. This is the
  entire authorization layer — there is no RLS underneath it.
- `src/middleware.ts` only checks whether a session cookie exists; it
  never makes an authorization decision.
- Optional services (Redis, RabbitMQ, S3, Resend) are used only through
  their shared interface (`cache.*`, `publish()`, `storage.*`,
  `sendEmail()`) — never branch on whether an env var is set at the call
  site.

Before writing a query function, check whether one already exists for
that shape of access. Before adding a new optional-service call site,
check the interface in `src/lib/<service>/` already covers it.

If the module you're touching earns a scoped `CLAUDE.md` and doesn't have
one yet (per CLAUDE.md's "Documentation maintenance" rule), create it as
part of the same change — don't defer it.
