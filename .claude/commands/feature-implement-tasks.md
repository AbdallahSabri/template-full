---
description: Start, resume, or continue implementing a feature's TASKS.md, milestone by milestone, until it ships or a milestone breaks
---

Argument: $ARGUMENTS — path to a TASKS.md file.

This command works through the feature **one milestone at a time, and keeps
going on its own**: each time a milestone is fully done (gate passed,
committed, STATE.md and INDEX.md updated) it moves straight on to the next
one without waiting for another prompt. It only stops when the feature ships
or a milestone breaks (see "When to stop" at the end). Steps 2-8 below are a
loop that runs once per milestone.

1. Read TASKS.md, STATE.md, PLAN.md, and SPEC.md in the same folder for full
   context. If the folder is already under _shipped/, tell me it's already
   shipped and stop.
2. From STATE.md and the checked/unchecked items in TASKS.md, determine
   exactly where the feature stands.
3. Implement the next unchecked milestone only — not several at once — to
   keep errors contained to one milestone's worth of work. Finish it
   completely (steps 3-8) before starting the next. If MIGRATION.md
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
9. If every item in TASKS.md is now checked off: move the entire folder
   as-is to _shipped/<same-folder-name>/ — keep every file, delete nothing.
   Update INDEX.md: status = "shipped", last touched = today. Tell me it
   shipped, with a short summary of what was built across the milestones,
   then stop.
10. Otherwise, **continue automatically with the next milestone**: give me a
    one-or-two-line progress note (which milestone just finished and its
    commit, which one is starting), then go back to step 2 and repeat steps
    2-8 for the next unchecked milestone. Do not wait for me to run the
    command again, and do not ask for permission to continue. Only start a
    milestone if the previous one is completely finished: committed, with
    its STATE.md and INDEX.md update committed too.

## When to stop and wait for me

If a milestone **breaks for any reason**, stop the loop, do not start the next
milestone, and tell me. "Breaks" means any of:

- A gate (`lint`, `build`, tests, or a manual check the milestone describes)
  still fails after you have made a real effort to fix it (route the fix back
  to the owning subagent, re-run, and try a different approach at least
  once — but don't loop forever on the same failure).
- A subagent fails, returns something that doesn't check out when you verify
  it, or reports it is blocked or was denied a permission.
- A tool, environment, database, or migration problem you can't resolve
  yourself (including anything that would need a risky or destructive action
  to get past).
- A check the milestone requires can't be performed as written and no
  substitute would genuinely exercise the same behaviour. A substitute counts
  only if it really verifies the same thing; note it as a deviation in
  STATE.md. If in doubt, treat it as a break.
- You hit a genuine scope or architecture decision that belongs to me (small
  implementation details are still yours to decide and note, per step 3).
- The repository is in an unexpected state you didn't cause (e.g. unrelated
  uncommitted changes that would be swept into the commit, a diverged
  branch).

When you stop for a break:

1. Never commit failing or unverified code, and never check off a milestone
   or task that isn't truly done. Leave finished-and-verified tasks checked
   and committed work alone.
2. Record the break in STATE.md (status, what failed, what you tried, what's
   needed to unblock) so the record survives the session. Commit that STATE.md
   update on its own so the tree isn't left dirty with planning notes.
3. Tell me clearly, in plain language: which milestone broke, what exactly
   went wrong (with the relevant error output or evidence), what you already
   tried, what state the working tree and dev database are in, and your
   recommended options for moving forward. Then wait for my guidance. Don't
   guess at a fix that needs my approval, and don't quietly skip the milestone
   or work around the problem.

Never push to a remote or open a pull request as part of this command; commits
stay local unless I ask.
