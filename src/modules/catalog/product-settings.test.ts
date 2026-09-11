import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import { lookupBarcode } from "./catalog.service";
import { productSettingsSchema, updateProductSettings } from "./product-settings.service";
import { resolvePrescriptionRequirement } from "@/modules/sales/prescription-rule.service";
import { getLowStockReport } from "@/modules/reports/inventory-report.service";

test("product settings reject invalid alert quantities and oversized barcodes", () => {
  const valid = { productId: randomUUID(), name: "Test Product", primaryBarcode: "", reorderLevel: 0, isControlled: false, prescriptionRule: "NONE" };
  for (const reorderLevel of [-1, Infinity, 0.0001, 100000000000]) {
    assert.equal(productSettingsSchema.safeParse({ ...valid, reorderLevel }).success, false);
  }
  assert.equal(productSettingsSchema.safeParse({ ...valid, primaryBarcode: "x".repeat(121) }).success, false);
  assert.equal(productSettingsSchema.safeParse({ ...valid, reorderLevel: "12.345" }).success, true);
});

test("settings edits preserve stock/units/prices, update lookups and prescription/alert rules, and roll back duplicates", {
  skip: process.env.RUN_CATALOG_DB_TESTS !== "1",
}, async () => {
  const ids = [randomUUID(), randomUUID()];
  const prefix = `QA-SETTINGS-${randomUUID()}`;
  try {
    const actor = await prisma.user.findFirst({ where: { isActive: true }, select: { id: true } });
    assert.ok(actor, "An existing active audit actor is required");
    const product = await prisma.product.create({ data: {
      id: ids[0], name: `${prefix}-medicine`, productType: "MEDICINE", baseUnitName: "Tablet", defaultSellingPrice: 12,
      units: { create: [
        { unitName: "Tablet", factorToBase: 1, isSaleDefault: true },
        { unitName: "Box", factorToBase: 10, sellingPrice: 110 },
      ] },
      batches: { create: { batchNo: prefix, qtyOnHandBase: 5, costPrice: 8, sellingPrice: 12, expiryDate: new Date("2030-01-01") } },
    }, include: { units: true, batches: true } });
    const base = product.units.find((unit) => unit.unitName === "Tablet")!;
    const box = product.units.find((unit) => unit.unitName === "Box")!;
    const packageBarcode = `${prefix}-box`;
    await prisma.productBarcode.create({ data: { productId: product.id, unitId: box.id, barcode: packageBarcode } });
    await prisma.product.create({ data: {
      id: ids[1], name: `${prefix}-other`, productType: "MEDICINE", baseUnitName: "Tablet",
      barcodes: { create: { barcode: `${prefix}-taken`, isPrimary: true } },
    } });
    const settings = { productId: product.id, name: `${prefix}-medicine`, primaryBarcode: `${prefix}-first`, reorderLevel: 6, isControlled: true, prescriptionRule: "NONE" as const };
    await updateProductSettings(settings, actor.id);
    assert.equal((await lookupBarcode(settings.primaryBarcode))?.unit?.id, base.id);
    assert.equal((await resolvePrescriptionRequirement([{ productId: product.id }])).rule, "HARD_REQUIRED_CONTROLLED");
    assert.ok((await getLowStockReport()).rows.some((row) => row.productId === product.id));

    await assert.rejects(updateProductSettings({ ...settings, primaryBarcode: `${prefix}-taken`, reorderLevel: 99 }, actor.id), /already assigned/);
    await assert.rejects(updateProductSettings({ ...settings, primaryBarcode: packageBarcode }, actor.id), /already assigned/);
    assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).reorderLevel.toString(), "6");
    assert.ok(await lookupBarcode(settings.primaryBarcode));

    await updateProductSettings({ ...settings, primaryBarcode: `${prefix}-replacement`, isControlled: false, prescriptionRule: "PROMPT_SKIPPABLE" }, actor.id);
    assert.equal(await lookupBarcode(settings.primaryBarcode), null);
    assert.equal((await lookupBarcode(`${prefix}-replacement`))?.unit?.id, base.id);
    assert.equal((await resolvePrescriptionRequirement([{ productId: product.id }])).rule, "PROMPT_SKIPPABLE");

    await updateProductSettings({ ...settings, primaryBarcode: "", reorderLevel: 0, isControlled: false }, actor.id);
    assert.equal(await lookupBarcode(`${prefix}-replacement`), null);
    assert.equal((await lookupBarcode(packageBarcode))?.unit?.id, box.id);
    assert.equal((await resolvePrescriptionRequirement([{ productId: product.id }])).rule, "NONE");
    assert.equal((await getLowStockReport()).rows.some((row) => row.productId === product.id), false);
    const after = await prisma.product.findUniqueOrThrow({ where: { id: product.id }, include: { units: true, batches: true } });
    assert.equal(after.defaultSellingPrice?.toString(), product.defaultSellingPrice?.toString());
    assert.equal(after.baseUnitName, product.baseUnitName);
    assert.deepEqual(after.units, product.units);
    assert.deepEqual(after.batches, product.batches);
    assert.equal(await prisma.auditLog.count({ where: { entityId: product.id, action: "product.settings.updated" } }), 3);
  } finally {
    await prisma.auditLog.deleteMany({ where: { entityId: { in: ids }, action: "product.settings.updated" } });
    await prisma.batch.deleteMany({ where: { productId: { in: ids } } });
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
    assert.equal(await prisma.product.count({ where: { id: { in: ids } } }), 0);
    await prisma.$disconnect();
  }
});
