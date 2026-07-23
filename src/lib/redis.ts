import { createClient, type RedisClientType } from "redis";
import { createHash } from "node:crypto";
import { env } from "./env";

type RedisClient = RedisClientType;

const globalForRedis = globalThis as unknown as {
  redis?: RedisClient;
  redisConnectPromise?: Promise<void>;
};

/**
 * Redis is supporting infrastructure for future cache, session, and rate-limit
 * features. PostgreSQL remains the source of truth for ERP data.
 */
export function getRedisClient(): RedisClient {
  if (globalForRedis.redis) return globalForRedis.redis;
  if (!env.REDIS_URL) throw new Error("Redis is not configured.");

  const client = createClient({ url: env.REDIS_URL });
  client.on("error", (error) => {
    console.error("Redis client error:", error.message);
  });

  globalForRedis.redis = client;
  return client;
}

async function connectIfNeeded(client: RedisClient) {
  if (client.isOpen) return;
  if (!globalForRedis.redisConnectPromise) {
    globalForRedis.redisConnectPromise = client
      .connect()
      .then(() => undefined)
      .finally(() => {
        globalForRedis.redisConnectPromise = undefined;
      });
  }
  await globalForRedis.redisConnectPromise;
}

export async function checkRedisConnection(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await connectIfNeeded(client);
    return (await client.ping()) === "PONG";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Redis error";
    console.error("Redis health check failed:", message);
    return false;
  }
}

/** Security-sensitive login throttling. A cache outage fails closed for login,
 * while inventory and payment transactions remain PostgreSQL-only. */
export async function consumeLoginAttempt(username: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    await connectIfNeeded(client);
    const digest = createHash("sha256").update(username.trim().toLowerCase()).digest("hex");
    const key = `eheliyagoda-pharmacy:${env.APP_ENV}:login:${digest}`;
    const attempts = await client.incr(key);
    if (attempts === 1) await client.expire(key, 15 * 60);
    return attempts <= 10;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Redis error";
    console.error("Login throttle unavailable:", message);
    return false;
  }
}

export async function clearLoginAttempts(username: string) {
  const client = getRedisClient();
  await connectIfNeeded(client);
  const digest = createHash("sha256").update(username.trim().toLowerCase()).digest("hex");
  await client.del(`eheliyagoda-pharmacy:${env.APP_ENV}:login:${digest}`);
}
