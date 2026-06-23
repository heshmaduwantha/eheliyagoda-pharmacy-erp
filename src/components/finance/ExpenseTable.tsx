import { formatMoney } from "@/lib/money";
import type { ExpenseListRow } from "@/modules/finance/expense.types";

function categoryLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ExpenseTable({ expenses }: { expenses: ExpenseListRow[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,51,58,.05)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="border-b border-slate-200 px-5 py-4 font-bold">Date</th>
              <th className="border-b border-slate-200 px-5 py-4 font-bold">Expense no.</th>
              <th className="border-b border-slate-200 px-5 py-4 font-bold">Category</th>
              <th className="border-b border-slate-200 px-5 py-4 font-bold">Description</th>
              <th className="border-b border-slate-200 px-5 py-4 font-bold">Amount</th>
              <th className="border-b border-slate-200 px-5 py-4 font-bold">Payment method</th>
              <th className="border-b border-slate-200 px-5 py-4 font-bold">Reference</th>
              <th className="border-b border-slate-200 px-5 py-4 font-bold">Created by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.length === 0 ? (
              <tr>
                <td className="px-5 py-16 text-center text-slate-400" colSpan={8}>
                  No expenses recorded yet.
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr className={expense.deletedAt ? "bg-slate-50/70 text-slate-400" : "hover:bg-teal-50/30"} key={expense.id}>
                  <td className="px-5 py-4 font-semibold text-slate-700">{expense.date}</td>
                  <td className="px-5 py-4 text-slate-600">{expense.expenseNumber}</td>
                  <td className="px-5 py-4 text-slate-600">{categoryLabel(expense.category)}</td>
                  <td className="px-5 py-4 text-slate-600">{expense.description ?? "—"}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{formatMoney(expense.amount)}</td>
                  <td className="px-5 py-4 text-slate-600">{expense.paymentMethod}</td>
                  <td className="px-5 py-4 text-slate-600">{expense.reference ?? "—"}</td>
                  <td className="px-5 py-4 text-slate-600">{expense.createdBy ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
