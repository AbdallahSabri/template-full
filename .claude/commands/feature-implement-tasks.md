---
description: Start, resume, or continue implementing a feature's TASKS.md
---

Argument: $ARGUMENTS — path to a TASKS.md file.

1. Read TASKS.md, STATE.md, PLAN.md, and SPEC.md in the same folder for full
   context. If the folder is already under _shipped/, tell me it's already
   shipped and stop.
2. From STATE.md and the checked/unchecked items in TASKS.md, determine
   exactly where the feature stands.
3. Implement the next unchecked milestone only — not the whole file at once
   — to keep errors contained to one session's worth of work. If MIGRATION.md
   exists and this milestone touches schema, apply it carefully and verify.

   For each task in the milestone, determine which subagent owns it by the
   files/area it touches, and delegate the actual implementation to that
   subagent rather than writing the code directly yourself:
   - Touches src/db/schema/ (new/changed tables, columns, types)
     → delegate to db-migration first
   - Touches route handlers, src/db/queries/, server-side/API logic
     → delegate to implement-logic
   - Touches pages, layout, components, anything UI-only
     → delegate to build-ui
   - Touches Dockerfile, Coolify config, env var setup, deploy checklist
     → delegate to deploy-reviewer
     Some tasks span more than one: e.g. a task needing a new query plus a
     page that calls it should delegate to implement-logic first (build-ui
     is instructed to leave a TODO for logic it doesn't own, so give it real
     logic to call instead), then build-ui for the page.
     If a task doesn't fit any of the four subagents' remit, implement it
     yourself directly rather than forcing a delegation.

   If a task is ambiguous on a small implementation detail, don't stop to
   ask — pick the most reasonable interpretation, note the assumption (it
   goes in the milestone's commit body later), and proceed. Only stop to
   ask me if it's a genuine scope or architecture decision, not an
   implementation detail.

4. As you (or a delegated subagent) finish each task within the milestone,
   check it off in TASKS.md immediately, don't batch checkbox updates to
   the end.
5. Once every task in the milestone is implemented, run this milestone's
   gate criteria yourself (`pnpm lint`, `pnpm build`, and any manual check
   the milestone or TASKS.md describes). If a gate fails, fix it (or route
   the fix back to the subagent that owns the affected area) and re-run —
   never check off a milestone or commit on a failing gate.
6. Once the gate passes:
   a. Confirm every task in this milestone is checked off in TASKS.md.
   b. `git add -A && git commit` with message
   `feat(<feature-slug>/m<N>): <milestone name>` (feature-slug is the
   slug portion of the feature's folder name), and a commit body listing
   the gate criteria that passed plus any assumptions noted in step 3.
7. Update STATE.md with: what's done, what's next, any blockers you hit and
   what's needed to unblock them, and any decisions you made while building
   that PLAN.md didn't anticipate. This update is mandatory — a milestone
   that's implemented and committed without a STATE.md update is not done.
8. Update _features/INDEX.md: last touched = today; status = "in progress"
   (or keep as-is if unchanged).
9. If this session completes every item in TASKS.md: move the entire folder
   as-is to _shipped/<same-folder-name>/ — keep every file, delete nothing.
   Update INDEX.md: status = "shipped", last touched = today. Tell me it
   shipped.
10. Otherwise, stop here — do not start the next milestone in this
    invocation. Tell me clearly what's done, what's next, and whether I
    should run this command again to continue or there's something
    blocking that needs my input.
