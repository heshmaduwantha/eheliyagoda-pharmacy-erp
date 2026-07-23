import { existsSync, readFileSync } from "node:fs";

function readEnvFile() {
  const path = new URL("../.env", import.meta.url);
  if (!existsSync(path)) return {};
  return Object.fromEntries(readFileSync(path, "utf8").split(/\r?\n/).flatMap((raw) => {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) return [];
    const [key, ...rest] = line.split("=");
    return [[key.trim(), rest.join("=").trim().replace(/^['\"]|['\"]$/g, "")]];
  }));
}

const values = { ...readEnvFile(), ...process.env };
if (values.APP_ENV !== "uat" || values.UAT_MODE !== "true") {
  throw new Error("Refusing UAT database command: APP_ENV=uat and UAT_MODE=true are both required.");
}
if (values.APP_ENV === "production") throw new Error("Refusing to run a UAT command against production.");

const databaseUrl = values.DIRECT_URL ?? values.DATABASE_URL;
if (!databaseUrl) throw new Error("Refusing UAT database command: DIRECT_URL or DATABASE_URL is required.");
const host = new URL(databaseUrl).hostname;
if (["localhost", "127.0.0.1", "::1"].includes(host)) {
  throw new Error("Refusing UAT database command against localhost.");
}
console.log(`UAT database guard passed for host: ${host}`);
