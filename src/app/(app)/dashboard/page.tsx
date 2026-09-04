import {
  TrendingUp,
  AlertTriangle,
  CalendarClock,
  Receipt,
  Clock,
  Plus,
  ArrowRight,
  Package,
} from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { withPerformanceTrace } from "@/lib/performance";
import { requireAuth, requirePermission } from "@/modules/auth/permissions";
import {
  getDashboardMetrics,
  getDashboardWeeklySales,
  getDashboardTopProducts,
} from "@/modules/dashboard/dashboard.service";

export default function DashboardPage() {
  return withPerformanceTrace({ route: "/dashboard", method: "RSC" }, renderDashboardPage);
}

async function renderDashboardPage() {
  const user = await requireAuth();
  await requirePermission("dashboard.view");

  const metrics = await getDashboardMetrics();
  const weeklySales = await getDashboardWeeklySales();
  const topProducts = await getDashboardTopProducts();

  const maxTotal = Math.max(...weeklySales.map((d) => Number(d.total)), 1);

  // Determine today's sales label
  const salesTodayValue =
    Number(metrics.salesTotal) === 0 && metrics.saleCount === 0
      ? "No completed sales yet"
      : formatMoney(metrics.salesTotal);
  const salesTodayHint =
    Number(metrics.salesTotal) === 0 ? "Sale model is live" : `${metrics.saleCount} transactions`;

  // Expenses this month
  const expensesValue =
    metrics.expenseCount === 0 ? "No expenses yet" : formatMoney(metrics.expenseTotal);
  const expensesHint = metrics.expenseCount === 0 ? "Expense records are empty" : `${metrics.expenseCount} entries`;

  return (
    <div className="mx-auto max-w-7xl min-w-0 pb-12 pt-2">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-text sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-muted">
            Welcome back, {user.name.split(" ")[0]}. Here&apos;s your overview for today.
          </p>
        </div>
        <div>
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-default px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover hover:shadow-md"
          >
            <Plus className="size-4" strokeWidth={3} />
            New Sale (POS)
          </Link>
        </div>
      </div>

      {/* ── KPI Cards grid ── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          href="/sales"
          icon={<TrendingUp className="size-5" />}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Today sales"
          value={salesTodayValue}
          hint={salesTodayHint}
        />
        <KpiCard
          href="/stock"
          icon={<AlertTriangle className="size-5" />}
          iconBg="bg-amber-100"
          iconColor="text-amber-500"
          label="Low stock"
          value={String(metrics.lowStockCount)}
          hint="At or below reorder level"
        />
        <KpiCard
          href="/stock"
          icon={<CalendarClock className="size-5" />}
          iconBg="bg-red-100"
          iconColor="text-red-500"
          label="Near expiry"
          value={String(metrics.nearExpiryCount)}
          hint="Active batches within 6 months"
        />
        <KpiCard
          href="/expenses"
          icon={<Receipt className="size-5" />}
          iconBg="bg-teal-100"
          iconColor="text-teal-500"
          label="Expenses this month"
          value={expensesValue}
          hint={expensesHint}
        />
        <KpiCard
          href="/suppliers"
          icon={<Clock className="size-5" />}
          iconBg="bg-rose-100"
          iconColor="text-rose-500"
          label="Overdue payables"
          value={String(metrics.overdueCount)}
          hint="Due date passed and balance remains"
        />
      </div>

      {/* ── Charts + Top Products ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Revenue Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-border/50 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-text">Weekly Revenue</h2>
              <p className="text-xs text-neutral-muted mt-0.5">Performance over the last 7 days</p>
            </div>
            <Link
              href="/reports"
              className="flex items-center gap-1 text-xs font-bold text-brand-default transition-colors hover:text-brand-hover hover:underline"
            >
              View Analytics <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="flex h-56 items-end gap-2 sm:gap-4 mt-4">
            {weeklySales.map((day, i) => {
              const height = Math.max((Number(day.total) / maxTotal) * 100, 4);
              const isToday = i === weeklySales.length - 1;
              return (
                <div key={i} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 ease-out ${
                      isToday
                        ? "bg-brand-default"
                        : "bg-brand-pale group-hover:bg-brand-default/50"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-muted">
                    {new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(day.date)}
                  </span>
                  {/* Hover tooltip */}
                  <div className="pointer-events-none absolute -top-8 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="rounded border border-neutral-border bg-white px-2 py-1 text-[10px] font-bold text-neutral-text shadow-md whitespace-nowrap">
                      {formatMoney(Number(day.total))}
                    </div>
                  </div>
                </div>
              );
            })}
            {weeklySales.length === 0 && (
              <div className="flex h-full w-full items-center justify-center pb-8 text-sm text-neutral-muted">
                No sales data yet
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-2xl border border-neutral-border/50 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-text">Top Sellers</h2>
              <p className="text-xs text-neutral-muted mt-0.5">Highest volume this month</p>
            </div>
            <Link
              href="/products"
              className="flex items-center gap-1 text-xs font-bold text-brand-default transition-colors hover:text-brand-hover hover:underline"
            >
              All <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {topProducts.slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-neutral-bg text-neutral-muted transition-colors group-hover:bg-brand-pale group-hover:text-brand-default">
                    <Package className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-text line-clamp-1">{p.productName}</p>
                    <p className="text-xs text-neutral-muted">{p.unitsSold} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-neutral-text">{formatMoney(p.revenue)}</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="py-8 text-center text-sm text-neutral-muted">No sales yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Low stock alert banner */}
      {metrics.lowStockCount > 0 && (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-rose-600 shadow-sm">
              <AlertTriangle className="size-4" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900">Restock Alert</h3>
              <p className="text-xs text-rose-700/80">
                You have {metrics.lowStockCount} items running low in inventory.
              </p>
            </div>
          </div>
          <Link
            href="/stock"
            className="inline-flex rounded-lg bg-white px-4 py-2 text-xs font-bold text-rose-700 shadow-sm transition hover:bg-rose-100 ring-1 ring-rose-200"
          >
            Manage Stock
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Reusable KPI Card ────────────────────────────────────────────────────────
function KpiCard({
  href,
  icon,
  iconBg,
  iconColor,
  label,
  value,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border border-neutral-border/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-neutral-border"
    >
      {/* Icon */}
      <div className={`grid size-10 place-items-center rounded-xl ${iconBg} ${iconColor} transition-transform group-hover:scale-110`}>
        {icon}
      </div>

      {/* Label */}
      <p className="text-xs font-semibold text-neutral-muted">{label}</p>

      {/* Value */}
      <p className="text-xl font-black leading-tight tracking-tight text-neutral-text">
        {value}
      </p>

      {/* Hint */}
      <p className="text-xs text-neutral-muted">{hint}</p>
    </Link>
  );
}
