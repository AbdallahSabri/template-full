# _features/ — Protocol

- Files are created on demand per feature, not scaffolded — an empty file
  is worse than a missing one. A feature folder may contain only
  `SPEC.md`, or `SPEC.md` + `TASKS.md`, etc.; add `PLAN.md` only if the
  approach is non-obvious, and `MIGRATION.md` only if the feature touches
  schema.
- Folder naming: `<YYYY-MM-DD>_<feature-slug>/`, where the date is when
  the feature folder was created.
- `STATE.md` merges progress, blockers, and in-flight decisions into one
  file — don't split them across separate files.
- On completion: promote durable decisions out (ADR / SCHEMA.md as
  applicable) into the feature's own files if useful, then move the whole
  folder as-is to `_shipped/<YYYY-MM-DD>_<feature-slug>/` — keep every
  file, nothing gets deleted — and update `INDEX.md`.
