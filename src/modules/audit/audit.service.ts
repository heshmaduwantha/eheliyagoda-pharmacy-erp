import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serverOnly } from "@/lib/server-only";

serverOnly();

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
