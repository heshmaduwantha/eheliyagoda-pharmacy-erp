import { AlertTriangle, Banknote, CircleDollarSign, Truck } from "lucide-react";
import { FinanceSummaryCards } from "@/components/finance/FinanceSummaryCards";
import { SupplierPaymentForm } from "@/components/finance/SupplierPaymentForm";
import { SupplierPaymentTable } from "@/components/finance/SupplierPaymentTable";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/modules/auth/permissions";
import { listSupplierInvoiceBalances } from "@/modules/finance/supplier-payment.service";
import { getSupplierPayablesSummary, getSupplierPaymentsReport } from "@/modules/reports/payables-report.service";

function monthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  return { from, to };
}

export default async function SupplierPaymentsPage() {
  await requirePermission("supplier_payment.view");
  const [payables, report, invoiceBalances] = await Promise.all([
    getSupplierPayablesSummary(),
    getSupplierPaymentsReport(monthRange()),
    listSupplierInvoiceBalances(200),
  ]);
  const openInvoices = invoiceBalances.filter((invoice) => Number(invoice.outstandingAmount) > 0);
  const overdueCount = payables.summary?.overdueCount ?? 0;

  return (
    <div className="grid gap-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-teal-700">Finance</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Supplier payments</h1>
          <p className="mt-2 max-w-3xl text-slate-500">Record payments against supplier invoices. These payments reduce supplier payables and never count as expenses.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm">
          Real invoice balances
        </div>
      </div>

      <FinanceSummaryCards
        cards={[
          {
            label: "Outstanding payables",
            value: formatMoney(payables.summary?.outstandingTotal ?? "0.00"),
            hint: `${payables.summary?.invoiceCount ?? 0} invoice${(payables.summary?.invoiceCount ?? 0) === 1 ? "" : "s"} with balances`,
            icon: Truck,
            tone: "teal",
          },
          {
            label: "Overdue invoices",
            value: String(overdueCount),
            hint: "Due date passed and balance still outstanding",
            icon: AlertTriangle,
            tone: "red",
          },
          {
            label: "Payments this month",
            value: formatMoney(report.summary?.totalAmount ?? "0.00"),
            hint: `${report.summary?.paymentCount ?? 0} recorded payment${(report.summary?.paymentCount ?? 0) === 1 ? "" : "s"}`,
            icon: CircleDollarSign,
            tone: "blue",
          },
          {
            label: "Open invoices",
            value: String(openInvoices.length),
            hint: "Available for payment entry",
            icon: Banknote,
            tone: "violet",
          },
        ]}
      />

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Record supplier payment</h2>
          <p className="mt-1 text-sm text-slate-500">Select an invoice, verify the outstanding balance, and record a payment without affecting expense reports.</p>
        </div>
        <SupplierPaymentForm invoices={openInvoices} />
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Supplier payments</h2>
          <p className="mt-1 text-sm text-slate-500">This table is backed by real SupplierPayment rows and keeps the payable balance in sync.</p>
        </div>
        <SupplierPaymentTable payments={report.rows} />
      </section>
    </div>
  );
}
