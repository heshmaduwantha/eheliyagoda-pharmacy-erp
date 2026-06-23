import { BatchStatus, Prisma, StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ExpiryAlertRecord,
  InventoryBatchRecord,
  InventoryFilterInput,
  StockMovementRecord,
  StockSummary,
} from "./inventory.types";
import { serverOnly } from "@/lib/server-only";

serverOnly();

// TODO(settings): Read system_settings.near_expiry_days when that model is introduced.
const DEFAULT_NEAR_EXPIRY_DAYS = 90;

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(value: Date, days: number) {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

function toDateOnly(value: Date | null) {
  if (!value) return null;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetween(from: Date, to: Date | null) {
  if (!to) return null;
  const dayMs = 86_400_000;
  const normalized = new Date(to);
  normalized.setHours(0, 0, 0, 0);
  return Math.round((normalized.getTime() - from.getTime()) / dayMs);
}

function batchStatus(value?: string) {
  return Object.values(BatchStatus).includes(value as BatchStatus) ? value as BatchStatus : undefined;
}

function movementType(value?: string) {
  return Object.values(StockMovementType).includes(value as StockMovementType)
    ? value as StockMovementType
    : undefined;
}

function batchSearchWhere(search?: string): Prisma.BatchWhereInput[] | undefined {
  const query = search?.trim();
  if (!query) return undefined;
  return [
    { batchNo: { contains: query, mode: "insensitive" } },
    { product: { name: { contains: query, mode: "insensitive" } } },
    { product: { genericName: { contains: query, mode: "insensitive" } } },
    { product: { barcodes: { some: { barcode: { contains: query } } } } },
  ];
}

function serializeBatch(batch: {
  id: string;
  productId: string;
  batchNo: string | null;
  expiryDate: Date | null;
  mrp: Prisma.Decimal | null;
  costPrice: Prisma.Decimal;
  sellingPrice: Prisma.Decimal;
  qtyOnHandBase: Prisma.Decimal;
  status: BatchStatus;
  product: { name: string; baseUnitName: string; barcodes: { barcode: string }[] };
}): InventoryBatchRecord {
  return {
    id: batch.id,
    productId: batch.productId,
    productName: batch.product.name,
    primaryBarcode: batch.product.barcodes[0]?.barcode ?? null,
    batchNumber: batch.batchNo,
    expiryDate: toDateOnly(batch.expiryDate),
    mrp: batch.mrp?.toFixed(2) ?? null,
    costPrice: batch.costPrice.toFixed(2),
    sellingPrice: batch.sellingPrice.toFixed(2),
    qtyOnHandBase: batch.qtyOnHandBase.toFixed(3),
    baseUnit: batch.product.baseUnitName,
    status: batch.status,
  };
}

const batchInclude = {
  product: {
    select: {
      name: true,
      baseUnitName: true,
      barcodes: { where: { isPrimary: true }, select: { barcode: true }, take: 1 },
    },
  },
} satisfies Prisma.BatchInclude;

export async function getStockSummary(): Promise<StockSummary> {
  const today = startOfToday();
  const nearExpiryDate = addDays(today, DEFAULT_NEAR_EXPIRY_DAYS);

  const [totalActiveProducts, productsWithReorderLevels, nearExpiryCount, expiredOrQuarantinedCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.findMany({
      where: { isActive: true, reorderLevel: { gt: 0 } },
      select: {
        reorderLevel: true,
        batches: {
          where: { status: BatchStatus.ACTIVE, qtyOnHandBase: { gt: 0 } },
          select: { qtyOnHandBase: true },
        },
      },
    }),
    prisma.batch.count({
      where: {
        status: BatchStatus.ACTIVE,
        qtyOnHandBase: { gt: 0 },
        expiryDate: { gte: today, lte: nearExpiryDate },
      },
    }),
    prisma.batch.count({
      where: {
        qtyOnHandBase: { gt: 0 },
        OR: [{ status: BatchStatus.QUARANTINED }, { expiryDate: { lt: today } }],
      },
    }),
  ]);

  const lowStockCount = productsWithReorderLevels.reduce((count, product) => {
    const available = product.batches.reduce(
      (sum, batch) => sum.add(batch.qtyOnHandBase),
      new Prisma.Decimal(0),
    );
    return available.lte(product.reorderLevel) ? count + 1 : count;
  }, 0);

  return { totalActiveProducts, lowStockCount, nearExpiryCount, expiredOrQuarantinedCount };
}

export async function getBatchList(filters: InventoryFilterInput = {}): Promise<InventoryBatchRecord[]> {
  const rows = await prisma.batch.findMany({
    where: {
      status: batchStatus(filters.status),
      OR: batchSearchWhere(filters.search),
    },
    include: batchInclude,
    orderBy: [{ createdAt: "desc" }],
    take: 250,
  });
  return rows.map(serializeBatch);
}

export async function getLatestActiveBatches(limit = 4): Promise<InventoryBatchRecord[]> {
  const rows = await prisma.batch.findMany({
    where: { status: BatchStatus.ACTIVE, qtyOnHandBase: { gt: 0 } },
    include: batchInclude,
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 50),
  });
  return rows.map(serializeBatch);
}

export async function getStockMovementList(filters: InventoryFilterInput = {}): Promise<StockMovementRecord[]> {
  const query = filters.search?.trim();
  const rows = await prisma.stockMovement.findMany({
    where: {
      movementType: movementType(filters.status),
      OR: query
        ? [
            { product: { name: { contains: query, mode: "insensitive" } } },
            { batch: { batchNo: { contains: query, mode: "insensitive" } } },
            { refType: { contains: query, mode: "insensitive" } },
            { refId: { contains: query, mode: "insensitive" } },
          ]
        : undefined,
    },
    include: {
      product: { select: { name: true, baseUnitName: true } },
      batch: { select: { batchNo: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 250,
  });

  const creatorIds = [...new Set(rows.flatMap((row) => row.createdById ? [row.createdById] : []))];
  const creators = creatorIds.length
    ? await prisma.user.findMany({ where: { id: { in: creatorIds } }, select: { id: true, name: true } })
    : [];
  const creatorById = new Map(creators.map((creator) => [creator.id, creator.name]));

  return rows.map((row) => ({
    id: row.id,
    occurredAt: row.createdAt.toISOString(),
    productName: row.product.name,
    batchNumber: row.batch.batchNo,
    movementType: row.movementType,
    qtyBase: row.qtyBase.toFixed(3),
    baseUnit: row.product.baseUnitName,
    reference: `${row.refType} · ${row.refId}`,
    createdBy: row.createdById ? creatorById.get(row.createdById) ?? null : null,
  }));
}

export async function getExpiryAlerts(filters: InventoryFilterInput = {}): Promise<ExpiryAlertRecord[]> {
  const today = startOfToday();
  const threshold = addDays(today, DEFAULT_NEAR_EXPIRY_DAYS);
  const query = filters.search?.trim();
  const rows = await prisma.batch.findMany({
    where: {
      qtyOnHandBase: { gt: 0 },
      status: batchStatus(filters.status),
      AND: [
        {
          OR: [
            { status: BatchStatus.QUARANTINED },
            { expiryDate: { lte: threshold } },
          ],
        },
        ...(query
          ? [{
              OR: [
                { batchNo: { contains: query, mode: "insensitive" as const } },
                { product: { name: { contains: query, mode: "insensitive" as const } } },
              ],
            }]
          : []),
      ],
    },
    include: { product: { select: { name: true, baseUnitName: true } } },
    orderBy: [{ expiryDate: "asc" }, { createdAt: "desc" }],
    take: 250,
  });

  return rows.map((row) => {
    const daysLeft = daysBetween(today, row.expiryDate);
    const alertState = row.status === BatchStatus.QUARANTINED
      ? "QUARANTINED"
      : daysLeft != null && daysLeft < 0
        ? "EXPIRED"
        : "NEAR_EXPIRY";
    return {
      id: row.id,
      productName: row.product.name,
      batchNumber: row.batchNo,
      expiryDate: toDateOnly(row.expiryDate),
      daysLeft,
      qty: row.qtyOnHandBase.toFixed(3),
      baseUnit: row.product.baseUnitName,
      status: row.status,
      alertState,
    };
  });
}
