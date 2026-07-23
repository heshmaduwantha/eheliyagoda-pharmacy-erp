import {
  GrnStatus,
  PrescriptionRule,
  Prisma,
  PrismaClient,
  ProductType,
  StockMovementType,
  SupplierInvoiceStatus,
  ExpenseCategory,
  PaymentMethod,
  SaleStatus,
  SaleVoidStockPolicy,
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
  const isUat = process.env.APP_ENV === "uat" && process.env.UAT_MODE === "true";
  if (process.env.APP_ENV === "production") throw new Error("Refusing to seed a production environment.");
  const ownerUsername = requiredSeedValue(isUat ? "UAT_ADMIN_USERNAME" : "SEED_OWNER_USERNAME");
  const ownerPassword = requiredSeedValue(isUat ? "UAT_ADMIN_PASSWORD" : "SEED_OWNER_PASSWORD");
  const pharmacistUsername = requiredSeedValue(isUat ? "UAT_PHARMACIST_USERNAME" : "SEED_PHARMACIST_USERNAME");
  const pharmacistPassword = requiredSeedValue(isUat ? "UAT_PHARMACIST_PASSWORD" : "SEED_PHARMACIST_PASSWORD");

  if (process.env.UAT_RESET === "CONFIRM_TRUNCATE_ALL") {
    if (!isUat || process.env.UAT_ALLOW_DEMO_RESET !== "true") {
      throw new Error("UAT reset requires APP_ENV=uat, UAT_MODE=true, and UAT_ALLOW_DEMO_RESET=true.");
    }
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "PrescriptionSaleLine", "Prescription", "Patient", "SaleVoid",
        "SalePayment", "SaleLine", "Sale", "SupplierPayment", "Expense",
        "StockMovement", "Batch", "SupplierInvoice", "GrnLine", "Grn",
        "ProductBarcode", "ProductUnit", "Product", "Supplier", "AuditLog",
        "UserRole", "RolePermission", "User", "Permission", "Role"
      RESTART IDENTITY CASCADE
    `);
  }

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

  const existingSupplier = await prisma.supplier.findFirst({ where: { name: "UAT Medical Distributors" } });
  const supplier = existingSupplier
    ? await prisma.supplier.update({
        where: { id: existingSupplier.id },
        data: { isActive: true, creditTermDays: 30 },
      })
    : await prisma.supplier.create({
        data: {
        name: "UAT Medical Distributors",
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
      reorderLevel: "50.000",
      units: [
        { name: "piece", factor: "1.000", saleDefault: true, barcode: "9417000000059" },
        { name: "box", factor: "50.000", purchaseDefault: true },
      ],
    },
  ];

  const seededProducts: Awaited<ReturnType<typeof upsertDevProduct>>[] = [];
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
            priceUnitId: baseUnit.id,
            priceSetById: ownerUser.id,
            priceSetAt: new Date(),
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

  if (process.env.UAT_RESET === "CONFIRM_TRUNCATE_ALL") {
    const baseUnit = (index: number) => seededProducts[index].units.find((unit) => unit.factorToBase.eq(1))!;
    const batchFor = async (index: number) => {
      const batch = await prisma.batch.findFirst({ where: { productId: seededProducts[index].product.id } });
      if (!batch) throw new Error(`Missing UAT batch for product index ${index}.`);
      return batch;
    };
    const paracetamolBatch = await batchFor(0);
    const amoxicillinBatch = await batchFor(1);
    const diazepamBatch = await batchFor(2);
    const maskBatch = await batchFor(3);
    const now = new Date();
    const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);

    const secondSupplier = await prisma.supplier.create({
      data: {
        name: "State Pharmaceuticals Corporation",
        contactPerson: "UAT Accounts Desk",
        phone: "0112320356",
        email: "uat-spc@example.test",
        address: "Colombo 10, Sri Lanka",
        creditTermDays: 45,
      },
    });
    const paidInvoice = await prisma.supplierInvoice.create({
      data: {
        supplierId: secondSupplier.id,
        invoiceNo: "SPC-UAT-1001",
        totalAmount: new Prisma.Decimal("45000.00"),
        paidAmount: new Prisma.Decimal("45000.00"),
        status: SupplierInvoiceStatus.PAID,
        dueDate: daysAgo(-20),
      },
    });
    const openInvoice = await prisma.supplierInvoice.findFirstOrThrow({ where: { invoiceNo: "INV-SEED-0001" } });
    await prisma.supplierPayment.createMany({
      data: [
        { paymentNumber: "PAY-UAT-0001", supplierInvoiceId: paidInvoice.id, supplierId: secondSupplier.id, amount: new Prisma.Decimal("45000.00"), paymentMethod: PaymentMethod.CARD, reference: "BANK-UAT-45000", paidAt: daysAgo(2), notes: "Fully paid supplier invoice", createdById: ownerUser.id },
        { paymentNumber: "PAY-UAT-0002", supplierInvoiceId: openInvoice.id, supplierId: supplier.id, amount: new Prisma.Decimal("10000.00"), paymentMethod: PaymentMethod.CASH, paidAt: daysAgo(1), notes: "Part payment for UAT", createdById: ownerUser.id },
      ],
    });
    await prisma.supplierInvoice.update({ where: { id: openInvoice.id }, data: { paidAmount: new Prisma.Decimal("10000.00"), status: SupplierInvoiceStatus.PARTIALLY_PAID } });

    await prisma.expense.createMany({
      data: [
        { expenseNumber: "EXP-UAT-0001", date: daysAgo(5), category: ExpenseCategory.RENT, description: "Monthly premises rent", amount: new Prisma.Decimal("85000.00"), paymentMethod: PaymentMethod.CARD, reference: "BANK-RENT-UAT", createdById: ownerUser.id },
        { expenseNumber: "EXP-UAT-0002", date: daysAgo(3), category: ExpenseCategory.ELECTRICITY, description: "Electricity bill", amount: new Prisma.Decimal("18450.00"), paymentMethod: PaymentMethod.CASH, createdById: ownerUser.id },
        { expenseNumber: "EXP-UAT-0003", date: daysAgo(1), category: ExpenseCategory.INTERNET, description: "Business fibre connection", amount: new Prisma.Decimal("7490.00"), paymentMethod: PaymentMethod.CARD, reference: "CARD-UAT-7490", createdById: ownerUser.id },
      ],
    });

    const createSale = async (input: {
      saleNumber: string; status: SaleStatus; createdAt: Date; productIndex: number; batch: typeof paracetamolBatch;
      qty: string; unitPrice: string; payment?: PaymentMethod; notes: string;
    }) => {
      const item = seededProducts[input.productIndex];
      const qty = new Prisma.Decimal(input.qty);
      const unitPrice = new Prisma.Decimal(input.unitPrice);
      const total = qty.mul(unitPrice);
      return prisma.sale.create({
        data: {
          saleNumber: input.saleNumber,
          status: input.status,
          cashierId: ownerUser.id,
          subtotal: total,
          total,
          notes: input.notes,
          createdAt: input.createdAt,
          completedAt: input.status === SaleStatus.COMPLETED ? input.createdAt : null,
          lines: { create: [{
            productId: item.product.id, batchId: input.batch.id, unitId: baseUnit(input.productIndex).id,
            qty, qtyBase: qty, unitPrice, lineTotal: total, costPriceAtSale: input.batch.costPrice,
            mrpAtSale: input.batch.mrp, productNameSnapshot: item.product.name,
            batchNoSnapshot: input.batch.batchNo, expiryDateSnapshot: input.batch.expiryDate,
          }] },
          ...(input.payment ? { payments: { create: [{ method: input.payment, amount: total, ...(input.payment === PaymentMethod.CARD ? { cardReference: `CARD-${input.saleNumber}` } : {}) }] } } : {}),
        },
        include: { lines: true },
      });
    };

    const cashSale = await createSale({ saleNumber: "SALE-UAT-0001", status: SaleStatus.COMPLETED, createdAt: daysAgo(3), productIndex: 0, batch: paracetamolBatch, qty: "20", unitPrice: "10.00", payment: PaymentMethod.CASH, notes: "Completed cash sale" });
    const antibioticSale = await createSale({ saleNumber: "SALE-UAT-0002", status: SaleStatus.COMPLETED, createdAt: daysAgo(2), productIndex: 1, batch: amoxicillinBatch, qty: "10", unitPrice: "28.00", payment: PaymentMethod.CARD, notes: "Prescription medicine card sale" });
    await createSale({ saleNumber: "SALE-UAT-0003", status: SaleStatus.HELD, createdAt: daysAgo(1), productIndex: 3, batch: maskBatch, qty: "4", unitPrice: "25.00", notes: "Held sale for workflow demonstration" });
    const voidSale = await createSale({ saleNumber: "SALE-UAT-0004", status: SaleStatus.VOIDED, createdAt: daysAgo(1), productIndex: 0, batch: paracetamolBatch, qty: "5", unitPrice: "10.00", payment: PaymentMethod.CASH, notes: "Voided sale demonstration" });
    await prisma.sale.update({ where: { id: voidSale.id }, data: { voidedAt: daysAgo(1) } });
    await prisma.saleVoid.create({ data: { saleId: voidSale.id, reason: "Customer requested cancellation before collection", refundAmount: new Prisma.Decimal("50.00"), refundMethod: PaymentMethod.CASH, stockPolicy: SaleVoidStockPolicy.RETURN_TO_ACTIVE, voidedById: ownerUser.id, voidedAt: daysAgo(1) } });

    const patient = await prisma.patient.create({ data: { name: "Nimal Perera", phone: "0771234567", nic: "901234567V", patientReference: "PAT-UAT-0001", age: 36 } });
    const prescription = await prisma.prescription.create({ data: { saleId: antibioticSale.id, patientId: patient.id, prescriberName: "Dr. S. Fernando", prescriberRef: "SLMC-UAT-45821", imageKey: "uat/prescriptions/sample-prescription.jpg", capturedById: ownerUser.id, capturedAt: daysAgo(2) } });
    await prisma.prescriptionSaleLine.create({ data: { prescriptionId: prescription.id, saleLineId: antibioticSale.lines[0].id, productId: seededProducts[1].product.id, batchId: amoxicillinBatch.id, qtyBase: new Prisma.Decimal("10") } });

    const stockRows = [
      { sale: cashSale, index: 0, batch: paracetamolBatch, qty: "-20" },
      { sale: antibioticSale, index: 1, batch: amoxicillinBatch, qty: "-10" },
    ];
    for (const row of stockRows) {
      await prisma.stockMovement.create({ data: { productId: seededProducts[row.index].product.id, batchId: row.batch.id, movementType: StockMovementType.SALE_OUT, qtyBase: new Prisma.Decimal(row.qty), refType: "SALE", refId: row.sale.id, note: `UAT ${row.sale.saleNumber}`, createdById: ownerUser.id, createdAt: row.sale.createdAt } });
      await prisma.batch.update({ where: { id: row.batch.id }, data: { qtyOnHandBase: { decrement: new Prisma.Decimal(row.qty).abs() } } });
    }
    await prisma.stockMovement.create({ data: { productId: seededProducts[2].product.id, batchId: diazepamBatch.id, movementType: StockMovementType.WRITE_OFF, qtyBase: new Prisma.Decimal("-5"), refType: "UAT_WRITE_OFF", refId: "WO-UAT-0001", note: "Damaged pack write-off demonstration", createdById: ownerUser.id } });
    await prisma.batch.update({ where: { id: diazepamBatch.id }, data: { qtyOnHandBase: { decrement: new Prisma.Decimal("5") } } });
    await prisma.auditLog.createMany({ data: [
      { actorUserId: ownerUser.id, action: "uat.reset_completed", entityType: "SYSTEM", afterData: { dataset: "UAT", users: [ownerUsername, pharmacistUsername] } },
      { actorUserId: ownerUser.id, action: "sale.completed", entityType: "SALE", entityId: cashSale.id, afterData: { saleNumber: cashSale.saleNumber } },
      { actorUserId: ownerUser.id, action: "sale.voided", entityType: "SALE", entityId: voidSale.id, afterData: { saleNumber: voidSale.saleNumber } },
    ] });
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error instanceof Error ? error.message : "Unknown error");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
