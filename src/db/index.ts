import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as appSchema from "@/db/schema/app";

const schema = { ...appSchema };

const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, { schema });
