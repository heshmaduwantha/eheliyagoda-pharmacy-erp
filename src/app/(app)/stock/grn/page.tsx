import Link from "next/link";
import { PackagePlus, Search } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/modules/auth/permissions";
import { listGrns } from "@/modules/procurement/grn.service";
import { Pagination } from "@/components/ui/pagination";

const statusConfig: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  CONFIRMED: { label: "Confirmed", cls: "bg-green-50 text-green-700 border-green-200" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-100 text-slate-500 border-slate-200" },
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
          <p className="flex items-center gap-2 text-sm font-bold text-teal-700">
            <PackagePlus className="size-4" />
            Inventory workspace
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Receive stock
          </h1>
          <p className="mt-2 text-slate-500">Record deliveries from suppliers</p>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700"
          href="/stock/grn/new"
          id="record-delivery-btn"
        >
          <PackagePlus className="size-4" />
          Record a delivery
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <Search className="size-4 text-slate-400" />
          <input
            className="bg-transparent text-sm outline-none w-full"
            defaultValue={q}
            name="q"
            placeholder="Search GRN, invoice, or supplier..."
          />
        </form>
      </div>

      {/* Delivery list */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">GRN Number</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Supplier</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Date</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Status</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold text-right">Total Cost</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grns.length === 0 ? (
                <tr>
                  <td className="px-5 py-16 text-center text-slate-400" colSpan={6}>
                    No deliveries found.
                  </td>
                </tr>
              ) : (
                grns.map((grn) => {
                  const status = statusConfig[grn.status] ?? { label: grn.status, cls: "bg-slate-100 text-slate-500" };
                  return (
                    <tr className="align-middle hover:bg-slate-50/50" key={grn.id}>
                      <td className="px-5 py-4">
                        <strong className="block text-slate-900">{grn.grnNo}</strong>
                        <span className="text-xs text-slate-500">{grn._count.lines} item{grn._count.lines === 1 ? "" : "s"}</span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{grn.supplier.name}</td>
                      <td className="px-5 py-4 text-slate-500">{grn.createdAt.toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-slate-900">{formatMoney(grn.invoiceTotal)}</td>
                      <td className="px-5 py-4 text-right">
                        <Link className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href={`/stock/grn/${grn.id}`}>
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
