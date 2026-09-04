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

import { unstable_cache } from "next/cache";

const userSessionCache = new Map<string, { user: CurrentUser; expiresAt: number }>();

export function invalidateUserSessionCache(userId?: string) {
  if (userId) userSessionCache.delete(userId);
  else userSessionCache.clear();
}

const loadCurrentUserById = cache(async (userId: string): Promise<CurrentUser | null> => {
  const now = Date.now();
  const cached = userSessionCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }

  const fetchUserFromDb = unstable_cache(
    async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId, isActive: true },
        select: {
          id: true,
          name: true,
          username: true,
          role: {
            select: {
              code: true,
              name: true,
              rolePermissions: { select: { permission: { select: { code: true } } } },
            },
          },
          userRoles: {
            select: {
              role: {
                select: {
                  code: true,
                  name: true,
                  isActive: true,
                  rolePermissions: { select: { permission: { select: { code: true } } } },
                },
              },
            },
          },
        },
      });

      if (!user) return null;

      const roleNames: string[] = [];
      const permissionCodesSet = new Set<string>();

      if (user.userRoles && user.userRoles.length > 0) {
        for (const ur of user.userRoles) {
          if (ur.role && ur.role.isActive) {
            roleNames.push(ur.role.name);
            for (const rp of ur.role.rolePermissions) {
              if (rp.permission?.code) {
                permissionCodesSet.add(rp.permission.code);
              }
            }
          }
        }
      } else if (user.role) {
        roleNames.push(user.role.name);
        for (const rp of user.role.rolePermissions) {
          if (rp.permission?.code) {
            permissionCodesSet.add(rp.permission.code);
          }
        }
      }

      const currentUser: CurrentUser = {
        id: user.id,
        name: user.name,
        username: user.username,
        roleCode: user.role.code,
        roleName: user.role.name,
        roleNames: [...new Set(roleNames)],
        permissions: expandPermissionCodes([...permissionCodesSet]),
      };

      return currentUser;
    },
    [`user-session-${userId}`],
    { revalidate: 60, tags: ["user-session"] },
  );

  const currentUser = await fetchUserFromDb();
  if (!currentUser) {
    userSessionCache.delete(userId);
    return null;
  }

  userSessionCache.set(userId, { user: currentUser, expiresAt: now + 60000 });
  return currentUser;
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
