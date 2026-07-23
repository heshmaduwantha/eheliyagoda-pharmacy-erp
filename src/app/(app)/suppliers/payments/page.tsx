import { AlertTriangle, Truck } from "lucide-react";
import { SupplierPaymentForm } from "@/components/finance/SupplierPaymentForm";
import { SupplierPaymentTable } from "@/components/finance/SupplierPaymentTable";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/modules/auth/permissions";
import { listSupplierInvoiceBalances } from "@/modules/finance/supplier-payment.service";
import { getSupplierPayablesSummary, getSupplierPaymentsReport } from "@/modules/reports/payables-report.service";
import { Pagination } from "@/components/ui/pagination";

function monthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  return { from, to };
}

export default async function SupplierPaymentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requirePermission("supplier_payment.view");
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);

  const [payables, report, invoiceBalances] = await Promise.all([
    getSupplierPayablesSummary(),
    getSupplierPaymentsReport({ ...monthRange(), page: currentPage }),
    listSupplierInvoiceBalances({ pageSize: 200 }),
  ]);
  const openInvoices = invoiceBalances.data.filter((invoice) => Number(invoice.outstandingAmount) > 0);
  const overdueCount = payables.summary?.overdueCount ?? 0;
  const outstandingTotal = formatMoney(payables.summary?.outstandingTotal ?? "0.00");

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-text sm:text-4xl">
            Pay suppliers
          </h1>
        </div>
      </div>

      {/* Hero — you owe */}
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <span>💸</span> You currently owe
          </p>
          <p className="mt-1 text-sm font-medium text-emerald-600/80">
            Across {payables.summary?.invoiceCount ?? 0} outstanding invoice{(payables.summary?.invoiceCount ?? 0) === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-2xl font-black tracking-tight text-emerald-900">{outstandingTotal}</div>
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          <AlertTriangle className="size-4 shrink-0" />
          {overdueCount} invoice{overdueCount === 1 ? "" : "s"} are overdue — payment due date has passed
        </div>
      )}

      {/* Payment form */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-base font-bold text-slate-800">Make a payment</h2>
        <SupplierPaymentForm invoices={openInvoices} />
      </section>

      {/* Payment history */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5">
          <h2 className="mb-1 text-base font-bold text-slate-800">Payments this month</h2>
          <p className="text-sm text-slate-500">
            {report.summary?.paymentCount ?? 0} payment{(report.summary?.paymentCount ?? 0) === 1 ? "" : "s"} ·{" "}
            {formatMoney(report.summary?.totalAmount ?? "0.00")} total
          </p>
        </div>
        <SupplierPaymentTable payments={report.rows} />
        {report.summary?.totalPages ? (
          <Pagination currentPage={currentPage} totalPages={report.summary.totalPages} baseUrl="/suppliers/payments" queryParams={{}} />
        ) : null}
      </section>
    </div>
  );
}
