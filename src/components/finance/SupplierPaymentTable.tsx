import { formatMoney } from "@/lib/money";
import type { SupplierPaymentRow } from "@/modules/reports/report.types";

export function SupplierPaymentTable({ payments }: { payments: SupplierPaymentRow[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,51,58,.05)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="border-b border-slate-200 px-5 py-4 font-bold">Paid at</th>
              <th className="border-b border-slate-200 px-5 py-4 font-bold">Payment no.</th>
              <th className="border-b border-slate-200 px-5 py-4 font-bold">Supplier</th>
              <th className="border-b border-slate-200 px-5 py-4 font-bold">Invoice</th>
              <th className="border-b border-slate-200 px-5 py-4 font-bold">Amount</th>
              <th className="border-b border-slate-200 px-5 py-4 font-bold">Method</th>
              <th className="border-b border-slate-200 px-5 py-4 font-bold">Reference</th>
              <th className="border-b border-slate-200 px-5 py-4 font-bold">Created by</th>
              <th className="border-b border-slate-200 px-5 py-4 font-bold">Current outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.length === 0 ? (
              <tr>
                <td className="px-5 py-16 text-center text-slate-400" colSpan={9}>
                  No supplier payments recorded yet.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr className="hover:bg-teal-50/30" key={payment.paymentId}>
                  <td className="px-5 py-4 font-semibold text-slate-700">{payment.paidAt.slice(0, 10)}</td>
                  <td className="px-5 py-4 text-slate-600">{payment.paymentNumber}</td>
                  <td className="px-5 py-4 text-slate-600">{payment.supplierName}</td>
                  <td className="px-5 py-4 text-slate-600">{payment.invoiceNumber ?? "—"}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{formatMoney(payment.amount)}</td>
                  <td className="px-5 py-4 text-slate-600">{payment.paymentMethod}</td>
                  <td className="px-5 py-4 text-slate-600">{payment.reference ?? "—"}</td>
                  <td className="px-5 py-4 text-slate-600">{payment.createdBy ?? "—"}</td>
                  <td className="px-5 py-4 text-slate-600">{formatMoney(payment.outstandingAfter)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
