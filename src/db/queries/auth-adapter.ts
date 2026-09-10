import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as authSchema from "@/db/schema/auth";

// Not a query function like the rest of this directory — it's the one
// piece of wiring Better Auth needs to reach the raw Drizzle client, which
// is why it lives here rather than in src/lib/auth.ts (see root CLAUDE.md
// convention #1: only src/db/queries/ may import src/db/index.ts).
// Better Auth owns authorization for its own tables (session tokens,
// account linkage) internally, so the usual "scope every query by
// session/tenant" rule (convention #2) doesn't apply to this file.
export const authAdapter = drizzleAdapter(db, {
  provider: "pg",
  schema: authSchema,
});
