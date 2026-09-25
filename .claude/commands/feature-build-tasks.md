---
description: Turn a feature's PLAN.md into TASKS.md, STATE.md, and MIGRATION.md. Requires a feature folder or PLAN.md path.
argument-hint: <feature folder or path to PLAN.md>
---

Argument: $ARGUMENTS — either a feature folder (e.g. `_features/<folder>`) or
the path to its PLAN.md file.

## Gate: a feature folder or PLAN.md path is mandatory

Before doing anything else, resolve $ARGUMENTS to a PLAN.md:

- A path ending in `PLAN.md` that exists is used as-is.
- A path to an existing feature folder is used if it contains a `PLAN.md`;
  the PLAN.md inside it is the target.

If $ARGUMENTS is empty, resolves to neither, or the folder has no PLAN.md,
**stop immediately**: do not read, explore, or edit anything else. Reply with
one short message: this command needs a feature folder or a PLAN.md path, e.g.
`/feature-build-tasks _features/<folder>` or
`/feature-build-tasks _features/<folder>/PLAN.md` (and if the folder has no
PLAN.md, say `/feature-plan` produces it). Nothing else.

## Steps

1. Read PLAN.md and the SPEC.md in the same folder.
2. Write TASKS.md: a milestone-ordered checklist, granular enough that each
   milestone can be built and verified in a single focused session. Use
   markdown checkboxes. Order by dependency, not by guesswork.
3. Write STATE.md: initial state — note "not started", blockers: none yet,
   and carry forward any key decisions from PLAN.md worth remembering
   mid-build. This file is the single source of truth for progress,
   blockers, and in-flight decisions going forward — feature-implement-tasks
   will keep it updated.
4. Only write MIGRATION.md if this feature actually changes the schema
   (new tables, columns, indexes, data migrations). If it doesn't, skip it
   entirely — do not create an empty placeholder.
5. Update _features/INDEX.md: set status to "ready to build",
   last touched = today.
6. Do not start implementing anything — this command only produces the
   planning artifacts.
