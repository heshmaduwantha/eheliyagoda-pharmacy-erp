import { Prisma } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { env } from "@/lib/env";
import { measurePerformanceSegment, setPerformanceActor } from "@/lib/performance";
import { prisma } from "@/lib/prisma";
import { serverOnly } from "@/lib/server-only";
import { expandPermissionCodes } from "./permission-registry";

serverOnly();

const sessionCookieName = "medisquare_session";
const sessionDurationSeconds = 60 * 60 * 24 * 7;
const signingKey = new TextEncoder().encode(env.AUTH_SECRET);
const appUrlIsHttps = new URL(env.APP_URL).protocol === "https:";

export type CurrentUser = {
  id: string;
  name: string;
  username: string;
  roleCode: string;
  roleName?: string;
  roleNames?: string[];
  permissions: string[];
};

async function createSessionToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer("medisquare")
    .setAudience("medisquare-app")
    .setIssuedAt()
    .setExpirationTime(`${sessionDurationSeconds}s`)
    .sign(signingKey);
}

async function readSessionUserId() {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, signingKey, {
      algorithms: ["HS256"],
      issuer: "medisquare",
      audience: "medisquare-app",
    });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const token = await createSessionToken(userId);
  (await cookies()).set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: appUrlIsHttps,
    maxAge: sessionDurationSeconds,
    path: "/",
  });
}

export async function clearSession() {
  (await cookies()).delete(sessionCookieName);
}

type AuthorizationRow = {
  id: string;
  name: string;
  username: string;
  primaryRoleCode: string;
  primaryRoleName: string;
  effectiveRoleCode: string | null;
  effectiveRoleName: string | null;
  effectiveRoleActive: boolean | null;
  permissionCode: string | null;
};

const loadCurrentUserById = cache(async (userId: string): Promise<CurrentUser | null> => {
  const rows = await prisma.$queryRaw<AuthorizationRow[]>(Prisma.sql`
    SELECT
      u.id,
      u.name,
      u.username,
      primary_role.code AS "primaryRoleCode",
      primary_role.name AS "primaryRoleName",
      effective_role.code AS "effectiveRoleCode",
      effective_role.name AS "effectiveRoleName",
      effective_role."isActive" AS "effectiveRoleActive",
      effective_role."permissionCode"
    FROM "User" u
    INNER JOIN "Role" primary_role ON primary_role.id = u."roleId"
    LEFT JOIN LATERAL (
      SELECT
        assigned_role.code,
        assigned_role.name,
        assigned_role."isActive",
        permission.code AS "permissionCode"
      FROM "UserRole" user_role
      INNER JOIN "Role" assigned_role ON assigned_role.id = user_role."roleId"
      LEFT JOIN "RolePermission" role_permission ON role_permission."roleId" = assigned_role.id
      LEFT JOIN "Permission" permission ON permission.id = role_permission."permissionId"
      WHERE user_role."userId" = u.id

      UNION ALL

      SELECT
        primary_role.code,
        primary_role.name,
        primary_role."isActive",
        permission.code AS "permissionCode"
      FROM (SELECT 1) fallback
      LEFT JOIN "RolePermission" role_permission ON role_permission."roleId" = primary_role.id
      LEFT JOIN "Permission" permission ON permission.id = role_permission."permissionId"
      WHERE NOT EXISTS (
        SELECT 1 FROM "UserRole" assigned WHERE assigned."userId" = u.id
      )
    ) effective_role ON TRUE
    WHERE u.id = ${userId}::uuid
      AND u."isActive" = TRUE
  `);

  const first = rows[0];
  if (!first) return null;

  const roleNames = [...new Set(rows.flatMap((row) =>
    row.effectiveRoleActive && row.effectiveRoleName ? [row.effectiveRoleName] : [],
  ))];
  const permissionCodes = [...new Set(rows.flatMap((row) =>
    row.effectiveRoleActive && row.permissionCode ? [row.permissionCode] : [],
  ))];

  return {
    id: first.id,
    name: first.name,
    username: first.username,
    roleCode: first.primaryRoleCode,
    roleName: first.primaryRoleName,
    roleNames,
    permissions: expandPermissionCodes(permissionCodes),
  };
});

export const getUserPermissions = cache(async (userId: string) => {
  const user = await loadCurrentUserById(userId);
  return user?.permissions ?? [];
});

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> =>
  measurePerformanceSegment("authMs", async () => {
    const userId = await readSessionUserId();
    if (!userId) return null;

    const user = await loadCurrentUserById(userId);
    if (user) setPerformanceActor(user.id);
    return user;
  }),
);
