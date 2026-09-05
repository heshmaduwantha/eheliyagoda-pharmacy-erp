import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { Prisma, ProductType, PrescriptionRule } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createProduct } from "@/modules/catalog/catalog.service";
import { createGrnDraft, confirmGrn } from "@/modules/procurement/grn.service";
import { createSupplier } from "@/modules/procurement/supplier.service";
import { searchProductsForPos } from "@/modules/sales/pos.service";
import { completeSale } from "@/modules/sales/sale.service";
import { getStockValuationReport } from "@/modules/reports/inventory-report.service";

const suffix = randomUUID().slice(0, 8);
const productName = `QA_FIX_${suffix}_Paracetamol_500mg`;
let actor: Awaited<ReturnType<typeof loadActor>>;
let supplierId = "";
let productId = "";
let grnId = "";
let invoiceId = "";
let batchId = "";
let units: Record<string, string> = {};

async function loadActor() {
  const user = await prisma.user.findFirst({
    where: { isActive: true, role: { code: "owner" } },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
  });
  assert.ok(user, "QA database must be seeded with an owner.");
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    roleCode: user.role.code,
    permissions: user.role.rolePermissions.map((row) => row.permission.code),
  };
}

before(async () => {
  actor = await loadActor();
  const supplier = await createSupplier({
    name: `QA_FIX_${suffix}_HealthCare_Distributors`,
    contactPerson: "Synthetic QA Contact",
    phone: "0700000000",
    email: `qa-${suffix}@example.test`,
    address: "Synthetic address, Colombo",
    creditTermDays: 30,
  }, actor.id);
  supplierId = supplier.id;

  const product = await createProduct({
    name: productName,
    genericName: "Paracetamol",
    strength: "500mg",
    form: "Tablet",
    productType: ProductType.MEDICINE,
    category: "Analgesic",
    baseUnitName: "TABLET",
    prescriptionRule: PrescriptionRule.NONE,
    isControlled: false,
    defaultSellingPrice: 20,
    units: [
      { unitName: "TABLET", factorToBase: 1, isSaleDefault: true, barcode: `QA-${suffix}-TAB` },
      { unitName: "STRIP", factorToBase: 10, barcode: `QA-${suffix}-STRIP` },
      { unitName: "PACK20", factorToBase: 20, barcode: `QA-${suffix}-PACK20` },
      { unitName: "BOX", factorToBase: 100, isPurchaseDefault: true, barcode: `QA-${suffix}-BOX` },
    ],
  }, actor.id);
  productId = product.id;
  units = Object.fromEntries(product.units.map((unit) => [unit.unitName, unit.id]));

  const grn = await createGrnDraft({
    supplierId,
    notes: "QA UOM purchase: 10 BOX × 100 TABLET",
    lines: [{
      productId,
      unitId: units.BOX,
      qtyInUnit: 10,
      supplierBatchNo: `QA-B001-${suffix}`,
      expiryDate: "2028-06-30",
      mrp: 2200,
      costPrice: 1500,
      sellingPrice: 2000,
    }],
  }, actor.id);
  grnId = grn.id;
  await confirmGrn(grnId, actor.id);
  const [batch, invoice] = await Promise.all([
    prisma.batch.findFirstOrThrow({ where: { grnLine: { grnId } } }),
    prisma.supplierInvoice.findUniqueOrThrow({ where: { grnId } }),
  ]);
  batchId = batch.id;
  invoiceId = invoice.id;
});

after(async () => {
  if (!productId) return;
  const saleIds = (await prisma.saleLine.findMany({ where: { productId }, select: { saleId: true }, distinct: ["saleId"] })).map((row) => row.saleId);
  await prisma.stockMovement.deleteMany({ where: { OR: [{ productId }, { refType: "SALE", refId: { in: saleIds } }] } });
  await prisma.auditLog.deleteMany({ where: { OR: [{ entityId: { in: [productId, supplierId, grnId, invoiceId] } }, { entityType: "SALE", entityId: { in: saleIds } }] } });
  await prisma.sale.deleteMany({ where: { id: { in: saleIds } } });
  await prisma.supplierInvoice.deleteMany({ where: { id: invoiceId } });
  await prisma.batch.deleteMany({ where: { id: batchId } });
  await prisma.grn.deleteMany({ where: { id: grnId } });
  await prisma.product.deleteMany({ where: { id: productId } });
  await prisma.supplier.deleteMany({ where: { id: supplierId } });
});

test("UOM-PUR-001: 10 boxes are received as 1,000 tablets with normalized base-unit cost", async () => {
  const [line, batch, movement, invoice] = await Promise.all([
    prisma.grnLine.findFirstOrThrow({ where: { grnId } }),
    prisma.batch.findUniqueOrThrow({ where: { id: batchId } }),
    prisma.stockMovement.findFirstOrThrow({ where: { refType: "GRN", refId: grnId } }),
    prisma.supplierInvoice.findUniqueOrThrow({ where: { id: invoiceId } }),
  ]);
  assert.equal(line.qtyInUnit.toFixed(3), "10.000");
  assert.equal(line.qtyBase.toFixed(3), "1000.000");
  assert.equal(batch.qtyOnHandBase.toFixed(3), "1000.000");
  assert.equal(batch.costPrice.toFixed(2), "15.00");
  assert.equal(batch.sellingPrice.toFixed(2), "20.00");
  assert.equal(movement.qtyBase.toFixed(3), "1000.000");
  assert.equal(invoice.totalAmount.toFixed(2), "15000.00");
});

test("UOM-REP-001: stock valuation equals 1,000 tablets × Rs.15", async () => {
  const report = await getStockValuationReport();
  const row = report.rows.find((item) => item.batchId === batchId);
  assert.ok(row, "Purchased batch must appear in stock valuation.");
  assert.equal(row.costPrice, "15.00");
  assert.equal(row.valuation, "15000.00");
});

test("UOM-POS-001: POS exposes correct base, factor-10, factor-20 and factor-100 prices", async () => {
  const result = await searchProductsForPos(productName);
  const product = result.find((item) => item.id === productId);
  assert.ok(product);
  const prices = Object.fromEntries(product.units.map((unit) => [unit.unitName, unit.sellingPrice]));
  assert.deepEqual(prices, { TABLET: "20.00", STRIP: "200.00", PACK20: "400.00", BOX: "2000.00" });
});

test("UOM-SALE-001: selling 2 strips deducts 20 tablets and charges Rs.400", async () => {
  const result = await completeSale({
    clientRequestId: randomUUID(),
    requestedStatus: "COMPLETED",
    lines: [{
      clientLineId: randomUUID(),
      productId,
      unitId: units.STRIP,
      quantity: "2",
      quotedUnitPrice: "200.00",
    }],
    payments: [{ method: "CASH", amount: "400.00" }],
    expectedTotal: "400.00",
    discountAmount: "0.00",
    taxAmount: "0.00",
  }, actor);
  const [batch, movement] = await Promise.all([
    prisma.batch.findUniqueOrThrow({ where: { id: batchId } }),
    prisma.stockMovement.findFirstOrThrow({ where: { refType: "SALE", refId: result.saleId } }),
  ]);
  assert.equal(result.total, "400.00");
  assert.equal(movement.qtyBase.toFixed(3), "-20.000");
  assert.equal(batch.qtyOnHandBase.toFixed(3), "980.000");
});

test("UOM-SALE-002: selling one factor-20 pack charges Rs.400 with Rs.15/base COGS", async () => {
  const result = await completeSale({
    clientRequestId: randomUUID(),
    requestedStatus: "COMPLETED",
    lines: [{
      clientLineId: randomUUID(),
      productId,
      unitId: units.PACK20,
      quantity: "1",
      quotedUnitPrice: "400.00",
    }],
    payments: [{ method: "CASH", amount: "400.00" }],
    expectedTotal: "400.00",
    discountAmount: "0.00",
    taxAmount: "0.00",
  }, actor);
  const [batch, line] = await Promise.all([
    prisma.batch.findUniqueOrThrow({ where: { id: batchId } }),
    prisma.saleLine.findFirstOrThrow({ where: { saleId: result.saleId } }),
  ]);
  assert.equal(line.qtyBase.toFixed(3), "20.000");
  assert.equal(line.costPriceAtSale.toFixed(2), "15.00");
  assert.equal(batch.qtyOnHandBase.toFixed(3), "960.000");
});

test("DB-UOM-001: database rejects a zero conversion factor", async () => {
  await assert.rejects(() => prisma.productUnit.create({
    data: { productId, unitName: `INVALID-${suffix}`, factorToBase: new Prisma.Decimal(0) },
  }));
});
