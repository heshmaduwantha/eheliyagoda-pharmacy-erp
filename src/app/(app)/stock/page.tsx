import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Boxes, CalendarClock, ShieldAlert } from "lucide-react";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { ProductStockOverviewTable } from "@/components/inventory/ProductStockOverviewTable";
import { requirePermission } from "@/modules/auth/permissions";
import { getStockProductOverview, getStockSummary } from "@/modules/inventory/inventory.service";

export const metadata: Metadata = { title: "Stock" };

export default async function StockPage() {
  await requirePermission("stock.access");
  const [summary, productOverview] = await Promise.all([
    getStockSummary(),
    getStockProductOverview(20),
  ]);


  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-text sm:text-4xl">
            Stock
          </h1>
        </div>
        <InventoryTabs active="/stock" />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Products */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,51,58,.04)]">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Boxes className="size-5" />
          </div>
          <p className="text-sm font-bold text-slate-500">Active products</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">{summary.totalActiveProducts}</p>
          <p className="mt-2 text-xs font-medium text-slate-400">Active catalogue records</p>
        </div>

        {/* Low Stock */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,51,58,.04)]">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <AlertTriangle className="size-5" />
          </div>
          <p className="text-sm font-bold text-slate-500">Low stock</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">{summary.lowStockCount}</p>
          <p className="mt-2 text-xs font-medium text-slate-400">At or below reorder level</p>
        </div>

        {/* Near Expiry */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,51,58,.04)]">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CalendarClock className="size-5" />
          </div>
          <p className="text-sm font-bold text-slate-500">Near expiry</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">{summary.nearExpiryCount}</p>
          <p className="mt-2 text-xs font-medium text-slate-400">Active batches within 30 days</p>
        </div>

        {/* Expired / Quarantined */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,51,58,.04)]">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <ShieldAlert className="size-5" />
          </div>
          <p className="text-sm font-bold text-slate-500">Expired / quarantined</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">{summary.expiredOrQuarantinedCount}</p>
          <p className="mt-2 text-xs font-medium text-slate-400">Batches requiring attention</p>
        </div>
      </div>

      {/* Product stock overview */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Stock overview</h2>
            <p className="mt-1 text-xs text-slate-500">Total quantity by item. Use Batch register for individual batch details.</p>
          </div>
          <Link className="flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline" href="/stock/batches">
            View all batches <ArrowRight className="size-4" />
          </Link>
        </div>
        <ProductStockOverviewTable rows={productOverview} />
      </section>
    </div>
  );
}
