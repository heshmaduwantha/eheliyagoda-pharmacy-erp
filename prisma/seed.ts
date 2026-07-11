import {
  GrnStatus,
  PrescriptionRule,
  Prisma,
  PrismaClient,
  ProductType,
  StockMovementType,
  SupplierInvoiceStatus,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { env } from "../src/lib/env";
import { seedAllPermissionsAndRoles } from "../src/modules/admin/rbac.service";

const prisma = new PrismaClient({ datasourceUrl: env.DATABASE_URL });

function requiredSeedValue(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required seed environment variable: ${name}`);
  return value;
}

type DevProductInput = {
  name: string;
  genericName?: string;
  strength?: string;
  form?: string;
  productType: ProductType;
  category: string;
  baseUnitName: string;
  prescriptionRule: PrescriptionRule;
  isControlled?: boolean;
  defaultSellingPrice: string;
  reorderLevel: string;
  units: { name: string; factor: string; saleDefault?: boolean; purchaseDefault?: boolean; barcode?: string }[];
};

async function upsertDevProduct(input: DevProductInput) {
  const existing = await prisma.product.findFirst({ where: { name: input.name } });
  const product = existing
    ? await prisma.product.update({
        where: { id: existing.id },
        data: {
          genericName: input.genericName ?? null,
          strength: input.strength ?? null,
          form: input.form ?? null,
          productType: input.productType,
          category: input.category,
          baseUnitName: input.baseUnitName,
          prescriptionRule: input.prescriptionRule,
          isControlled: input.isControlled ?? false,
          isSpecialDrug: input.isControlled ?? false,
          defaultSellingPrice: new Prisma.Decimal(input.defaultSellingPrice),
          reorderLevel: new Prisma.Decimal(input.reorderLevel),
          isActive: true,
        },
      })
    : await prisma.product.create({
        data: {
          name: input.name,
          genericName: input.genericName ?? null,
          strength: input.strength ?? null,
          form: input.form ?? null,
          productType: input.productType,
          category: input.category,
          baseUnitName: input.baseUnitName,
          prescriptionRule: input.prescriptionRule,
          isControlled: input.isControlled ?? false,
          isSpecialDrug: input.isControlled ?? false,
          defaultSellingPrice: new Prisma.Decimal(input.defaultSellingPrice),
          reorderLevel: new Prisma.Decimal(input.reorderLevel),
        },
      });

  const units = [];
  for (const item of input.units) {
    const unit = await prisma.productUnit.upsert({
      where: { productId_unitName: { productId: product.id, unitName: item.name } },
      create: {
        productId: product.id,
        unitName: item.name,
        factorToBase: new Prisma.Decimal(item.factor),
        isSaleDefault: item.saleDefault ?? false,
        isPurchaseDefault: item.purchaseDefault ?? false,
      },
      update: {
        factorToBase: new Prisma.Decimal(item.factor),
        isSaleDefault: item.saleDefault ?? false,
        isPurchaseDefault: item.purchaseDefault ?? false,
      },
    });
    units.push(unit);

    if (item.barcode) {
      const existingBarcode = await prisma.productBarcode.findUnique({ where: { barcode: item.barcode } });
      if (existingBarcode && existingBarcode.productId !== product.id) {
        throw new Error(`Seed barcode ${item.barcode} is already assigned to another product.`);
      }
      await prisma.productBarcode.upsert({
        where: { barcode: item.barcode },
        create: {
          productId: product.id,
          unitId: unit.id,
          barcode: item.barcode,
          isPrimary: item.saleDefault ?? false,
        },
        update: { unitId: unit.id, isPrimary: item.saleDefault ?? false },
      });
    }
  }
  return { product, units };
}

async function main() {
  const ownerUsername = requiredSeedValue("SEED_OWNER_USERNAME");
  const ownerPassword = requiredSeedValue("SEED_OWNER_PASSWORD");
  const pharmacistUsername = requiredSeedValue("SEED_PHARMACIST_USERNAME");
  const pharmacistPassword = requiredSeedValue("SEED_PHARMACIST_PASSWORD");

  await seedAllPermissionsAndRoles(prisma);

  const ownerRole = await prisma.role.findUnique({ where: { code: "owner" } });
  const pharmacistRole = await prisma.role.findUnique({ where: { code: "pharmacist" } });
  if (!ownerRole || !pharmacistRole) {
    throw new Error("Default RBAC roles were not seeded correctly.");
  }

  const ownerUser = await prisma.user.upsert({
    where: { username: ownerUsername },
    create: {
      name: "Owner",
      username: ownerUsername,
      passwordHash: await hash(ownerPassword, 12),
      roleId: ownerRole.id,
    },
    update: { name: "Owner", roleId: ownerRole.id, isActive: true },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: ownerUser.id, roleId: ownerRole.id } },
    create: { userId: ownerUser.id, roleId: ownerRole.id },
    update: { assignedById: null },
  });
  await prisma.user.upsert({
    where: { username: pharmacistUsername },
    create: {
      name: "Pharmacist",
      username: pharmacistUsername,
      passwordHash: await hash(pharmacistPassword, 12),
      roleId: pharmacistRole.id,
      pharmacistCertificateVerified: false,
    },
    update: { name: "Pharmacist", roleId: pharmacistRole.id, isActive: true },
  });
  const pharmacistUser = await prisma.user.findUnique({ where: { username: pharmacistUsername }, select: { id: true } });
  if (pharmacistUser) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: pharmacistUser.id, roleId: pharmacistRole.id } },
      create: { userId: pharmacistUser.id, roleId: pharmacistRole.id },
      update: { assignedById: null },
    });
  }

  const existingSupplier = await prisma.supplier.findFirst({ where: { name: "Eheliyagoda Medical Distributors" } });
  const supplier = existingSupplier
    ? await prisma.supplier.update({
        where: { id: existingSupplier.id },
        data: { isActive: true, creditTermDays: 30 },
      })
    : await prisma.supplier.create({
        data: {
          name: "Eheliyagoda Medical Distributors",
          contactPerson: "Development Contact",
          phone: "0450000000",
          email: "dev-supplier@example.test",
          address: "Eheliyagoda, Sri Lanka",
          creditTermDays: 30,
        },
      });

  const devProducts: DevProductInput[] = [
    {
      name: "Paracetamol 500mg",
      genericName: "Paracetamol",
      strength: "500mg",
      form: "Tablet",
      productType: ProductType.MEDICINE,
      category: "Analgesic",
      baseUnitName: "tablet",
      prescriptionRule: PrescriptionRule.NONE,
      defaultSellingPrice: "10.00",
      reorderLevel: "200.000",
      units: [
        { name: "tablet", factor: "1.000", saleDefault: true, barcode: "9417000000011" },
        { name: "strip", factor: "10.000", purchaseDefault: true, barcode: "9417000000028" },
        { name: "box", factor: "100.000" },
      ],
    },
    {
      name: "Amoxicillin 250mg",
      genericName: "Amoxicillin",
      strength: "250mg",
      form: "Capsule",
      productType: ProductType.MEDICINE,
      category: "Antibiotic",
      baseUnitName: "capsule",
      prescriptionRule: PrescriptionRule.PROMPT_SKIPPABLE,
      defaultSellingPrice: "28.00",
      reorderLevel: "100.000",
      units: [
        { name: "capsule", factor: "1.000", saleDefault: true, barcode: "9417000000035" },
        { name: "strip", factor: "10.000", purchaseDefault: true },
        { name: "box", factor: "100.000" },
      ],
    },
    {
      name: "Diazepam 5mg",
      genericName: "Diazepam",
      strength: "5mg",
      form: "Tablet",
      productType: ProductType.MEDICINE,
      category: "Controlled medicine",
      baseUnitName: "tablet",
      prescriptionRule: PrescriptionRule.HARD_REQUIRED_CONTROLLED,
      isControlled: true,
      defaultSellingPrice: "15.00",
      reorderLevel: "50.000",
      units: [
        { name: "tablet", factor: "1.000", saleDefault: true, barcode: "9417000000042" },
        { name: "strip", factor: "10.000", purchaseDefault: true },
      ],
    },
    {
      name: "Disposable Surgical Mask",
      productType: ProductType.GENERAL_ITEM,
      category: "General",
      baseUnitName: "piece",
      prescriptionRule: PrescriptionRule.NONE,
      defaultSellingPrice: "25.00",
      reorderLevel: "50.000",
      units: [
        { name: "piece", factor: "1.000", saleDefault: true, barcode: "9417000000059" },
        { name: "box", factor: "50.000", purchaseDefault: true },
      ],
    },
  ];

  const seededProducts = [];
  for (const product of devProducts) seededProducts.push(await upsertDevProduct(product));

  // Create the development stock ledger only once. Re-running the seed never resets
  // batch quantities, so later legitimate stock movements are not overwritten.
  const seedGrnNo = "GRN-SEED-0001";
  const existingSeedGrn = await prisma.grn.findUnique({ where: { grnNo: seedGrnNo } });
  if (!existingSeedGrn) {
    const stockLines = [
      { item: seededProducts[0], qty: "1000.000", batchNo: "PAR500-DEV-01", expiry: new Date("2027-12-31"), mrp: "12.00", cost: "6.50", selling: "10.00" },
      { item: seededProducts[1], qty: "500.000", batchNo: "AMX250-DEV-01", expiry: new Date("2027-10-31"), mrp: "30.00", cost: "19.00", selling: "28.00" },
      { item: seededProducts[2], qty: "200.000", batchNo: "DIA5-DEV-01", expiry: new Date("2027-06-30"), mrp: "18.00", cost: "10.00", selling: "15.00" },
      { item: seededProducts[3], qty: "100.000", batchNo: null, expiry: null, mrp: null, cost: "15.00", selling: "25.00" },
    ];
    const invoiceTotal = stockLines.reduce(
      (sum, line) => sum.add(new Prisma.Decimal(line.qty).mul(line.cost)),
      new Prisma.Decimal(0),
    );

    await prisma.$transaction(async (tx) => {
      const grn = await tx.grn.create({
        data: {
          grnNo: seedGrnNo,
          supplierId: supplier.id,
          supplierInvoiceNo: "INV-SEED-0001",
          invoiceTotal,
          status: GrnStatus.CONFIRMED,
          notes: "Idempotent development seed stock",
          receivedById: ownerUser.id,
          receivedAt: new Date(),
        },
      });

      for (const line of stockLines) {
        const baseUnit = line.item.units.find((unit) => unit.factorToBase.eq(1)) ?? line.item.units[0];
        const grnLine = await tx.grnLine.create({
          data: {
            grnId: grn.id,
            productId: line.item.product.id,
            unitId: baseUnit.id,
            qtyInUnit: new Prisma.Decimal(line.qty),
            qtyBase: new Prisma.Decimal(line.qty),
            batchNo: line.batchNo,
            expiryDate: line.expiry,
            mrp: line.mrp ? new Prisma.Decimal(line.mrp) : null,
            costPrice: new Prisma.Decimal(line.cost),
            sellingPrice: new Prisma.Decimal(line.selling),
          },
        });
        const batch = await tx.batch.create({
          data: {
            productId: line.item.product.id,
            grnLineId: grnLine.id,
            batchNo: line.batchNo,
            expiryDate: line.expiry,
            mrp: line.mrp ? new Prisma.Decimal(line.mrp) : null,
            costPrice: new Prisma.Decimal(line.cost),
            sellingPrice: new Prisma.Decimal(line.selling),
            qtyOnHandBase: new Prisma.Decimal(line.qty),
          },
        });
        await tx.stockMovement.create({
          data: {
            productId: line.item.product.id,
            batchId: batch.id,
            movementType: StockMovementType.GRN_IN,
            qtyBase: new Prisma.Decimal(line.qty),
            refType: "GRN",
            refId: grn.id,
            note: `GRN ${seedGrnNo}`,
            createdById: ownerUser.id,
          },
        });
      }

      await tx.supplierInvoice.create({
        data: {
          supplierId: supplier.id,
          grnId: grn.id,
          invoiceNo: "INV-SEED-0001",
          totalAmount: invoiceTotal,
          status: SupplierInvoiceStatus.OPEN,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: ownerUser.id,
          action: "seed.grn_confirmed",
          entityType: "GRN",
          entityId: grn.id,
          afterData: { grnNo: seedGrnNo, batchesCreated: stockLines.length },
        },
      });
    });
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error instanceof Error ? error.message : "Unknown error");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
