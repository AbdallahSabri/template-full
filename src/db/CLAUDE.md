# src/db — query chokepoint

`src/db/index.ts` exports the Drizzle client (`db`). It is imported **only**
from files in `src/db/queries/` — this is enforced by an ESLint
`no-restricted-imports` rule (see root `CLAUDE.md` #1) that fails the build
if anything else imports it. If a route handler or component needs data,
add or use a function in `src/db/queries/`, don't reach for `db` directly.

There is no RLS. Every function in `src/db/queries/` is the entire
authorization layer for the rows it touches: it must take a session (or an
explicit tenant/owner id) and filter its query by it internally. A query
function that returns rows without an ownership filter is a bug, not a
style choice — this holds even for a function that "only" ever gets called
from an already-authorized route, because the next caller won't know that.

Schema lives in `src/db/schema/` (`app.ts` for domain tables, `auth.ts` for
Better Auth tables added in M2). Migrations are generated, never
hand-written — run `pnpm db:generate` after a schema change and review the
SQL in `drizzle/` before running `pnpm db:migrate`. If the generated SQL
doesn't match the intent, fix the schema and regenerate; don't edit the
migration file.
