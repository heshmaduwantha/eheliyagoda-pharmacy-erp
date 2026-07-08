import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection URL.").optional(),
  PG_DB_HOST: z.string().min(1).optional(),
  PG_DB_PORT: z.string().regex(/^\d+$/, "PG_DB_PORT must be a valid port number.").optional(),
  PG_DB_NAME: z.string().min(1).optional(),
  PG_DB_USER: z.string().min(1).optional(),
  PG_DB_PASSWORD: z.string().min(1).optional(),
  REDIS_URL: z.string().url("REDIS_URL must be a valid Redis connection URL."),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must contain at least 32 characters."),
  APP_URL: z.string().url("APP_URL must be a valid application URL."),
});

function buildDatabaseUrl(env: z.infer<typeof serverEnvSchema>) {
  if (env.DATABASE_URL) return env.DATABASE_URL;

  const { PG_DB_HOST: host, PG_DB_PORT: port, PG_DB_NAME: name, PG_DB_USER: user, PG_DB_PASSWORD: password } = env;
  if (!host || !port || !name || !user || !password) {
    throw new Error(
      "Invalid server environment configuration. Provide DATABASE_URL or PG_DB_HOST, PG_DB_PORT, PG_DB_NAME, PG_DB_USER, and PG_DB_PASSWORD.",
    );
  }

  const url = new URL(`postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(name)}`);
  url.searchParams.set("schema", "public");
  return url.toString();
}

function validateServerEnv() {
  const result = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    PG_DB_HOST: process.env.PG_DB_HOST,
    PG_DB_PORT: process.env.PG_DB_PORT,
    PG_DB_NAME: process.env.PG_DB_NAME,
    PG_DB_USER: process.env.PG_DB_USER,
    PG_DB_PASSWORD: process.env.PG_DB_PASSWORD,
    REDIS_URL: process.env.REDIS_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    APP_URL: process.env.APP_URL,
  });

  if (result.success) {
    const data = {
      ...result.data,
      DATABASE_URL: buildDatabaseUrl(result.data),
    };
    process.env.DATABASE_URL = data.DATABASE_URL;
    return data;
  }

  const details = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid server environment configuration. ${details}`);
}

/** Validated server-only environment configuration. */
export const env = validateServerEnv();
