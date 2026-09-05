import { BatchStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ExpiryReportRow, LowStockRow, ReportResult, StockValuationRow } from "./report.types";
import { serverOnly } from "@/lib/server-only";

serverOnly();

// TODO(settings): Read system_settings.near_expiry_days when the settings model exists.
export const DEFAULT_NEAR_EXPIRY_DAYS = 180;

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

function daysLeft(today: Date, expiryDate: Date | null) {
  if (!expiryDate) return null;
  const normalized = new Date(expiryDate);
  normalized.setHours(0, 0, 0, 0);
  return Math.round((normalized.getTime() - today.getTime()) / 86_400_000);
}

export async function getStockValuationReport(): Promise<ReportResult<{ totalValuation: string }, StockValuationRow>> {
  const batches = await prisma.batch.findMany({
    where: { status: BatchStatus.ACTIVE, qtyOnHandBase: { gt: 0 } },
    select: {
      id: true, batchNo: true, qtyOnHandBase: true, costPrice: true,
      product: { select: { name: true } },
    },
    orderBy: [{ product: { name: "asc" } }, { expiryDate: "asc" }],
    take: 1000,
  });

  const totalValuation = batches.reduce(
    (sum, batch) => sum.add(batch.qtyOnHandBase.mul(batch.costPrice)),
    new Prisma.Decimal(0),
  );
  const rows = batches.map((batch) => {
    const baseCost = batch.costPrice;
    return {
      batchId: batch.id,
      productName: batch.product.name,
      batchNumber: batch.batchNo,
      qtyOnHandBase: batch.qtyOnHandBase.toFixed(3),
      costPrice: baseCost.toFixed(2),
      valuation: batch.qtyOnHandBase.mul(baseCost).toFixed(2),
    };
  });
  return {
    availability: rows.length ? "ready" : "empty",
    summary: { totalValuation: totalValuation.toFixed(2) },
    rows,
    message: rows.length ? undefined : "No active stock batches found.",
  };
}

export async function getLowStockReport(): Promise<ReportResult<{ productCount: number }, LowStockRow>> {
  const products = await prisma.product.findMany({
    where: { isActive: true, reorderLevel: { gt: 0 } },
    select: {
      id: true, name: true, reorderLevel: true,
      batches: {
        where: { status: BatchStatus.ACTIVE, qtyOnHandBase: { gt: 0 } },
        select: { qtyOnHandBase: true },
      },
    },
    orderBy: { name: "asc" },
    take: 1000,
  });
  const rows = products.flatMap((product) => {
    const available = product.batches.reduce((sum, batch) => sum.add(batch.qtyOnHandBase), new Prisma.Decimal(0));
    return available.lte(product.reorderLevel)
      ? [{ productId: product.id, productName: product.name, availableQtyBase: available.toFixed(3), reorderLevel: product.reorderLevel.toFixed(3) }]
      : [];
  });
  return {
    availability: rows.length ? "ready" : "empty",
    summary: { productCount: rows.length },
    rows,
    message: rows.length ? undefined : "No low-stock products found.",
  };
}

export async function getNearExpiryReport(nearExpiryDays = DEFAULT_NEAR_EXPIRY_DAYS): Promise<ReportResult<{ batchCount: number }, ExpiryReportRow>> {
  const today = startOfToday();
  const threshold = addDays(today, nearExpiryDays);
  const batches = await prisma.batch.findMany({
    where: {
      status: { in: [BatchStatus.ACTIVE, BatchStatus.QUARANTINED] },
      qtyOnHandBase: { gt: 0 },
      expiryDate: { gte: today, lte: threshold },
    },
    select: {
      id: true, batchNo: true, expiryDate: true, qtyOnHandBase: true, status: true, costPrice: true,
      product: { select: { name: true } },
    },
    orderBy: { expiryDate: "asc" },
    take: 1000,
  });

  const rows = batches.map((batch) => {
    const baseCost = batch.costPrice;
    return {
      batchId: batch.id,
      productName: batch.product.name,
      batchNumber: batch.batchNo,
      expiryDate: toDateOnly(batch.expiryDate),
      daysLeft: daysLeft(today, batch.expiryDate),
      qtyOnHandBase: batch.qtyOnHandBase.toFixed(3),
      status: batch.status,
      valuation: batch.qtyOnHandBase.mul(baseCost).toFixed(2),
    };
  });
  return {
    availability: rows.length ? "ready" : "empty",
    summary: { batchCount: rows.length },
    rows,
    message: rows.length ? undefined : `No batches expire within ${nearExpiryDays} days.`,
  };
}

export async function getExpiredQuarantinedReport(): Promise<ReportResult<{ batchCount: number; totalValuation: string }, ExpiryReportRow>> {
  const today = startOfToday();
  const batches = await prisma.batch.findMany({
    where: {
      qtyOnHandBase: { gt: 0 },
      OR: [{ status: BatchStatus.QUARANTINED }, { expiryDate: { lt: today } }],
    },
    select: {
      id: true, batchNo: true, expiryDate: true, qtyOnHandBase: true, status: true, costPrice: true,
      product: { select: { name: true } },
    },
    orderBy: [{ expiryDate: "asc" }, { product: { name: "asc" } }],
    take: 1000,
  });

  const totalValuation = batches.reduce(
    (sum, batch) => sum.add(batch.qtyOnHandBase.mul(batch.costPrice)),
    new Prisma.Decimal(0),
  );
  const rows = batches.map((batch) => {
    const baseCost = batch.costPrice;
    return {
      batchId: batch.id,
      productName: batch.product.name,
      batchNumber: batch.batchNo,
      expiryDate: toDateOnly(batch.expiryDate),
      daysLeft: daysLeft(today, batch.expiryDate),
      qtyOnHandBase: batch.qtyOnHandBase.toFixed(3),
      status: batch.status,
      valuation: batch.qtyOnHandBase.mul(baseCost).toFixed(2),
    };
  });
  return {
    availability: rows.length ? "ready" : "empty",
    summary: { batchCount: rows.length, totalValuation: totalValuation.toFixed(2) },
    rows,
    message: rows.length ? undefined : "No expired or quarantined stock found.",
  };
}
