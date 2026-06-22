import "server-only";

import type {
  CashCardSummaryRow,
  DailySalesSummary,
  ProductSalesRow,
  ReportDateRange,
  ReportResult,
} from "./report.types";

const completedSalesUnavailable = "No completed sales yet. Sale, sale-line, and payment models are not implemented.";

// TODO(sales): Query only COMPLETED sales after Sale/SaleLine/Payment models exist.
export async function getDailySalesReport(range: ReportDateRange): Promise<ReportResult<DailySalesSummary, never>> {
  void range;
  return { availability: "unavailable", summary: null, rows: [], message: completedSalesUnavailable };
}

// TODO(sales): Group completed-sale payments by CASH/CARD after Payment exists.
export async function getCashCardReport(range: ReportDateRange): Promise<ReportResult<CashCardSummaryRow[], CashCardSummaryRow>> {
  void range;
  return { availability: "unavailable", summary: null, rows: [], message: completedSalesUnavailable };
}

// TODO(sales): Use SaleLine quantity/price/discount snapshots after SaleLine exists.
export async function getProductWiseSalesReport(range: ReportDateRange): Promise<ReportResult<null, ProductSalesRow>> {
  void range;
  return { availability: "unavailable", summary: null, rows: [], message: completedSalesUnavailable };
}

// TODO(sales): Use cost_price_at_sale snapshots; never current Batch.costPrice for historical COGS.
export async function getGrossProfitReport(range: ReportDateRange): Promise<ReportResult<null, ProductSalesRow>> {
  void range;
  return {
    availability: "unavailable",
    summary: null,
    rows: [],
    message: "Gross profit is pending until completed sale lines with cost-price snapshots exist.",
    warnings: ["Current batch cost is not used as a substitute for historical COGS."],
  };
}
