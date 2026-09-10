import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

// Deliberate exception to the "every query function scopes by
// session/tenant" rule, like auth-adapter.ts — this doesn't return app
// rows, it just confirms the DB connection is alive for /api/health.
export async function checkDatabaseConnection(): Promise<void> {
  await db.execute(sql`select 1`);
}
