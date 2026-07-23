import { TrendingUp, ShoppingCart, AlertTriangle, Wallet, ArrowRight, Plus, Package } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { withPerformanceTrace } from "@/lib/performance";
import { requireAuth, requirePermission } from "@/modules/auth/permissions";
import { 
  getDashboardMetrics, 
  getDashboardWeeklySales 
} from "@/modules/dashboard/dashboard.service";

export default function DashboardPage() {
  return withPerformanceTrace({ route: "/dashboard", method: "RSC" }, renderDashboardPage);
}

async function renderDashboardPage() {
  const user = await requireAuth();
  await requirePermission("dashboard.view");
  
  const [metrics, weeklySales] = await Promise.all([
    getDashboardMetrics(),
    getDashboardWeeklySales()
  ]);
  
  const maxTotal = Math.max(...weeklySales.map(d => Number(d.total)), 1);

  return (
    <div className="mx-auto flex h-[calc(100vh-theme(spacing.16)-theme(spacing.8))] max-w-7xl flex-col min-w-0 pb-4 pt-2">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-text sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-muted">
            Welcome back, {user.name.split(" ")[0]}. Here's your overview for today.
          </p>
        </div>
        <div>
          <Link 
            href="/pos" 
            className="inline-flex items-center gap-2 rounded-xl bg-brand-default px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover"
          >
            <Plus className="size-4" strokeWidth={3} />
            New Sale (POS)
          </Link>
        </div>
      </div>

      {/* Premium Clickable KPI Cards Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
        <Link href="/sales" className="group rounded-2xl border border-neutral-border/50 bg-white p-5 shadow-sm transition-all hover:border-brand-default/40 hover:shadow-md">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold text-neutral-muted uppercase tracking-wider">Sales Today</p>
            <div className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black tracking-tight text-neutral-text transition-colors group-hover:text-brand-default">{formatMoney(metrics.salesTotal)}</p>
        </Link>
        
        <Link href="/sales" className="group rounded-2xl border border-neutral-border/50 bg-white p-5 shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold text-neutral-muted uppercase tracking-wider">Transactions</p>
            <div className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
              <ShoppingCart className="size-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black tracking-tight text-neutral-text transition-colors group-hover:text-emerald-700">{metrics.saleCount}</p>
        </Link>

        <Link href="/expenses" className="group rounded-2xl border border-neutral-border/50 bg-white p-5 shadow-sm transition-all hover:border-rose-500/40 hover:shadow-md">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold text-neutral-muted uppercase tracking-wider">Expenses Today</p>
            <div className="grid size-7 place-items-center rounded-lg bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-100">
              <Wallet className="size-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black tracking-tight text-neutral-text transition-colors group-hover:text-rose-700">{formatMoney(metrics.expenseTotal)}</p>
        </Link>

        <Link href="/inventory" className="group rounded-2xl border border-neutral-border/50 bg-white p-5 shadow-sm transition-all hover:border-amber-500/40 hover:shadow-md">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold text-neutral-muted uppercase tracking-wider">Low Stock</p>
            <div className="grid size-7 place-items-center rounded-lg bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black tracking-tight text-neutral-text transition-colors group-hover:text-amber-700">{metrics.lowStockCount}</p>
        </Link>
      </div>

      {/* Main Content Area - Fills remaining height */}
      <div className="grid flex-1 gap-6 min-h-0 lg:grid-cols-3">
        {/* Sales Graph */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-border/50 bg-white p-6 shadow-sm flex flex-col h-full">
          <div className="mb-4 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-sm font-bold text-neutral-text">Weekly Revenue</h2>
              <p className="text-xs text-neutral-muted mt-0.5">Performance over the last 7 days</p>
            </div>
            <Link href="/reports" className="flex items-center gap-1 text-xs font-bold text-brand-default transition-colors hover:text-brand-hover hover:underline">
              View Analytics <ArrowRight className="size-3" />
            </Link>
          </div>
          
          <div className="flex flex-1 items-end gap-3 sm:gap-6 min-h-0 pt-6">
            {weeklySales.map((day, i) => {
              const height = Math.max((Number(day.total) / maxTotal) * 100, 4); // min 4%
              const isToday = i === weeklySales.length - 1;
              return (
                <div key={i} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div 
                    className={`w-full rounded-t-md transition-all duration-300 ease-out ${isToday ? 'bg-brand-default' : 'bg-brand-pale group-hover:bg-brand-default/50'} `} 
                    style={{ height: `${height}%` }}
                  ></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-muted">
                    {new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(day.date)}
                  </span>
                  
                  {/* Tooltip on hover */}
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

        {/* Action Panel */}
        <div className="flex flex-col gap-4 h-full overflow-hidden">
          {metrics.lowStockCount > 0 && (
             <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 shadow-sm shrink-0">
               <div className="flex items-start gap-3">
                 <div className="mt-0.5 text-rose-600"><AlertTriangle className="size-4" /></div>
                 <div>
                   <h3 className="text-sm font-bold text-rose-900">Restock Alert</h3>
                   <p className="text-xs text-rose-700/80 mt-1 mb-3 leading-relaxed">
                     You have {metrics.lowStockCount} items running low. Keep your shelves full to avoid missed sales.
                   </p>
                   <Link 
                     href="/inventory" 
                     className="inline-flex rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-rose-700 shadow-sm transition hover:bg-rose-50 ring-1 ring-rose-200"
                   >
                     Manage Inventory
                   </Link>
                 </div>
               </div>
             </div>
          )}
          
          <div className="rounded-2xl border border-neutral-border/50 bg-white p-5 shadow-sm flex-1">
             <h2 className="text-sm font-bold text-neutral-text mb-4">Quick Links</h2>
             <div className="flex flex-col gap-1.5">
                <Link href="/products" className="group flex items-center justify-between rounded-xl p-3 border border-transparent transition-all hover:border-neutral-border/50 hover:bg-neutral-bg">
                  <div className="flex items-center gap-3 text-sm font-bold text-neutral-text transition-colors group-hover:text-brand-default">
                    <div className="text-neutral-400 group-hover:text-brand-default"><Package className="size-4" /></div>
                    Product Catalog
                  </div>
                  <ArrowRight className="size-3 text-neutral-muted transition-colors group-hover:text-brand-default" />
                </Link>
                <Link href="/inventory/grn" className="group flex items-center justify-between rounded-xl p-3 border border-transparent transition-all hover:border-neutral-border/50 hover:bg-neutral-bg">
                  <div className="flex items-center gap-3 text-sm font-bold text-neutral-text transition-colors group-hover:text-emerald-600">
                    <div className="text-neutral-400 group-hover:text-emerald-600"><ShoppingCart className="size-4" /></div>
                    Receive Stock (GRN)
                  </div>
                  <ArrowRight className="size-3 text-neutral-muted transition-colors group-hover:text-emerald-600" />
                </Link>
                <Link href="/expenses" className="group flex items-center justify-between rounded-xl p-3 border border-transparent transition-all hover:border-neutral-border/50 hover:bg-neutral-bg">
                  <div className="flex items-center gap-3 text-sm font-bold text-neutral-text transition-colors group-hover:text-rose-600">
                    <div className="text-neutral-400 group-hover:text-rose-600"><Wallet className="size-4" /></div>
                    Log Expense
                  </div>
                  <ArrowRight className="size-3 text-neutral-muted transition-colors group-hover:text-rose-600" />
                </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
