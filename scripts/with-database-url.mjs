import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  const parsed = {};
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith(";")) continue;

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (!key) continue;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

function buildDatabaseUrl(env) {
  if (env.DATABASE_URL) return env.DATABASE_URL;

  const host = env.PG_DB_HOST;
  const port = env.PG_DB_PORT;
  const name = env.PG_DB_NAME;
  const user = env.PG_DB_USER;
  const password = env.PG_DB_PASSWORD;

  if (!host || !port || !name || !user || !password) {
    throw new Error(
      "Provide DATABASE_URL or the full PG_DB_HOST, PG_DB_PORT, PG_DB_NAME, PG_DB_USER, and PG_DB_PASSWORD set before running Prisma commands.",
    );
  }

  const url = new URL(`postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(name)}`);
  url.searchParams.set("schema", "public");
  return url.toString();
}

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("Usage: node scripts/with-database-url.mjs <command> [args...]");
  process.exit(1);
}

const fileEnv = parseEnvFile(new URL("../.env", import.meta.url));
const mergedEnv = { ...fileEnv, ...process.env };
const databaseUrl = buildDatabaseUrl(mergedEnv);

const child = spawn(command, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
