import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { Prisma, ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { confirmGrn, createGrnDraft } from "@/modules/procurement/grn.service";

const suffix = randomUUID().slice(0, 8);
let actorId = "";
let supplierId = "";
let inactiveSupplierId = "";
const productIds: string[] = [];
const grnIds: string[] = [];

before(async () => {
  actorId = (await prisma.user.findFirstOrThrow({ where: { isActive: true, role: { code: "owner" } } })).id;
  const [supplier, inactiveSupplier] = await Promise.all([
    prisma.supplier.create({ data: { name: `QA_FIX_${suffix}_Boundary_Supplier`, isActive: true } }),
    prisma.supplier.create({ data: { name: `QA_FIX_${suffix}_Inactive_Supplier`, isActive: false } }),
  ]);
  supplierId = supplier.id;
  inactiveSupplierId = inactiveSupplier.id;
});

after(async () => {
  await prisma.auditLog.deleteMany({ where: { entityId: { in: [...grnIds, ...productIds, supplierId, inactiveSupplierId] } } });
  await prisma.stockMovement.deleteMany({ where: { refType: "GRN", refId: { in: grnIds } } });
  await prisma.supplierInvoice.deleteMany({ where: { grnId: { in: grnIds } } });
  await prisma.batch.deleteMany({ where: { grnLine: { grnId: { in: grnIds } } } });
  await prisma.grn.deleteMany({ where: { id: { in: grnIds } } });
  await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  await prisma.supplier.deleteMany({ where: { id: { in: [supplierId, inactiveSupplierId] } } });
});

async function makeProduct(label: string) {
  const product = await prisma.product.create({
    data: {
      name: `QA_FIX_${suffix}_${label}`,
      productType: ProductType.MEDICINE,
      baseUnitName: "TABLET",
      isActive: true,
      units: { create: { unitName: "TABLET", factorToBase: new Prisma.Decimal(1), isPurchaseDefault: true } },
    },
    include: { units: true },
  });
  productIds.push(product.id);
  return product;
}

async function draft(product: Awaited<ReturnType<typeof makeProduct>>, targetSupplierId: string, expiryDate: string) {
  const grn = await createGrnDraft({
    supplierId: targetSupplierId,
    lines: [{
      productId: product.id,
      unitId: product.units[0].id,
      qtyInUnit: 10,
      expiryDate,
      mrp: 12,
      costPrice: 6,
      sellingPrice: 10,
    }],
  }, actorId);
  grnIds.push(grn.id);
  return grn;
}

test("GRN-EXP-001: an already-expired medicine cannot be received", async () => {
  const product = await makeProduct("Expired Medicine");
  const grn = await draft(product, supplierId, "2020-01-01");
  await assert.rejects(() => confirmGrn(grn.id, actorId));
});

test("GRN-PROD-001: a draft cannot be confirmed after its product is deactivated", async () => {
  const product = await makeProduct("Inactive_Medicine");
  const grn = await draft(product, supplierId, "2028-12-31");
  await prisma.product.update({ where: { id: product.id }, data: { isActive: false } });
  await assert.rejects(() => confirmGrn(grn.id, actorId), /inactive product/);
  await prisma.product.update({ where: { id: product.id }, data: { isActive: true } });
  await confirmGrn(grn.id, actorId);
  assert.equal(await prisma.batch.count({ where: { grnLine: { grnId: grn.id } } }), 1);
});

test("GRN-SUP-001: an inactive supplier cannot be confirmed", async () => {
  const product = await makeProduct("Inactive Supplier Medicine");
  const grn = await draft(product, inactiveSupplierId, "2028-12-31");
  await assert.rejects(() => confirmGrn(grn.id, actorId), /Supplier is inactive/);
  assert.equal(await prisma.batch.count({ where: { grnLine: { grnId: grn.id } } }), 0);
  assert.equal(await prisma.supplierInvoice.count({ where: { grnId: grn.id } }), 0);
});
