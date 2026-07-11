import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serverOnly } from "@/lib/server-only";

serverOnly();

export type WriteAuditLogInput = {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  beforeData?: Prisma.InputJsonValue;
  afterData?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

/** Prisma client or interactive transaction client; both expose `auditLog.create`. */
export type AuditClient = Pick<typeof prisma, "auditLog">;

/**
 * Writes an audit row. Pass the active transaction client so the audit row is
 * committed in the same transaction as the mutation it records.
 * Callers must exclude passwords, secrets, tokens, and other sensitive values.
 */
export async function writeAuditLog(input: WriteAuditLogInput, client: AuditClient = prisma) {
  return client.auditLog.create({ data: input });
}

/** Writes several distinct audit events in one statement inside the caller's transaction. */
export async function writeAuditLogs(inputs: WriteAuditLogInput[], client: AuditClient = prisma) {
  if (inputs.length === 0) return { count: 0 };
  return client.auditLog.createMany({ data: inputs });
}
