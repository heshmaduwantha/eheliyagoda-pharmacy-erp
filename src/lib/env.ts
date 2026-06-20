import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection URL."),
  REDIS_URL: z.string().url("REDIS_URL must be a valid Redis connection URL."),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must contain at least 32 characters."),
  APP_URL: z.string().url("APP_URL must be a valid application URL."),
});

function validateServerEnv() {
  const result = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    APP_URL: process.env.APP_URL,
  });

  if (result.success) return result.data;

  const details = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid server environment configuration. ${details}`);
}

/** Validated server-only environment configuration. */
export const env = validateServerEnv();
