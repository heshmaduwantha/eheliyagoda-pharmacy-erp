import { TrendingUp, ShoppingCart, AlertTriangle, Wallet, ArrowRight, Plus, Package } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { withPerformanceTrace } from "@/lib/performance";
import { requireAuth, requirePermission } from "@/modules/auth/permissions";
import { 
  getDashboardMetrics, 
  getDashboardWeeklySales,
  getDashboardTopProducts
} from "@/modules/dashboard/dashboard.service";

export default function DashboardPage() {
  return withPerformanceTrace({ route: "/dashboard", method: "RSC" }, renderDashboardPage);
}

async function renderDashboardPage() {
  const user = await requireAuth();
  await requirePermission("dashboard.view");
  
  const [metrics, weeklySales, topProducts] = await Promise.all([
    getDashboardMetrics(),
    getDashboardWeeklySales(),
    getDashboardTopProducts()
  ]);
  
  const maxTotal = Math.max(...weeklySales.map(d => Number(d.total)), 1);

  return (
    <div className="mx-auto max-w-7xl min-w-0 pb-12 pt-2">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
            className="inline-flex items-center gap-2 rounded-xl bg-brand-default px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover hover:shadow-md"
          >
            <Plus className="size-4" strokeWidth={3} />
            New Sale (POS)
          </Link>
        </div>
      </div>

      {/* Colorful yet Premium KPI Cards Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/sales" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm ring-1 ring-blue-100 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-300">
          <div className="flex items-start justify-between relative z-10">
            <p className="text-xs font-bold text-blue-900/60 uppercase tracking-wider">Sales Today</p>
            <div className="grid size-8 place-items-center rounded-lg bg-blue-100 text-blue-600 transition-transform group-hover:scale-110">
              <TrendingUp className="size-4" strokeWidth={2.5} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black tracking-tight text-blue-950 relative z-10">{formatMoney(metrics.salesTotal)}</p>
          {/* Subtle bg decoration */}
          <div className="absolute -bottom-4 -right-4 size-24 rounded-full bg-blue-100/50 blur-2xl transition-all group-hover:bg-blue-200/50"></div>
        </Link>
        
        <Link href="/sales" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm ring-1 ring-emerald-100 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-300">
          <div className="flex items-start justify-between relative z-10">
            <p className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider">Transactions</p>
            <div className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-600 transition-transform group-hover:scale-110">
              <ShoppingCart className="size-4" strokeWidth={2.5} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black tracking-tight text-emerald-950 relative z-10">{metrics.saleCount}</p>
          <div className="absolute -bottom-4 -right-4 size-24 rounded-full bg-emerald-100/50 blur-2xl transition-all group-hover:bg-emerald-200/50"></div>
        </Link>

        <Link href="/expenses" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm ring-1 ring-rose-100 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-rose-300">
          <div className="flex items-start justify-between relative z-10">
            <p className="text-xs font-bold text-rose-900/60 uppercase tracking-wider">Expenses Today</p>
            <div className="grid size-8 place-items-center rounded-lg bg-rose-100 text-rose-600 transition-transform group-hover:scale-110">
              <Wallet className="size-4" strokeWidth={2.5} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black tracking-tight text-rose-950 relative z-10">{formatMoney(metrics.expenseTotal)}</p>
          <div className="absolute -bottom-4 -right-4 size-24 rounded-full bg-rose-100/50 blur-2xl transition-all group-hover:bg-rose-200/50"></div>
        </Link>

        <Link href="/stock" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm ring-1 ring-amber-100 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-amber-300">
          <div className="flex items-start justify-between relative z-10">
            <p className="text-xs font-bold text-amber-900/60 uppercase tracking-wider">Low Stock</p>
            <div className="grid size-8 place-items-center rounded-lg bg-amber-100 text-amber-600 transition-transform group-hover:scale-110">
              <AlertTriangle className="size-4" strokeWidth={2.5} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black tracking-tight text-amber-950 relative z-10">{metrics.lowStockCount}</p>
          <div className="absolute -bottom-4 -right-4 size-24 rounded-full bg-amber-100/50 blur-2xl transition-all group-hover:bg-amber-200/50"></div>
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Graph - Fixed height so it's not ugly/oversized */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-border/50 bg-white p-6 shadow-sm">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-text">Weekly Revenue</h2>
              <p className="text-xs text-neutral-muted mt-0.5">Performance over the last 7 days</p>
            </div>
            <Link href="/reports" className="flex items-center gap-1 text-xs font-bold text-brand-default transition-colors hover:text-brand-hover hover:underline">
              View Analytics <ArrowRight className="size-3" />
            </Link>
          </div>
          
          {/* Constrained fixed height for the graph */}
          <div className="flex h-56 items-end gap-3 sm:gap-6 mt-4">
            {weeklySales.map((day, i) => {
              const height = Math.max((Number(day.total) / maxTotal) * 100, 4); // min 4%
              const isToday = i === weeklySales.length - 1;
              return (
                <div key={i} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-300 ease-out ${isToday ? 'bg-brand-default' : 'bg-brand-pale group-hover:bg-brand-default/50'} `} 
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

        {/* Top Products Compact Table */}
        <div className="rounded-2xl border border-neutral-border/50 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
               <h2 className="text-base font-bold text-neutral-text">Top Sellers</h2>
               <p className="text-xs text-neutral-muted mt-0.5">Highest volume this month</p>
            </div>
            <Link href="/products" className="flex items-center gap-1 text-xs font-bold text-brand-default transition-colors hover:text-brand-hover hover:underline">
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
      
      {/* Bottom Alert Row */}
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
