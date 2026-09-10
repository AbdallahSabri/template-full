import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/session";
import { getUploadById, markUploadUploaded } from "@/db/queries/uploads";
import { objectExists } from "@/lib/storage/presign";

// Phase 2 of the two-phase upload: the client calls this after PUTing the
// object to the presigned URL. We verify the object actually landed in
// storage before flipping PENDING -> UPLOADED — the caller is unverified,
// it's just claiming the PUT succeeded.
export async function PATCH(
  _request: Request,
  { params }: RouteContext<"/api/uploads/[id]">,
) {
  const { tenantId } = await requireTenant();
  const { id } = await params;

  const existing = await getUploadById(tenantId, id);
  if (!existing) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }
  if (existing.status === "UPLOADED") {
    return NextResponse.json(existing);
  }

  const exists = await objectExists(existing.key);
  if (typeof exists !== "boolean") {
    return NextResponse.json({ error: exists.error }, { status: 503 });
  }
  if (!exists) {
    return NextResponse.json(
      { error: "Object not found in storage — the upload may have failed." },
      { status: 409 },
    );
  }

  const updated = await markUploadUploaded(tenantId, id);
  return NextResponse.json(updated);
}
