import { ExpenseForm } from "@/components/finance/ExpenseForm";
import { Receipt } from "lucide-react";
import { ExpenseTable } from "@/components/finance/ExpenseTable";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/modules/auth/permissions";
import { getExpenseSummary, listExpenses } from "@/modules/finance/expense.service";
import { Pagination } from "@/components/ui/pagination";

function monthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  return { from, to };
}

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requirePermission("expense.view");
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const [summary, { data: expenses, total }] = await Promise.all([
    getExpenseSummary(monthRange()), 
    listExpenses({ page: currentPage })
  ]);
  const totalPages = Math.ceil(total / 10);

  const totalThisMonth = summary.summary ? formatMoney(summary.summary.totalAmount) : "LKR 0.00";
  const expenseCount = summary.summary?.expenseCount ?? 0;

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-text sm:text-4xl">
            Expenses
          </h1>
        </div>
      </div>

      {/* Hero — this month's total */}
      <div className="flex items-center justify-between rounded-xl border border-brand-default/10 bg-brand-pale px-5 py-4 shadow-sm">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-hover">
            <span>📉</span> Expenses this month
          </p>
          <p className="mt-1 text-sm font-medium text-brand-hover/80">
            {expenseCount > 0
              ? `${expenseCount} expense${expenseCount === 1 ? "" : "s"} recorded this month`
              : "No expenses recorded this month"}
          </p>
        </div>
        <div className="text-2xl font-black tracking-tight text-brand-hover">{totalThisMonth}</div>
      </div>

      {/* Add expense */}
      <section className="rounded-xl border border-neutral-border bg-neutral-surface p-5 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-neutral-text">Record an expense</h2>
        {user.permissions.includes("expense.create") ? (
          <ExpenseForm />
        ) : (
          <div className="rounded-lg border border-dashed border-neutral-border bg-neutral-bg p-5 text-sm text-neutral-muted">
            You can view expenses but don&apos;t have permission to add new ones.
          </div>
        )}
      </section>

      {/* Expense list */}
      <section className="rounded-xl border border-neutral-border bg-neutral-surface shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-border">
          <h2 className="text-base font-bold text-neutral-text">This month&apos;s expenses</h2>
        </div>
        <ExpenseTable expenses={expenses} />
        {expenses.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/expenses" queryParams={{}} />
        )}
      </section>
    </div>
  );
}
