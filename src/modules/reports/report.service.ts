import type { ReportDateRange, ReportType } from "./report.types";

const REPORT_TYPES = new Set<ReportType>([
  "daily-sales", "cash-card", "product-sales", "gross-profit", "stock-valuation",
  "low-stock", "near-expiry", "expired-quarantined", "supplier-payables", "supplier-payments", "expenses",
  "controlled-drugs",
]);

function dateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function validDateOnly(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : value;
}

export function normalizeReportType(value?: string): ReportType {
  return REPORT_TYPES.has(value as ReportType) ? value as ReportType : "daily-sales";
}

export function normalizeReportDateRange(from?: string, to?: string): ReportDateRange {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const normalizedFrom = validDateOnly(from) ?? dateOnly(firstDay);
  const normalizedTo = validDateOnly(to) ?? dateOnly(today);
  return normalizedFrom <= normalizedTo
    ? { from: normalizedFrom, to: normalizedTo }
    : { from: normalizedTo, to: normalizedFrom };
}

export function toDateWindow(range: ReportDateRange) {
  const start = new Date(`${range.from}T00:00:00`);
  const endExclusive = new Date(`${range.to}T00:00:00`);
  endExclusive.setDate(endExclusive.getDate() + 1);
  return { start, endExclusive };
}
