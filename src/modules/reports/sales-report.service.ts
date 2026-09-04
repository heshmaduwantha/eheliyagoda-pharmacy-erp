import { PaymentMethod, Prisma, SaleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toDateWindow } from "./report.service";
import type {
  CashCardSummaryRow,
  DailySalesSummary,
  ProductSalesRow,
  ReportDateRange,
  ReportResult,
} from "./report.types";
import { serverOnly } from "@/lib/server-only";

serverOnly();

function emptySalesReport<TSummary, TRow>(message: string): ReportResult<TSummary, TRow> {
  return { availability: "empty", summary: null, rows: [], message };
}

export async function getDailySalesReport(range: ReportDateRange): Promise<ReportResult<DailySalesSummary, never>> {
  const { start, endExclusive } = toDateWindow(range);
  const sales = await prisma.sale.findMany({
    where: {
      status: SaleStatus.COMPLETED,
      completedAt: { gte: start, lt: endExclusive },
    },
    select: {
      subtotal: true,
      discountAmount: true,
      taxAmount: true,
      total: true,
    },
    orderBy: { completedAt: "asc" },
  });

  if (!sales.length) return emptySalesReport("No completed sales yet.");

  const summary = sales.reduce(
    (acc, sale) => ({
      subtotal: acc.subtotal.add(sale.subtotal),
      discount: acc.discount.add(sale.discountAmount),
      tax: acc.tax.add(sale.taxAmount),
      total: acc.total.add(sale.total),
      saleCount: acc.saleCount + 1,
    }),
    {
      subtotal: new Prisma.Decimal(0),
      discount: new Prisma.Decimal(0),
      tax: new Prisma.Decimal(0),
      total: new Prisma.Decimal(0),
      saleCount: 0,
    },
  );

  return {
    availability: "ready",
    summary: {
      subtotal: summary.subtotal.toFixed(2),
      discount: summary.discount.toFixed(2),
      tax: summary.tax.toFixed(2),
      total: summary.total.toFixed(2),
      saleCount: summary.saleCount,
    },
    rows: [],
  };
}

export async function getCashCardReport(range: ReportDateRange): Promise<ReportResult<CashCardSummaryRow[], CashCardSummaryRow>> {
  const { start, endExclusive } = toDateWindow(range);
  const payments = await prisma.salePayment.findMany({
    where: {
      sale: {
        status: SaleStatus.COMPLETED,
        completedAt: { gte: start, lt: endExclusive },
      },
    },
    select: {
      method: true,
      amount: true,
    },
  });

  if (!payments.length) return emptySalesReport("No completed sale payments yet.");

  const grouped = new Map<PaymentMethod, { amount: Prisma.Decimal; paymentCount: number }>();
  for (const payment of payments) {
    const current = grouped.get(payment.method) ?? {
      amount: new Prisma.Decimal(0),
      paymentCount: 0,
    };
    current.amount = current.amount.add(payment.amount);
    current.paymentCount += 1;
    grouped.set(payment.method, current);
  }

  const rows = [...grouped.entries()].map(([method, row]): CashCardSummaryRow => ({
    method: method === PaymentMethod.CASH ? "CASH" : "CARD",
    amount: row.amount.toFixed(2),
    paymentCount: row.paymentCount,
  }));

  return {
    availability: "ready",
    summary: rows,
    rows,
  };
}

function aggregateProductRows(lines: Array<{
  productId: string;
  productNameSnapshot: string;
  qtyBase: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  costPriceAtSale: Prisma.Decimal;
}>): ProductSalesRow[] {
  const grouped = new Map<string, ProductSalesRow>();

  for (const line of lines) {
    const current = grouped.get(line.productId) ?? {
      productId: line.productId,
      productName: line.productNameSnapshot,
      qtyBaseSold: "0.000",
      grossSales: "0.00",
      discount: "0.00",
      netSales: "0.00",
      batchAwareCogs: "0.00",
      grossProfitEstimate: "0.00",
    };

    const grossSales = new Prisma.Decimal(current.grossSales).add(line.lineTotal);
    const discount = new Prisma.Decimal(current.discount).add(line.discountAmount);
    const netSales = grossSales.sub(discount);
    const cogs = new Prisma.Decimal(current.batchAwareCogs).add(line.qtyBase.mul(line.costPriceAtSale));
    const grossProfitEstimate = netSales.sub(cogs);

    current.qtyBaseSold = new Prisma.Decimal(current.qtyBaseSold).add(line.qtyBase).toFixed(3);
    current.grossSales = grossSales.toFixed(2);
    current.discount = discount.toFixed(2);
    current.netSales = netSales.toFixed(2);
    current.batchAwareCogs = cogs.toFixed(2);
    current.grossProfitEstimate = grossProfitEstimate.toFixed(2);
    grouped.set(line.productId, current);
  }

  return [...grouped.values()].sort((left, right) => Number(new Prisma.Decimal(right.netSales).sub(left.netSales)));
}

export async function getProductWiseSalesReport(range: ReportDateRange): Promise<ReportResult<null, ProductSalesRow>> {
  const { start, endExclusive } = toDateWindow(range);
  const lines = await prisma.saleLine.findMany({
    where: {
      sale: {
        status: SaleStatus.COMPLETED,
        completedAt: { gte: start, lt: endExclusive },
      },
    },
    select: {
      productId: true,
      productNameSnapshot: true,
      qtyBase: true,
      lineTotal: true,
      discountAmount: true,
      costPriceAtSale: true,
    },
  });

  if (!lines.length) {
    return {
      availability: "empty",
      summary: null,
      rows: [],
      message: "No completed sales yet.",
    };
  }

  const rows = aggregateProductRows(lines);
  return { availability: "ready", summary: null, rows };
}

export async function getGrossProfitReport(range: ReportDateRange): Promise<ReportResult<null, ProductSalesRow>> {
  const { start, endExclusive } = toDateWindow(range);
  const lines = await prisma.saleLine.findMany({
    where: {
      sale: {
        status: SaleStatus.COMPLETED,
        completedAt: { gte: start, lt: endExclusive },
      },
    },
    select: {
      productId: true,
      productNameSnapshot: true,
      qtyBase: true,
      lineTotal: true,
      discountAmount: true,
      costPriceAtSale: true,
    },
  });

  if (!lines.length) {
    return {
      availability: "empty",
      summary: null,
      rows: [],
      message: "Gross profit is unavailable until completed sales exist.",
      warnings: ["Current batch cost is never substituted for historical sale cost."],
    };
  }

  const rows = aggregateProductRows(lines).sort(
    (left, right) => Number(new Prisma.Decimal(right.grossProfitEstimate).sub(left.grossProfitEstimate)),
  );

  return { availability: "ready", summary: null, rows };
}

export async function getItemVelocityReport(range: ReportDateRange): Promise<ReportResult<null, import("./report.types").ProductVelocityRow>> {
  const { start, endExclusive } = toDateWindow(range);
  const [lines, activeProducts] = await Promise.all([
    prisma.saleLine.findMany({
      where: {
        sale: {
          status: SaleStatus.COMPLETED,
          completedAt: { gte: start, lt: endExclusive },
        },
      },
      select: {
        productId: true,
        productNameSnapshot: true,
        qtyBase: true,
        lineTotal: true,
        product: { select: { baseUnitName: true } },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, baseUnitName: true },
    }),
  ]);

  const salesByProduct = new Map<string, { productName: string; baseUnit: string; qtyBaseSold: Prisma.Decimal; grossSales: Prisma.Decimal }>();

  // Seed with active products so slow/zero moving products are tracked
  for (const product of activeProducts) {
    salesByProduct.set(product.id, {
      productName: product.name,
      baseUnit: product.baseUnitName,
      qtyBaseSold: new Prisma.Decimal(0),
      grossSales: new Prisma.Decimal(0),
    });
  }

  for (const line of lines) {
    const current = salesByProduct.get(line.productId) ?? {
      productName: line.productNameSnapshot,
      baseUnit: line.product?.baseUnitName ?? "unit",
      qtyBaseSold: new Prisma.Decimal(0),
      grossSales: new Prisma.Decimal(0),
    };

    current.qtyBaseSold = current.qtyBaseSold.add(line.qtyBase);
    current.grossSales = current.grossSales.add(line.lineTotal);
    salesByProduct.set(line.productId, current);
  }

  const rows: import("./report.types").ProductVelocityRow[] = [...salesByProduct.entries()].map(([productId, item]) => {
    const qtySoldNum = Number(item.qtyBaseSold);

    let velocityCategory: "FAST_MOVING" | "MEDIUM_MOVING" | "SLOW_MOVING" = "MEDIUM_MOVING";
    let velocityLabel = "Medium Moving";
    let benchmarkBadge = "bg-blue-50 text-blue-700 border-blue-200";

    if (qtySoldNum >= 100) {
      velocityCategory = "FAST_MOVING";
      velocityLabel = "🔥 Fast Moving (≥100 units)";
      benchmarkBadge = "bg-amber-50 text-amber-700 border-amber-300 font-extrabold";
    } else if (qtySoldNum <= 10) {
      velocityCategory = "SLOW_MOVING";
      velocityLabel = "🐢 Slow Moving (≤10 units)";
      benchmarkBadge = "bg-slate-100 text-slate-700 border-slate-300";
    }

    return {
      productId,
      productName: item.productName,
      baseUnit: item.baseUnit,
      qtyBaseSold: item.qtyBaseSold.toFixed(3),
      grossSales: item.grossSales.toFixed(2),
      velocityCategory,
      velocityLabel,
      benchmarkBadge,
    };
  }).sort((a, b) => Number(b.qtyBaseSold) - Number(a.qtyBaseSold));

  return { availability: "ready", summary: null, rows };
}

