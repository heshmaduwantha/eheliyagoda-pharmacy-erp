import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const permissions = [
  ["dashboard.view", "View the application dashboard"],
  ["pos.access", "Access the point of sale"],
  ["stock.access", "Access stock screens"],
  ["product.manage", "Manage products"],
  ["supplier.manage", "Manage suppliers"],
  ["expense.manage", "Manage expenses"],
  ["report.view", "View reports"],
  ["user.manage", "Manage users"],
  ["audit.view", "View audit logs"],
  ["settings.manage", "Manage settings"],
  ["controlled_drug.sell", "Sell controlled drugs"],
] as const;

const ownerPermissionCodes = permissions.map(([code]) => code);
const pharmacistPermissionCodes = [
  "dashboard.view",
  "pos.access",
  "stock.access",
  "product.manage",
  "supplier.manage",
  "expense.manage",
  "report.view",
  "controlled_drug.sell",
];

function requiredSeedValue(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required seed environment variable: ${name}`);
  return value;
}

async function assignPermissions(roleId: string, permissionCodes: readonly string[]) {
  const permissionRows = await prisma.permission.findMany({
    where: { code: { in: [...permissionCodes] } },
    select: { id: true, code: true },
  });
  if (permissionRows.length !== permissionCodes.length) throw new Error("Seed permission mapping is incomplete.");

  for (const permission of permissionRows) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId: permission.id } },
      create: { roleId, permissionId: permission.id },
      update: {},
    });
  }
}

async function main() {
  const ownerUsername = requiredSeedValue("SEED_OWNER_USERNAME");
  const ownerPassword = requiredSeedValue("SEED_OWNER_PASSWORD");
  const pharmacistUsername = requiredSeedValue("SEED_PHARMACIST_USERNAME");
  const pharmacistPassword = requiredSeedValue("SEED_PHARMACIST_PASSWORD");

  for (const [code, description] of permissions) {
    await prisma.permission.upsert({ where: { code }, create: { code, description }, update: { description } });
  }

  const ownerRole = await prisma.role.upsert({
    where: { code: "OWNER_DOCTOR" },
    create: { code: "OWNER_DOCTOR", name: "Owner Doctor" },
    update: { name: "Owner Doctor" },
  });
  const pharmacistRole = await prisma.role.upsert({
    where: { code: "PHARMACIST_CASHIER" },
    create: { code: "PHARMACIST_CASHIER", name: "Pharmacist Cashier" },
    update: { name: "Pharmacist Cashier" },
  });

  await assignPermissions(ownerRole.id, ownerPermissionCodes);
  await assignPermissions(pharmacistRole.id, pharmacistPermissionCodes);

  await prisma.user.upsert({
    where: { username: ownerUsername },
    create: { name: "Owner Doctor", username: ownerUsername, passwordHash: await hash(ownerPassword, 12), roleId: ownerRole.id },
    update: { name: "Owner Doctor", roleId: ownerRole.id, isActive: true },
  });
  await prisma.user.upsert({
    where: { username: pharmacistUsername },
    create: {
      name: "Certified Pharmacist",
      username: pharmacistUsername,
      passwordHash: await hash(pharmacistPassword, 12),
      roleId: pharmacistRole.id,
      pharmacistCertificateVerified: false,
    },
    update: { name: "Certified Pharmacist", roleId: pharmacistRole.id, isActive: true },
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error instanceof Error ? error.message : "Unknown error");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
