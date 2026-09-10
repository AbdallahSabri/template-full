import { z } from "zod";

// Optional integrations (Redis, RabbitMQ, S3, Resend) get their own
// `.optional()` fields here as each milestone wires them up — this schema
// only covers what's required to boot at all. Missing required vars throw
// here, at import time, not wherever the value happens to first get read.
const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    console.error("❌ Invalid environment variables:", fieldErrors);
    throw new Error("Invalid environment variables — see log above.");
  }

  return parsed.data;
}

export const env = loadEnv();
