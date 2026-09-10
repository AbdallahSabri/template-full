# src/lib/storage — presigned upload flow

`client.ts`'s `getStorageClient()` is feature-detected on `S3_BUCKET`
alone — it returns `null` when unset, and every other `S3_*`/`AWS_*` var is
meaningless without it. Never branch on those vars directly at a call
site; call `getStorageClient()` (or, more likely, one of `presign.ts`'s
functions) and handle the `null`/`StorageError` case.

`presign.ts` is the actual interface routes use — `createPresignedPutUrl()`
and `objectExists()` both return a `StorageError` (`{ ok: false, error }`)
instead of throwing when storage isn't configured. Route handlers turn
that into a 503 with the error message; they never crash on a missing S3
env var.

## Two-phase upload

1. `POST /api/uploads` — client sends `{ entity, filename, contentType,
size? }`. The route generates the upload id, builds the object key,
   gets a presigned PUT URL, and inserts a `PENDING` row (scoped by
   `requireTenant()`, like every other `src/db/queries/` function).
2. Client PUTs the file bytes directly to the presigned URL — the app
   server never sees the file body.
3. `PATCH /api/uploads/:id` — the route calls `objectExists()` (a
   `HeadObjectCommand`) before flipping the row to `UPLOADED`. The client's
   claim that the PUT succeeded is not trusted on its own; a 409 means the
   object genuinely isn't there.

## Key structure

`{ownerId}/{entity}/{id}/{filename}` (`buildObjectKey()` in `presign.ts`).
`ownerId` is the tenant id from `requireTenant()`, `entity` is a
caller-chosen logical grouping (e.g. `"avatar"`, `"attachment"`), `id` is
the upload row's own id, and `filename` is sanitized to
`[a-zA-Z0-9._-]`. This keeps every object under a given owner's prefix,
which matters if a bucket policy or lifecycle rule ever needs to scope by
tenant.

## Orphaned PENDING rows

A row can get stuck at `PENDING` forever if the client never calls PATCH
(tab closed, upload abandoned, network failure after the presigned PUT).
Nothing sweeps these yet — this template has no cron/scheduled-job
mechanism. When one exists (see M6/M7), add a sweep that deletes `PENDING`
rows older than the presign TTL (`PRESIGN_TTL_SECONDS` in `presign.ts`,
currently 5 minutes) plus a safety margin, and best-effort deletes the S3
object at that key in case a PUT did land after all. Until then, orphaned
rows are a known, harmless gap — they don't correspond to real storage
usage, so they cost nothing beyond a stale table row.
