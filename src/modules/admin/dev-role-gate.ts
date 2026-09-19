import { timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { serverOnly } from "@/lib/server-only";
import type { CurrentUser } from "@/modules/auth/session";

serverOnly();

export const DEV_ROLE_CODE = "dev";

const DEV_ROLE_PASSWORD = "com@123456";
const unlockCookieName = "medisquare_dev_role_unlock";
const unlockDurationSeconds = 60 * 30;
const signingKey = new TextEncoder().encode(env.AUTH_SECRET);

function isDevUser(user: CurrentUser) {
  return user.roleCode === DEV_ROLE_CODE || (user.roleNames ?? []).some((name) => name.toLowerCase() === "development");
}

export function isDevRolePasswordValid(input: string) {
  const a = Buffer.from(input);
  const b = Buffer.from(DEV_ROLE_PASSWORD);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function grantDevRoleUnlock(user: CurrentUser) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setAudience("medisquare-dev-role")
    .setExpirationTime(`${unlockDurationSeconds}s`)
    .sign(signingKey);
  (await cookies()).set(unlockCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(env.APP_URL).protocol === "https:",
    maxAge: unlockDurationSeconds,
    path: "/",
  });
}

/** Users in the development role always have access; everyone else needs the password unlock cookie. */
export async function hasDevRoleAccess(user: CurrentUser) {
  if (isDevUser(user)) return true;
  const token = (await cookies()).get(unlockCookieName)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, signingKey, { algorithms: ["HS256"], audience: "medisquare-dev-role" });
    return payload.sub === user.id;
  } catch {
    return false;
  }
}

export async function isDevRoleId(roleId: string) {
  const role = await prisma.role.findUnique({ where: { id: roleId }, select: { code: true } });
  return role?.code === DEV_ROLE_CODE;
}
