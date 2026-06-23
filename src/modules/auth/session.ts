import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { serverOnly } from "@/lib/server-only";

serverOnly();

const sessionCookieName = "medisquare_session";
const sessionDurationSeconds = 60 * 60 * 24 * 7;
const signingKey = new TextEncoder().encode(env.AUTH_SECRET);

export type CurrentUser = {
  id: string;
  name: string;
  username: string;
  roleCode: string;
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
    secure: env.NODE_ENV === "production",
    maxAge: sessionDurationSeconds,
    path: "/",
  });
}

export async function clearSession() {
  (await cookies()).delete(sessionCookieName);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const userId = await readSessionUserId();
  if (!userId) return null;

  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: {
      id: true,
      name: true,
      username: true,
      role: {
        select: {
          code: true,
          rolePermissions: { select: { permission: { select: { code: true } } } },
        },
      },
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    roleCode: user.role.code,
    permissions: user.role.rolePermissions.map(({ permission }) => permission.code),
  };
}
