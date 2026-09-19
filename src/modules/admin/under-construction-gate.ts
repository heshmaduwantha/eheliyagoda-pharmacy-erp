import { timingSafeEqual } from "node:crypto";
import { canonicalizePermissionCode } from "@/modules/auth/permission-registry";

/** Granting the under-construction lock to a role requires this password. */
const UNDER_CONSTRUCTION_PASSWORD = "com@123456";

export function isUnderConstructionCode(code: string) {
  return canonicalizePermissionCode(code) === "system.under_construction";
}

export function isUnderConstructionPasswordValid(input: string) {
  const a = Buffer.from(input);
  const b = Buffer.from(UNDER_CONSTRUCTION_PASSWORD);
  return a.length === b.length && timingSafeEqual(a, b);
}
