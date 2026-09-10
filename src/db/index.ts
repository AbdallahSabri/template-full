import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as appSchema from "@/db/schema/app";
import * as authSchema from "@/db/schema/auth";
import * as uploadsSchema from "@/db/schema/uploads";

const schema = { ...appSchema, ...authSchema, ...uploadsSchema };

const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, { schema });
