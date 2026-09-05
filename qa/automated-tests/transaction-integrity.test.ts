import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { BatchStatus, PaymentMethod, Prisma, ProductType, SupplierInvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSupplierReturn, processSupplierReturnSettlement } from "@/modules/inventory/inventory.service";
import { completeSale } from "@/modules/sales/sale.service";

const suffix = randomUUID().slice(0, 8);
let actor: Awaited<ReturnType<typeof loadActor>>;
let productId = "";
let unitId = "";
let batchId = "";
let supplierAId = "";
let supplierBId = "";
let foreignInvoiceId = "";
let ownInvoiceId = "";

async function loadActor() {
  const user = await prisma.user.findFirstOrThrow({
    where: { isActive: true, role: { code: "owner" } },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
  });
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    roleCode: user.role.code,
    permissions: user.role.rolePermissions.map((row) => row.permission.code),
  };
}

function saleInput(quantity: string) {
  const total = new Prisma.Decimal(quantity).mul(10).toFixed(2);
  return {
    clientRequestId: randomUUID(),
    requestedStatus: "COMPLETED" as const,
    lines: [{
      clientLineId: randomUUID(),
      productId,
      unitId,
      quantity,
      quotedUnitPrice: "10.00",
    }],
    payments: [{ method: "CASH" as const, amount: total }],
    expectedTotal: total,
    discountAmount: "0.00",
    taxAmount: "0.00",
  };
}

before(async () => {
  actor = await loadActor();
  const [supplierA, supplierB] = await Promise.all([
    prisma.supplier.create({ data: { name: `QA_FIX_${suffix}_Supplier_A`, creditTermDays: 30 } }),
    prisma.supplier.create({ data: { name: `QA_FIX_${suffix}_Supplier_B`, creditTermDays: 30 } }),
  ]);
  supplierAId = supplierA.id;
  supplierBId = supplierB.id;
  const product = await prisma.product.create({
    data: {
      name: `QA_FIX_${suffix}_Concurrency_Product`,
      productType: ProductType.MEDICINE,
      baseUnitName: "TABLET",
      defaultSellingPrice: new Prisma.Decimal(10),
      units: { create: { unitName: "TABLET", factorToBase: new Prisma.Decimal(1), isSaleDefault: true } },
    },
    include: { units: true },
  });
  productId = product.id;
  unitId = product.units[0].id;
  const batch = await prisma.batch.create({
    data: {
      productId,
      batchNo: `QA-CONC-${suffix}`,
      expiryDate: new Date("2028-12-31"),
      mrp: new Prisma.Decimal(12),
      costPrice: new Prisma.Decimal(6),
      sellingPrice: new Prisma.Decimal(10),
      qtyOnHandBase: new Prisma.Decimal(10),
      status: BatchStatus.ACTIVE,
    },
  });
  batchId = batch.id;
  const [invoice, ownInvoice] = await Promise.all([
    prisma.supplierInvoice.create({
    data: {
      supplierId: supplierBId,
      invoiceNo: `QA-FOREIGN-${suffix}`,
      totalAmount: new Prisma.Decimal(100),
      paidAmount: new Prisma.Decimal(0),
      status: SupplierInvoiceStatus.OPEN,
    },
    }),
    prisma.supplierInvoice.create({
      data: {
        supplierId: supplierAId,
        invoiceNo: `QA_FIX_${suffix}_OWN`,
        totalAmount: new Prisma.Decimal(100),
        paidAmount: new Prisma.Decimal(0),
        status: SupplierInvoiceStatus.OPEN,
      },
    }),
  ]);
  foreignInvoiceId = invoice.id;
  ownInvoiceId = ownInvoice.id;
});

after(async () => {
  const saleIds = (await prisma.saleLine.findMany({ where: { productId }, select: { saleId: true }, distinct: ["saleId"] })).map((row) => row.saleId);
  const returnIds = (await prisma.supplierReturn.findMany({ where: { productId }, select: { id: true } })).map((row) => row.id);
  await prisma.stockMovement.deleteMany({ where: { productId } });
  await prisma.auditLog.deleteMany({ where: { OR: [{ entityType: "SALE", entityId: { in: saleIds } }, { entityType: "SUPPLIER_RETURN", entityId: { in: returnIds } }] } });
  await prisma.supplierReturn.deleteMany({ where: { productId } });
  await prisma.sale.deleteMany({ where: { id: { in: saleIds } } });
  await prisma.supplierInvoice.deleteMany({ where: { id: { in: [foreignInvoiceId, ownInvoiceId] } } });
  await prisma.batch.deleteMany({ where: { id: batchId } });
  await prisma.product.deleteMany({ where: { id: productId } });
  await prisma.supplier.deleteMany({ where: { id: { in: [supplierAId, supplierBId] } } });
});

test("CONC-SALE-001: simultaneous sales cannot oversell ten tablets", async () => {
  const results = await Promise.allSettled([
    completeSale(saleInput("8"), actor),
    completeSale(saleInput("5"), actor),
  ]);
  const fulfilled = results.filter((result) => result.status === "fulfilled");
  const rejected = results.filter((result) => result.status === "rejected");
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  const batch = await prisma.batch.findUniqueOrThrow({ where: { id: batchId } });
  assert.ok(batch.qtyOnHandBase.equals(2) || batch.qtyOnHandBase.equals(5));
  assert.ok(batch.qtyOnHandBase.gte(0));
  assert.equal(await prisma.saleLine.count({ where: { productId } }), 1);
});

test("RET-SUP-001: a supplier return cannot reduce another supplier's invoice", async () => {
  const supplierReturn = await createSupplierReturn({
    batchId,
    supplierId: supplierAId,
    qtyBase: 1,
    reason: "QA cross-supplier settlement isolation",
  }, actor.id);

  await assert.rejects(() => processSupplierReturnSettlement({
    returnId: supplierReturn.id,
    action: "DEDUCT_INVOICE",
    invoiceId: foreignInvoiceId,
  }, actor.id));

  const invoice = await prisma.supplierInvoice.findUniqueOrThrow({ where: { id: foreignInvoiceId } });
  assert.equal(invoice.totalAmount.toFixed(2), "100.00");
  assert.equal(invoice.supplierId, supplierBId);
});

test("RET-SUP-002: a return settles only its supplier's invoice and records the invoice link", async () => {
  const supplierReturn = await prisma.supplierReturn.findFirstOrThrow({ where: { productId }, orderBy: { createdAt: "desc" } });
  await processSupplierReturnSettlement({
    returnId: supplierReturn.id,
    action: "DEDUCT_INVOICE",
    invoiceId: ownInvoiceId,
  }, actor.id);
  const [invoice, settledReturn] = await Promise.all([
    prisma.supplierInvoice.findUniqueOrThrow({ where: { id: ownInvoiceId } }),
    prisma.supplierReturn.findUniqueOrThrow({ where: { id: supplierReturn.id } }),
  ]);
  assert.equal(invoice.totalAmount.toFixed(2), "94.00");
  assert.equal(settledReturn.status, "ADJUSTED");
  assert.equal(settledReturn.settledInvoiceId, ownInvoiceId);
});

test("RET-QTY-001: supplier return ledger and batch use the same base quantity", async () => {
  const returned = await prisma.supplierReturn.findFirst({ where: { productId }, orderBy: { createdAt: "desc" } });
  assert.ok(returned);
  const movement = await prisma.stockMovement.findFirstOrThrow({
    where: { refType: "SUPPLIER_RETURN", refId: returned.returnNumber },
  });
  assert.equal(returned.qtyBase.toFixed(3), "1.000");
  assert.equal(movement.qtyBase.toFixed(3), "-1.000");
  assert.equal(returned.totalCost.toFixed(2), "6.00");
});

test("PAY-METHOD-001: payment method enum is limited to cash/card", () => {
  assert.deepEqual(Object.values(PaymentMethod).sort(), ["CARD", "CASH"]);
});
