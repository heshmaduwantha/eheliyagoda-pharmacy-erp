import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRedisConnection } from "@/lib/redis";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  let database = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch {
    // Do not disclose connection details from a public readiness endpoint.
  }

  if (!database) {
    return NextResponse.json({ status: "unready", environment: env.APP_ENV, database: "unavailable", serverTime: new Date().toISOString() }, { status: 503 });
  }

  const redis = await checkRedisConnection();
  return NextResponse.json({
    status: redis ? "ok" : "degraded",
    environment: env.APP_ENV,
    database: "ok",
    redis: redis ? "ok" : "unavailable",
    version: process.env.NETLIFY_COMMIT_REF ?? process.env.COMMIT_REF ?? "local",
    serverTime: new Date().toISOString(),
  });
}
