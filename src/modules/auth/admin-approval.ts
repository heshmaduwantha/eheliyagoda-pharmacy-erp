import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { serverOnly } from "@/lib/server-only";

serverOnly();

const ADMIN_ROLE_CODES = ["admin", "owner"];

const adminRoleFilter = { code: { in: ADMIN_ROLE_CODES }, isActive: true };

/** True when the (active) user holds the admin or owner role, as primary or additional role. */
export async function userHasAdminRole(userId: string) {
  const match = await prisma.user.findFirst({
    where: {
      id: userId,
      isActive: true,
      OR: [{ role: adminRoleFilter }, { userRoles: { some: { role: adminRoleFilter } } }],
    },
    select: { id: true },
  });
  return match != null;
}

/** Verifies an admin's username + password. Returns the admin, or null if the credentials or role are not valid. */
export async function verifyAdminApproval(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username: username.trim() },
    select: { id: true, username: true, passwordHash: true, isActive: true },
  });
  if (!user?.isActive || !(await compare(password, user.passwordHash))) return null;
  if (!(await userHasAdminRole(user.id))) return null;
  return { id: user.id, username: user.username };
}
