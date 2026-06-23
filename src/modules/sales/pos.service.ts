import { BatchStatus, Prisma, ProductType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  PosBarcodeLookupResult,
  PosBatchPreview,
  PosProductSearchResult,
  PosUnitOption,
} from "./pos.types";
import { serverOnly } from "@/lib/server-only";

serverOnly();

type ProductReadRow = Prisma.ProductGetPayload<{
  include: {
    units: true;
    barcodes: true;
    batches: true;
  };
}>;

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function toDateOnly(value: Date | null) {
  if (!value) return null;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sellableBatches(product: ProductReadRow) {
  const today = startOfToday();
  return product.batches
    .filter((batch) => {
      if (batch.status !== BatchStatus.ACTIVE || batch.qtyOnHandBase.lte(0)) return false;
      if (product.productType !== ProductType.MEDICINE) return true;
      return batch.expiryDate != null && batch.expiryDate >= today;
    })
    .sort((left, right) => {
      if (left.expiryDate == null) return right.expiryDate == null ? 0 : 1;
      if (right.expiryDate == null) return -1;
      return left.expiryDate.getTime() - right.expiryDate.getTime();
    });
}

function serializeUnit(product: ProductReadRow, unit: ProductReadRow["units"][number]): PosUnitOption {
  const barcode = product.barcodes.find((item) => item.unitId === unit.id)?.barcode ?? null;
  const sellingPrice = product.defaultSellingPrice
    ? product.defaultSellingPrice.mul(unit.factorToBase).toFixed(2)
    : null;
  return {
    id: unit.id,
    productId: unit.productId,
    unitName: unit.unitName,
    factorToBase: unit.factorToBase.toFixed(3),
    isPurchaseDefault: unit.isPurchaseDefault,
    isSaleDefault: unit.isSaleDefault,
    barcode,
    sellingPrice,
  };
}

function serializeProduct(product: ProductReadRow): PosProductSearchResult {
  const batches = sellableBatches(product);
  const availableQtyBase = batches.reduce(
    (sum, batch) => sum.add(batch.qtyOnHandBase),
    new Prisma.Decimal(0),
  );
  const units = product.units
    .slice()
    .sort((left, right) => left.factorToBase.comparedTo(right.factorToBase))
    .map((unit) => serializeUnit(product, unit));
  const defaultSaleUnit = units.find((unit) => unit.isSaleDefault) ?? units[0] ?? null;
  const primaryBarcode = product.barcodes.find((barcode) => barcode.isPrimary)?.barcode
    ?? product.barcodes[0]?.barcode
    ?? null;

  return {
    id: product.id,
    name: product.name,
    genericName: product.genericName,
    strength: product.strength,
    form: product.form,
    productType: product.productType,
    category: product.category,
    baseUnitName: product.baseUnitName,
    prescriptionRule: product.prescriptionRule,
    isControlled: product.isControlled,
    isSpecialDrug: product.isSpecialDrug,
    isActive: product.isActive,
    primaryBarcode,
    units,
    defaultSaleUnitId: defaultSaleUnit?.id ?? null,
    availableQtyBase: availableQtyBase.toFixed(3),
    hasActiveStock: availableQtyBase.gt(0),
    nextExpiryDate: toDateOnly(batches.find((batch) => batch.expiryDate != null)?.expiryDate ?? null),
  };
}

const productReadInclude = {
  units: true,
  barcodes: true,
  batches: { where: { status: BatchStatus.ACTIVE, qtyOnHandBase: { gt: 0 } } },
} satisfies Prisma.ProductInclude;

export async function searchProductsForPos(query: string): Promise<PosProductSearchResult[]> {
  const normalized = query.trim();
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: normalized
        ? [
            { name: { contains: normalized, mode: "insensitive" } },
            { genericName: { contains: normalized, mode: "insensitive" } },
            { barcodes: { some: { barcode: { contains: normalized } } } },
          ]
        : undefined,
    },
    include: productReadInclude,
    orderBy: { name: "asc" },
    take: 100,
  });
  return products.map(serializeProduct);
}

export async function lookupProductByBarcode(barcode: string): Promise<PosBarcodeLookupResult | null> {
  const normalized = barcode.trim();
  if (!normalized) return null;
  const match = await prisma.productBarcode.findUnique({
    where: { barcode: normalized },
    include: { product: { include: productReadInclude } },
  });
  if (!match?.product.isActive) return null;
  const product = serializeProduct(match.product);
  return {
    barcode: match.barcode,
    product,
    matchedUnit: product.units.find((unit) => unit.id === match.unitId)
      ?? product.units.find((unit) => unit.isSaleDefault)
      ?? product.units[0]
      ?? null,
  };
}

export async function getProductUnits(productId: string): Promise<PosUnitOption[]> {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    include: productReadInclude,
  });
  if (!product) return [];
  return product.units.map((unit) => serializeUnit(product, unit));
}

export async function getPosBatchPreview(
  productId: string,
  unitId: string,
  quantity: string,
): Promise<PosBatchPreview | null> {
  let requestedQty: Prisma.Decimal;
  try {
    requestedQty = new Prisma.Decimal(quantity);
  } catch {
    return null;
  }
  if (requestedQty.lte(0)) return null;

  const unit = await prisma.productUnit.findFirst({
    where: { id: unitId, productId, product: { isActive: true } },
    include: { product: { select: { productType: true } } },
  });
  if (!unit) return null;

  const today = startOfToday();
  const batches = await prisma.batch.findMany({
    where: {
      productId,
      status: BatchStatus.ACTIVE,
      qtyOnHandBase: { gt: 0 },
      ...(unit.product.productType === ProductType.MEDICINE ? { expiryDate: { gte: today } } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
  batches.sort((left, right) => {
    if (left.expiryDate == null) return right.expiryDate == null ? 0 : 1;
    if (right.expiryDate == null) return -1;
    return left.expiryDate.getTime() - right.expiryDate.getTime();
  });

  const requestedQtyBase = requestedQty.mul(unit.factorToBase);
  const totalAvailableQtyBase = batches.reduce(
    (sum, batch) => sum.add(batch.qtyOnHandBase),
    new Prisma.Decimal(0),
  );

  return {
    productId,
    requestedQtyBase: requestedQtyBase.toFixed(3),
    totalAvailableQtyBase: totalAvailableQtyBase.toFixed(3),
    canFulfil: totalAvailableQtyBase.gte(requestedQtyBase),
    candidates: batches.map((batch, index) => ({
      id: batch.id,
      batchNumber: batch.batchNo,
      expiryDate: toDateOnly(batch.expiryDate),
      status: batch.status,
      availableQtyBase: batch.qtyOnHandBase.toFixed(3),
      mrp: batch.mrp?.toFixed(2) ?? null,
      costPrice: batch.costPrice.toFixed(2),
      sellingPrice: batch.sellingPrice.toFixed(2),
      fefoRank: index + 1,
    })),
    generatedAt: new Date().toISOString(),
  };
}
