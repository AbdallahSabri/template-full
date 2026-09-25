---
description: Update a named file in a feature folder (SPEC, PLAN, TASKS, STATE, MIGRATION, ...). Requires the file name.
argument-hint: <file name or path> [what to change]
---

Argument: $ARGUMENTS — a file name or path inside a feature folder, optionally
followed by a description of what to change. Example:
`/feature-update PLAN.md move the retry script into milestone 3`.

## Gate: a file name is mandatory

Before doing anything else, check that $ARGUMENTS starts with a file name or
path. If $ARGUMENTS is empty, or its first token is not a file name (no
extension, or it is plainly a sentence), **stop immediately**: do not read,
edit, or explore anything. Reply with one short message: this command needs a
file name, e.g. `/feature-update SPEC.md <what to change>` or
`/feature-update _features/<folder>/TASKS.md <what to change>`. Nothing else.

## Steps

1. **Split the argument.** First token = the file; the rest (if any) = the
   change I want.
2. **Resolve the file to exactly one path.**
   - A path that exists as given (relative to the repo root, or absolute) is
     used as-is.
   - A bare name (e.g. `PLAN.md`) is looked up in the feature for the current
     git branch: branch `feature/<slug>` maps to the folder in `_features/`
     whose name ends in `_<slug>`. If the branch doesn't identify a feature,
     and `_features/` has exactly one feature folder, use it. If it is still
     ambiguous (several candidates, or none), list the candidates and ask me
     which one — don't guess.
   - Only files inside a feature folder under `_features/` are in scope. Refuse
     anything else, including `_features/INDEX.md`, `_features/CLAUDE.md`, and
     source code. (INDEX.md is only touched by step 6.)
3. **Check the target.**
   - If the folder is under `_shipped/`, tell me the feature already shipped
     and stop.
   - If the file does not exist, do not create it. Tell me it doesn't exist,
     and name the command that produces it (`/feature-create` for SPEC.md,
     `/feature-plan` for PLAN.md, `/feature-build-tasks` for TASKS.md,
     STATE.md and MIGRATION.md), then stop. A file I name that isn't one of
     those (a notes file, say) also isn't created here.
4. **Read what you need.** Read the target in full. Read the other files in the
   same folder as far as they are needed to make the change correctly and
   consistently, and explore the codebase if the change depends on what the
   code actually does (verify against the code, don't assume).
   If I gave no change description, ask me what to change and stop until I
   answer. Don't invent an update.
5. **Make the edit to that file only.** Change what I asked for, keep the file's
   existing structure, headings, and tone, and edit in place rather than
   rewriting the whole file unless the change requires it. File-specific care:
   - `TASKS.md`: keep milestone order dependency-correct. Never uncheck a task
     that is already done, and never check one off that isn't; if the change
     affects already-completed work, say so instead of silently altering it.
   - `STATE.md`: keep it the single record of progress, blockers, and decisions.
     Add to it, don't erase history; record a superseded decision as superseded.
   - `MIGRATION.md`: it records intent for a generated migration. If the schema
     or generated SQL already exists, say so; never hand-edit files in
     `drizzle/`.
   - `SPEC.md` and `PLAN.md`: if the change alters scope or acceptance criteria,
     add a short dated note saying what changed and why, as `/feature-plan` does.
6. **Update `_features/INDEX.md`:** last touched = today for this feature. Leave
   its status unchanged.
7. **Report.** Show a short summary of what changed in the file. Then list, without
   editing them, any other files in the feature that the change may have made
   stale (for example: a SPEC change that the PLAN or TASKS no longer reflect;
   a PLAN change that needs `/feature-build-tasks` re-run or a TASKS edit) and
   suggest the follow-up command or `/feature-update` call for each.

## Boundaries

- Edit only the named file and INDEX.md's last-touched date. Never edit other
  feature files, source code, schema, or migrations from this command, even to
  keep them consistent; list them in step 7 instead.
- Do not implement anything and do not run builds or migrations.
- Do not commit, push, or open a pull request unless I ask.
