import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldAlert, LineChart } from "lucide-react";
import { CashCardSummary } from "@/components/reports/CashCardSummary";
import { ControlledDrugRegisterTable } from "@/components/reports/ControlledDrugRegisterTable";
import { ReportFilter } from "@/components/reports/ReportFilter";
import { ReportTable } from "@/components/reports/ReportTable";
import { SalesSummaryCards } from "@/components/reports/SalesSummaryCards";
import { StockAlertCards } from "@/components/reports/StockAlertCards";
import { FinanceSummaryCards } from "@/components/finance/FinanceSummaryCards";
import { formatMoney, formatQty } from "@/lib/money";
import { requirePermission } from "@/modules/auth/permissions";
import { getControlledDrugRegister } from "@/modules/reports/controlled-drug-report.service";
import { getExpiredQuarantinedReport, getLowStockReport, getNearExpiryReport, getStockValuationReport } from "@/modules/reports/inventory-report.service";
import { getExpensesSummary, getSupplierPayablesSummary, getSupplierPaymentsReport } from "@/modules/reports/payables-report.service";
import { normalizeReportDateRange, normalizeReportType } from "@/modules/reports/report.service";
import { getCashCardReport, getDailySalesReport, getGrossProfitReport, getProductWiseSalesReport } from "@/modules/reports/sales-report.service";

function todayRange() {
  const today = new Date().toISOString().slice(0, 10);
  return { from: today, to: today };
}

function weekRange() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  return { from: start.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
}

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: start.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
}

function ReportMessage({ message, warnings = [] }: { message?: string; warnings?: string[] }) {
  if (!message && warnings.length === 0) return null;
  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
      {message ? <p className="font-bold">{message}</p> : null}
      {warnings.map((warning) => (
        <p className="mt-1 text-amber-800/80" key={warning}>{warning}</p>
      ))}
    </div>
  );
}

function countRangeSummary(rows: Array<{ paymentMethod: string; totalAmount: string }>, paymentMethod: string) {
  return rows.filter((row) => row.paymentMethod === paymentMethod).reduce((sum, row) => sum + Number(row.totalAmount), 0);
}

const rangeTabLabels: { key: string; label: string; getRange: () => { from: string; to: string } }[] = [
  { key: "today", label: "Today", getRange: todayRange },
  { key: "week", label: "This week", getRange: weekRange },
  { key: "month", label: "This month", getRange: monthRange },
];

const reportTypeLabels: Record<string, string> = {
  "daily-sales": "Sales summary",
  "cash-card": "Cash vs card",
  "product-sales": "Sales by product",
  "gross-profit": "Gross profit",
  "stock-valuation": "Stock value",
  "low-stock": "Low stock",
  "near-expiry": "Expiring soon",
  "expired-quarantined": "Expired stock",
  "supplier-payables": "What you owe",
  "supplier-payments": "Payments made",
  "expenses": "Expenses",
  "controlled-drugs": "Controlled drugs register",
};

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ type?: string; from?: string; to?: string; range?: string }> }) {
  const actor = await requirePermission("reports.read");
  const params = await searchParams;

  // Default to daily-sales + today if no type specified
  const type = normalizeReportType(params.type ?? "daily-sales");

  // Quick range tabs
  const activeRangeKey = params.range ?? "today";
  const quickRange = rangeTabLabels.find((r) => r.key === activeRangeKey)?.getRange() ?? todayRange();

  // Allow custom from/to to override quick range
  const hasCustomRange = params.from || params.to;
  const range = hasCustomRange
    ? normalizeReportDateRange(params.from, params.to)
    : normalizeReportDateRange(quickRange.from, quickRange.to);

  let content: ReactNode;
  let heroSentence: string | null = null;

  if (type === "daily-sales") {
    const report = await getDailySalesReport(range);
    const total = report.summary?.total ?? "0.00";
    const count = report.summary?.saleCount ?? 0;

    heroSentence = count > 0
      ? `You made ${formatMoney(total)} from ${count} sale${count === 1 ? "" : "s"}`
      : "No completed sales in this period";
    content = (
      <div className="grid gap-4">
        <SalesSummaryCards message={report.message} summary={report.summary} />
        <ReportMessage warnings={report.warnings} />
      </div>
    );
  } else if (type === "cash-card") {
    const report = await getCashCardReport(range);
    content = (
      <div className="grid gap-4">
        <CashCardSummary message={report.message} rows={report.rows} />
        <ReportMessage warnings={report.warnings} />
      </div>
    );
  } else if (type === "product-sales" || type === "gross-profit") {
    const report = type === "product-sales" ? await getProductWiseSalesReport(range) : await getGrossProfitReport(range);
    content = (
      <div className="grid gap-4">
        <ReportMessage message={report.message} warnings={report.warnings} />
        <ReportTable
          emptyMessage={report.message ?? "No completed product sales found."}
          headers={["Product", "Qty sold", "Gross sales", "Discount", "Net sales", "Cost", "Gross profit"]}
          rows={report.rows.map((row) => [row.productName, formatQty(row.qtyBaseSold), formatMoney(row.grossSales), formatMoney(row.discount), formatMoney(row.netSales), formatMoney(row.batchAwareCogs), formatMoney(row.grossProfitEstimate)])}
        />
      </div>
    );
  } else if (["stock-valuation", "low-stock", "near-expiry", "expired-quarantined"].includes(type)) {
    const [valuation, lowStock, nearExpiry, expired] = await Promise.all([
      getStockValuationReport(),
      getLowStockReport(),
      getNearExpiryReport(),
      getExpiredQuarantinedReport(),
    ]);
    const cards = (
      <StockAlertCards
        expiredQuarantinedCount={expired.summary?.batchCount ?? 0}
        lowStockCount={lowStock.summary?.productCount ?? 0}
        nearExpiryCount={nearExpiry.summary?.batchCount ?? 0}
        stockValuation={valuation.summary?.totalValuation ?? "0.00"}
      />
    );
    if (type === "stock-valuation") {
      content = (
        <div className="grid gap-4">
          {cards}
          <ReportTable
            emptyMessage={valuation.message ?? "No active stock batches found."}
            headers={["Product", "Batch", "Qty on hand", "Cost price", "Value"]}
            rows={valuation.rows.map((row) => [row.productName, row.batchNumber ?? "—", formatQty(row.qtyOnHandBase), formatMoney(row.costPrice), formatMoney(row.valuation)])}
          />
        </div>
      );
    } else if (type === "low-stock") {
      content = (
        <div className="grid gap-4">
          {cards}
          <ReportTable
            emptyMessage={lowStock.message ?? "No low-stock products found."}
            headers={["Product", "Available qty", "Alert level"]}
            rows={lowStock.rows.map((row) => [row.productName, formatQty(row.availableQtyBase), formatQty(row.reorderLevel)])}
          />
        </div>
      );
    } else {
      const selected = type === "near-expiry" ? nearExpiry : expired;
      content = (
        <div className="grid gap-4">
          {cards}
          <ReportTable
            emptyMessage={selected.message ?? "No matching batches found."}
            headers={["Product", "Batch", "Expiry", "Days left", "Qty", "Status", "Value"]}
            rows={selected.rows.map((row) => [row.productName, row.batchNumber ?? "—", row.expiryDate ?? "—", row.daysLeft == null ? "—" : String(row.daysLeft), formatQty(row.qtyOnHandBase), row.status, formatMoney(row.valuation)])}
          />
        </div>
      );
    }
  } else if (type === "supplier-payables") {
    const report = await getSupplierPayablesSummary();
    const overdueCount = report.summary?.overdueCount ?? 0;
    content = (
      <div className="grid gap-4">
        <ReportMessage message={report.message} warnings={report.warnings} />
        <FinanceSummaryCards
          cards={[
            { label: "You owe", value: formatMoney(report.summary?.outstandingTotal ?? "0.00"), hint: "Total outstanding to suppliers", tone: "teal" },
            { label: "Invoices", value: String(report.summary?.invoiceCount ?? 0), hint: "Active supplier invoices", tone: "blue" },
            { label: "Overdue", value: String(overdueCount), hint: "Due date passed, balance remains", tone: "red" },
            { label: "Latest payment", value: report.rows[0]?.latestPaymentAt ? report.rows[0].latestPaymentAt.slice(0, 10) : "—", hint: "Most recent recorded payment", tone: "violet" },
          ]}
        />
        <ReportTable
          emptyMessage={report.message ?? "No supplier payables found."}
          headers={["Supplier", "Invoice", "Total", "Paid", "Still owe", "Status", "Due date", "Latest payment"]}
          rows={report.rows.map((row) => [row.supplierName, row.invoiceNumber ?? "—", formatMoney(row.invoiceTotal), formatMoney(row.paidAmount), formatMoney(row.outstandingAmount), row.status, row.dueDate ?? "—", row.latestPaymentAt ? row.latestPaymentAt.slice(0, 10) : "—"])}
        />
      </div>
    );
  } else if (type === "supplier-payments") {
    const report = await getSupplierPaymentsReport(range);
    content = (
      <div className="grid gap-4">
        <ReportMessage message={report.message} />
        <FinanceSummaryCards
          cards={[
            { label: "Payments made", value: String(report.summary?.paymentCount ?? 0), hint: "Supplier payments in range", tone: "blue" },
            { label: "Total paid", value: formatMoney(report.summary?.totalAmount ?? "0.00"), hint: "Paid to suppliers", tone: "teal" },
            { label: "Date range", value: `${range.from} → ${range.to}`, hint: "Filtered by payment date", tone: "violet" },
            { label: "Records", value: String(report.rows.length), hint: "Payment rows", tone: "amber" },
          ]}
        />
        <ReportTable
          emptyMessage={report.message ?? "No supplier payments found."}
          headers={["Date", "Payment no.", "Supplier", "Invoice", "Amount", "Method", "Reference", "Recorded by", "Balance after"]}
          rows={report.rows.map((row) => [row.paidAt.slice(0, 10), row.paymentNumber, row.supplierName, row.invoiceNumber ?? "—", formatMoney(row.amount), row.paymentMethod, row.reference ?? "—", row.createdBy ?? "—", formatMoney(row.outstandingAfter)])}
        />
      </div>
    );
  } else if (type === "expenses") {
    const report = await getExpensesSummary(range);
    const cashTotal = countRangeSummary(report.rows, "CASH");
    const cardTotal = countRangeSummary(report.rows, "CARD");
    content = (
      <div className="grid gap-4">
        <ReportMessage message={report.message} warnings={report.warnings} />
        <FinanceSummaryCards
          cards={[
            { label: "Total expenses", value: formatMoney(report.summary?.totalAmount ?? "0.00"), hint: `${report.summary?.expenseCount ?? 0} expense${(report.summary?.expenseCount ?? 0) === 1 ? "" : "s"}`, tone: "teal" },
            { label: "Paid in cash", value: formatMoney(cashTotal.toFixed(2)), hint: "Cash expenses", tone: "blue" },
            { label: "Paid by card", value: formatMoney(cardTotal.toFixed(2)), hint: "Card expenses", tone: "violet" },
            { label: "Categories", value: String(report.rows.length), hint: "Grouped by category", tone: "amber" },
          ]}
        />
        <ReportTable
          emptyMessage={report.message ?? "No expenses found."}
          headers={["Category", "Payment method", "Count", "Total"]}
          rows={report.rows.map((row) => [row.category, row.paymentMethod, String(row.expenseCount), formatMoney(row.totalAmount)])}
        />
      </div>
    );
  } else {
    await requirePermission("reports.controlled_drugs.read");
    const report = await getControlledDrugRegister(actor.id);
    content = (
      <div className="grid gap-4">
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" />
          <p>
            <strong>Sensitive register.</strong> Viewing this report is permission-gated and audit-logged.
          </p>
        </div>
        <ReportMessage message={report.message} warnings={report.warnings} />
        <ControlledDrugRegisterTable emptyMessage={report.message ?? "No completed controlled-drug sales yet"} rows={report.rows} />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-teal-700">
            <LineChart className="size-4" />
            Analytics workspace
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Reports
          </h1>
          {heroSentence ? (
            <p className="mt-2 font-semibold text-teal-700">{heroSentence}</p>
          ) : (
            <p className="mt-2 text-slate-500">View and generate analytics reports</p>
          )}
        </div>
      </div>

      {/* Quick range tabs */}
      <div className="flex flex-wrap gap-2">
        {rangeTabLabels.map((tab) => (
          <Link
            key={tab.key}
            href={`/reports?type=${type}&range=${tab.key}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeRangeKey === tab.key && !hasCustomRange
                ? "bg-teal-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:text-teal-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Report type tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(reportTypeLabels).map(([key, label]) => (
          <Link
            key={key}
            href={`/reports?type=${key}&range=${activeRangeKey}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              type === key
                ? "border-teal-200 bg-teal-50 text-teal-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Advanced filters (always expanded now) */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="px-4 pb-4 pt-4">
          <p className="mb-4 text-sm font-bold text-slate-700">Advanced filters (custom date range)</p>
          <ReportFilter range={range} type={type} />
        </div>
      </div>

      {/* Content */}
      <div>{content}</div>
    </div>
  );
}
