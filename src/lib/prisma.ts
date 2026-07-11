import { PrismaClient } from "@prisma/client";
import { env } from "./env";
import { isPerformanceLoggingEnabled, recordDatabaseQuery } from "./performance";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
  if (!isPerformanceLoggingEnabled()) return client;

  return client.$extends({
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

/** Reuses the Prisma client during development hot reloads. */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
