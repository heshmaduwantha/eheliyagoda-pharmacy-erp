import type { ReactNode } from "react";
import { BarChart3, Info, ShieldAlert } from "lucide-react";
import { CashCardSummary } from "@/components/reports/CashCardSummary";
import { ControlledDrugRegisterTable } from "@/components/reports/ControlledDrugRegisterTable";
import { ReportFilter } from "@/components/reports/ReportFilter";
import { ReportTable } from "@/components/reports/ReportTable";
import { SalesSummaryCards } from "@/components/reports/SalesSummaryCards";
import { StockAlertCards } from "@/components/reports/StockAlertCards";
import { formatMoney, formatQty } from "@/lib/money";
import { requirePermission } from "@/modules/auth/permissions";
import { getControlledDrugRegister } from "@/modules/reports/controlled-drug-report.service";
import { getExpiredQuarantinedReport, getLowStockReport, getNearExpiryReport, getStockValuationReport } from "@/modules/reports/inventory-report.service";
import { getExpensesSummary, getSupplierPayablesSummary } from "@/modules/reports/payables-report.service";
import { normalizeReportDateRange, normalizeReportType } from "@/modules/reports/report.service";
import { getCashCardReport, getDailySalesReport, getGrossProfitReport, getProductWiseSalesReport } from "@/modules/reports/sales-report.service";

function ReportMessage({ message, warnings = [] }: { message?: string; warnings?: string[] }) {
  if (!message && warnings.length === 0) return null;
  return <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">{message ? <p className="font-bold">{message}</p> : null}{warnings.map((warning) => <p className="mt-1 text-amber-800/80" key={warning}>{warning}</p>)}</div>;
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ type?: string; from?: string; to?: string }> }) {
  const user = await requirePermission("report.view");
  const params = await searchParams;
  const type = normalizeReportType(params.type);
  const range = normalizeReportDateRange(params.from, params.to);
  let content: ReactNode;

  if (type === "daily-sales") {
    const report = await getDailySalesReport(range);
    content = <div className="grid gap-4"><SalesSummaryCards message={report.message} summary={report.summary} /><ReportMessage warnings={report.warnings} /></div>;
  } else if (type === "cash-card") {
    const report = await getCashCardReport(range);
    content = <div className="grid gap-4"><CashCardSummary message={report.message} rows={report.rows} /><ReportMessage warnings={report.warnings} /></div>;
  } else if (type === "product-sales" || type === "gross-profit") {
    const report = type === "product-sales" ? await getProductWiseSalesReport(range) : await getGrossProfitReport(range);
    content = <div className="grid gap-4"><ReportMessage message={report.message} warnings={report.warnings} /><ReportTable emptyMessage={report.message ?? "No completed product sales found."} headers={["Product", "Qty sold", "Gross sales", "Discount", "Net sales", "COGS", "Gross profit"]} rows={report.rows.map((row) => [row.productName, formatQty(row.qtyBaseSold), formatMoney(row.grossSales), formatMoney(row.discount), formatMoney(row.netSales), formatMoney(row.batchAwareCogs), formatMoney(row.grossProfitEstimate)])} /></div>;
  } else if (["stock-valuation", "low-stock", "near-expiry", "expired-quarantined"].includes(type)) {
    const [valuation, lowStock, nearExpiry, expired] = await Promise.all([
      getStockValuationReport(), getLowStockReport(), getNearExpiryReport(), getExpiredQuarantinedReport(),
    ]);
    const cards = <StockAlertCards expiredQuarantinedCount={expired.summary?.batchCount ?? 0} lowStockCount={lowStock.summary?.productCount ?? 0} nearExpiryCount={nearExpiry.summary?.batchCount ?? 0} stockValuation={valuation.summary?.totalValuation ?? "0.00"} />;
    if (type === "stock-valuation") {
      content = <div className="grid gap-4">{cards}<ReportTable emptyMessage={valuation.message ?? "No active stock batches found."} headers={["Product", "Batch", "Qty on hand", "Cost price", "Valuation"]} rows={valuation.rows.map((row) => [row.productName, row.batchNumber ?? "—", formatQty(row.qtyOnHandBase), formatMoney(row.costPrice), formatMoney(row.valuation)])} /></div>;
    } else if (type === "low-stock") {
      content = <div className="grid gap-4">{cards}<ReportTable emptyMessage={lowStock.message ?? "No low-stock products found."} headers={["Product", "Available qty", "Reorder level"]} rows={lowStock.rows.map((row) => [row.productName, formatQty(row.availableQtyBase), formatQty(row.reorderLevel)])} /></div>;
    } else {
      const selected = type === "near-expiry" ? nearExpiry : expired;
      content = <div className="grid gap-4">{cards}<ReportTable emptyMessage={selected.message ?? "No matching batches found."} headers={["Product", "Batch", "Expiry", "Days left", "Qty", "Status", "Valuation"]} rows={selected.rows.map((row) => [row.productName, row.batchNumber ?? "—", row.expiryDate ?? "—", row.daysLeft == null ? "—" : String(row.daysLeft), formatQty(row.qtyOnHandBase), row.status, formatMoney(row.valuation)])} /></div>;
    }
  } else if (type === "supplier-payables") {
    const report = await getSupplierPayablesSummary();
    content = <div className="grid gap-4"><ReportMessage message={report.message} warnings={report.warnings} />{report.summary ? <div className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm text-slate-500">Outstanding supplier payables</p><p className="mt-1 text-3xl font-black text-slate-900">{formatMoney(report.summary.outstandingTotal)}</p><p className="mt-2 text-xs text-slate-400">{report.summary.invoiceCount} invoices · not included in expenses</p></div> : null}<ReportTable emptyMessage={report.message ?? "No supplier payables found."} headers={["Supplier", "Invoice", "Total", "Paid", "Outstanding", "Status", "Due date"]} rows={report.rows.map((row) => [row.supplierName, row.invoiceNumber ?? "—", formatMoney(row.invoiceTotal), formatMoney(row.paidAmount), formatMoney(row.outstandingAmount), row.status, row.dueDate ?? "Unavailable"])} /></div>;
  } else if (type === "expenses") {
    const report = await getExpensesSummary();
    content = <div className="grid gap-4"><ReportMessage message={report.message} warnings={report.warnings} /><ReportTable emptyMessage={report.message ?? "No expenses found."} headers={["Category", "Payment method", "Total"]} rows={[]} /></div>;
  } else {
    await requirePermission("controlled_drug.sell");
    const report = await getControlledDrugRegister(user.id);
    content = <div className="grid gap-4"><div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800"><ShieldAlert className="mt-0.5 size-5 shrink-0" /><p><strong>Sensitive register.</strong> Viewing this report is permission-gated and audit logged. CSV export remains disabled.</p></div><ReportMessage message={report.message} warnings={report.warnings} /><ControlledDrugRegisterTable emptyMessage={report.message ?? "No completed controlled-drug sales yet"} rows={report.rows} /></div>;
  }

  return <div><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="flex items-center gap-2 text-sm font-bold text-teal-700"><BarChart3 className="size-4" />Read-only reporting</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Reports</h1><p className="mt-2 text-slate-500">Authoritative PostgreSQL read models and honest availability states.</p></div><div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700"><Info className="size-4" />Frontend totals are never authoritative</div></div><div className="mt-6"><ReportFilter range={range} type={type} /></div><div className="mt-6">{content}</div></div>;
}
