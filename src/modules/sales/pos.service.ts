import { BatchStatus, Prisma, ProductType } from "@prisma/client";
import { unstable_cache } from "next/cache";
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
  sellingPrice: true,
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
  sellingPrice: true,
  mrp: true,
  costPrice: true,
  grnLine: { select: { unit: { select: { factorToBase: true } } } },
} satisfies Prisma.BatchSelect;

type ProductBaseRow = Prisma.ProductGetPayload<{ select: typeof productSelect }>;
type UnitRow = Prisma.ProductUnitGetPayload<{ select: typeof unitSelect }>;
type BarcodeRow = Prisma.ProductBarcodeGetPayload<{ select: typeof barcodeSelect }>;
type StockBatchRow = Prisma.BatchGetPayload<{ select: typeof stockBatchSelect }>;
type BatchPriceSource = Pick<StockBatchRow, "grnLine">;
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

function batchPriceForUnit(
  batch: BatchPriceSource,
  saleUnitFactor: Prisma.Decimal,
  price: Prisma.Decimal,
) {
  const sourceUnitFactor = batch.grnLine?.unit.factorToBase;
  return sourceUnitFactor?.gt(0)
    ? price.div(sourceUnitFactor).mul(saleUnitFactor)
    : price;
}

function serializeUnit(
  product: ProductReadRow,
  unit: ProductReadRow["units"][number],
  preferredBatch: StockBatchRow | null,
): PosUnitOption {
  const barcode = product.barcodes.find((item) => item.unitId === unit.id)?.barcode ?? null;
  const customPrice = unit.sellingPrice ? unit.sellingPrice.toFixed(2) : null;
  const sellingPrice = customPrice ?? (preferredBatch
    ? batchPriceForUnit(preferredBatch, unit.factorToBase, preferredBatch.sellingPrice).toFixed(2)
    : product.defaultSellingPrice
    ? product.defaultSellingPrice.mul(unit.factorToBase).toFixed(2)
    : null);
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
  // POS always starts from the first sellable FEFO batch. The checkout service
  // repeats this calculation under row locks before creating the sale.
  const preferredBatch = batches[0] ?? null;
  const availableQtyBase = batches.reduce(
    (sum, batch) => sum.add(batch.qtyOnHandBase),
    new Prisma.Decimal(0),
  );
  const units = product.units
    .slice()
    .sort((left, right) => left.factorToBase.comparedTo(right.factorToBase))
    .map((unit) => serializeUnit(product, unit, preferredBatch));
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
  const units = await prisma.productUnit.findMany({
    where: { productId: { in: productIds } },
    select: unitSelect,
    orderBy: { factorToBase: "asc" },
  });
  const barcodes = await prisma.productBarcode.findMany({
    where: { productId: { in: productIds } },
    select: barcodeSelect,
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
  const batches = await prisma.batch.findMany({
    where: {
      productId: { in: productIds },
      status: BatchStatus.ACTIVE,
      qtyOnHandBase: { gt: 0 },
    },
    select: stockBatchSelect,
    orderBy: [{ expiryDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
  });
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

let initialPosCatalogCache: { data: PosProductSearchResult[]; expiresAt: number } | null = null;

export function invalidatePosInitialCatalogCache() {
  initialPosCatalogCache = null;
}

function deduplicateProductsByName(products: PosProductSearchResult[]): PosProductSearchResult[] {
  const map = new Map<string, PosProductSearchResult>();
  for (const product of products) {
    const key = product.name.trim().toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...product, units: [...product.units] });
    } else {
      const existingUnits = new Set(existing.units.map((u) => u.unitName.toLowerCase()));
      for (const unit of product.units) {
        if (!existingUnits.has(unit.unitName.toLowerCase())) {
          existing.units.push(unit);
          existingUnits.add(unit.unitName.toLowerCase());
        }
      }
      const existingQty = new Prisma.Decimal(existing.availableQtyBase || "0");
      const addQty = new Prisma.Decimal(product.availableQtyBase || "0");
      existing.availableQtyBase = existingQty.add(addQty).toFixed(3);
      existing.hasActiveStock = existing.hasActiveStock || product.hasActiveStock;
      if (!existing.nextExpiryDate || (product.nextExpiryDate && product.nextExpiryDate < existing.nextExpiryDate)) {
        existing.nextExpiryDate = product.nextExpiryDate;
      }
    }
  }
  return Array.from(map.values());
}

const fetchInitialPosCatalogFromDb = unstable_cache(
  async () => {
    const today = startOfToday();
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        batches: {
          some: {
            status: BatchStatus.ACTIVE,
            qtyOnHandBase: { gt: 0 },
            OR: [{ expiryDate: null }, { expiryDate: { gte: today } }],
          },
        },
      },
      select: productSelect,
      orderBy: { createdAt: "desc" },
      take: 36,
    });

    const serialized = (await hydrateProductRows(products)).map(serializeProduct);
    const activeWithStock = serialized.filter((product) => product.hasActiveStock);
    return deduplicateProductsByName(activeWithStock);
  },
  ["pos-initial-catalog"],
  { revalidate: 30, tags: ["pos-catalog"] },
);

export async function searchProductsForPos(query: string): Promise<PosProductSearchResult[]> {
  const normalized = query.trim();
  const now = Date.now();

  if (!normalized) {
    if (initialPosCatalogCache && initialPosCatalogCache.expiresAt > now) {
      return initialPosCatalogCache.data;
    }
    const result = await fetchInitialPosCatalogFromDb();
    initialPosCatalogCache = { data: result, expiresAt: now + 30000 };
    return result;
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: normalized, mode: "insensitive" } },
        { genericName: { contains: normalized, mode: "insensitive" } },
        { barcodes: { some: { barcode: { contains: normalized } } } },
      ],
    },
    select: productSelect,
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const serialized = (await hydrateProductRows(products)).map(serializeProduct);
  return deduplicateProductsByName(serialized);
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
  const [product, units, barcodes, batches] = await Promise.all([
    prisma.product.findFirst({ where: { id: productId, isActive: true }, select: productSelect }),
    prisma.productUnit.findMany({ where: { productId }, select: unitSelect, orderBy: { factorToBase: "asc" } }),
    prisma.productBarcode.findMany({ where: { productId }, select: barcodeSelect }),
    prisma.batch.findMany({
      where: { productId, status: BatchStatus.ACTIVE, qtyOnHandBase: { gt: 0 } },
      select: stockBatchSelect,
      orderBy: [{ expiryDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    }),
  ]);
  if (!product) return [];
  const readRow: ProductReadRow = { ...product, units, barcodes, batches };
  const preferredBatch = sellableBatches(readRow)[0] ?? null;
  return units.map((unit) => serializeUnit(readRow, unit, preferredBatch));
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
      grnLine: { select: { unit: { select: { factorToBase: true } } } },
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
    unitName: unit.unitName,
    requestedQtyBase: requestedQtyBase.toFixed(3),
    totalAvailableQtyBase: totalAvailableQtyBase.toFixed(3),
    canFulfil: totalAvailableQtyBase.gte(requestedQtyBase),
    candidates: batches.map((batch, index) => ({
      id: batch.id,
      batchNumber: batch.batchNo,
      expiryDate: toDateOnly(batch.expiryDate),
      status: batch.status,
      availableQtyBase: batch.qtyOnHandBase.toFixed(3),
      mrp: batch.mrp ? batchPriceForUnit(batch, unit.factorToBase, batch.mrp).toFixed(2) : null,
      costPrice: batchPriceForUnit(batch, unit.factorToBase, batch.costPrice).toFixed(2),
      sellingPrice: batchPriceForUnit(batch, unit.factorToBase, batch.sellingPrice).toFixed(2),
      fefoRank: index + 1,
    })),
    generatedAt: new Date().toISOString(),
  };
}
