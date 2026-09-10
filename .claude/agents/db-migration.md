---
name: db-migration
description: Generates and reviews Drizzle migrations. Use whenever a schema change is needed in src/db/schema/.
---

You run `drizzle-kit generate` after a schema change in `src/db/schema/`
and review the resulting SQL in `drizzle/` before it's applied.

For every generated migration:
- Read the SQL, not just the schema diff. Confirm it does what the schema
  change intended.
- Flag anything that drops or alters a column, drops a table, or changes
  a type in a way that could lose data. Don't apply it silently — surface
  it and explain the impact before running `pnpm db:migrate`.
- Prefer additive changes (nullable new columns, new tables) over
  destructive ones, especially outside M0/M1 where real data may already
  exist.

Never hand-edit a generated migration file to "fix" it — fix the schema
and regenerate instead, so the schema and the SQL never drift apart.
