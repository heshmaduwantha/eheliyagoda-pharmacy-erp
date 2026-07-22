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

const productSelect = {
  id: true,
  name: true,
  genericName: true,
  strength: true,
  form: true,
  productType: true,
  category: true,
  baseUnitName: true,
  prescriptionRule: true,
  isControlled: true,
  isSpecialDrug: true,
  isActive: true,
  defaultSellingPrice: true,
} satisfies Prisma.ProductSelect;

const unitSelect = {
  id: true,
  productId: true,
  unitName: true,
  factorToBase: true,
  isPurchaseDefault: true,
  isSaleDefault: true,
} satisfies Prisma.ProductUnitSelect;

const barcodeSelect = {
  id: true,
  productId: true,
  unitId: true,
  barcode: true,
  isPrimary: true,
} satisfies Prisma.ProductBarcodeSelect;

const stockBatchSelect = {
  id: true,
  productId: true,
  expiryDate: true,
  qtyOnHandBase: true,
  status: true,
} satisfies Prisma.BatchSelect;

type ProductBaseRow = Prisma.ProductGetPayload<{ select: typeof productSelect }>;
type UnitRow = Prisma.ProductUnitGetPayload<{ select: typeof unitSelect }>;
type BarcodeRow = Prisma.ProductBarcodeGetPayload<{ select: typeof barcodeSelect }>;
type StockBatchRow = Prisma.BatchGetPayload<{ select: typeof stockBatchSelect }>;
type ProductReadRow = ProductBaseRow & {
  units: UnitRow[];
  barcodes: BarcodeRow[];
  batches: StockBatchRow[];
};

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

function groupByProductId<T extends { productId: string }>(rows: T[]) {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const bucket = grouped.get(row.productId);
    if (bucket) bucket.push(row);
    else grouped.set(row.productId, [row]);
  }
  return grouped;
}

async function hydrateProductRows(products: ProductBaseRow[]): Promise<ProductReadRow[]> {
  if (products.length === 0) return [];
  const productIds = products.map((product) => product.id);
  const [units, barcodes, batches] = await Promise.all([
    prisma.productUnit.findMany({
      where: { productId: { in: productIds } },
      select: unitSelect,
      orderBy: { factorToBase: "asc" },
    }),
    prisma.productBarcode.findMany({
      where: { productId: { in: productIds } },
      select: barcodeSelect,
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    }),
    prisma.batch.findMany({
      where: {
        productId: { in: productIds },
        status: BatchStatus.ACTIVE,
        qtyOnHandBase: { gt: 0 },
      },
      select: stockBatchSelect,
      orderBy: [{ expiryDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    }),
  ]);
  const unitsByProduct = groupByProductId(units);
  const barcodesByProduct = groupByProductId(barcodes);
  const batchesByProduct = groupByProductId(batches);

  return products.map((product) => ({
    ...product,
    units: unitsByProduct.get(product.id) ?? [],
    barcodes: barcodesByProduct.get(product.id) ?? [],
    batches: batchesByProduct.get(product.id) ?? [],
  }));
}

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
    select: productSelect,
    orderBy: { name: "asc" },
    take: normalized ? 40 : 10,
  });
  return (await hydrateProductRows(products)).map(serializeProduct);
}

export async function lookupProductByBarcode(barcode: string): Promise<PosBarcodeLookupResult | null> {
  const normalized = barcode.trim();
  if (!normalized) return null;
  const match = await prisma.productBarcode.findUnique({
    where: { barcode: normalized },
    select: { barcode: true, productId: true, unitId: true },
  });
  if (!match) return null;

  const products = await prisma.product.findMany({
    where: { id: match.productId, isActive: true },
    select: productSelect,
    take: 1,
  });
  const productRow = (await hydrateProductRows(products))[0];
  if (!productRow) return null;
  const product = serializeProduct(productRow);
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
  const [product, units, barcodes] = await Promise.all([
    prisma.product.findFirst({ where: { id: productId, isActive: true }, select: productSelect }),
    prisma.productUnit.findMany({ where: { productId }, select: unitSelect, orderBy: { factorToBase: "asc" } }),
    prisma.productBarcode.findMany({ where: { productId }, select: barcodeSelect }),
  ]);
  if (!product) return [];
  const readRow: ProductReadRow = { ...product, units, barcodes, batches: [] };
  return units.map((unit) => serializeUnit(readRow, unit));
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

  const [unit, product] = await Promise.all([
    prisma.productUnit.findFirst({ where: { id: unitId, productId }, select: unitSelect }),
    prisma.product.findFirst({ where: { id: productId, isActive: true }, select: { productType: true } }),
  ]);
  if (!unit || !product) return null;

  const today = startOfToday();
  const batches = await prisma.batch.findMany({
    where: {
      productId,
      status: BatchStatus.ACTIVE,
      qtyOnHandBase: { gt: 0 },
      ...(product.productType === ProductType.MEDICINE ? { expiryDate: { gte: today } } : {}),
    },
    select: {
      id: true,
      batchNo: true,
      expiryDate: true,
      status: true,
      qtyOnHandBase: true,
      mrp: true,
      costPrice: true,
      sellingPrice: true,
    },
    orderBy: [{ expiryDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
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
