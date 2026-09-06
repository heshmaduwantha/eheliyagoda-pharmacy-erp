import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { Pagination } from "@/components/ui/pagination";
import { requirePermission } from "@/modules/auth/permissions";
import { getBatchExpiryList } from "@/modules/inventory/batch-expiry.service";

export const metadata: Metadata = { title: "Batch Expiry" };

export default async function BatchExpiryPage({ searchParams }: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  await requirePermission("stock.access");
  const filters = await searchParams;
  const search = filters.search?.trim() ?? "";
  const { rows, total, page, totalPages } = await getBatchExpiryList(search, Number(filters.page ?? 1));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-text sm:text-3xl">Batch Expiry</h1>
          <p className="mt-2 text-sm text-neutral-muted">Compare medicine batches, earliest expiry first. Only batches with stock are shown, including expired and quarantined stock.</p>
        </div>
        <InventoryTabs active="/stock/batch-expiry" />
      </div>

      <form action="/stock/batch-expiry" className="flex flex-col gap-3 rounded-2xl border border-neutral-border bg-neutral-surface p-4 shadow-sm sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-neutral-border bg-neutral-bg px-3 focus-within:border-brand-default focus-within:ring-2 focus-within:ring-brand-default/15">
          <Search aria-hidden="true" className="size-4 shrink-0 text-neutral-muted" />
          <span className="sr-only">Search medicine name, batch number or barcode</span>
          <input key={search} name="search" defaultValue={search} placeholder="Search medicine, batch number or barcode…" className="w-full min-w-0 bg-transparent py-3 text-sm text-neutral-text outline-none" />
        </label>
        <button type="submit" className="rounded-xl bg-brand-default px-5 py-3 text-sm font-bold text-white hover:bg-brand-hover">Search</button>
        {search ? <Link href="/stock/batch-expiry" className="rounded-xl border border-neutral-border px-5 py-3 text-center text-sm font-bold text-neutral-muted hover:bg-neutral-bg">Clear</Link> : null}
      </form>

      <section className="overflow-hidden rounded-2xl border border-neutral-border bg-neutral-surface shadow-sm" aria-label="Medicine batch expiry dates">
        <div className="border-b border-neutral-border px-5 py-4 text-sm text-neutral-muted">
          <strong className="text-neutral-text">{total}</strong> matching batches · Earliest expiry first · Dates: YYYY-MM-DD
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] border-collapse text-left text-sm">
            <thead className="border-b border-brand-default/15 bg-brand-pale text-xs uppercase tracking-wider text-brand-hover">
              <tr>{["Batch", "Medicine name", "Expiry date"].map((heading) => <th key={heading} scope="col" className="px-5 py-3.5 font-extrabold">{heading}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-neutral-border">
              {rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-neutral-bg/60">
                  <td className="px-5 py-4 font-semibold text-neutral-muted">{row.batchNo ?? "—"}</td>
                  <td className="px-5 py-4 font-bold text-neutral-text">{row.product.name}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-semibold tabular-nums text-neutral-text">{row.expiryDate ? <time dateTime={row.expiryDate.toISOString().slice(0, 10)}>{row.expiryDate.toISOString().slice(0, 10)}</time> : "Not recorded"}</td>
                </tr>
              ))}
              {rows.length === 0 ? <tr><td colSpan={3} className="px-5 py-14 text-center text-neutral-muted">{search ? "No in-stock batches match this medicine name, batch number or barcode." : "No batches with stock available."}</td></tr> : null}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={totalPages} baseUrl="/stock/batch-expiry" queryParams={{ search }} />
      </section>
    </div>
  );
}
