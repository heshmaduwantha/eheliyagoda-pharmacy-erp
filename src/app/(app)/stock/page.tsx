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
          <h1 className="text-2xl font-black tracking-tight text-neutral-text sm:text-3xl">
            Stock
          </h1>
        </div>
        <InventoryTabs active="/stock" />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Products */}
        <Link
          href="/products"
          className="group rounded-2xl border border-neutral-border bg-neutral-surface p-5 shadow-[0_8px_30px_rgba(15,51,58,.04)] transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-brand-default/40"
        >
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-brand-pale text-brand-default transition-transform group-hover:scale-110">
            <Boxes className="size-5" />
          </div>
          <p className="text-sm font-bold text-neutral-muted">Active products</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-neutral-text">{summary.totalActiveProducts}</p>
          <p className="mt-2 text-xs font-medium text-neutral-muted">Active catalogue records</p>
        </Link>

        {/* Low Stock */}
        <Link
          href="/stock/batches?availability=AVAILABLE"
          className="group rounded-2xl border border-neutral-border bg-neutral-surface p-5 shadow-[0_8px_30px_rgba(15,51,58,.04)] transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-amber-300"
        >
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-status-warning-bg text-status-warning-text transition-transform group-hover:scale-110">
            <AlertTriangle className="size-5" />
          </div>
          <p className="text-sm font-bold text-neutral-muted">Low stock</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-neutral-text">{summary.lowStockCount}</p>
          <p className="mt-2 text-xs font-medium text-neutral-muted">At or below reorder level</p>
        </Link>

        {/* Near Expiry */}
        <Link
          href="/stock/expiry"
          className="group rounded-2xl border border-neutral-border bg-neutral-surface p-5 shadow-[0_8px_30px_rgba(15,51,58,.04)] transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300"
        >
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
            <CalendarClock className="size-5" />
          </div>
          <p className="text-sm font-bold text-neutral-muted">Near expiry</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-neutral-text">{summary.nearExpiryCount}</p>
          <p className="mt-2 text-xs font-medium text-neutral-muted">Active batches within 6 months</p>
        </Link>

        {/* Expired / Quarantined */}
        <Link
          href="/stock/expiry?status=EXPIRED"
          className="group rounded-2xl border border-neutral-border bg-neutral-surface p-5 shadow-[0_8px_30px_rgba(15,51,58,.04)] transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-rose-300"
        >
          <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-status-danger-bg text-status-danger-text transition-transform group-hover:scale-110">
            <ShieldAlert className="size-5" />
          </div>
          <p className="text-sm font-bold text-neutral-muted">Expired / quarantined</p>
          <p className="mt-1 text-3xl font-black tracking-tight text-neutral-text">{summary.expiredOrQuarantinedCount}</p>
          <p className="mt-2 text-xs font-medium text-neutral-muted">Batches requiring attention</p>
        </Link>
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
