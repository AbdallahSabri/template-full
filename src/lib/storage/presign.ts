import "server-only";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getStorageClient } from "@/lib/storage/client";

export type StorageError = { ok: false; error: string };

const NOT_CONFIGURED: StorageError = {
  ok: false,
  error: "Storage is not configured (S3_BUCKET is unset).",
};

const PRESIGN_TTL_SECONDS = 5 * 60;

// {ownerId}/{entity}/{id}/{filename} — see CLAUDE.md in this directory.
export function buildObjectKey(params: {
  ownerId: string;
  entity: string;
  id: string;
  filename: string;
}): string {
  const safeFilename = params.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${params.ownerId}/${params.entity}/${params.id}/${safeFilename}`;
}

export async function createPresignedPutUrl(params: {
  key: string;
  contentType: string;
}): Promise<{ ok: true; uploadUrl: string; expiresIn: number } | StorageError> {
  const storage = getStorageClient();
  if (!storage) return NOT_CONFIGURED;

  const uploadUrl = await getSignedUrl(
    storage.client,
    new PutObjectCommand({
      Bucket: storage.bucket,
      Key: params.key,
      ContentType: params.contentType,
    }),
    { expiresIn: PRESIGN_TTL_SECONDS },
  );

  return { ok: true, uploadUrl, expiresIn: PRESIGN_TTL_SECONDS };
}

// Confirms the object actually landed in the bucket before a PENDING row
// is flipped to UPLOADED — the client calling PATCH /api/uploads/:id is
// unverified, it's just claiming the PUT succeeded.
export async function objectExists(
  key: string,
): Promise<boolean | StorageError> {
  const storage = getStorageClient();
  if (!storage) return NOT_CONFIGURED;

  try {
    await storage.client.send(
      new HeadObjectCommand({ Bucket: storage.bucket, Key: key }),
    );
    return true;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "$metadata" in error &&
      (error as { $metadata?: { httpStatusCode?: number } }).$metadata
        ?.httpStatusCode === 404
    ) {
      return false;
    }
    throw error;
  }
}
