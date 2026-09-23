---
description: Create a new feature folder and its SPEC.md from a description
---

Argument: $ARGUMENTS — a free-text description of the feature to build.

1. Derive a short kebab-case feature-slug from the description.
2. Check _features/ and _shipped/ for any existing folder ending in that
   slug. If one exists, append -2, -3, etc. to keep it unique.
3. Get today's date as YYYY-MM-DD. Create the folder
   _features/<YYYY-MM-DD>_<feature-slug>/.
4. Explore the codebase enough to ground the spec in reality — relevant
   existing modules, patterns, conventions already in use for similar
   features.
5. If the description leaves a major decision genuinely open (e.g. which of
   two plausible approaches, unclear scope boundary), ask me before writing
   anything. Otherwise proceed and note any assumptions you made.
6. Write SPEC.md in that folder with these sections:
   - What & why (one paragraph)
   - Acceptance criteria (checklist)
   - Out of scope (explicit)
   - Files/modules likely touched (best guess from exploration)
   - Assumptions made (if any)
7. Update _features/INDEX.md: add a row for this feature with
   status = "spec", last touched = today, notes = one-line summary. Create
   INDEX.md with the standard columns (feature | status | last touched |
   notes) if it doesn't exist yet.
8. Tell me the folder path when done. Do not write PLAN.md, TASKS.md, or any
   code — this command only produces SPEC.md.
