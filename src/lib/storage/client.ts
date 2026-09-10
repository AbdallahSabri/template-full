import "server-only";
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

export type StorageClient = { client: S3Client; bucket: string };

let cached: StorageClient | null | undefined;

// Feature-detected on S3_BUCKET alone — the other S3_* / AWS_* vars are
// meaningless without it. Returns null when storage isn't configured;
// callers surface that as a typed error, they never crash on it (see
// src/lib/storage/CLAUDE.md).
export function getStorageClient(): StorageClient | null {
  if (cached !== undefined) return cached;

  if (!env.S3_BUCKET) {
    cached = null;
    return cached;
  }

  cached = {
    bucket: env.S3_BUCKET,
    client: new S3Client({
      region: env.S3_REGION ?? "us-east-1",
      endpoint: env.S3_ENDPOINT,
      // MinIO (and most other S3-compatible services) need path-style
      // addressing; real AWS S3 works with either, so this only matters
      // when a custom endpoint is set.
      forcePathStyle: Boolean(env.S3_ENDPOINT),
      credentials:
        env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: env.AWS_ACCESS_KEY_ID,
              secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    }),
  };
  return cached;
}
