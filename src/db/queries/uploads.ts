import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { uploads } from "@/db/schema/uploads";

export async function createPendingUpload(
  tenantId: string,
  data: {
    id: string;
    entity: string;
    key: string;
    filename: string;
    contentType: string;
    size?: number;
  },
) {
  const [row] = await db
    .insert(uploads)
    .values({ ownerId: tenantId, ...data })
    .returning();
  return row;
}

export async function getUploadById(tenantId: string, id: string) {
  const [row] = await db
    .select()
    .from(uploads)
    .where(and(eq(uploads.id, id), eq(uploads.ownerId, tenantId)));
  return row ?? null;
}

export async function markUploadUploaded(tenantId: string, id: string) {
  const [row] = await db
    .update(uploads)
    .set({ status: "UPLOADED", updatedAt: new Date() })
    .where(and(eq(uploads.id, id), eq(uploads.ownerId, tenantId)))
    .returning();
  return row ?? null;
}
