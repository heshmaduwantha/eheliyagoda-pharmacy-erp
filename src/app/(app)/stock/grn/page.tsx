import Link from "next/link";
import { PackagePlus, Search } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/modules/auth/permissions";
import { listGrns } from "@/modules/procurement/grn.service";
import { Pagination } from "@/components/ui/pagination";

const statusConfig: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-status-warning-bg text-status-warning-text border-status-warning-bg" },
  CONFIRMED: { label: "Confirmed", cls: "bg-status-success-bg text-status-success-text border-green-200" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-100 text-neutral-muted border-neutral-border" },
};

export default async function GrnListPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requirePermission("grn.manage");
  const { q, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const { data: grns, total } = await listGrns({ search: q, page: currentPage });
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-text sm:text-4xl">
            Receive stock
          </h1>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-lg bg-brand-default px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-default"
          href="/stock/grn/new"
          id="record-delivery-btn"
        >
          <PackagePlus className="size-4" />
          Add GRN
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-3 py-2 shadow-sm">
          <Search className="size-4 text-neutral-muted" />
          <input
            className="bg-transparent text-sm outline-none w-full"
            defaultValue={q}
            name="q"
            placeholder="Search GRN, invoice, or supplier..."
          />
        </form>
      </div>

      {/* Delivery list */}
      <section className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm text-neutral-muted">
            <thead className="bg-neutral-bg text-xs uppercase tracking-wider text-neutral-muted">
              <tr>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">GRN Number</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Supplier</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Date</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Status</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold text-right">Total Cost</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grns.length === 0 ? (
                <tr>
                  <td className="px-5 py-16 text-center text-neutral-muted" colSpan={6}>
                    No deliveries found.
                  </td>
                </tr>
              ) : (
                grns.map((grn) => {
                  const status = statusConfig[grn.status] ?? { label: grn.status, cls: "bg-slate-100 text-neutral-muted" };
                  return (
                    <tr className="align-middle hover:bg-neutral-bg/50" key={grn.id}>
                      <td className="px-5 py-4">
                        <strong className="block text-neutral-text">{grn.grnNo}</strong>
                        <span className="text-xs text-neutral-muted">{grn._count.lines} item{grn._count.lines === 1 ? "" : "s"}</span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-neutral-text">{grn.supplier.name}</td>
                      <td className="px-5 py-4 text-neutral-muted">{grn.createdAt.toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-neutral-text">{formatMoney(grn.invoiceTotal)}</td>
                      <td className="px-5 py-4 text-right">
                        <Link className="rounded-lg border border-neutral-border bg-neutral-surface px-3 py-2 text-sm font-semibold text-neutral-text hover:bg-neutral-bg" href={`/stock/grn/${grn.id}`}>
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {grns.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/stock/grn" queryParams={{ q }} />
        )}
      </section>
    </div>
  );
}
