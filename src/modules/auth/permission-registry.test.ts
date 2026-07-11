import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalizePermissionCode,
  expandPermissionCodes,
  groupPermissionsByModule,
  permissionRegistry,
} from "./permission-registry";

test("canonicalizePermissionCode maps legacy permission codes to canonical codes", () => {
  assert.equal(canonicalizePermissionCode("sale.create"), "pos.sale.create");
  assert.equal(canonicalizePermissionCode("audit.view"), "audit.read");
  assert.equal(canonicalizePermissionCode("pos.sale.create"), "pos.sale.create");
});

test("expandPermissionCodes returns canonical and legacy aliases", () => {
  const codes = expandPermissionCodes(["sale.create", "pos.sale.void"]);
  assert.ok(codes.includes("sale.create"));
  assert.ok(codes.includes("pos.sale.create"));
  assert.ok(codes.includes("pos.sale.void"));
});

test("groupPermissionsByModule groups the seeded registry by module", () => {
  const groups = groupPermissionsByModule();
  const admin = groups.find((group) => group.module === "admin");
  assert.ok(admin);
  assert.ok(admin?.permissions.some((permission) => permission.code === "admin.users.manage"));
  assert.ok(permissionRegistry.some((permission) => permission.code === "reports.gross_profit.read"));
});
