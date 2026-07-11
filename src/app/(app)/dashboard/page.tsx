import { AlertTriangle, Banknote, CalendarClock, CircleDollarSign, CreditCard, ReceiptText, Truck } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { withPerformanceTrace } from "@/lib/performance";
import { requirePermission } from "@/modules/auth/permissions";
import { getDashboardMetrics } from "@/modules/dashboard/dashboard.service";

const toneClass = {
  teal: "bg-teal-50 text-teal-700",
  blue: "bg-blue-50 text-blue-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-100 text-slate-600",
} as const;

async function renderDashboardPage() {
  const user = await requirePermission("dashboard.view");
  const metrics = await getDashboardMetrics();
  const date = new Intl.DateTimeFormat("en-LK", { dateStyle: "full" }).format(new Date());
  const cards = [
    {
      title: "Today sales",
      value: metrics.saleCount > 0 ? formatMoney(metrics.salesTotal) : "No completed sales yet",
      note: metrics.saleCount > 0 ? `${metrics.saleCount} completed sale${metrics.saleCount === 1 ? "" : "s"}` : "Sale model is live",
      icon: CircleDollarSign,
      tone: "slate",
    },
    {
      title: "Cash vs card",
      value: metrics.paymentCount > 0 ? `${formatMoney(metrics.cashTotal)} cash / ${formatMoney(metrics.cardTotal)} card` : "No completed payments yet",
      note: metrics.paymentCount > 0 ? "Payment split from completed sales" : "Payment records are empty",
      icon: CreditCard,
      tone: "blue",
    },
    {
      title: "Gross profit",
      value: metrics.profitLineCount > 0 ? formatMoney(metrics.grossProfitTotal) : "No completed sales yet",
      note: metrics.profitLineCount > 0 ? "Based on sale-line cost snapshots" : "Historical sale cost is pending",
      icon: Banknote,
      tone: "violet",
    },
    {
      title: "Low stock",
      value: metrics.lowStockCount.toLocaleString("en-LK"),
      note: "At or below reorder level",
      icon: AlertTriangle,
      tone: "amber",
    },
    {
      title: "Near expiry",
      value: metrics.nearExpiryCount.toLocaleString("en-LK"),
      note: "Active batches within 90 days",
      icon: CalendarClock,
      tone: "red",
    },
    {
      title: "Supplier payables",
      value: formatMoney(metrics.outstandingTotal),
      note: "Separate from expenses",
      icon: Truck,
      tone: "teal",
    },
    {
      title: "Expenses this month",
      value: metrics.expenseCount > 0 ? formatMoney(metrics.expenseTotal) : "No expenses yet",
      note: metrics.expenseCount > 0 ? `${metrics.expenseCount} expense${metrics.expenseCount === 1 ? "" : "s"} this month` : "Expense records are empty",
      icon: ReceiptText,
      tone: "emerald",
    },
    {
      title: "Overdue payables",
      value: String(metrics.overdueCount),
      note: "Due date passed and balance remains",
      icon: AlertTriangle,
      tone: "red",
    },
  ] as const;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-teal-700">Welcome back, {user.name}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-slate-500">Today&apos;s pharmacy overview.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm">
          {date}
        </div>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, value, note, icon: Icon, tone }) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,51,58,.05)]"
            key={title}
          >
            <div className={`grid size-11 place-items-center rounded-2xl ${toneClass[tone]}`}>
              <Icon className="size-5" />
            </div>
            <p className="mt-5 text-sm font-medium text-slate-500">{title}</p>
            <p className={`mt-1 font-black text-slate-900 ${value.length > 18 ? "text-lg" : "text-2xl"}`}>
              {value}
            </p>
            <p className="mt-2 text-xs text-slate-500">{note}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-800">
        <strong>Today&apos;s view:</strong> sales, payments, profit, expenses, and supplier balances are shown separately.
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return withPerformanceTrace({ route: "/dashboard", method: "RSC" }, renderDashboardPage);
}
