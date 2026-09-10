# src/lib/email — send.ts & templates

`send.ts`'s `sendEmail({ to, subject, text, react? })` is the only place
that touches Resend. It's feature-detected on `RESEND_API_KEY` **and**
`EMAIL_FROM` together (mirrors the Google OAuth pattern in `auth.tsx`) —
either alone falls back to `console.log`, same as having neither. Never
throws: a delivery failure is logged and swallowed so it can't break the
sign-up/reset flow that triggered it.

`react` is a React element (a template from `templates/`); Resend renders
it to HTML internally via its `@react-email/render` peer dependency. Both
callers (`sendVerificationEmail`/`sendResetPassword` in `auth.tsx`) pass a
plain-text `text` alongside `react` — used for the console-log fallback
and as Resend's text-alternative body.

## Templates are hand-rolled, not `@react-email/components`

`templates/shared.tsx` exports plain inline-styled JSX (`EmailShell`,
`styles`) instead of using `@react-email/components`. That package was
deprecated in April 2026 in favor of a unified `react-email` package, and
that unified package has a known issue (resend/react-email#3556) where
top-level imports pull `prismjs`/`marked`/`tailwindcss` into the server
bundle even when unused. Two simple transactional emails don't need that
dependency weight or a deprecated package — `@react-email/render` (which
`resend` already depends on as a peer) is all `react`-prop rendering
actually requires. If a future template needs real component reuse
(columns, responsive tables), reach for hand-written inline-styled JSX
first before pulling in a components package.

## Adding a template

Add a `.tsx` file under `templates/` using `EmailShell`/`styles` from
`shared.tsx`, export it, and pass `<YourTemplate ... />` as `react` from
wherever calls `sendEmail()`. Keep styles inline (email clients mostly
ignore `<style>` blocks and strip classes) and avoid layout that depends
on flexbox/grid — Outlook's rendering engine doesn't support either.
