import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { GrnStatus, Prisma, ProductType, StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { confirmGrn } from "./grn.service";

test("GRN confirmation creates stock and payable exactly once in one transaction", async () => {
  const actor = await prisma.user.findFirst({ where: { isActive: true }, select: { id: true } });
  assert.ok(actor, "Expected an active seeded user.");

  const suffix = randomUUID().slice(0, 8);
  const supplier = await prisma.supplier.create({ data: { name: `GRN Test Supplier ${suffix}`, creditTermDays: 14 } });
  const product = await prisma.product.create({
    data: {
      name: `GRN Test Medicine ${suffix}`,
      productType: ProductType.MEDICINE,
      baseUnitName: "tablet",
      defaultSellingPrice: new Prisma.Decimal("8.00"),
      units: {
        create: [{ unitName: "tablet", factorToBase: new Prisma.Decimal(1), isPurchaseDefault: true, isSaleDefault: true }],
      },
    },
    include: { units: true },
  });
  const grn = await prisma.grn.create({
    data: {
      grnNo: `TEST-GRN-${suffix}`,
      supplierId: supplier.id,
      supplierInvoiceNo: `TEST-INV-${suffix}`,
      invoiceTotal: new Prisma.Decimal("50.00"),
      status: GrnStatus.DRAFT,
      receivedById: actor.id,
      lines: {
        create: [{
          productId: product.id,
          unitId: product.units[0].id,
          qtyInUnit: new Prisma.Decimal("10.000"),
          qtyBase: new Prisma.Decimal("10.000"),
          batchNo: `B-${suffix}`,
          expiryDate: new Date("2027-12-31"),
          mrp: new Prisma.Decimal("10.00"),
          costPrice: new Prisma.Decimal("5.00"),
          sellingPrice: new Prisma.Decimal("8.00"),
        }],
      },
    },
  });

  try {
    const confirmed = await confirmGrn(grn.id, actor.id);
    assert.equal(confirmed.status, GrnStatus.CONFIRMED);

    const batches = await prisma.batch.findMany({ where: { grnLine: { grnId: grn.id } } });
    assert.equal(batches.length, 1);
    assert.equal(batches[0].qtyOnHandBase.toFixed(3), "10.000");

    const movements = await prisma.stockMovement.findMany({ where: { refType: "GRN", refId: grn.id } });
    assert.equal(movements.length, 1);
    assert.equal(movements[0].movementType, StockMovementType.GRN_IN);
    assert.equal(movements[0].qtyBase.toFixed(3), "10.000");

    const invoice = await prisma.supplierInvoice.findUnique({ where: { grnId: grn.id } });
    assert.ok(invoice);
    assert.equal(invoice?.totalAmount.toFixed(2), "50.00");

    const audit = await prisma.auditLog.findFirst({
      where: { entityType: "GRN", entityId: grn.id, action: "grn.confirmed" },
    });
    assert.ok(audit);

    await assert.rejects(() => confirmGrn(grn.id, actor.id), /Only a DRAFT GRN can be confirmed/);
    assert.equal(await prisma.stockMovement.count({ where: { refType: "GRN", refId: grn.id } }), 1);
    assert.equal(await prisma.batch.count({ where: { grnLine: { grnId: grn.id } } }), 1);
  } finally {
    await prisma.auditLog.deleteMany({ where: { entityType: "GRN", entityId: grn.id } });
    await prisma.stockMovement.deleteMany({ where: { refType: "GRN", refId: grn.id } });
    await prisma.supplierInvoice.deleteMany({ where: { grnId: grn.id } });
    await prisma.batch.deleteMany({ where: { grnLine: { grnId: grn.id } } });
    await prisma.grn.deleteMany({ where: { id: grn.id } });
    await prisma.productUnit.deleteMany({ where: { productId: product.id } });
    await prisma.product.deleteMany({ where: { id: product.id } });
    await prisma.supplier.deleteMany({ where: { id: supplier.id } });
  }
});
