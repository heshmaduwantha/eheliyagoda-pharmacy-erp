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
    <section className="overflow-hidden rounded-2xl border border-neutral-border bg-neutral-surface shadow-[0_8px_30px_rgba(15,51,58,.05)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-neutral-bg text-xs uppercase tracking-wider text-neutral-muted">
            <tr>
              <th className="border-b border-neutral-border px-5 py-4 font-bold">Date</th>
              <th className="border-b border-neutral-border px-5 py-4 font-bold">Expense no.</th>
              <th className="border-b border-neutral-border px-5 py-4 font-bold">Category</th>
              <th className="border-b border-neutral-border px-5 py-4 font-bold">Description</th>
              <th className="border-b border-neutral-border px-5 py-4 font-bold">Amount</th>
              <th className="border-b border-neutral-border px-5 py-4 font-bold">Payment method</th>
              <th className="border-b border-neutral-border px-5 py-4 font-bold">Reference</th>
              <th className="border-b border-neutral-border px-5 py-4 font-bold">Created by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.length === 0 ? (
              <tr>
                <td className="px-5 py-16 text-center text-neutral-muted" colSpan={8}>
                  No expenses recorded yet.
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr className={expense.deletedAt ? "bg-neutral-bg/70 text-neutral-muted" : "hover:bg-brand-pale/30"} key={expense.id}>
                  <td className="px-5 py-4 font-semibold text-neutral-text">{expense.date}</td>
                  <td className="px-5 py-4 text-neutral-muted">{expense.expenseNumber}</td>
                  <td className="px-5 py-4 text-neutral-muted">{categoryLabel(expense.category)}</td>
                  <td className="px-5 py-4 text-neutral-muted">{expense.description ?? "—"}</td>
                  <td className="px-5 py-4 font-semibold text-neutral-text">{formatMoney(expense.amount)}</td>
                  <td className="px-5 py-4 text-neutral-muted">{expense.paymentMethod}</td>
                  <td className="px-5 py-4 text-neutral-muted">{expense.reference ?? "—"}</td>
                  <td className="px-5 py-4 text-neutral-muted">{expense.createdBy ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
