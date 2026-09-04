import { PrismaClient } from "@prisma/client";
import { env } from "./env";
import { isPerformanceLoggingEnabled, recordDatabaseQuery } from "./performance";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaRaw?: PrismaClient;
};

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const rawClient = new PrismaClient({
    datasourceUrl: env.DATABASE_URL,
  });

  globalForPrisma.prismaRaw = rawClient;

  let client: PrismaClient = rawClient;

  if (isPerformanceLoggingEnabled()) {
    client = rawClient.$extends({
      query: {
        async $allOperations({ model, operation, args, query }) {
          const startedAt = performance.now();
          try {
            return await query(args);
          } finally {
            recordDatabaseQuery(`${model ?? "raw"}.${operation}`, performance.now() - startedAt);
          }
        },
      },
    }) as unknown as PrismaClient;
  }

  if (env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

/** Reuses the exact same Prisma client singleton across hot reloads in development. */
export const prisma = globalForPrisma.prisma ?? getPrismaClient();
