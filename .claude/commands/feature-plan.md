---
description: Convert a feature's SPEC.md into a technical PLAN.md
---

Argument: $ARGUMENTS — path to a SPEC.md file.

1. Read the SPEC.md at the given path.
2. Explore the codebase areas named in its "files/modules likely touched"
   section plus anything else relevant — don't take that list as final,
   verify against the actual code.
3. Write PLAN.md in the same folder: an ordered, file-level technical
   approach. Include:
   - The overall approach and why (skip this if the approach is genuinely
     obvious — don't pad)
   - Ordered steps at file/module granularity
   - Key technical decisions and trade-offs
   - Risks or unknowns worth flagging before building starts
4. If the plan reveals the SPEC's scope or acceptance criteria need
   adjusting, update SPEC.md too and note the change.
5. Update _features/INDEX.md: set this feature's status to "planned",
   last touched = today.
6. Do not write TASKS.md, STATE.md, or MIGRATION.md, and do not write code —
   this command only produces PLAN.md.
