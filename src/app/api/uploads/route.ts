import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTenant } from "@/lib/session";
import { createPendingUpload } from "@/db/queries/uploads";
import { buildObjectKey, createPresignedPutUrl } from "@/lib/storage/presign";

const bodySchema = z.object({
  entity: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive().optional(),
});

// Phase 1 of the two-phase upload: create a PENDING row and hand back a
// presigned PUT URL. The client uploads directly to storage, then calls
// PATCH /api/uploads/:id to confirm.
export async function POST(request: Request) {
  const { tenantId } = await requireTenant();

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const id = randomUUID();
  const key = buildObjectKey({
    ownerId: tenantId,
    entity: parsed.data.entity,
    id,
    filename: parsed.data.filename,
  });

  const presigned = await createPresignedPutUrl({
    key,
    contentType: parsed.data.contentType,
  });
  if (!presigned.ok) {
    return NextResponse.json({ error: presigned.error }, { status: 503 });
  }

  const row = await createPendingUpload(tenantId, { id, key, ...parsed.data });

  return NextResponse.json(
    {
      id: row.id,
      key: row.key,
      uploadUrl: presigned.uploadUrl,
      expiresIn: presigned.expiresIn,
    },
    { status: 201 },
  );
}
