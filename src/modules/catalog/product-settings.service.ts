import { Prisma, PrescriptionRule } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/modules/audit/audit.service";

export const productSettingsSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().trim().min(1, "Product name is required").max(200),
  strength: z.string().trim().max(80).optional().nullable(),
  primaryBarcode: z.string().trim().max(120),
  reorderLevel: z.coerce.number().min(0).max(99999999999.999).refine(
    (value) => new Prisma.Decimal(value).decimalPlaces() <= 3,
    "Use up to 3 decimal places.",
  ),
  isControlled: z.boolean(),
  prescriptionRule: z.nativeEnum(PrescriptionRule),
});

export async function updateProductSettings(input: z.input<typeof productSettingsSchema>, actorUserId: string) {
  const values = productSettingsSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    // Serialize settings edits for this product, including barcode creation/removal.
    await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${values.productId}::uuid FOR UPDATE`;
    const before = await tx.product.findUnique({
      where: { id: values.productId }, include: { barcodes: true, units: true },
    });
    if (!before) throw new Error("Product not found.");
    const primary = before.barcodes.filter((barcode) => barcode.isPrimary);
    if (primary.length > 1) throw new Error("This product has multiple primary barcodes. Resolve them before editing.");
    const existing = primary[0];
    if (values.primaryBarcode !== (existing?.barcode ?? "")) {
      if (values.primaryBarcode) {
        const duplicate = await tx.productBarcode.findUnique({ where: { barcode: values.primaryBarcode } });
        if (duplicate) throw new Error("This barcode is already assigned to a product or package unit.");
        if (existing) {
          await tx.productBarcode.update({ where: { id: existing.id }, data: { barcode: values.primaryBarcode } });
        } else {
          const baseUnit = before.units.find((unit) => unit.unitName === before.baseUnitName && unit.factorToBase.eq(1));
          if (!baseUnit) throw new Error("A valid primary unit is required before adding a primary barcode.");
          await tx.productBarcode.create({ data: {
            productId: before.id, unitId: baseUnit.id, barcode: values.primaryBarcode, isPrimary: true,
          } });
        }
      } else if (existing) {
        await tx.productBarcode.delete({ where: { id: existing.id } });
      }
    }
    const product = await tx.product.update({ where: { id: before.id }, data: {
      name: values.name,
      strength: values.strength || null,
      reorderLevel: values.reorderLevel,
      isControlled: values.isControlled,
      prescriptionRule: values.isControlled ? PrescriptionRule.HARD_REQUIRED_CONTROLLED : values.prescriptionRule,
    } });
    await writeAuditLog({
      actorUserId, action: "product.settings.updated", entityType: "PRODUCT", entityId: before.id,
      beforeData: { name: before.name, strength: before.strength, primaryBarcode: existing?.barcode ?? null, reorderLevel: before.reorderLevel.toString(), isControlled: before.isControlled, prescriptionRule: before.prescriptionRule },
      afterData: { name: product.name, strength: product.strength, primaryBarcode: values.primaryBarcode || null, reorderLevel: product.reorderLevel.toString(), isControlled: product.isControlled, prescriptionRule: product.prescriptionRule },
    }, tx);
    return product;
  }, { maxWait: 5000, timeout: 10000 });
}
