import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./session";
import { serverOnly } from "@/lib/server-only";

serverOnly();

type GuardOptions = {
  onDenied?: "redirect" | "throw";
};

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

export function hasPermission(user: CurrentUser, permissionCode: string) {
  return user.permissions.includes(permissionCode);
}

export async function requireAuth(options: GuardOptions = {}) {
  const user = await getCurrentUser();
  if (user) return user;
  if (options.onDenied === "throw") throw new UnauthorizedError();
  redirect("/login");
}

export async function requirePermission(permissionCode: string, options: GuardOptions = {}) {
  const user = await requireAuth(options);
  if (hasPermission(user, permissionCode)) return user;
  if (options.onDenied === "throw") throw new ForbiddenError();
  redirect("/forbidden");
}

export async function requireRole(roleCode: string, options: GuardOptions = {}) {
  const user = await requireAuth(options);
  if (user.roleCode === roleCode) return user;
  if (options.onDenied === "throw") throw new ForbiddenError();
  redirect("/forbidden");
}
