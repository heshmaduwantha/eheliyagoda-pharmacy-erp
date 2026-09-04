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
  const summary = await getStockSummary();
  const productOverview = await getStockProductOverview(20);


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
        <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-5 shadow-[0_8px_30px_rgba(15,51,58,.04)]">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-brand-pale text-brand-default">
            <Boxes className="size-5" />
          </div>
          <p className="text-sm font-bold text-neutral-muted">Active products</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-neutral-text">{summary.totalActiveProducts}</p>
          <p className="mt-2 text-xs font-medium text-neutral-muted">Active catalogue records</p>
        </div>

        {/* Low Stock */}
        <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-5 shadow-[0_8px_30px_rgba(15,51,58,.04)]">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-status-warning-bg text-status-warning-text">
            <AlertTriangle className="size-5" />
          </div>
          <p className="text-sm font-bold text-neutral-muted">Low stock</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-neutral-text">{summary.lowStockCount}</p>
          <p className="mt-2 text-xs font-medium text-neutral-muted">At or below reorder level</p>
        </div>

        {/* Near Expiry */}
        <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-5 shadow-[0_8px_30px_rgba(15,51,58,.04)]">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CalendarClock className="size-5" />
          </div>
          <p className="text-sm font-bold text-neutral-muted">Near expiry</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-neutral-text">{summary.nearExpiryCount}</p>
          <p className="mt-2 text-xs font-medium text-neutral-muted">Active batches within 6 months</p>
        </div>

        {/* Expired / Quarantined */}
        <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-5 shadow-[0_8px_30px_rgba(15,51,58,.04)]">
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-status-danger-bg text-status-danger-text">
            <ShieldAlert className="size-5" />
          </div>
          <p className="text-sm font-bold text-neutral-muted">Expired / quarantined</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-neutral-text">{summary.expiredOrQuarantinedCount}</p>
          <p className="mt-2 text-xs font-medium text-neutral-muted">Batches requiring attention</p>
        </div>
      </div>

      {/* Product stock overview */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-text">Stock overview</h2>
            <p className="mt-1 text-xs text-neutral-muted">Total quantity by item. Use Batch register for individual batch details.</p>
          </div>
          <Link className="flex items-center gap-1 text-sm font-semibold text-brand-default hover:underline" href="/stock/batches">
            View all batches <ArrowRight className="size-4" />
          </Link>
        </div>
        <ProductStockOverviewTable rows={productOverview} />
      </section>
    </div>
  );
}
