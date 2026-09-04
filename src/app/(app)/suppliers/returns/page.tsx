import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { requirePermission } from "@/modules/auth/permissions";
import { getSupplierReturnLogs } from "@/modules/inventory/inventory.service";
import { Pagination } from "@/components/ui/pagination";
import { AutoSubmit } from "@/components/ui/auto-submit";

export default async function SupplierReturnsLogPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requirePermission("supplier.manage");
  const { q, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const { data: logs, total } = await getSupplierReturnLogs({ search: q, page: currentPage });
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="flex flex-col gap-6 min-w-0">
      <div className="flex flex-col gap-2">
        <Link className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-muted hover:text-neutral-text" href="/suppliers">
          <ArrowLeft className="size-3.5" /> Back to Suppliers
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-neutral-text sm:text-4xl">Supplier Returns Log</h1>
        <p className="text-sm text-neutral-muted">Audit trail of near-expired and expired inventory returned to suppliers.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-3 py-2 shadow-sm">
          <Search className="size-4 text-neutral-muted" />
          <input
            className="bg-transparent text-sm outline-none w-full"
            defaultValue={q}
            name="q"
            placeholder="Search return log..."
          />
          <AutoSubmit />
        </form>
        <Link
          className="inline-flex items-center gap-2 rounded-lg border border-brand-default/20 bg-brand-pale px-4 py-2 text-sm font-semibold text-brand-default shadow-sm transition hover:bg-brand-default hover:text-white"
          href="/stock/expiry"
        >
          View Expiry Stock →
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm text-neutral-muted">
            <thead className="bg-neutral-bg border-b border-neutral-border text-xs uppercase font-bold tracking-wider text-neutral-muted">
              <tr>
                <th className="px-5 py-3 text-neutral-text">Return No.</th>
                <th className="px-5 py-3 text-neutral-text">Supplier</th>
                <th className="px-5 py-3 text-neutral-text">Product</th>
                <th className="px-5 py-3 text-neutral-text">Batch</th>
                <th className="px-5 py-3 text-neutral-text">Qty Returned</th>
                <th className="px-5 py-3 text-neutral-text">Reason</th>
                <th className="px-5 py-3 text-neutral-text">Returned By</th>
                <th className="px-5 py-3 text-neutral-text">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td className="px-5 py-16 text-center text-neutral-muted" colSpan={8}>
                    No supplier return records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr className="transition hover:bg-neutral-bg bg-neutral-surface" key={log.id}>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-brand-default">{log.returnNumber}</td>
                    <td className="px-5 py-3.5 font-bold text-neutral-text">{log.supplierName}</td>
                    <td className="px-5 py-3.5 font-semibold text-neutral-text">{log.productName}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-neutral-muted">{log.batchNo ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <strong className="text-status-danger-text">{log.qtyBase}</strong>
                      <span className="ml-1 text-xs text-neutral-muted">{log.baseUnit}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-neutral-muted">{log.reason ?? "Supplier Return"}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-neutral-text">{log.returnedBy}</td>
                    <td className="px-5 py-3.5 text-xs text-neutral-muted">{log.returnedAt.slice(0, 10)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {logs.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/suppliers/returns" queryParams={{ q }} />
        )}
      </section>
    </div>
  );
}
