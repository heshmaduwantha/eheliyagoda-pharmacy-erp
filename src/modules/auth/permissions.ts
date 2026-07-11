import { redirect } from "next/navigation";
import { getCurrentUser, getUserPermissions, type CurrentUser } from "./session";
import { measurePerformanceSegmentSync } from "@/lib/performance";
import { serverOnly } from "@/lib/server-only";
import { canonicalizePermissionCode } from "./permission-registry";

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

export async function hasPermission(userId: string, permissionCode: string): Promise<boolean>;
export function hasPermission(user: CurrentUser, permissionCode: string): boolean;
export function hasPermission(userOrId: CurrentUser | string, permissionCode: string) {
  const canonicalPermission = canonicalizePermissionCode(permissionCode);
  if (typeof userOrId === "string") {
    return getUserPermissions(userOrId).then((permissions) => permissions.includes(canonicalPermission));
  }
  return measurePerformanceSegmentSync(
    "permissionMs",
    () => userOrId.permissions.includes(canonicalPermission) || userOrId.permissions.includes(permissionCode),
  );
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

export async function requireAnyPermission(permissionCodes: string[], options: GuardOptions = {}) {
  const user = await requireAuth(options);
  if (permissionCodes.some((permissionCode) => hasPermission(user, permissionCode))) return user;
  if (options.onDenied === "throw") throw new ForbiddenError();
  redirect("/forbidden");
}

export async function requireAllPermissions(permissionCodes: string[], options: GuardOptions = {}) {
  const user = await requireAuth(options);
  if (permissionCodes.every((permissionCode) => hasPermission(user, permissionCode))) return user;
  if (options.onDenied === "throw") throw new ForbiddenError();
  redirect("/forbidden");
}

export async function requireRole(roleCode: string, options: GuardOptions = {}) {
  const user = await requireAuth(options);
  if (user.roleCode === roleCode) return user;
  if (options.onDenied === "throw") throw new ForbiddenError();
  redirect("/forbidden");
}
