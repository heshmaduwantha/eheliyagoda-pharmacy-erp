import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { PageHeader } from "@/components/ui/form";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/modules/auth/permissions";
import { listGrns } from "@/modules/procurement/grn.service";

const statusStyle: Record<string, string> = {
  DRAFT: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default async function GrnListPage() {
  await requirePermission("grn.manage");
  const grns = await listGrns();

  return (
    <div className="grid gap-7">
      <PageHeader
        action={
          <Link className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg" href="/stock/grn/new">
            <PackagePlus className="size-4" /> New GRN
          </Link>
        }
        description="Direct GRN is the only stock-in path. Confirming a draft creates batches, ledger movements and a payable."
        title="Goods Received Notes"
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="py-2.5 pr-4">GRN No.</th>
                <th className="py-2.5 pr-4">Supplier</th>
                <th className="py-2.5 pr-4">Lines</th>
                <th className="py-2.5 pr-4">Invoice total</th>
                <th className="py-2.5 pr-4">Status</th>
                <th className="py-2.5 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {grns.length === 0 && (
                <tr>
                  <td className="py-8 text-center text-slate-400" colSpan={6}>No GRNs yet.</td>
                </tr>
              )}
              {grns.map((grn) => (
                <tr className="border-b border-slate-100 hover:bg-slate-50" key={grn.id}>
                  <td className="py-3 pr-4">
                    <Link className="font-semibold text-teal-700 hover:underline" href={`/stock/grn/${grn.id}`}>{grn.grnNo}</Link>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{grn.supplier.name}</td>
                  <td className="py-3 pr-4 text-slate-600">{grn._count.lines}</td>
                  <td className="py-3 pr-4 text-slate-600">{formatMoney(grn.invoiceTotal)}</td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[grn.status]}`}>{grn.status}</span>
                  </td>
                  <td className="py-3 pr-4 text-slate-500">{grn.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
