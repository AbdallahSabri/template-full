import { z } from "zod";

// .env files commonly leave unset optional vars as an empty string rather
// than omitting the key entirely — treat "" the same as undefined so an
// unconfigured optional var doesn't fail validation.
const optionalString = () =>
  z.preprocess((v) => (v === "" ? undefined : v), z.string().min(1).optional());

// Optional integrations (Redis, RabbitMQ, S3, Resend) get their own
// `optionalString()` fields here as each milestone wires them up — this
// schema only covers what's required to boot at all. Missing required vars
// throw here, at import time, not wherever the value happens to first get
// read.
const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),

  // Optional — Google OAuth. Both must be set together for the provider to
  // be enabled; src/lib/auth.ts feature-detects on their presence.
  GOOGLE_CLIENT_ID: optionalString(),
  GOOGLE_CLIENT_SECRET: optionalString(),

  // Optional — S3-compatible storage. src/lib/storage/client.ts
  // feature-detects on S3_BUCKET alone; the rest are meaningless without
  // it. S3_ENDPOINT is set for MinIO in dev and omitted for AWS S3.
  AWS_ACCESS_KEY_ID: optionalString(),
  AWS_SECRET_ACCESS_KEY: optionalString(),
  S3_BUCKET: optionalString(),
  S3_REGION: optionalString(),
  S3_ENDPOINT: optionalString(),
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
