import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

type PerformanceSegment = "authMs" | "permissionMs" | "redisMs" | "externalStorageMs";

type SlowestQuery = {
  operation: string;
  durationMs: number;
};

type PerformanceContext = {
  requestId: string;
  route: string;
  method: string;
  actorId: string | null;
  startedAt: number;
  authMs: number;
  permissionMs: number;
  dbMs: number;
  dbQueryCount: number;
  redisMs: number;
  externalStorageMs: number;
  statusCode: number;
  slowestQuery: SlowestQuery | null;
};

export type PerformanceSummary = Omit<PerformanceContext, "startedAt" | "slowestQuery"> & {
  event: "server.performance";
  totalMs: number;
  slowestQueryOperation: string | null;
  slowestQueryMs: number;
};

const performanceStorage = new AsyncLocalStorage<PerformanceContext>();

export function isPerformanceLoggingEnabled() {
  if (process.env.PERF_LOGGING === "0") return false;
  return process.env.PERF_LOGGING === "1" || process.env.NODE_ENV !== "production";
}

function roundMs(value: number) {
  return Math.round(value * 10) / 10;
}

export function recordDatabaseQuery(operation: string, durationMs: number) {
  const context = performanceStorage.getStore();
  if (!context) return;

  context.dbMs += durationMs;
  context.dbQueryCount += 1;
  if (!context.slowestQuery || durationMs > context.slowestQuery.durationMs) {
    context.slowestQuery = { operation, durationMs };
  }
}

export async function measurePerformanceSegment<T>(segment: PerformanceSegment, operation: () => Promise<T>) {
  const context = performanceStorage.getStore();
  if (!context) return operation();

  const startedAt = performance.now();
  try {
    return await operation();
  } finally {
    context[segment] += performance.now() - startedAt;
  }
}

export function measurePerformanceSegmentSync<T>(segment: PerformanceSegment, operation: () => T) {
  const context = performanceStorage.getStore();
  if (!context) return operation();

  const startedAt = performance.now();
  try {
    return operation();
  } finally {
    context[segment] += performance.now() - startedAt;
  }
}

export function setPerformanceActor(actorId: string | null) {
  const context = performanceStorage.getStore();
  if (context) context.actorId = actorId;
}

export function setPerformanceStatus(statusCode: number) {
  const context = performanceStorage.getStore();
  if (context) context.statusCode = statusCode;
}

function summarize(context: PerformanceContext): PerformanceSummary {
  return {
    event: "server.performance",
    requestId: context.requestId,
    route: context.route,
    method: context.method,
    actorId: context.actorId,
    totalMs: roundMs(performance.now() - context.startedAt),
    authMs: roundMs(context.authMs),
    permissionMs: roundMs(context.permissionMs),
    dbMs: roundMs(context.dbMs),
    dbQueryCount: context.dbQueryCount,
    redisMs: roundMs(context.redisMs),
    externalStorageMs: roundMs(context.externalStorageMs),
    statusCode: context.statusCode,
    slowestQueryOperation: context.slowestQuery?.operation ?? null,
    slowestQueryMs: roundMs(context.slowestQuery?.durationMs ?? 0),
  };
}

export async function withPerformanceTrace<T>(
  input: { route: string; method: string; actorId?: string | null; requestId?: string },
  operation: () => Promise<T>,
) {
  if (!isPerformanceLoggingEnabled()) return operation();

  const context: PerformanceContext = {
    requestId: input.requestId ?? randomUUID(),
    route: input.route,
    method: input.method,
    actorId: input.actorId ?? null,
    startedAt: performance.now(),
    authMs: 0,
    permissionMs: 0,
    dbMs: 0,
    dbQueryCount: 0,
    redisMs: 0,
    externalStorageMs: 0,
    statusCode: 200,
    slowestQuery: null,
  };

  return performanceStorage.run(context, async () => {
    try {
      return await operation();
    } catch (error) {
      if (context.statusCode === 200) context.statusCode = 500;
      throw error;
    } finally {
      console.info(JSON.stringify(summarize(context)));
    }
  });
}
