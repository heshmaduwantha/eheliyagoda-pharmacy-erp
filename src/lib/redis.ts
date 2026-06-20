import { createClient, type RedisClientType } from "redis";
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
