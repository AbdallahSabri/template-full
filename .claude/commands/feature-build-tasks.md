---
description: Turn a feature's PLAN.md into TASKS.md, STATE.md, and MIGRATION.md
---

Argument: $ARGUMENTS — path to a PLAN.md file.

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
