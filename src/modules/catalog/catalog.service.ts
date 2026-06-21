import "server-only";
import { Prisma, PrescriptionRule, ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/modules/audit/audit.service";

export type ProductUnitInput = {
  unitName: string;
  factorToBase: number;
  isPurchaseDefault?: boolean;
  isSaleDefault?: boolean;
  barcode?: string;
};

export type CreateProductInput = {
  name: string;
  genericName?: string;
  strength?: string;
  form?: string;
  productType: ProductType;
  category?: string;
  baseUnitName: string;
  prescriptionRule: PrescriptionRule;
  isControlled: boolean;
  defaultSellingPrice?: number;
  reorderLevel?: number;
  units: ProductUnitInput[];
};

/** Lists/searches active products with their units and barcodes for catalog screens. */
export async function searchProducts(query?: string) {
  const trimmed = query?.trim();
  return prisma.product.findMany({
    where: trimmed
      ? {
          OR: [
            { name: { contains: trimmed, mode: "insensitive" } },
            { genericName: { contains: trimmed, mode: "insensitive" } },
            { barcodes: { some: { barcode: { contains: trimmed } } } },
          ],
        }
      : undefined,
    include: {
      units: { orderBy: { factorToBase: "asc" } },
      barcodes: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/** Resolves a scanned barcode to a product + matched unit. Used by POS/GRN screens. */
export async function lookupBarcode(barcode: string) {
  const trimmed = barcode.trim();
  if (!trimmed) return null;

  const match = await prisma.productBarcode.findUnique({
    where: { barcode: trimmed },
    include: {
      product: { include: { units: true } },
      unit: true,
    },
  });
  if (!match || !match.product.isActive) return null;

  return {
    product: match.product,
    unit: match.unit ?? match.product.units.find((u) => u.isSaleDefault) ?? match.product.units[0] ?? null,
  };
}

/**
 * Creates a product with its units and barcodes inside a single transaction.
 * Controlled products are forced to HARD_REQUIRED_CONTROLLED to match the DB rule.
 * Writes an audit row in the same transaction.
 */
export async function createProduct(input: CreateProductInput, actorUserId: string) {
  const prescriptionRule = input.isControlled
    ? PrescriptionRule.HARD_REQUIRED_CONTROLLED
    : input.prescriptionRule;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: input.name,
        genericName: input.genericName || null,
        strength: input.strength || null,
        form: input.form || null,
        productType: input.productType,
        category: input.category || null,
        baseUnitName: input.baseUnitName,
        prescriptionRule,
        isControlled: input.isControlled,
        defaultSellingPrice:
          input.defaultSellingPrice != null ? new Prisma.Decimal(input.defaultSellingPrice) : null,
        reorderLevel: new Prisma.Decimal(input.reorderLevel ?? 0),
        units: {
          create: input.units.map((unit) => ({
            unitName: unit.unitName,
            factorToBase: new Prisma.Decimal(unit.factorToBase),
            isPurchaseDefault: unit.isPurchaseDefault ?? false,
            isSaleDefault: unit.isSaleDefault ?? false,
          })),
        },
      },
      include: { units: true },
    });

    for (const unit of input.units) {
      if (!unit.barcode?.trim()) continue;
      const matchingUnit = product.units.find((u) => u.unitName === unit.unitName);
      await tx.productBarcode.create({
        data: {
          productId: product.id,
          unitId: matchingUnit?.id ?? null,
          barcode: unit.barcode.trim(),
          isPrimary: unit.isSaleDefault ?? false,
        },
      });
    }

    await writeAuditLog(
      {
        actorUserId,
        action: "product.created",
        entityType: "PRODUCT",
        entityId: product.id,
        afterData: { name: product.name, productType: product.productType, prescriptionRule },
      },
      tx,
    );

    return product;
  });
}
