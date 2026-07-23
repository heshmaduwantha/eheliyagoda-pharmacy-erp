import { AlertTriangle, Banknote, Clock, CreditCard, DollarSign, Receipt, Truck, ChevronRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { withPerformanceTrace } from "@/lib/performance";
import { requirePermission } from "@/modules/auth/permissions";
import { getDashboardMetrics } from "@/modules/dashboard/dashboard.service";

export default function DashboardPage() {
  return withPerformanceTrace({ route: "/dashboard", method: "RSC" }, renderDashboardPage);
}

async function renderDashboardPage() {
  await requirePermission("dashboard.view");
  const metrics = await getDashboardMetrics();
  
  const dateStr = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());

  const todaySalesValue = metrics.saleCount > 0 ? formatMoney(metrics.salesTotal) : "No completed sales yet";
  const cashVsCardValue = metrics.paymentCount > 0 ? `${formatMoney(metrics.cashTotal)} / ${formatMoney(metrics.cardTotal)}` : "No completed payments yet";
  const grossProfitValue = metrics.profitLineCount > 0 ? formatMoney(metrics.grossProfitTotal) : "No completed sales yet";

  return (
    <div className="grid gap-4 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-text sm:text-4xl">
            Dashboard
          </h1>
        </div>
        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_8px_30px_rgba(15,51,58,.04)]">
          {dateStr}
        </div>
      </div>

      {/* Hero Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Today Sales */}
        <Link href="/sales" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:col-span-2">
          {/* Decorative background blur */}
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/20 blur-2xl transition-transform duration-700 group-hover:scale-125"></div>
          <div className="absolute right-4 top-4 text-white/50 transition-colors duration-300 group-hover:text-white">
            <ChevronRight className="size-5" />
          </div>
          <div className="mb-2 inline-flex size-8 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <DollarSign className="size-4" />
          </div>
          <p className="text-[11px] font-semibold text-emerald-50 uppercase tracking-widest">Today sales</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-white drop-shadow-sm">{todaySalesValue}</p>
          <p className="mt-1 text-[11px] font-medium text-emerald-100/90">Sale model is live</p>
        </Link>

        {/* Card 2: Gross Profit */}
        <Link href="/sales" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:col-span-2">
          {/* Decorative background blur */}
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/20 blur-2xl transition-transform duration-700 group-hover:scale-125"></div>
          <div className="absolute right-4 top-4 text-white/50 transition-colors duration-300 group-hover:text-white">
            <ChevronRight className="size-5" />
          </div>
          <div className="mb-2 inline-flex size-8 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <Banknote className="size-4" />
          </div>
          <p className="text-[11px] font-semibold text-indigo-50 uppercase tracking-widest">Gross profit</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-white drop-shadow-sm">{grossProfitValue}</p>
          <p className="mt-1 text-[11px] font-medium text-indigo-100/90">Historical sale cost is pending</p>
        </Link>
      </div>

      {/* Standard Financials */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Cash vs Card */}
        <Link href="/sales" className="group relative rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md">
          <div className="absolute right-4 top-4 text-slate-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <ChevronRight className="size-5" />
          </div>
          <div className="mb-2 inline-flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-500 transition-colors duration-300 group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-blue-500/20">
            <CreditCard className="size-4" />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cash vs card</p>
          <p className="mt-1 text-xl font-black tracking-tight text-slate-900">{cashVsCardValue}</p>
        </Link>

        {/* Expenses */}
        <Link href="/expenses" className="group relative rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md">
          <div className="absolute right-4 top-4 text-slate-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <ChevronRight className="size-5" />
          </div>
          <div className="mb-2 inline-flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition-colors duration-300 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-emerald-500/20">
            <Receipt className="size-4" />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Expenses this month</p>
          <p className="mt-1 text-xl font-black tracking-tight text-slate-900">{formatMoney(metrics.expenseTotal)}</p>
        </Link>

        {/* Supplier Payables */}
        <Link href="/suppliers/payments" className="group relative rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-md">
          <div className="absolute right-4 top-4 text-slate-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <ChevronRight className="size-5" />
          </div>
          <div className="mb-2 inline-flex size-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-colors duration-300 group-hover:bg-teal-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-teal-500/20">
            <Truck className="size-4" />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Supplier payables</p>
          <p className="mt-1 text-xl font-black tracking-tight text-slate-900">{formatMoney(metrics.outstandingTotal)}</p>
        </Link>
      </div>

      {/* Action Required Section */}
      <div>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-black tracking-tight text-slate-800">
          <div className="flex size-5 items-center justify-center rounded-full bg-rose-100 text-rose-500">
            <AlertTriangle className="size-3" />
          </div>
          Action Required
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Low Stock */}
          <Link href="/products" className="group relative rounded-2xl border border-amber-200/60 bg-gradient-to-b from-white to-amber-50/50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-amber-50 hover:shadow-md">
            <div className="absolute right-4 top-4 text-amber-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <ChevronRight className="size-5" />
            </div>
            <div className="mb-2 inline-flex size-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 transition-all duration-300 group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-amber-500/30">
              <AlertTriangle className="size-4" />
            </div>
            <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Low stock</p>
            <p className="mt-1 text-xl font-black tracking-tight text-amber-950">{metrics.lowStockCount}</p>
          </Link>

          {/* Near Expiry */}
          <Link href="/stock/batches" className="group relative rounded-2xl border border-orange-200/60 bg-gradient-to-b from-white to-orange-50/50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-orange-50 hover:shadow-md">
            <div className="absolute right-4 top-4 text-orange-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <ChevronRight className="size-5" />
            </div>
            <div className="mb-2 inline-flex size-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-orange-500/30">
              <Clock className="size-4" />
            </div>
            <p className="text-[11px] font-semibold text-orange-800 uppercase tracking-wider">Near expiry</p>
            <p className="mt-1 text-xl font-black tracking-tight text-orange-950">{metrics.nearExpiryCount}</p>
          </Link>

          {/* Expired Stock */}
          <Link href="/stock/batches" className="group relative rounded-2xl border border-red-200/60 bg-gradient-to-b from-white to-red-50/50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-red-50 hover:shadow-md">
            <div className="absolute right-4 top-4 text-red-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <ChevronRight className="size-5" />
            </div>
            <div className="mb-2 inline-flex size-8 items-center justify-center rounded-xl bg-red-100 text-red-600 transition-all duration-300 group-hover:bg-red-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-red-500/30">
              <AlertTriangle className="size-4" />
            </div>
            <p className="text-[11px] font-semibold text-red-800 uppercase tracking-wider">Expired stock</p>
            <p className="mt-1 text-xl font-black tracking-tight text-red-950">{metrics.expiredOrQuarantinedCount}</p>
          </Link>

          {/* Overdue Payables */}
          <Link href="/suppliers/payments" className="group relative rounded-2xl border border-rose-200/60 bg-gradient-to-b from-white to-rose-50/50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-rose-50 hover:shadow-md">
            <div className="absolute right-4 top-4 text-rose-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <ChevronRight className="size-5" />
            </div>
            <div className="mb-2 inline-flex size-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 transition-all duration-300 group-hover:bg-rose-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-rose-600/30">
              <AlertTriangle className="size-4" />
            </div>
            <p className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">Overdue payables</p>
            <p className="mt-1 text-xl font-black tracking-tight text-rose-950">{metrics.overdueCount}</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
