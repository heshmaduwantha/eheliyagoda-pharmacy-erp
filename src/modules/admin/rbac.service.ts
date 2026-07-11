import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serverOnly } from "@/lib/server-only";
import { writeAuditLog, writeAuditLogs } from "@/modules/audit/audit.service";
import { canonicalizePermissionCode, permissionRegistry, type PermissionDefinition } from "@/modules/auth/permission-registry";
import type { CurrentUser } from "@/modules/auth/session";

serverOnly();

const reservedRoleCodes = new Set(["owner", "pharmacist", "cashier", "inventory_manager", "auditor"]);
const roleCodePattern = /^[a-z][a-z0-9_]*$/;

type DbClient = typeof prisma | Prisma.TransactionClient;

export type AdminUserListFilters = {
  search?: string;
  status?: "all" | "active" | "inactive";
};

export type AdminRoleListFilters = {
  search?: string;
  status?: "all" | "active" | "inactive";
};

export type AdminUserListRow = {
  id: string;
  name: string;
  username: string;
  isActive: boolean;
  primaryRoleId: string;
  primaryRoleCode: string;
  primaryRoleName: string;
  roleCodes: string[];
  roleNames: string[];
  createdAt: string;
  updatedAt: string;
};

export type AdminRoleListRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  permissionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminPermissionRow = PermissionDefinition & {
  id: string;
  createdAt: string;
  updatedAt: string;
  roleCount: number;
};

export type AdminUserDetail = {
  id: string;
  name: string;
  username: string;
  phone: string | null;
  isActive: boolean;
  primaryRoleId: string;
  primaryRoleCode: string;
  primaryRoleName: string;
  roleIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type AdminRoleDetail = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissionCodes: string[];
  userCount: number;
};

export type BootstrapState = {
  hasUsers: boolean;
  hasOwnerRole: boolean;
};

export type CreateUserInput = {
  name: string;
  username: string;
  password: string;
  phone?: string;
  isActive: boolean;
  primaryRoleId: string;
  roleIds: string[];
};

export type UpdateUserInput = Omit<CreateUserInput, "password"> & {
  password?: string;
};

export type CreateRoleInput = {
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  permissionCodes: string[];
};

export type UpdateRoleInput = CreateRoleInput;

function uniqueStrings(values: Iterable<string>) {
  return [...new Set([...values].map((value) => value.trim()).filter(Boolean))];
}

function normalizeText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function assertUsernameAvailable(client: DbClient, username: string, excludingUserId?: string) {
  const existing = await client.user.findFirst({
    where: {
      username,
      ...(excludingUserId ? { NOT: { id: excludingUserId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Username is already in use.");
  }
}

async function ensurePermissionCatalog(client: DbClient = prisma) {
  const registryJson = JSON.stringify(permissionRegistry.map((permission) => ({
    id: randomUUID(),
    code: permission.code,
    module: permission.module,
    resource: permission.resource,
    action: permission.action,
    description: permission.description ?? null,
    isSensitive: permission.isSensitive ?? false,
  })));

  await client.$executeRaw(Prisma.sql`
    INSERT INTO "Permission" (
      id, code, module, resource, action, description, "isSensitive"
    )
    SELECT
      registry.id::uuid,
      registry.code,
      registry.module,
      registry.resource,
      registry.action,
      registry.description,
      registry."isSensitive"
    FROM jsonb_to_recordset(${registryJson}::jsonb) AS registry(
      id text,
      code text,
      module text,
      resource text,
      action text,
      description text,
      "isSensitive" boolean
    )
    ON CONFLICT (code) DO UPDATE SET
      module = EXCLUDED.module,
      resource = EXCLUDED.resource,
      action = EXCLUDED.action,
      description = EXCLUDED.description,
      "isSensitive" = EXCLUDED."isSensitive",
      "updatedAt" = CURRENT_TIMESTAMP
  `);
}

async function getRolePermissions(roleId: string, client: DbClient = prisma) {
  const role = await client.role.findUnique({
    where: { id: roleId },
    select: {
      rolePermissions: { select: { permission: { select: { code: true } } } },
    },
  });
  return role?.rolePermissions.map(({ permission }) => permission.code) ?? [];
}

async function syncUserRoles(
  client: DbClient,
  userId: string,
  roleIds: string[],
  actorUserId?: string | null,
) {
  const uniqueRoleIds = uniqueStrings(roleIds);
  const existing = await client.userRole.findMany({ where: { userId }, select: { roleId: true } });
  const existingRoleIds = new Set(existing.map((row) => row.roleId));
  const roles = await client.role.findMany({
    where: { id: { in: uniqueStrings([...uniqueRoleIds, ...existingRoleIds]) } },
    select: { id: true, code: true, name: true },
  });
  const roleById = new Map(roles.map((role) => [role.id, role]));
  const desiredRoleIds = new Set(uniqueRoleIds);

  const toRemove = existing.filter((row) => !desiredRoleIds.has(row.roleId));
  const toAdd = uniqueRoleIds.filter((roleId) => !existingRoleIds.has(roleId));

  if (toRemove.length > 0) {
    await client.userRole.deleteMany({
      where: {
        userId,
        roleId: { in: toRemove.map((row) => row.roleId) },
      },
    });

  }

  if (toAdd.length > 0) {
    await client.userRole.createMany({
      data: toAdd.map((roleId) => ({
        userId,
        roleId,
        assignedById: actorUserId ?? null,
      })),
    });
  }

  await writeAuditLogs([
    ...toRemove.map((row) => {
      const role = roleById.get(row.roleId);
      return {
        actorUserId: actorUserId ?? null,
        action: "admin.user.role_removed",
        entityType: "USER",
        entityId: userId,
        afterData: {
          roleId: row.roleId,
          roleCode: role?.code,
          roleName: role?.name,
        },
      };
    }),
    ...toAdd.map((roleId) => {
      const role = roleById.get(roleId);
      return {
        actorUserId: actorUserId ?? null,
        action: "admin.user.role_assigned",
        entityType: "USER",
        entityId: userId,
        afterData: {
          roleId,
          roleCode: role?.code,
          roleName: role?.name,
        },
      };
    }),
  ], client);
}

async function assertOwnerStillPresent(client: DbClient, excludingUserId?: string) {
  const ownerRole = await client.role.findUnique({ where: { code: "owner" }, select: { id: true } });
  if (!ownerRole) return;

  const activeOwners = await client.user.findMany({
    where: {
      isActive: true,
      OR: [
        { roleId: ownerRole.id },
        { userRoles: { some: { roleId: ownerRole.id } } },
      ],
      ...(excludingUserId ? { NOT: { id: excludingUserId } } : {}),
    },
    select: { id: true },
  });

  if (activeOwners.length === 0) {
    throw new Error("At least one active Owner user must remain.");
  }
}

async function assertOwnerPermissionSet(client: DbClient, roleId: string, permissionCodes: string[]) {
  const role = await client.role.findUnique({ where: { id: roleId }, select: { code: true } });
  if (!role || role.code !== "owner") return;

  const expectedCodes = uniqueStrings(permissionRegistry.map((permission) => permission.code));
  const actualCodes = uniqueStrings(permissionCodes.map(canonicalizePermissionCode));
  const missing = expectedCodes.filter((code) => !actualCodes.includes(code));
  if (missing.length > 0) {
    throw new Error("Owner role must retain all permissions.");
  }
}

async function getUserPermissionCodes(userId: string, client: DbClient = prisma) {
  const user = await client.user.findFirst({
    where: { id: userId, isActive: true, role: { isActive: true } },
    select: {
      role: {
        select: {
          rolePermissions: { select: { permission: { select: { code: true } } } },
        },
      },
      userRoles: {
        select: {
          role: {
            select: {
              isActive: true,
              rolePermissions: { select: { permission: { select: { code: true } } } },
            },
          },
        },
      },
    },
  });

  if (!user) return [];

  const permissionCodes =
    user.userRoles.length > 0
      ? user.userRoles.flatMap(({ role }) =>
          role.isActive ? role.rolePermissions.map(({ permission }) => permission.code) : [],
        )
      : user.role.rolePermissions.map(({ permission }) => permission.code);

  return uniqueStrings(permissionCodes);
}

export async function getBootstrapState(): Promise<BootstrapState> {
  const [userCount, ownerRole] = await Promise.all([
    prisma.user.count(),
    prisma.role.findUnique({ where: { code: "owner" }, select: { id: true } }),
  ]);

  return {
    hasUsers: userCount > 0,
    hasOwnerRole: Boolean(ownerRole),
  };
}

export async function listAdminUsers(filters: AdminUserListFilters = {}) {
  const search = filters.search?.trim();
  const status = filters.status ?? "all";
  const users = await prisma.user.findMany({
    where: {
      isActive: status === "active" ? true : status === "inactive" ? false : undefined,
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
            { role: { name: { contains: search, mode: "insensitive" } } },
            { role: { code: { contains: search, mode: "insensitive" } } },
            { userRoles: { some: { role: { name: { contains: search, mode: "insensitive" } } } } },
            { userRoles: { some: { role: { code: { contains: search, mode: "insensitive" } } } } },
          ]
        : undefined,
    },
    select: {
      id: true,
      name: true,
      username: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      role: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      userRoles: {
        select: {
          role: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const rows: AdminUserListRow[] = users.map((user) => {
    const roleMap = new Map<string, { id: string; code: string; name: string }>();
    roleMap.set(user.role.id, user.role);
    for (const userRole of user.userRoles) roleMap.set(userRole.role.id, userRole.role);
    const roleValues = [...roleMap.values()];

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      isActive: user.isActive,
      primaryRoleId: user.role.id,
      primaryRoleCode: user.role.code,
      primaryRoleName: user.role.name,
      roleCodes: roleValues.map((role) => role.code),
      roleNames: roleValues.map((role) => role.name),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  });

  return rows;
}

export async function getAdminUser(userId: string, client: DbClient = prisma): Promise<AdminUserDetail | null> {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      phone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      role: { select: { id: true, code: true, name: true } },
      userRoles: {
        select: {
          role: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  const roleMap = new Map<string, { id: string; code: string; name: string }>();
  roleMap.set(user.role.id, user.role);
  for (const userRole of user.userRoles) roleMap.set(userRole.role.id, userRole.role);

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    phone: user.phone,
    isActive: user.isActive,
    primaryRoleId: user.role.id,
    primaryRoleCode: user.role.code,
    primaryRoleName: user.role.name,
    roleIds: [...roleMap.keys()],
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function listAdminRoles(filters: AdminRoleListFilters = {}) {
  const search = filters.search?.trim();
  const status = filters.status ?? "all";
  const roles = await prisma.role.findMany({
    where: {
      isActive: status === "active" ? true : status === "inactive" ? false : undefined,
      OR: search
        ? [
            { code: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      isSystem: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      rolePermissions: { select: { permissionId: true } },
      users: { select: { id: true } },
      userRoles: { select: { userId: true } },
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  const rows: AdminRoleListRow[] = roles.map((role) => {
    const userIds = new Set<string>([
      ...role.users.map((user) => user.id),
      ...role.userRoles.map((userRole) => userRole.userId),
    ]);
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isActive: role.isActive,
      userCount: userIds.size,
      permissionCount: role.rolePermissions.length,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  });

  return rows;
}

export async function getAdminRole(roleId: string, client: DbClient = prisma): Promise<AdminRoleDetail | null> {
  const role = await client.role.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      isSystem: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      rolePermissions: {
        select: {
          permission: { select: { code: true } },
        },
      },
      users: { select: { id: true } },
      userRoles: { select: { userId: true } },
    },
  });

  if (!role) return null;

  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    isActive: role.isActive,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
    permissionCodes: role.rolePermissions.map(({ permission }) => permission.code),
    userCount: new Set([...role.users.map((user) => user.id), ...role.userRoles.map((userRole) => userRole.userId)]).size,
  };
}

export async function listAdminPermissions(): Promise<AdminPermissionRow[]> {
  const permissions = await prisma.permission.findMany({
    where: { code: { in: permissionRegistry.map((permission) => permission.code) } },
    select: {
      code: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { rolePermissions: true } },
    },
  });
  const permissionByCode = new Map(permissions.map((permission) => [permission.code, permission]));

  return permissionRegistry
    .map((definition) => {
      const permission = permissionByCode.get(definition.code);
      return {
        id: definition.code,
        code: definition.code,
        module: definition.module,
        resource: definition.resource,
        action: definition.action,
        description: definition.description,
        isSensitive: Boolean(definition.isSensitive),
        createdAt: permission?.createdAt?.toISOString() ?? "",
        updatedAt: permission?.updatedAt?.toISOString() ?? "",
        roleCount: permission?._count.rolePermissions ?? 0,
      };
    })
    .sort((left, right) =>
      left.module.localeCompare(right.module) ||
      left.resource.localeCompare(right.resource) ||
      left.action.localeCompare(right.action),
    );
}

export async function createBootstrapOwner(input: { name: string; username: string; password: string; phone?: string | null }) {
  const hasUsers = await prisma.user.count();
  if (hasUsers > 0) throw new Error("Bootstrap is only available before the first user exists.");

  await ensurePermissionCatalog();
  const passwordHash = await hash(input.password, 12);

  return prisma.$transaction(async (tx) => {
    const ownerRole = await tx.role.upsert({
      where: { code: "owner" },
      create: {
        code: "owner",
        name: "Owner",
        description: "Pharmacy owner with full access",
        isSystem: true,
        isActive: true,
      },
      update: {
        name: "Owner",
        description: "Pharmacy owner with full access",
        isSystem: true,
        isActive: true,
      },
    });

    const permissionRows = await tx.permission.findMany({
      where: { code: { in: permissionRegistry.map((permission) => permission.code) } },
      select: { id: true },
    });
    await tx.rolePermission.createMany({
      data: permissionRows.map((permission) => ({ roleId: ownerRole.id, permissionId: permission.id })),
      skipDuplicates: true,
    });

    await assertUsernameAvailable(tx, input.username.trim());
    const user = await tx.user.create({
      data: {
        name: input.name.trim(),
        username: input.username.trim(),
        passwordHash,
        phone: normalizeText(input.phone),
        isActive: true,
        roleId: ownerRole.id,
        userRoles: {
          create: [{ roleId: ownerRole.id }],
        },
      },
    });

    await writeAuditLog(
      {
        actorUserId: null,
        action: "admin.user.created",
        entityType: "USER",
        entityId: user.id,
        afterData: {
          username: user.username,
          name: user.name,
          roleCode: ownerRole.code,
          isActive: user.isActive,
          bootstrap: true,
        },
      },
      tx,
    );

    return user;
  });
}

export async function createAdminUser(input: CreateUserInput, actor: CurrentUser) {
  if (!actor.permissions.includes("admin.users.manage")) {
    throw new Error("You do not have permission to create users.");
  }

  const passwordHash = await hash(input.password, 12);

  return prisma.$transaction(async (tx) => {
    const roleIds = uniqueStrings([input.primaryRoleId, ...input.roleIds]);
    if (roleIds.length === 0) {
      throw new Error("Select at least one role.");
    }

    const roles = await tx.role.findMany({
      where: { id: { in: roleIds }, isActive: true },
      select: { id: true, code: true, name: true, isSystem: true, isActive: true },
    });
    if (roles.length !== roleIds.length) {
      throw new Error("One or more selected roles are unavailable.");
    }

    const primaryRole = roles.find((role) => role.id === input.primaryRoleId);
    if (!primaryRole) {
      throw new Error("Select a primary role.");
    }

    await assertUsernameAvailable(tx, input.username.trim());
    const user = await tx.user.create({
      data: {
        name: input.name.trim(),
        username: input.username.trim(),
        passwordHash,
        phone: normalizeText(input.phone),
        isActive: input.isActive,
        roleId: primaryRole.id,
        userRoles: {
          create: roleIds.map((roleId) => ({
            roleId,
            assignedById: actor.id,
          })),
        },
      },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "admin.user.created",
        entityType: "USER",
        entityId: user.id,
        afterData: {
          name: user.name,
          username: user.username,
          roleIds,
          isActive: user.isActive,
        },
      },
      tx,
    );

    return user;
  });
}

export async function updateAdminUser(userId: string, input: UpdateUserInput, actor: CurrentUser) {
  if (!actor.permissions.includes("admin.users.manage")) {
    throw new Error("You do not have permission to update users.");
  }

  const passwordHash = input.password ? await hash(input.password, 12) : undefined;

  return prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        isActive: true,
        roleId: true,
        role: { select: { id: true, code: true, name: true } },
        userRoles: { select: { roleId: true } },
      },
    });

    if (!current) throw new Error("User not found.");

    const roleIds = uniqueStrings([input.primaryRoleId, ...input.roleIds]);
    if (roleIds.length === 0) throw new Error("Select at least one role.");

    const roles = await tx.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, code: true, name: true, isSystem: true, isActive: true },
    });
    if (roles.length !== roleIds.length) throw new Error("One or more selected roles are unavailable.");

    const primaryRole = roles.find((role) => role.id === input.primaryRoleId);
    if (!primaryRole) throw new Error("Select a primary role.");

    const currentRoleIds = new Set([current.roleId, ...current.userRoles.map((role) => role.roleId)]);
    const inactiveRequested = roles.some((role) => !role.isActive && !currentRoleIds.has(role.id));
    if (inactiveRequested) {
      throw new Error("One or more selected roles are inactive.");
    }

    await assertUsernameAvailable(tx, input.username.trim(), userId);
    const ownerRole = await tx.role.findUnique({ where: { code: "owner" }, select: { id: true } });
    const currentHasOwner = ownerRole
      ? current.roleId === ownerRole.id || current.userRoles.some((role) => role.roleId === ownerRole.id)
      : false;
    const nextHasOwner = ownerRole ? roleIds.includes(ownerRole.id) : false;

    if (ownerRole && currentHasOwner && (!input.isActive || !nextHasOwner)) {
      await assertOwnerStillPresent(tx, userId);
    }

    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        name: input.name.trim(),
        username: input.username.trim(),
        phone: normalizeText(input.phone),
        isActive: input.isActive,
        roleId: primaryRole.id,
        ...(passwordHash ? { passwordHash } : {}),
      },
    });

    await syncUserRoles(tx, updated.id, roleIds, actor.id);

    if (current.isActive !== updated.isActive) {
      await writeAuditLog(
        {
          actorUserId: actor.id,
          action: updated.isActive ? "admin.user.activated" : "admin.user.deactivated",
          entityType: "USER",
          entityId: updated.id,
          beforeData: { isActive: current.isActive },
          afterData: { isActive: updated.isActive },
        },
        tx,
      );
    }

    if (input.password) {
      await writeAuditLog(
        {
          actorUserId: actor.id,
          action: "admin.user.password_reset",
          entityType: "USER",
          entityId: updated.id,
          afterData: { passwordReset: true },
        },
        tx,
      );
    }

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "admin.user.updated",
        entityType: "USER",
        entityId: updated.id,
        beforeData: {
          name: current.name,
          username: current.username,
          phone: current.phone,
          isActive: current.isActive,
          primaryRoleId: current.roleId,
          roleIds: current.userRoles.map((role) => role.roleId),
        },
        afterData: {
          name: updated.name,
          username: updated.username,
          phone: updated.phone,
          isActive: updated.isActive,
          primaryRoleId: primaryRole.id,
          roleIds,
          passwordReset: Boolean(input.password),
        },
      },
      tx,
    );

    return updated;
  });
}

export async function setUserActive(userId: string, isActive: boolean, actor: CurrentUser) {
  const user = await getAdminUser(userId);
  if (!user) throw new Error("User not found.");
  return updateAdminUser(
    userId,
    {
      name: user.name,
      username: user.username,
      phone: user.phone ?? undefined,
      isActive,
      primaryRoleId: user.primaryRoleId,
      roleIds: user.roleIds,
    },
    actor,
  );
}

export async function createAdminRole(input: CreateRoleInput, actor: CurrentUser) {
  if (!actor.permissions.includes("admin.roles.manage")) {
    throw new Error("You do not have permission to create roles.");
  }

  await ensurePermissionCatalog();

  return prisma.$transaction(async (tx) => {
    const normalizedCode = input.code.trim().toLowerCase();
    if (!roleCodePattern.test(normalizedCode)) {
      throw new Error("Role code must use lowercase snake_case.");
    }
    if (reservedRoleCodes.has(normalizedCode)) {
      throw new Error("This role code is reserved for system roles.");
    }
    const role = await tx.role.create({
      data: {
        code: normalizedCode,
        name: input.name.trim(),
        description: normalizeText(input.description),
        isSystem: false,
        isActive: input.isActive,
      },
    });

    await syncRolePermissions(tx, role.id, input.permissionCodes, actor.id);

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "admin.role.created",
        entityType: "ROLE",
        entityId: role.id,
        afterData: {
          code: role.code,
          name: role.name,
          isActive: role.isActive,
          permissionCodes: uniqueStrings(input.permissionCodes),
        },
      },
      tx,
    );

    return role;
  });
}

async function syncRolePermissions(client: DbClient, roleId: string, permissionCodes: readonly string[], actorUserId?: string | null) {
  const normalizedCodes = uniqueStrings(permissionCodes.map(canonicalizePermissionCode));
  const permissions = await client.permission.findMany({
    where: { code: { in: normalizedCodes } },
    select: { id: true, code: true },
  });

  if (permissions.length !== normalizedCodes.length) {
    throw new Error("One or more permissions are unavailable.");
  }

  await assertOwnerPermissionSet(client, roleId, normalizedCodes);

  const current = await client.rolePermission.findMany({
    where: { roleId },
    select: { permissionId: true, permission: { select: { code: true } } },
  });
  const currentByCode = new Map(current.map((row) => [row.permission.code, row.permissionId]));
  const desiredByCode = new Map(permissions.map((row) => [row.code, row.id]));

  const toRemove = [...currentByCode.entries()].filter(([code]) => !desiredByCode.has(code));
  const toAdd = [...desiredByCode.entries()].filter(([code]) => !currentByCode.has(code));

  if (toRemove.length > 0) {
    await client.rolePermission.deleteMany({
      where: { roleId, permissionId: { in: toRemove.map(([, permissionId]) => permissionId) } },
    });
  }
  if (toAdd.length > 0) {
    await client.rolePermission.createMany({
      data: toAdd.map(([, permissionId]) => ({ roleId, permissionId })),
    });
  }

  await writeAuditLogs([
    ...toRemove.map(([code]) => ({
      actorUserId: actorUserId ?? null,
      action: "admin.role.permission_removed",
      entityType: "ROLE",
      entityId: roleId,
      afterData: { permissionCode: code },
    })),
    ...toAdd.map(([code]) => ({
      actorUserId: actorUserId ?? null,
      action: "admin.role.permission_assigned",
      entityType: "ROLE",
      entityId: roleId,
      afterData: { permissionCode: code },
    })),
  ], client);
}

export async function updateAdminRole(roleId: string, input: UpdateRoleInput, actor: CurrentUser) {
  if (!actor.permissions.includes("admin.roles.manage")) {
    throw new Error("You do not have permission to update roles.");
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.role.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isSystem: true,
        isActive: true,
        rolePermissions: { select: { permission: { select: { code: true } } } },
      },
    });

    if (!current) throw new Error("Role not found.");
    const normalizedCode = input.code.trim().toLowerCase();
    if (!roleCodePattern.test(normalizedCode)) {
      throw new Error("Role code must use lowercase snake_case.");
    }
    if (current.code === "owner" && normalizedCode !== "owner") {
      throw new Error("Owner role code cannot be changed.");
    }
    if (current.code === "owner" && !input.isActive) {
      throw new Error("Owner role cannot be deactivated.");
    }
    if (current.code !== "owner" && reservedRoleCodes.has(normalizedCode)) {
      throw new Error("This role code is reserved for system roles.");
    }

    const updated = await tx.role.update({
      where: { id: roleId },
      data: {
        code: current.code === "owner" ? current.code : normalizedCode,
        name: input.name.trim(),
        description: normalizeText(input.description),
        isActive: input.isActive,
      },
    });

    await syncRolePermissions(tx, updated.id, input.permissionCodes, actor.id);

    if (current.isActive !== updated.isActive) {
      await writeAuditLog(
        {
          actorUserId: actor.id,
          action: updated.isActive ? "admin.role.activated" : "admin.role.deactivated",
          entityType: "ROLE",
          entityId: updated.id,
          beforeData: { isActive: current.isActive },
          afterData: { isActive: updated.isActive },
        },
        tx,
      );
    }

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "admin.role.updated",
        entityType: "ROLE",
        entityId: updated.id,
        beforeData: {
          code: current.code,
          name: current.name,
          description: current.description,
          isActive: current.isActive,
          permissionCodes: current.rolePermissions.map(({ permission }) => permission.code),
        },
        afterData: {
          code: updated.code,
          name: updated.name,
          description: updated.description,
          isActive: updated.isActive,
          permissionCodes: uniqueStrings(input.permissionCodes),
        },
      },
      tx,
    );

    return updated;
  });
}

export async function updateRolePermissions(roleId: string, permissionCodes: string[], actor: CurrentUser) {
  const role = await getAdminRole(roleId);
  if (!role) {
    throw new Error("Role not found.");
  }
  return updateAdminRole(
    roleId,
    {
      code: role.code,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      permissionCodes,
    } as UpdateRoleInput,
    actor,
  );
}

export async function canAccessAdminUsers(userId: string) {
  return hasPermissionByUserId(userId, "admin.users.manage");
}

export async function hasPermissionByUserId(userId: string, permissionCode: string) {
  const canonicalCode = canonicalizePermissionCode(permissionCode);
  const permissions = await getUserPermissionCodes(userId);
  const canonicalPermissions = uniqueStrings(permissions.flatMap((code) => [code, canonicalizePermissionCode(code)]));
  return canonicalPermissions.includes(canonicalCode) || canonicalPermissions.includes(permissionCode);
}

export async function listRoleRegistryPermissions() {
  return permissionRegistry;
}

export async function getEffectivePermissionCodesForRole(roleId: string) {
  return getRolePermissions(roleId);
}

export async function deleteRole(roleId: string, actor: CurrentUser) {
  if (!actor.permissions.includes("admin.roles.manage")) {
    throw new Error("You do not have permission to delete roles.");
  }

  return prisma.$transaction(async (tx) => {
    const role = await tx.role.findUnique({
      where: { id: roleId },
      select: { id: true, code: true, name: true, isSystem: true, isActive: true },
    });
    if (!role) throw new Error("Role not found.");
    if (role.code === "owner") throw new Error("Owner role cannot be deleted.");
    if (role.isSystem) throw new Error("System roles cannot be deleted.");

    const userCount = await tx.user.count({ where: { roleId } }) + (await tx.userRole.count({ where: { roleId } }));
    if (userCount > 0) throw new Error("Role is assigned to users.");

    await tx.role.delete({ where: { id: roleId } });
    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "admin.role.deleted",
        entityType: "ROLE",
        entityId: roleId,
        afterData: { code: role.code, name: role.name },
      },
      tx,
    );
  });
}

export async function deactivateUser(userId: string, actor: CurrentUser) {
  const user = await getAdminUser(userId);
  if (!user) throw new Error("User not found.");
  return updateAdminUser(
    userId,
    {
      name: user.name,
      username: user.username,
      phone: user.phone ?? undefined,
      isActive: false,
      primaryRoleId: user.primaryRoleId,
      roleIds: user.roleIds,
    },
    actor,
  );
}

export async function activateUser(userId: string, actor: CurrentUser) {
  const user = await getAdminUser(userId);
  if (!user) throw new Error("User not found.");
  return updateAdminUser(
    userId,
    {
      name: user.name,
      username: user.username,
      phone: user.phone ?? undefined,
      isActive: true,
      primaryRoleId: user.primaryRoleId,
      roleIds: user.roleIds,
    },
    actor,
  );
}

export async function getUserEffectivePermissions(userId: string) {
  return getUserPermissionCodes(userId);
}

export async function getPermissionRegistryGroups() {
  const groups = new Map<string, PermissionDefinition[]>();
  for (const permission of permissionRegistry) {
    const list = groups.get(permission.module) ?? [];
    list.push(permission);
    groups.set(permission.module, list);
  }
  return [...groups.entries()].map(([module, permissions]) => ({ module, permissions }));
}

export async function seedAllPermissionsAndRoles(client: DbClient = prisma) {
  await ensurePermissionCatalog(client);

  const roleDefinitions = [
    {
      code: "owner",
      name: "Owner",
      description: "Pharmacy owner with full access",
      isSystem: true,
      permissionCodes: permissionRegistry.map((permission) => permission.code),
    },
    {
      code: "pharmacist",
      name: "Pharmacist",
      description: "Pharmacy operations and controlled-drug workflow",
      isSystem: true,
      permissionCodes: [
        "pos.sale.read",
        "pos.sale.create",
        "pos.cash_session.manage",
        "prescriptions.read",
        "controlled_drugs.sale.create",
        "controlled_drugs.register.read",
        "inventory.stock.read",
        "inventory.product.read",
        "inventory.batch.read",
        "reports.read",
        "reports.dashboard.read",
        "reports.sales.read",
      ],
    },
    {
      code: "cashier",
      name: "Cashier",
      description: "POS sale capture only",
      isSystem: true,
      permissionCodes: [
        "pos.sale.read",
        "pos.sale.create",
      ],
    },
    {
      code: "inventory_manager",
      name: "Inventory Manager",
      description: "Inventory, procurement, and write-off control",
      isSystem: true,
      permissionCodes: [
        "inventory.stock.read",
        "inventory.product.read",
        "inventory.product.manage",
        "inventory.batch.read",
        "inventory.batch.adjust",
        "inventory.stock.writeoff",
        "inventory.expiry_quarantine.manage",
        "procurement.po.read",
        "procurement.po.create",
        "procurement.po.approve",
        "procurement.grn.read",
        "procurement.grn.confirm",
        "procurement.grn.manage",
        "suppliers.read",
        "suppliers.manage",
      ],
    },
    {
      code: "auditor",
      name: "Read Only / Auditor",
      description: "Read-only access to reports and audit data",
      isSystem: true,
      permissionCodes: [
        "audit.read",
        "reports.read",
        "reports.dashboard.read",
        "reports.sales.read",
        "reports.inventory.read",
        "reports.gross_profit.read",
        "reports.controlled_drugs.read",
        "reports.expenses.read",
        "controlled_drugs.register.read",
        "suppliers.payables.read",
        "expenses.read",
      ],
    },
  ] as const;

  for (const roleDefinition of roleDefinitions) {
    const role = await client.role.upsert({
      where: { code: roleDefinition.code },
      create: {
        code: roleDefinition.code,
        name: roleDefinition.name,
        description: roleDefinition.description,
        isSystem: roleDefinition.isSystem,
        isActive: true,
      },
      update: {
        name: roleDefinition.name,
        description: roleDefinition.description,
        isSystem: roleDefinition.isSystem,
        isActive: true,
      },
    });
    await syncRolePermissions(client, role.id, roleDefinition.permissionCodes, null);
  }
}
