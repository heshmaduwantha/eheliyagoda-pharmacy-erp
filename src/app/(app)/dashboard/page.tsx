import { TrendingUp, ShoppingCart, AlertTriangle, Clock, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { withPerformanceTrace } from "@/lib/performance";
import { requireAuth, requirePermission } from "@/modules/auth/permissions";
import { 
  getDashboardMetrics, 
  getDashboardWeeklySales, 
  getDashboardTopProducts, 
  getDashboardWatchlist 
} from "@/modules/dashboard/dashboard.service";

export default function DashboardPage() {
  return withPerformanceTrace({ route: "/dashboard", method: "RSC" }, renderDashboardPage);
}

async function renderDashboardPage() {
  const user = await requireAuth();
  await requirePermission("dashboard.view");
  
  const [metrics, weeklySales, topProducts, watchlist] = await Promise.all([
    getDashboardMetrics(),
    getDashboardWeeklySales(),
    getDashboardTopProducts(),
    getDashboardWatchlist()
  ]);
  
  // Prepare alerts
  const alerts = [
    { 
      icon: AlertTriangle, 
      bg: "bg-[#FCEBEB] text-[#791F1F]", 
      title: `${metrics.lowStockCount} products out of stock or low`, 
      desc: "Reorder required" 
    },
    { 
      icon: Clock, 
      bg: "bg-[#FDE9CC] text-[#8A4B0A]", 
      title: `${metrics.nearExpiryCount} batches expiring within 30 days`, 
      desc: "Review needed immediately" 
    },
    { 
      icon: ShoppingCart, 
      bg: "bg-[#E1F5EE] text-[#085041]", 
      title: `${metrics.totalActiveProducts} active products in catalog`, 
      desc: "System running normally" 
    }
  ];

  const maxTotal = Math.max(...weeklySales.map(d => Number(d.total)), 1);

  return (
    <div className="grid gap-6 min-w-0 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-muted mb-1">
            Home / Dashboard
          </p>
          <h1 className="text-2xl font-black tracking-tight text-neutral-text sm:text-3xl">
            Good morning, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-neutral-muted">
            Here's what's happening across your pharmacy today.
          </p>
        </div>
        <div>
          <Link 
            href="/pos" 
            className="inline-flex items-center gap-2 rounded-xl bg-brand-default px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover"
          >
            <Plus className="size-4" strokeWidth={3} />
            New sale
          </Link>
        </div>
      </div>

      {/* Top KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-neutral-border/50 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">Today's sales</p>
            <div className="grid size-7 place-items-center rounded-lg bg-brand-pale text-brand-default">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black tracking-tight">{formatMoney(metrics.salesTotal)}</p>
          <p className="mt-2 text-xs font-bold text-status-success-text flex items-center gap-1">
            <TrendingUp className="size-3" />
            Live tracking
          </p>
        </div>
        
        <div className="rounded-2xl border border-neutral-border/50 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">Transactions</p>
            <div className="grid size-7 place-items-center rounded-lg bg-[#E1F5EE] text-[#085041]">
              <ShoppingCart className="size-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black tracking-tight">{metrics.saleCount}</p>
          <p className="mt-2 text-xs font-bold text-status-success-text flex items-center gap-1">
            <TrendingUp className="size-3" />
            Today
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-border/50 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">Low stock items</p>
            <div className="grid size-7 place-items-center rounded-lg bg-[#FAEEDA] text-[#633806]">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black tracking-tight">{metrics.lowStockCount}</p>
          <p className="mt-2 text-xs font-bold text-[#791F1F]">
            Check reorder levels
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-border/50 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">Expiring within 30d</p>
            <div className="grid size-7 place-items-center rounded-lg bg-[#FCEBEB] text-[#791F1F]">
              <Clock className="size-4" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-black tracking-tight">{metrics.nearExpiryCount}</p>
          <p className="mt-2 text-xs font-bold text-[#791F1F]">
            Review needed
          </p>
        </div>
      </div>

      {/* Middle Section: Chart and Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-border/50 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-bold text-neutral-text">Sales this week</h2>
            <Link href="/sales" className="text-xs font-bold text-brand-default flex items-center gap-1 hover:underline">
              View reports <ArrowRight className="size-3" />
            </Link>
          </div>
          
          <div className="flex h-48 items-end gap-3 sm:gap-6 mt-6">
            {weeklySales.map((day, i) => {
              const height = Math.max((Number(day.total) / maxTotal) * 100, 4); // min 4%
              const isToday = i === weeklySales.length - 1;
              return (
                <div key={i} className="group relative flex flex-1 flex-col items-center gap-3 h-full justify-end">
                  <div 
                    className={`w-full rounded-t-sm transition-all ${isToday ? 'bg-brand-default' : 'bg-brand-pale group-hover:bg-brand-default/40'}`} 
                    style={{ height: `${height}%` }}
                  ></div>
                  <span className="text-[10px] font-bold text-neutral-muted uppercase">
                    {new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(day.date)}
                  </span>
                </div>
              );
            })}
            {weeklySales.length === 0 && (
              <div className="w-full flex items-center justify-center text-sm text-neutral-muted h-full pb-8">
                No sales data yet
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-2xl border border-neutral-border/50 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-neutral-text">Alerts</h2>
            <Link href="/reports" className="text-xs font-bold text-brand-default flex items-center gap-1 hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          
          <div className="flex flex-col gap-5">
            {alerts.map((alert, i) => (
              <div key={i} className="flex gap-4">
                <div className={`grid size-9 shrink-0 place-items-center rounded-xl ${alert.bg}`}>
                  <alert.icon className="size-4" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-text">{alert.title}</p>
                  <p className="text-xs text-neutral-muted mt-0.5">{alert.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Selling and Watchlist */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Selling */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-border/50 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-neutral-text">Top selling products</h2>
            <Link href="/products" className="text-xs font-bold text-brand-default flex items-center gap-1 hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-border/50">
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-neutral-muted">Product</th>
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-neutral-muted text-center">Units Sold</th>
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-neutral-muted text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border/40">
                {topProducts.map((p, i) => (
                  <tr key={i} className="group transition hover:bg-brand-pale/30">
                    <td className="py-4 font-bold text-neutral-text">{p.productName}</td>
                    <td className="py-4 text-center font-semibold text-neutral-muted">{p.unitsSold}</td>
                    <td className="py-4 text-right font-black text-neutral-text">{formatMoney(p.revenue)}</td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-neutral-muted">No sales yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Watchlist */}
        <div className="rounded-2xl border border-neutral-border/50 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-neutral-text">Stock watchlist</h2>
            <Link href="/inventory" className="text-xs font-bold text-brand-default flex items-center gap-1 hover:underline">
              Manage stock <ArrowRight className="size-3" />
            </Link>
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-border/50">
                <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-neutral-muted">Product</th>
                <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-neutral-muted text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border/40">
              {watchlist.map((p, i) => {
                let badgeClass = "bg-[#E1F5EE] text-[#085041]"; // In stock
                if (p.status === "Out of stock" || p.status === "Expired") badgeClass = "bg-[#FCEBEB] text-[#791F1F]";
                if (p.status === "Expiring soon") badgeClass = "bg-[#FDE9CC] text-[#8A4B0A]";
                if (p.status === "Low stock") badgeClass = "bg-[#FAEEDA] text-[#633806]";
                
                return (
                  <tr key={i} className="group transition hover:bg-brand-pale/30">
                    <td className="py-4 font-bold text-neutral-text pr-2 line-clamp-1">{p.name}</td>
                    <td className="py-4 text-right pl-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${badgeClass}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {watchlist.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-neutral-muted">Watchlist clear</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
