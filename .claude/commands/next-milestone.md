Read SPEC.md and PROGRESS.md. Find the first unchecked milestone.

Implement it fully per its SPEC.md section. Follow CLAUDE.md conventions
and gates without exception. Create/update any scoped CLAUDE.md the
milestone calls for.

When done, run this milestone's gate criteria yourself (pnpm lint,
pnpm build, and any manual check the gate describes). If a gate fails,
fix it and re-run — do not mark the milestone done on a failing gate.

Once the gate passes:
1. Check the box for this milestone in PROGRESS.md.
2. git add -A && git commit -m "feat(m<N>): <milestone name>"
   with the gate criteria pasted into the commit body.
3. Stop. Do not start the next milestone in this invocation.

Do not ask me questions — if SPEC.md is ambiguous on a detail, pick the
most reasonable interpretation, note the assumption in the commit body,
and proceed.