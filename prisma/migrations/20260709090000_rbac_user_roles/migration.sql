-- RBAC upgrade: add multi-role support and canonical permission metadata.

-- Role metadata
ALTER TABLE "Role" ADD COLUMN "description" VARCHAR(255);
ALTER TABLE "Role" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Role" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Permission metadata
ALTER TABLE "Permission" ADD COLUMN "module" VARCHAR(80);
ALTER TABLE "Permission" ADD COLUMN "resource" VARCHAR(80);
ALTER TABLE "Permission" ADD COLUMN "action" VARCHAR(80);
ALTER TABLE "Permission" ADD COLUMN "isSensitive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Permission" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Role-permission timestamps
ALTER TABLE "RolePermission" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Preserve the existing seeded roles in place while normalizing them to the canonical codes.
UPDATE "Role"
SET
  "code" = 'owner',
  "name" = 'Owner',
  "description" = 'Pharmacy owner with full access',
  "isSystem" = true,
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'OWNER_DOCTOR';

UPDATE "Role"
SET
  "code" = 'pharmacist',
  "name" = 'Pharmacist',
  "description" = 'Pharmacy operations and controlled-drug workflow',
  "isSystem" = true,
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'PHARMACIST_CASHIER';

-- Normalize legacy permission rows to the canonical registry and populate the new metadata columns.
UPDATE "Permission"
SET
  "code" = 'reports.dashboard.read',
  "module" = 'reports',
  "resource" = 'dashboard',
  "action" = 'read',
  "description" = 'View dashboard summaries',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'dashboard.view';

UPDATE "Permission"
SET
  "code" = 'pos.sale.read',
  "module" = 'pos',
  "resource" = 'sale',
  "action" = 'read',
  "description" = 'View POS sales and workspace access',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'pos.access';

UPDATE "Permission"
SET
  "code" = 'pos.sale.create',
  "module" = 'pos',
  "resource" = 'sale',
  "action" = 'create',
  "description" = 'Create and complete sales',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'sale.create';

UPDATE "Permission"
SET
  "code" = 'pos.sale.void',
  "module" = 'pos',
  "resource" = 'sale',
  "action" = 'void',
  "description" = 'Void completed sales',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'sale.void';

UPDATE "Permission"
SET
  "code" = 'inventory.stock.read',
  "module" = 'inventory',
  "resource" = 'stock',
  "action" = 'read',
  "description" = 'Read stock overview and movement data',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'stock.access';

UPDATE "Permission"
SET
  "code" = 'inventory.product.manage',
  "module" = 'inventory',
  "resource" = 'product',
  "action" = 'manage',
  "description" = 'Create and update products',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'product.manage';

UPDATE "Permission"
SET
  "code" = 'suppliers.manage',
  "module" = 'suppliers',
  "resource" = 'suppliers',
  "action" = 'manage',
  "description" = 'Create and update suppliers',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'supplier.manage';

UPDATE "Permission"
SET
  "code" = 'procurement.grn.manage',
  "module" = 'procurement',
  "resource" = 'grn',
  "action" = 'manage',
  "description" = 'Create and confirm GRNs',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'grn.manage';

UPDATE "Permission"
SET
  "code" = 'expenses.manage',
  "module" = 'expenses',
  "resource" = 'expense',
  "action" = 'manage',
  "description" = 'Manage expenses',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'expense.manage';

UPDATE "Permission"
SET
  "code" = 'expenses.read',
  "module" = 'expenses',
  "resource" = 'expense',
  "action" = 'read',
  "description" = 'View expenses',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'expense.view';

UPDATE "Permission"
SET
  "code" = 'expenses.create',
  "module" = 'expenses',
  "resource" = 'expense',
  "action" = 'create',
  "description" = 'Create expenses',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'expense.create';

UPDATE "Permission"
SET
  "code" = 'expenses.update',
  "module" = 'expenses',
  "resource" = 'expense',
  "action" = 'update',
  "description" = 'Update expenses',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'expense.update';

UPDATE "Permission"
SET
  "code" = 'expenses.delete',
  "module" = 'expenses',
  "resource" = 'expense',
  "action" = 'delete',
  "description" = 'Delete expenses',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'expense.delete';

UPDATE "Permission"
SET
  "code" = 'suppliers.payments.read',
  "module" = 'suppliers',
  "resource" = 'payments',
  "action" = 'read',
  "description" = 'View supplier payments',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'supplier_payment.view';

UPDATE "Permission"
SET
  "code" = 'suppliers.payments.create',
  "module" = 'suppliers',
  "resource" = 'payments',
  "action" = 'create',
  "description" = 'Record supplier payments',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'supplier_payment.create';

UPDATE "Permission"
SET
  "code" = 'reports.read',
  "module" = 'reports',
  "resource" = 'workspace',
  "action" = 'read',
  "description" = 'Open the reports workspace',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'report.view';

UPDATE "Permission"
SET
  "code" = 'admin.users.manage',
  "module" = 'admin',
  "resource" = 'users',
  "action" = 'manage',
  "description" = 'Manage users',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'user.manage';

UPDATE "Permission"
SET
  "code" = 'audit.read',
  "module" = 'audit',
  "resource" = 'log',
  "action" = 'read',
  "description" = 'View audit logs',
  "isSensitive" = true,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'audit.view';

UPDATE "Permission"
SET
  "code" = 'admin.settings.manage',
  "module" = 'admin',
  "resource" = 'settings',
  "action" = 'manage',
  "description" = 'Manage settings',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'settings.manage';

UPDATE "Permission"
SET
  "code" = 'controlled_drugs.sale.create',
  "module" = 'controlled_drugs',
  "resource" = 'sale',
  "action" = 'create',
  "description" = 'Create controlled-drug sales',
  "isSensitive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'controlled_drug.sell';

-- The new permission columns are required in Prisma, so make them non-null after backfilling.
ALTER TABLE "Permission" ALTER COLUMN "module" SET NOT NULL;
ALTER TABLE "Permission" ALTER COLUMN "resource" SET NOT NULL;
ALTER TABLE "Permission" ALTER COLUMN "action" SET NOT NULL;

-- Build the many-to-many user-role bridge from the existing single-role assignment.
CREATE TABLE "UserRole" (
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "assignedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserRole_userId_roleId_key" UNIQUE ("userId","roleId")
);

CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");
CREATE INDEX "UserRole_assignedById_idx" ON "UserRole"("assignedById");

INSERT INTO "UserRole" ("userId", "roleId", "createdAt")
SELECT "id", "roleId", CURRENT_TIMESTAMP
FROM "User"
ON CONFLICT ("userId", "roleId") DO NOTHING;

ALTER TABLE "UserRole"
  ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserRole"
  ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserRole"
  ADD CONSTRAINT "UserRole_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
