import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { serverOnly } from "@/lib/server-only";

serverOnly();

type DashboardMetricsRow = {
  totalActiveProducts: number;
  lowStockCount: number;
  nearExpiryCount: number;
  expiredOrQuarantinedCount: number;
  salesTotal: string;
  saleCount: number;
  cashTotal: string;
  cardTotal: string;
  paymentCount: number;
  grossProfitTotal: string;
  profitLineCount: number;
  outstandingTotal: string;
  invoiceCount: number;
  overdueCount: number;
  expenseTotal: string;
  expenseCount: number;
};

function startOfDay(value = new Date()) {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(value: Date, days: number) {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

let alertCountsCache: { data: AlertCounts; expiresAt: number } | null = null;
let dashboardMetricsCache: { data: DashboardMetricsRow; expiresAt: number } | null = null;

export function invalidateAlertCountsCache() {
  alertCountsCache = null;
  dashboardMetricsCache = null;
}

/** One read-only aggregate round trip for the dashboard's operational cards. */
const fetchMetricsFromDb = unstable_cache(
  async () => {
    const today = startOfDay();
    const tomorrow = addDays(today, 1);
    const nearExpiryDate = addDays(today, 180);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const rows = await prisma.$queryRaw<DashboardMetricsRow[]>(Prisma.sql`
      WITH stock_by_product AS (
        SELECT
          product.id,
          product."reorderLevel",
          COALESCE(SUM(batch."qtyOnHandBase") FILTER (
            WHERE batch.status = 'ACTIVE' AND batch."qtyOnHandBase" > 0
          ), 0) AS available_qty
        FROM "Product" product
        LEFT JOIN "Batch" batch ON batch."productId" = product.id
        WHERE product."isActive" = TRUE AND product."reorderLevel" > 0
        GROUP BY product.id, product."reorderLevel"
      ),
      sales AS (
        SELECT
          COUNT(*)::int AS sale_count,
          COALESCE(SUM(sale.total), 0)::text AS sales_total
        FROM "Sale" sale
        WHERE sale.status = 'COMPLETED'
          AND sale."completedAt" >= ${today}
          AND sale."completedAt" < ${tomorrow}
      ),
      payments AS (
        SELECT
          COUNT(*)::int AS payment_count,
          COALESCE(SUM(payment.amount) FILTER (WHERE payment.method = 'CASH'), 0)::text AS cash_total,
          COALESCE(SUM(payment.amount) FILTER (WHERE payment.method = 'CARD'), 0)::text AS card_total
        FROM "SalePayment" payment
        INNER JOIN "Sale" sale ON sale.id = payment."saleId"
        WHERE sale.status = 'COMPLETED'
          AND sale."completedAt" >= ${today}
          AND sale."completedAt" < ${tomorrow}
      ),
      profit AS (
        SELECT
          COUNT(line.id)::int AS line_count,
          COALESCE(SUM(
            line."lineTotal" - line."discountAmount" - (line."qtyBase" * line."costPriceAtSale")
          ), 0)::text AS gross_profit_total
        FROM "SaleLine" line
        INNER JOIN "Sale" sale ON sale.id = line."saleId"
        WHERE sale.status = 'COMPLETED'
          AND sale."completedAt" >= ${today}
          AND sale."completedAt" < ${tomorrow}
      ),
      payables AS (
        SELECT
          COUNT(*)::int AS invoice_count,
          COALESCE(SUM(GREATEST(invoice."totalAmount" - invoice."paidAmount", 0)), 0)::text AS outstanding_total,
          COUNT(*) FILTER (
            WHERE invoice.status NOT IN ('PAID', 'CANCELLED')
              AND invoice."dueDate" < ${today}
              AND invoice."totalAmount" - invoice."paidAmount" > 0
          )::int AS overdue_count
        FROM "SupplierInvoice" invoice
        WHERE invoice.status <> 'CANCELLED'
      ),
      expenses AS (
        SELECT
          COUNT(*)::int AS expense_count,
          COALESCE(SUM(expense.amount), 0)::text AS expense_total
        FROM "Expense" expense
        WHERE expense."deletedAt" IS NULL
          AND expense.date >= ${monthStart}
          AND expense.date < ${tomorrow}
      )
      SELECT
        (SELECT COUNT(*)::int FROM stock_by_product) AS "totalActiveProducts",
        (SELECT COUNT(*)::int FROM stock_by_product
          WHERE available_qty <= "reorderLevel") AS "lowStockCount",
        (SELECT COUNT(*)::int FROM "Batch"
          WHERE status = 'ACTIVE' AND "qtyOnHandBase" > 0
            AND "expiryDate" >= ${today} AND "expiryDate" <= ${nearExpiryDate}) AS "nearExpiryCount",
        (SELECT COUNT(*)::int FROM "Batch"
          WHERE "qtyOnHandBase" > 0
            AND (status = 'QUARANTINED' OR "expiryDate" < ${today})) AS "expiredOrQuarantinedCount",
        sales.sales_total AS "salesTotal",
        sales.sale_count AS "saleCount",
        payments.cash_total AS "cashTotal",
        payments.card_total AS "cardTotal",
        payments.payment_count AS "paymentCount",
        profit.gross_profit_total AS "grossProfitTotal",
        profit.line_count AS "profitLineCount",
        payables.outstanding_total AS "outstandingTotal",
        payables.invoice_count AS "invoiceCount",
        payables.overdue_count AS "overdueCount",
        expenses.expense_total AS "expenseTotal",
        expenses.expense_count AS "expenseCount"
      FROM sales, payments, profit, payables, expenses
    `);

    const metrics = rows[0];
    if (!metrics) throw new Error("Dashboard metrics are unavailable.");
    return metrics;
  },
  ["dashboard-metrics"],
  { revalidate: 30, tags: ["dashboard"] },
);

export async function getDashboardMetrics(): Promise<DashboardMetricsRow> {
  const now = Date.now();
  if (dashboardMetricsCache && dashboardMetricsCache.expiresAt > now) {
    return dashboardMetricsCache.data;
  }
  const metrics = await fetchMetricsFromDb();
  dashboardMetricsCache = { data: metrics, expiresAt: now + 30000 };
  return metrics;
}

export type AlertCounts = {
  lowStockCount: number;
  nearExpiryCount: number;
  expiredCount: number;
  overdueCount: number;
};

const fetchAlertCountsFromDb = unstable_cache(
  async () => {
    const today = startOfDay();
    const nearExpiryDate = addDays(today, 180);

    const rows = await prisma.$queryRaw<AlertCounts[]>(Prisma.sql`
      WITH stock_by_product AS (
        SELECT
          product.id,
          product."reorderLevel",
          COALESCE(SUM(batch."qtyOnHandBase") FILTER (
            WHERE batch.status = 'ACTIVE' AND batch."qtyOnHandBase" > 0
          ), 0) AS available_qty
        FROM "Product" product
        LEFT JOIN "Batch" batch ON batch."productId" = product.id
        WHERE product."isActive" = TRUE AND product."reorderLevel" > 0
        GROUP BY product.id, product."reorderLevel"
      ),
      payables AS (
        SELECT
          COUNT(*) FILTER (
            WHERE invoice.status NOT IN ('PAID', 'CANCELLED')
              AND invoice."dueDate" < ${today}
              AND invoice."totalAmount" - invoice."paidAmount" > 0
          )::int AS overdue_count
        FROM "SupplierInvoice" invoice
        WHERE invoice.status <> 'CANCELLED'
      )
      SELECT
        (SELECT COUNT(*)::int FROM stock_by_product
          WHERE available_qty <= "reorderLevel") AS "lowStockCount",
        (SELECT COUNT(*)::int FROM "Batch"
          WHERE status = 'ACTIVE' AND "qtyOnHandBase" > 0
            AND "expiryDate" >= ${today} AND "expiryDate" <= ${nearExpiryDate}) AS "nearExpiryCount",
        (SELECT COUNT(*)::int FROM "Batch"
          WHERE "qtyOnHandBase" > 0
            AND "expiryDate" < ${today}) AS "expiredCount",
        (SELECT overdue_count FROM payables) AS "overdueCount"
    `);

    return rows[0] ?? { lowStockCount: 0, nearExpiryCount: 0, expiredCount: 0, overdueCount: 0 };
  },
  ["alert-counts"],
  { revalidate: 30, tags: ["alerts"] },
);

/** A very lightweight query specifically for the notification bell in the app shell. */
export async function getAlertCounts(): Promise<AlertCounts> {
  const now = Date.now();
  if (alertCountsCache && alertCountsCache.expiresAt > now) {
    return alertCountsCache.data;
  }
  const result = await fetchAlertCountsFromDb();
  alertCountsCache = { data: result, expiresAt: now + 30000 };
  return result;
}

let weeklySalesCache: { data: { date: Date; total: string }[]; expiresAt: number } | null = null;
let topProductsCache: { data: { productName: string; unitsSold: number; revenue: string }[]; expiresAt: number } | null = null;

const fetchWeeklySalesFromDb = unstable_cache(
  async () => {
    const sevenDaysAgo = addDays(startOfDay(), -6);
    return await prisma.$queryRaw<{ date: Date; total: string }[]>(Prisma.sql`
      SELECT DATE_TRUNC('day', "completedAt") as date, COALESCE(SUM(total), 0)::text as total
      FROM "Sale"
      WHERE status = 'COMPLETED' AND "completedAt" >= ${sevenDaysAgo}
      GROUP BY 1 ORDER BY 1 ASC
    `);
  },
  ["dashboard-weekly-sales"],
  { revalidate: 30, tags: ["dashboard"] },
);

export async function getDashboardWeeklySales() {
  const now = Date.now();
  if (weeklySalesCache && weeklySalesCache.expiresAt > now) {
    return weeklySalesCache.data;
  }
  const rows = await fetchWeeklySalesFromDb();
  weeklySalesCache = { data: rows, expiresAt: now + 30000 };
  return rows;
}

const fetchTopProductsFromDb = unstable_cache(
  async () => {
    const thirtyDaysAgo = addDays(startOfDay(), -30);
    return await prisma.$queryRaw<{ productName: string; unitsSold: number; revenue: string }[]>(Prisma.sql`
      SELECT p.name as "productName", SUM(sl."qtyBase")::int as "unitsSold", SUM(sl."lineTotal")::text as "revenue"
      FROM "SaleLine" sl
      INNER JOIN "Sale" s ON s.id = sl."saleId"
      INNER JOIN "Product" p ON p.id = sl."productId"
      WHERE s.status = 'COMPLETED' AND s."completedAt" >= ${thirtyDaysAgo}
      GROUP BY p.id, p.name
      ORDER BY "unitsSold" DESC
      LIMIT 4
    `);
  },
  ["dashboard-top-products"],
  { revalidate: 30, tags: ["dashboard"] },
);

export async function getDashboardTopProducts() {
  const now = Date.now();
  if (topProductsCache && topProductsCache.expiresAt > now) {
    return topProductsCache.data;
  }
  const rows = await fetchTopProductsFromDb();
  topProductsCache = { data: rows, expiresAt: now + 30000 };
  return rows;
}

const fetchWatchlistFromDb = unstable_cache(
  async () => {
    const today = startOfDay();
    const nearExpiryDate = addDays(today, 180);
    return await prisma.$queryRaw<{ name: string; status: string }[]>(Prisma.sql`
      SELECT p.name,
        CASE 
          WHEN SUM(b."qtyOnHandBase") = 0 OR SUM(b."qtyOnHandBase") IS NULL THEN 'Out of stock'
          WHEN MIN(b."expiryDate") < ${today} THEN 'Expired'
          WHEN MIN(b."expiryDate") <= ${nearExpiryDate} THEN 'Expiring soon'
          WHEN SUM(b."qtyOnHandBase") <= p."reorderLevel" THEN 'Low stock'
          ELSE 'In stock'
        END as status
      FROM "Product" p
      LEFT JOIN "Batch" b ON b."productId" = p.id AND b.status = 'ACTIVE'
      WHERE p."isActive" = TRUE
      GROUP BY p.id, p.name, p."reorderLevel"
      HAVING (SUM(b."qtyOnHandBase") = 0 OR SUM(b."qtyOnHandBase") IS NULL OR SUM(b."qtyOnHandBase") <= p."reorderLevel" OR MIN(b."expiryDate") <= ${nearExpiryDate})
      ORDER BY status ASC
      LIMIT 4
    `);
  },
  ["dashboard-watchlist"],
  { revalidate: 30, tags: ["dashboard"] },
);

export async function getDashboardWatchlist() {
  return await fetchWatchlistFromDb();
}
