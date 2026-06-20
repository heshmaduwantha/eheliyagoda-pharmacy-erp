import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type WriteAuditLogInput = {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  beforeData?: Prisma.InputJsonValue;
  afterData?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

/** Callers must exclude passwords, secrets, tokens, and other sensitive values. */
export async function writeAuditLog(input: WriteAuditLogInput) {
  return prisma.auditLog.create({ data: input });
}
