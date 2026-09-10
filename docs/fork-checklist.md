# Fork checklist

Steps for turning this template into a real, standalone project. Do all
of these — each one exists because skipping it fails silently weeks
later, not immediately (a reused secret still "works," a shared dev
database still "works," until it very much doesn't). This is about
**this fork becoming its own project**; deploying a given commit of it is
`docs/deploy-checklist.md`'s job — do that too, but after this.

## 1. Rename

- `package.json`: `name`.
- `src/app/layout.tsx`: the `metadata` export (`title`/`description`) is
  still the unmodified create-next-app default — set it to the real
  product name.
- Anywhere else the string "template-full" or generic placeholder
  copy appears (skim the repo — there's no single source of truth for
  this one, it's just naming).

## 2. New Postgres database

Don't point a fork at the template's dev database or at another fork's
production database.

1. Provision a fresh Postgres instance/database (Coolify can host one, or
   point at any external Postgres).
2. Set `DATABASE_URL` to it — locally in `.env`, and in Coolify's runtime
   Environment Variables (see `docs/deploy-checklist.md`).
3. Run `pnpm db:migrate` against it. A brand-new database has no
   `__drizzle_migrations` history, so this applies every migration in
   `drizzle/` from the start — confirm it completes without error before
   moving on.

## 3. New `BETTER_AUTH_SECRET`

**Never reuse the template's dev value, and never reuse one fork's secret
across another fork or environment.** It signs session tokens; a shared
secret means one environment can forge sessions for another.

Generate one, e.g.:

```bash
openssl rand -base64 32
```

Set it in `.env` locally and in Coolify's runtime Environment Variables.
Set `BETTER_AUTH_URL` (and `NEXT_PUBLIC_APP_URL`) to match wherever this
fork is actually reachable — not the template's `localhost:3000` default.

## 4. DNS / SSL

1. Point the fork's domain at the Coolify server (an A/AAAA record, or a
   CNAME per Coolify's own instructions for the setup in use).
2. Let Coolify provision SSL (Let's Encrypt) for the domain once DNS has
   propagated — don't set the service live before this finishes, or the
   first real users hit a certificate warning.
3. Update `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` to the real
   `https://` domain, not the Coolify-assigned default hostname.
4. **If Google OAuth is enabled:** the authorized redirect URI configured
   in Google's OAuth client is tied to the exact domain. Add
   `https://<real-domain>/api/auth/callback/google` to the OAuth client's
   allowed redirect URIs — the template's dev redirect URI won't match a
   new domain, and Google will reject the callback with no useful error
   in this app's own logs.

## 5. Resend sending domain (only if email is used)

Skip this section entirely if `RESEND_API_KEY`/`EMAIL_FROM` are staying
unset — the console-log fallback is a legitimate choice, not just a dev
placeholder, for a project that doesn't need real email yet.

1. In Resend, verify a sending domain (SPF/DKIM records) — sending from
   an unverified domain either fails outright or lands in spam.
2. Set `EMAIL_FROM` to an address on that verified domain (matches the
   format Better Auth/Resend expect: `"Name <user@verified-domain>"` or
   plain `user@verified-domain`).
3. Set `RESEND_API_KEY` to a key scoped to this project — don't share one
   Resend API key across multiple forks; there's no per-project
   attribution or rate-limit isolation if you do.

## 6. S3 bucket (only if storage is used)

Skip if `S3_BUCKET` is staying unset.

1. Create a fresh bucket (AWS S3, or any S3-compatible provider) — don't
   reuse another fork's bucket; `src/lib/storage/presign.ts`'s key
   structure (`{ownerId}/{entity}/{id}/{filename}`) scopes by _this app's_
   user ids, which mean nothing in another fork's bucket.
2. Set `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `S3_BUCKET` /
   `S3_REGION`; set `S3_ENDPOINT` only for a non-AWS S3-compatible
   provider (omit it for real AWS S3).
3. Confirm the bucket's CORS config allows presigned PUT from this fork's
   real domain — the local MinIO dev setup doesn't need CORS configured,
   production S3 usually does.

## 7. Redis / RabbitMQ (only if used)

Skip either that's staying unset. If used, point `REDIS_URL` /
`RABBITMQ_URL` at instances provisioned for **this fork** — sharing one
Redis/RabbitMQ instance across multiple forks means one fork's rate-limit
keys, cache keys, and queue names collide with another's (nothing here is
namespaced per-project).

## 8. Verify

After the above, follow `docs/deploy-checklist.md` to actually stand the
service up on Coolify, then confirm end-to-end:

1. Visit the real domain, sign up with a real email address.
2. Verification email arrives (or, if Resend is intentionally unset,
   confirm that was a deliberate choice for this fork, not an oversight).
3. Verify the account, sign in.
4. The dashboard (a protected route) loads — confirms
   `BETTER_AUTH_SECRET`/`DATABASE_URL`/`BETTER_AUTH_URL` are all correctly
   wired together, not just individually "set."
5. Sign out.

If every step above worked from this checklist alone — no step skipped,
no undocumented fix needed — the fork is done.
