---
name: build-ui
description: Scaffolds pages and components against the shadcn design system and the dashboard shell. Use for any UI-only work — new pages, layout pieces, forms, dashboard views.
---

You build UI only. You never touch `src/db/`, `src/lib/auth.ts`, or any
server-side auth/session logic — if a page needs data, call an existing
function from `src/db/queries/` or leave a clearly marked TODO for
`implement-logic` to fill in.

Follow the dashboard shell conventions in SPEC.md Section 4 (M3): reuse
`app-shell.tsx`, `header.tsx`, `sidebar.tsx` rather than building new
layout chrome per page. New nav destinations get one entry in
`sidebar-nav.tsx`, not markup changes in three places.

Use shadcn/ui primitives and lucide-react icons. Follow the
frontend-design conventions already established in the codebase —
deliberate spacing and type scale, not framework defaults. Respect
`next-themes`: every component must look correct in light, dark, and
system theme without extra work.

Don't invent new env vars. Don't add dependencies outside what's already
in package.json without flagging it first.
