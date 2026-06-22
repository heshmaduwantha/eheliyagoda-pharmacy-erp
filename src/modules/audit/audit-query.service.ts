import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditLogFilters = {
  search?: string;
  action?: string;
  entityType?: string;
  page?: number;
  pageSize?: number;
};

export type AuditLogReadRow = {
  id: string;
  actorName: string | null;
  actorUsername: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

/** Safe, paginated audit read model; mutation JSON payloads are intentionally excluded. */
export async function listAuditLogs(filters: AuditLogFilters = {}) {
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const pageSize = Math.min(100, Math.max(10, Math.floor(filters.pageSize ?? 50)));
  const search = filters.search?.trim();
  const where: Prisma.AuditLogWhereInput = {
    action: filters.action?.trim() ? { contains: filters.action.trim(), mode: "insensitive" } : undefined,
    entityType: filters.entityType?.trim() ? { equals: filters.entityType.trim(), mode: "insensitive" } : undefined,
    OR: search
      ? [
          { action: { contains: search, mode: "insensitive" } },
          { entityType: { contains: search, mode: "insensitive" } },
          { entityId: { contains: search, mode: "insensitive" } },
          { actor: { name: { contains: search, mode: "insensitive" } } },
          { actor: { username: { contains: search, mode: "insensitive" } } },
        ]
      : undefined,
  };

  const [totalItems, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        actor: { select: { name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const rows: AuditLogReadRow[] = logs.map((log) => ({
    id: log.id,
    actorName: log.actor?.name ?? null,
    actorUsername: log.actor?.username ?? null,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    createdAt: log.createdAt.toISOString(),
  }));
  return {
    rows,
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
}
