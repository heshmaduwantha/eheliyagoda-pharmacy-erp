import { Banknote, CircleDollarSign, ReceiptText, Wallet } from "lucide-react";
import { FinanceSummaryCards } from "@/components/finance/FinanceSummaryCards";
import { ExpenseForm } from "@/components/finance/ExpenseForm";
import { ExpenseTable } from "@/components/finance/ExpenseTable";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/modules/auth/permissions";
import { getExpenseSummary, listExpenses } from "@/modules/finance/expense.service";

function monthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  return { from, to };
}

export default async function ExpensesPage() {
  const user = await requirePermission("expense.view");
  const [summary, expenses] = await Promise.all([getExpenseSummary(monthRange()), listExpenses({ limit: 100 })]);
  const cashTotal = summary.rows.filter((row) => row.paymentMethod === "CASH").reduce((sum, row) => sum + Number(row.totalAmount), 0);
  const cardTotal = summary.rows.filter((row) => row.paymentMethod === "CARD").reduce((sum, row) => sum + Number(row.totalAmount), 0);

  return (
    <div className="grid gap-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-teal-700">Operational finance</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Expenses</h1>
          <p className="mt-2 max-w-3xl text-slate-500">Record non-supplier operating costs. Supplier payments are tracked separately and never mixed into expenses.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm">
          Month to date
        </div>
      </div>

      <FinanceSummaryCards
        cards={[
          {
            label: "Expense total",
            value: summary.summary ? formatMoney(summary.summary.totalAmount) : "LKR 0.00",
            hint: summary.summary ? `${summary.summary.expenseCount} recorded expense${summary.summary.expenseCount === 1 ? "" : "s"}` : "No expenses recorded yet",
            icon: CircleDollarSign,
            tone: "teal",
          },
          {
            label: "Cash outflow",
            value: formatMoney(cashTotal.toFixed(2)),
            hint: "Operational costs paid in cash",
            icon: Wallet,
            tone: "blue",
          },
          {
            label: "Card outflow",
            value: formatMoney(cardTotal.toFixed(2)),
            hint: "Operational costs paid by card",
            icon: Banknote,
            tone: "violet",
          },
          {
            label: "Expense categories",
            value: String(summary.rows.length),
            hint: "Grouped by category and payment method",
            icon: ReceiptText,
            tone: "amber",
          },
        ]}
      />

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Add expense</h2>
          <p className="mt-1 text-sm text-slate-500">Record rent, utilities, salaries, transport, internet, and other operating costs.</p>
        </div>
        {user.permissions.includes("expense.create") ? (
          <ExpenseForm />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
            You have view-only access to expenses. Create permission is not assigned to this user.
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Recorded expenses</h2>
          <p className="mt-1 text-sm text-slate-500">This table uses real PostgreSQL rows only. Deleted expenses are excluded.</p>
        </div>
        <ExpenseTable expenses={expenses} />
      </section>
    </div>
  );
}
