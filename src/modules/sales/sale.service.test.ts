import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { afterEach } from "node:test";
import { BatchStatus, Prisma, ProductType, PrescriptionRule, SaleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PrescriptionValidationError } from "@/modules/prescriptions/prescription.types";
import { getDailySalesReport, getGrossProfitReport } from "@/modules/reports/sales-report.service";
import { completeSale } from "./sale.service";
import { voidSale } from "./sale-void.service";
import { SaleVoidError } from "./sale-void.types";
import { SaleCompletionError } from "./sale.types";

type SaleActor = {
  id: string;
  name: string;
  username: string;
  roleCode: string;
  permissions: string[];
};

type FixtureOptions = {
  name: string;
  defaultSellingPrice: string;
  prescriptionRule?: PrescriptionRule;
  isControlled?: boolean;
  productType?: ProductType;
  saleUnitFactor?: string;
  saleUnitName?: string;
  batches: Array<{
    qtyOnHandBase: string;
    expiryDate?: Date | null;
    mrp?: string | null;
    costPrice: string;
    sellingPrice: string;
    status?: BatchStatus;
  }>;
};

type Fixture = {
  productId: string;
  saleUnitId: string;
  saleUnitFactor: Prisma.Decimal;
  saleUnitPrice: Prisma.Decimal;
  batchIds: string[];
  saleBatchIds: string[];
  cleanup: () => Promise<void>;
};

const cleanupTasks: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (cleanupTasks.length > 0) {
    const cleanup = cleanupTasks.pop();
    if (cleanup) await cleanup();
  }
});

async function getSaleActor(): Promise<SaleActor> {
  const user = await prisma.user.findFirst({
    where: {
      isActive: true,
      role: {
        rolePermissions: {
          some: { permission: { code: "sale.create" } },
        },
      },
    },
    select: {
      id: true,
      name: true,
      username: true,
      role: {
        select: {
          code: true,
          rolePermissions: {
            select: {
              permission: { select: { code: true } },
            },
          },
        },
      },
    },
  });

  assert.ok(user, "Expected a seeded user with sale.create permission.");
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    roleCode: user.role.code,
    permissions: user.role.rolePermissions.map(({ permission }) => permission.code),
  };
}

async function getVoidActor(): Promise<SaleActor> {
  const user = await prisma.user.findFirst({
    where: {
      isActive: true,
      role: {
        rolePermissions: {
          some: { permission: { code: "sale.void" } },
        },
      },
    },
    select: {
      id: true,
      name: true,
      username: true,
      role: {
        select: {
          code: true,
          rolePermissions: {
            select: {
              permission: { select: { code: true } },
            },
          },
        },
      },
    },
  });

  assert.ok(user, "Expected a seeded user with sale.void permission.");
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    roleCode: user.role.code,
    permissions: user.role.rolePermissions.map(({ permission }) => permission.code),
  };
}

async function getNonVoidActor(): Promise<SaleActor> {
  const user = await prisma.user.findFirst({
    where: {
      isActive: true,
      role: {
        code: "PHARMACIST_CASHIER",
      },
    },
    select: {
      id: true,
      name: true,
      username: true,
      role: {
        select: {
          code: true,
          rolePermissions: {
            select: {
              permission: { select: { code: true } },
            },
          },
        },
      },
    },
  });

  assert.ok(user, "Expected a seeded pharmacist user.");
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    roleCode: user.role.code,
    permissions: user.role.rolePermissions.map(({ permission }) => permission.code),
  };
}

async function createFixture(options: FixtureOptions): Promise<Fixture> {
  const product = await prisma.product.create({
    data: {
      name: options.name,
      productType: options.productType ?? ProductType.MEDICINE,
      category: "Test",
      baseUnitName: options.saleUnitName ?? "tablet",
      prescriptionRule: options.prescriptionRule ?? PrescriptionRule.NONE,
      isControlled: options.isControlled ?? false,
      isSpecialDrug: options.isControlled ?? false,
      defaultSellingPrice: new Prisma.Decimal(options.defaultSellingPrice),
      reorderLevel: new Prisma.Decimal("0"),
      units: {
        create: [
          {
            unitName: options.saleUnitName ?? "tablet",
            factorToBase: new Prisma.Decimal(options.saleUnitFactor ?? "1"),
            isSaleDefault: true,
          },
        ],
      },
    },
    include: { units: true },
  });

  const saleUnit = product.units[0];
  const saleUnitFactor = saleUnit.factorToBase;
  const saleUnitPrice = new Prisma.Decimal(options.defaultSellingPrice).mul(saleUnitFactor);
  const batches: Array<{ id: string; qtyOnHandBase: Prisma.Decimal }> = [];

  for (const [index, batchInput] of options.batches.entries()) {
    const batch = await prisma.batch.create({
      data: {
        productId: product.id,
        batchNo: `${options.name.replace(/\s+/g, "-").toUpperCase()}-${index + 1}`,
        expiryDate: batchInput.expiryDate ?? null,
        mrp: batchInput.mrp != null ? new Prisma.Decimal(batchInput.mrp) : null,
        costPrice: new Prisma.Decimal(batchInput.costPrice),
        sellingPrice: new Prisma.Decimal(batchInput.sellingPrice),
        qtyOnHandBase: new Prisma.Decimal(batchInput.qtyOnHandBase),
        status: batchInput.status ?? BatchStatus.ACTIVE,
      },
    });
    batches.push({ id: batch.id, qtyOnHandBase: new Prisma.Decimal(batchInput.qtyOnHandBase) });
  }

  const cleanup = async () => {
    await prisma.stockMovement.deleteMany({
      where: { refType: "SALE", refId: { in: [] } },
    });
    await prisma.batch.deleteMany({ where: { id: { in: batches.map((item) => item.id) } } });
    await prisma.productUnit.deleteMany({ where: { productId: product.id } });
    await prisma.product.delete({ where: { id: product.id } });
  };

  cleanupTasks.push(cleanup);

  return {
    productId: product.id,
    saleUnitId: saleUnit.id,
    saleUnitFactor,
    saleUnitPrice,
    batchIds: batches.map((item) => item.id),
    saleBatchIds: batches.map((item) => item.id),
    cleanup,
  };
}

function saleInput(fixture: Fixture, overrides: Partial<{
  quantity: string;
  quotedUnitPrice: string;
  payments: Array<{ method: "CASH" | "CARD"; amount: string; cardReference?: string }>;
  expectedTotal: string;
  discountAmount: string;
  taxAmount: string;
  prescription: unknown;
}> = {}) {
  const quantity = overrides.quantity ?? "1";
  const quotedUnitPrice = overrides.quotedUnitPrice ?? fixture.saleUnitPrice.toFixed(2);
  const discountAmount = overrides.discountAmount ?? "0.00";
  const taxAmount = overrides.taxAmount ?? "0.00";
  const subtotal = new Prisma.Decimal(quantity).mul(quotedUnitPrice);
  const total = new Prisma.Decimal(overrides.expectedTotal ?? subtotal.sub(discountAmount).add(taxAmount).toFixed(2));
  return {
    clientRequestId: randomUUID(),
    requestedStatus: "COMPLETED" as const,
    lines: [
      {
        clientLineId: `${fixture.productId}-${fixture.saleUnitId}`,
        productId: fixture.productId,
        unitId: fixture.saleUnitId,
        quantity,
        quotedUnitPrice,
      },
    ],
    payments: overrides.payments ?? [{ method: "CASH" as const, amount: total.toFixed(2) }],
    expectedTotal: total.toFixed(2),
    discountAmount,
    taxAmount,
    prescription: overrides.prescription as never,
  };
}

async function cleanupSaleEntities(identifier: string) {
  const sale = await prisma.sale.findFirst({
    where: {
      OR: [{ id: identifier }, { clientRequestId: identifier }],
    },
    select: { id: true },
  });
  if (!sale) return;
  const voidRecord = await prisma.saleVoid.findUnique({
    where: { saleId: sale.id },
    select: { id: true },
  });
  if (voidRecord) {
    await prisma.stockMovement.deleteMany({ where: { refType: "SALE_VOID", refId: voidRecord.id } });
  }
  await prisma.stockMovement.deleteMany({ where: { refType: "SALE", refId: sale.id } });
  await prisma.auditLog.deleteMany({ where: { entityType: "SALE", entityId: sale.id } });
  await prisma.sale.deleteMany({ where: { id: sale.id } });
}

test("complete normal OTC sale creates sale, sale lines, payment, and stock movement", async () => {
  const actor = await getSaleActor();
  const fixture = await createFixture({
    name: `OTC-${randomUUID().slice(0, 8)}`,
    defaultSellingPrice: "10.00",
    saleUnitFactor: "10",
    saleUnitName: "strip",
    batches: [
      { qtyOnHandBase: "100.000", expiryDate: new Date("2027-12-31"), mrp: "120.00", costPrice: "6.50", sellingPrice: "100.00" },
    ],
  });

  const input = saleInput(fixture, { quantity: "1", expectedTotal: "100.00" });
  const result = await completeSale(input, actor);

  assert.equal(result.status, "COMPLETED");
  assert.equal(result.total, "100.00");
  const sale = await prisma.sale.findUnique({
    where: { id: result.saleId },
    include: { lines: true, payments: true },
  });
  assert.ok(sale);
  assert.equal(sale?.lines.length, 1);
  assert.equal(sale?.payments.length, 1);
  const movement = await prisma.stockMovement.findFirst({ where: { refType: "SALE", refId: result.saleId } });
  assert.ok(movement);
  assert.equal(movement?.qtyBase.toFixed(3), "-10.000");
  const auditActions = await prisma.auditLog.findMany({
    where: { entityType: "SALE", entityId: result.saleId },
    select: { action: true },
  });
  assert.ok(auditActions.some((entry) => entry.action === "sale.completed"));
  assert.ok(auditActions.some((entry) => entry.action === "stock.sale_out"));
  assert.ok(auditActions.some((entry) => entry.action === "payment.recorded"));
  await cleanupSaleEntities(result.saleId);
});

test("completed sale decrements batch qty", async () => {
  const actor = await getSaleActor();
  const fixture = await createFixture({
    name: `DEC-${randomUUID().slice(0, 8)}`,
    defaultSellingPrice: "8.00",
    batches: [
      { qtyOnHandBase: "25.000", expiryDate: new Date("2027-12-31"), mrp: "10.00", costPrice: "4.00", sellingPrice: "8.00" },
    ],
  });
  const input = saleInput(fixture, { quantity: "5", expectedTotal: "40.00" });
  const result = await completeSale(input, actor);
  const batch = await prisma.batch.findUnique({ where: { id: fixture.batchIds[0] } });
  assert.ok(batch);
  assert.equal(batch?.qtyOnHandBase.toFixed(3), "20.000");
  assert.equal(result.allocations[0].qtyBase, "5.000");
  await cleanupSaleEntities(result.saleId);
});

test("held sale is rejected", async () => {
  const actor = await getSaleActor();
  const fixture = await createFixture({
    name: `HELD-${randomUUID().slice(0, 8)}`,
    defaultSellingPrice: "8.00",
    batches: [
      { qtyOnHandBase: "25.000", expiryDate: new Date("2027-12-31"), mrp: "10.00", costPrice: "4.00", sellingPrice: "8.00" },
    ],
  });

  await assert.rejects(
    () => completeSale({ ...saleInput(fixture), requestedStatus: "HELD" }, actor),
    (error: unknown) => error instanceof SaleCompletionError && error.code === "VALIDATION_ERROR",
  );
});

test("payment mismatch rejects and does not move stock", async () => {
  const actor = await getSaleActor();
  const fixture = await createFixture({
    name: `PAY-${randomUUID().slice(0, 8)}`,
    defaultSellingPrice: "12.00",
    batches: [
      { qtyOnHandBase: "25.000", expiryDate: new Date("2027-12-31"), mrp: "14.00", costPrice: "6.00", sellingPrice: "12.00" },
    ],
  });

  const input = saleInput(fixture, {
    quantity: "1",
    payments: [{ method: "CASH", amount: "5.00" }],
    expectedTotal: "12.00",
  });

  await assert.rejects(
    () => completeSale(input, actor),
    (error: unknown) => error instanceof SaleCompletionError && error.code === "SALE_PAYMENT_TOTAL_MISMATCH",
  );

  const batch = await prisma.batch.findUnique({ where: { id: fixture.batchIds[0] } });
  const sale = await prisma.sale.findFirst({ where: { clientRequestId: input.clientRequestId } });
  assert.ok(batch);
  assert.equal(batch?.qtyOnHandBase.toFixed(3), "25.000");
  assert.equal(sale, null);
});

test("insufficient stock rejects and does not create sale", async () => {
  const actor = await getSaleActor();
  const fixture = await createFixture({
    name: `STOCK-${randomUUID().slice(0, 8)}`,
    defaultSellingPrice: "15.00",
    batches: [
      { qtyOnHandBase: "2.000", expiryDate: new Date("2027-12-31"), mrp: "18.00", costPrice: "7.00", sellingPrice: "15.00" },
    ],
  });

  const input = saleInput(fixture, { quantity: "3", expectedTotal: "45.00" });
  await assert.rejects(
    () => completeSale(input, actor),
    (error: unknown) => error instanceof SaleCompletionError && error.code === "INVENTORY_INSUFFICIENT_STOCK",
  );

  const sale = await prisma.sale.findFirst({ where: { clientRequestId: input.clientRequestId } });
  assert.equal(sale, null);
});

test("expired medicine batch is not allocated", async () => {
  const actor = await getSaleActor();
  const fixture = await createFixture({
    name: `EXP-${randomUUID().slice(0, 8)}`,
    defaultSellingPrice: "11.00",
    batches: [
      { qtyOnHandBase: "10.000", expiryDate: new Date("2024-01-01"), mrp: "12.00", costPrice: "5.00", sellingPrice: "11.00" },
      { qtyOnHandBase: "10.000", expiryDate: new Date("2027-12-31"), mrp: "12.00", costPrice: "5.00", sellingPrice: "11.00" },
    ],
  });

  const input = saleInput(fixture, { quantity: "1", expectedTotal: "11.00" });
  const result = await completeSale(input, actor);
  const lines = await prisma.saleLine.findMany({ where: { saleId: result.saleId } });
  assert.equal(lines.length, 1);
  assert.equal(lines[0].batchId, fixture.batchIds[1]);
  await cleanupSaleEntities(result.saleId);
});

test("multi-batch allocation splits one sale line across FEFO batches", async () => {
  const actor = await getSaleActor();
  const fixture = await createFixture({
    name: `SPLIT-${randomUUID().slice(0, 8)}`,
    defaultSellingPrice: "11.00",
    batches: [
      { qtyOnHandBase: "2.000", expiryDate: new Date("2027-01-01"), mrp: "12.00", costPrice: "5.00", sellingPrice: "11.00" },
      { qtyOnHandBase: "5.000", expiryDate: new Date("2027-12-31"), mrp: "12.00", costPrice: "5.00", sellingPrice: "11.00" },
    ],
  });

  const result = await completeSale(saleInput(fixture, { quantity: "4", expectedTotal: "44.00" }), actor);
  const lines = await prisma.saleLine.findMany({ where: { saleId: result.saleId }, orderBy: { createdAt: "asc" } });
  assert.equal(lines.length, 2);
  assert.equal(lines[0].batchId, fixture.batchIds[0]);
  assert.equal(lines[0].qtyBase.toFixed(3), "2.000");
  assert.equal(lines[1].batchId, fixture.batchIds[1]);
  assert.equal(lines[1].qtyBase.toFixed(3), "2.000");
  assert.equal(result.allocations.length, 2);
  assert.equal(result.receipt.lines.length, 1);
  assert.equal(result.receipt.lines[0].batchAllocations.length, 2);
  await cleanupSaleEntities(result.saleId);
});

test("quarantined batch is not allocated", async () => {
  const actor = await getSaleActor();
  const fixture = await createFixture({
    name: `Q-${randomUUID().slice(0, 8)}`,
    defaultSellingPrice: "11.00",
    batches: [
      { qtyOnHandBase: "10.000", expiryDate: new Date("2027-12-31"), mrp: "12.00", costPrice: "5.00", sellingPrice: "11.00", status: BatchStatus.QUARANTINED },
      { qtyOnHandBase: "10.000", expiryDate: new Date("2027-12-31"), mrp: "12.00", costPrice: "5.00", sellingPrice: "11.00" },
    ],
  });

  const input = saleInput(fixture, { quantity: "1", expectedTotal: "11.00" });
  const result = await completeSale(input, actor);
  const lines = await prisma.saleLine.findMany({ where: { saleId: result.saleId } });
  assert.equal(lines.length, 1);
  assert.equal(lines[0].batchId, fixture.batchIds[1]);
  await cleanupSaleEntities(result.saleId);
});

test("medicine price above MRP rejects", async () => {
  const actor = await getSaleActor();
  const fixture = await createFixture({
    name: `MRP-${randomUUID().slice(0, 8)}`,
    defaultSellingPrice: "13.00",
    batches: [
      { qtyOnHandBase: "10.000", expiryDate: new Date("2027-12-31"), mrp: "12.00", costPrice: "5.00", sellingPrice: "13.00" },
    ],
  });

  await assert.rejects(
    () => completeSale(saleInput(fixture, { expectedTotal: "13.00" }), actor),
    (error: unknown) => error instanceof SaleCompletionError && error.code === "SALE_PRICE_EXCEEDS_MRP",
  );
});

test("FEFO picks nearest expiry batch", async () => {
  const actor = await getSaleActor();
  const fixture = await createFixture({
    name: `FEFO-${randomUUID().slice(0, 8)}`,
    defaultSellingPrice: "9.00",
    batches: [
      { qtyOnHandBase: "10.000", expiryDate: new Date("2027-01-01"), mrp: "10.00", costPrice: "4.00", sellingPrice: "9.00" },
      { qtyOnHandBase: "10.000", expiryDate: new Date("2028-01-01"), mrp: "10.00", costPrice: "4.00", sellingPrice: "9.00" },
    ],
  });

  const result = await completeSale(saleInput(fixture, { quantity: "1", expectedTotal: "9.00" }), actor);
  const lines = await prisma.saleLine.findMany({ where: { saleId: result.saleId } });
  assert.equal(lines.length, 1);
  assert.equal(lines[0].batchId, fixture.batchIds[0]);
  await cleanupSaleEntities(result.saleId);
});

test("controlled drug without patient or prescriber rejects", async () => {
  const actor = await getSaleActor();
  const fixture = await createFixture({
    name: `CTRL-${randomUUID().slice(0, 8)}`,
    defaultSellingPrice: "20.00",
    isControlled: true,
    prescriptionRule: PrescriptionRule.HARD_REQUIRED_CONTROLLED,
    batches: [
      { qtyOnHandBase: "10.000", expiryDate: new Date("2027-12-31"), mrp: "24.00", costPrice: "8.00", sellingPrice: "20.00" },
    ],
  });

  await assert.rejects(
    () => completeSale(saleInput(fixture, { expectedTotal: "20.00" }), actor),
    (error: unknown) => error instanceof PrescriptionValidationError && error.code === "SALE_CONTROLLED_DRUG_DETAILS_REQUIRED",
  );
});

test("controlled drug with valid patient and prescriber succeeds", async () => {
  const actor = await getSaleActor();
  const fixture = await createFixture({
    name: `CTRL-OK-${randomUUID().slice(0, 8)}`,
    defaultSellingPrice: "20.00",
    isControlled: true,
    prescriptionRule: PrescriptionRule.HARD_REQUIRED_CONTROLLED,
    batches: [
      { qtyOnHandBase: "10.000", expiryDate: new Date("2027-12-31"), mrp: "24.00", costPrice: "8.00", sellingPrice: "20.00" },
    ],
  });

  const result = await completeSale(
    saleInput(fixture, {
      expectedTotal: "20.00",
      prescription: {
        mode: "CAPTURED",
        patient: { name: "Test Patient", nic: "200012345678" },
        prescriber: { name: "Dr Silva", reference: "SLMC-123" },
      },
    }),
    actor,
  );

  assert.equal(result.status, "COMPLETED");
  const prescription = await prisma.prescription.findUnique({
    where: { saleId: result.saleId },
  });
  assert.ok(prescription);
  const prescriptionLines = await prisma.prescriptionSaleLine.findMany({
    where: { prescriptionId: prescription.id },
    include: { saleLine: true },
  });
  assert.equal(prescriptionLines.length, 1);
  assert.equal(prescriptionLines[0].saleLine.saleId, result.saleId);
  const auditActions = await prisma.auditLog.findMany({
    where: { entityType: "PRESCRIPTION", entityId: prescription.id },
    select: { action: true },
  });
  assert.ok(auditActions.some((entry) => entry.action === "prescription.captured"));
  assert.ok(auditActions.some((entry) => entry.action === "controlled_drug.sale_validated"));
  await cleanupSaleEntities(result.saleId);
});

test("gross profit report uses cost_price_at_sale after sale", async () => {
  const actor = await getSaleActor();
  const fixture = await createFixture({
    name: `PROFIT-${randomUUID().slice(0, 8)}`,
    defaultSellingPrice: "30.00",
    batches: [
      { qtyOnHandBase: "10.000", expiryDate: new Date("2027-12-31"), mrp: "32.00", costPrice: "12.00", sellingPrice: "30.00" },
    ],
  });

  const result = await completeSale(saleInput(fixture, { expectedTotal: "30.00" }), actor);
  const today = new Date();
  const range = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const report = await getGrossProfitReport({
    from: range,
    to: range,
  });
  assert.equal(report.availability, "ready");
  assert.ok(report.rows.some((row) => row.productId === fixture.productId));
  const row = report.rows.find((item) => item.productId === fixture.productId);
  assert.ok(row);
  assert.equal(row?.batchAwareCogs, "12.00");
  await cleanupSaleEntities(result.saleId);
});

test("completed sale can be voided without returning stock", async () => {
  const actor = await getVoidActor();
  const fixture = await createFixture({
    name: `VOID-${randomUUID().slice(0, 8)}`,
    defaultSellingPrice: "15.00",
    batches: [
      { qtyOnHandBase: "20.000", expiryDate: new Date("2027-12-31"), mrp: "18.00", costPrice: "8.00", sellingPrice: "15.00" },
    ],
  });

  const sale = await completeSale(saleInput(fixture, { expectedTotal: "15.00" }), await getSaleActor());
  const batchAfterSale = await prisma.batch.findUnique({ where: { id: fixture.batchIds[0] } });
  assert.ok(batchAfterSale);
  assert.equal(batchAfterSale?.qtyOnHandBase.toFixed(3), "19.000");

  const result = await voidSale(
    {
      saleId: sale.saleId,
      reason: "Cashier mistake",
      refundAmount: sale.total,
      stockPolicy: "NO_STOCK_RETURN",
    },
    actor,
  );

  assert.equal(result.status, "VOIDED");
  assert.equal(result.refundAmount, "15.00");
  assert.equal(result.returnedStockMovements.length, 0);

  const voidRecord = await prisma.saleVoid.findUnique({ where: { saleId: sale.saleId } });
  assert.ok(voidRecord);
  assert.equal(voidRecord?.reason, "Cashier mistake");
  const reloadedSale = await prisma.sale.findUnique({ where: { id: sale.saleId } });
  assert.equal(reloadedSale?.status, SaleStatus.VOIDED);
  assert.ok(reloadedSale?.voidedAt);

  const batchAfterVoid = await prisma.batch.findUnique({ where: { id: fixture.batchIds[0] } });
  assert.ok(batchAfterVoid);
  assert.equal(batchAfterVoid?.qtyOnHandBase.toFixed(3), "19.000");

  const returnedMovement = await prisma.stockMovement.findFirst({ where: { refType: "SALE_VOID", refId: result.saleVoidId } });
  assert.equal(returnedMovement, null);

  const daily = await getDailySalesReport({
    from: new Date().toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  assert.equal(daily.availability, "empty");

  const profit = await getGrossProfitReport({
    from: new Date().toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  assert.equal(profit.availability, "empty");

  await cleanupSaleEntities(sale.saleId);
});

test("completed sale can return stock to active when safe", async () => {
  const actor = await getVoidActor();
  const fixture = await createFixture({
    name: `RETURN-${randomUUID().slice(0, 8)}`,
    defaultSellingPrice: "12.00",
    batches: [
      { qtyOnHandBase: "3.000", expiryDate: new Date("2027-12-31"), mrp: "14.00", costPrice: "6.00", sellingPrice: "12.00" },
    ],
  });

  const sale = await completeSale(saleInput(fixture, { quantity: "3", expectedTotal: "36.00" }), await getSaleActor());
  const batchAfterSale = await prisma.batch.findUnique({ where: { id: fixture.batchIds[0] } });
  assert.ok(batchAfterSale);
  assert.equal(batchAfterSale?.qtyOnHandBase.toFixed(3), "0.000");
  assert.equal(batchAfterSale?.status, BatchStatus.DEPLETED);

  const result = await voidSale(
    {
      saleId: sale.saleId,
      reason: "Counter mistake",
      refundAmount: sale.total,
      stockPolicy: "RETURN_TO_ACTIVE",
      refundMethod: "CASH",
      refundReference: "REF-001",
    },
    actor,
  );

  assert.equal(result.returnedStockMovements.length, 1);
  const batchAfterVoid = await prisma.batch.findUnique({ where: { id: fixture.batchIds[0] } });
  assert.ok(batchAfterVoid);
  assert.equal(batchAfterVoid?.qtyOnHandBase.toFixed(3), "3.000");
  assert.equal(batchAfterVoid?.status, BatchStatus.ACTIVE);

  const movement = await prisma.stockMovement.findFirst({ where: { refType: "SALE_VOID", refId: result.saleVoidId } });
  assert.ok(movement);
  assert.equal(movement?.movementType, "RETURN_IN");

  await cleanupSaleEntities(sale.saleId);
});

test("held sale cannot be voided", async () => {
  const actor = await getVoidActor();
  const sale = await prisma.sale.create({
    data: {
      saleNumber: `HELD-${randomUUID().slice(0, 8)}`,
      status: SaleStatus.HELD,
      cashierId: actor.id,
      subtotal: new Prisma.Decimal(0),
      discountAmount: new Prisma.Decimal(0),
      taxAmount: new Prisma.Decimal(0),
      total: new Prisma.Decimal(0),
    },
  });

  await assert.rejects(
    () =>
      voidSale(
        {
          saleId: sale.id,
          reason: "Not completed",
          stockPolicy: "NO_STOCK_RETURN",
        },
        actor,
      ),
    (error: unknown) => error instanceof SaleVoidError && error.code === "CONFLICT",
  );

  await prisma.sale.deleteMany({ where: { id: sale.id } });
});

test("user without sale.void permission cannot void", async () => {
  const actor = await getNonVoidActor();
  assert.equal(actor.permissions.includes("sale.void"), false);

  const fixture = await createFixture({
    name: `NO-VOID-${randomUUID().slice(0, 8)}`,
    defaultSellingPrice: "10.00",
    batches: [
      { qtyOnHandBase: "10.000", expiryDate: new Date("2027-12-31"), mrp: "12.00", costPrice: "5.00", sellingPrice: "10.00" },
    ],
  });
  const sale = await completeSale(saleInput(fixture, { expectedTotal: "10.00" }), await getSaleActor());

  await assert.rejects(
    () =>
      voidSale(
        {
          saleId: sale.saleId,
          reason: "Unauthorized void",
          stockPolicy: "NO_STOCK_RETURN",
        },
        actor,
      ),
    (error: unknown) => error instanceof SaleVoidError && error.code === "FORBIDDEN",
  );

  await cleanupSaleEntities(sale.saleId);
});
