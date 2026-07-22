import { randomUUID } from "node:crypto";
import { Prisma, PrescriptionRule, ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/modules/audit/audit.service";
import { serverOnly } from "@/lib/server-only";

serverOnly();

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
export async function searchProducts(
  options: { query?: string; filter?: string; page?: number; pageSize?: number } = {}
) {
  const { query, filter, page = 1, pageSize = 10 } = options;
  const trimmed = query?.trim();

  const where: Prisma.ProductWhereInput = {};
  
  if (trimmed) {
    where.OR = [
      { name: { contains: trimmed, mode: "insensitive" } },
      { genericName: { contains: trimmed, mode: "insensitive" } },
      { barcodes: { some: { barcode: { contains: trimmed } } } },
    ];
  }
  
  if (filter === "controlled") {
    where.isControlled = true;
  }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        units: { orderBy: { factorToBase: "asc" } },
        barcodes: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { data, total };
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

    const barcodes = input.units.flatMap((unit) => {
      if (!unit.barcode?.trim()) return [];
      const matchingUnit = product.units.find((item) => item.unitName === unit.unitName);
      return [{
          id: randomUUID(),
          productId: product.id,
          unitId: matchingUnit?.id ?? null,
          barcode: unit.barcode.trim(),
          isPrimary: unit.isSaleDefault ?? false,
      }];
    });
    if (barcodes.length > 0) await tx.productBarcode.createMany({ data: barcodes });

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
  }, { maxWait: 5_000, timeout: 10_000 });
}
