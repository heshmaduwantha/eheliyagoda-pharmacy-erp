import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/form";
import { formatMoney, formatQty } from "@/lib/money";
import { requirePermission } from "@/modules/auth/permissions";
import { getGrn } from "@/modules/procurement/grn.service";
import { ConfirmGrnButton } from "@/modules/procurement/confirm-grn-button";

const statusStyle: Record<string, string> = {
  DRAFT: "bg-status-warning-bg text-status-warning-text",
  CONFIRMED: "bg-status-success-bg text-status-success-text",
  CANCELLED: "bg-slate-100 text-neutral-muted",
};

export default async function GrnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("grn.manage");
  const { id } = await params;
  const grn = await getGrn(id);
  if (!grn) notFound();

  return (
    <div className="grid gap-7">
      <PageHeader
        action={
          <div className="flex gap-2">
            <Link className="inline-flex items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-4 py-2 text-sm font-semibold text-neutral-muted" href="/stock/grn">
              <ArrowLeft className="size-4" /> Back
            </Link>
            {grn.status === "DRAFT" && (
              <Link className="inline-flex items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-4 py-2 text-sm font-semibold text-neutral-muted" href={`/stock/grn/${grn.id}/edit`}>
                Edit draft
              </Link>
            )}
          </div>
        }
        description={`Supplier: ${grn.supplier.name}`}
        title={grn.grnNo}
      />

      <section className="grid gap-4 rounded-xl border border-neutral-border bg-neutral-surface p-5 shadow-sm sm:grid-cols-4 sm:p-6">
        <Detail label="Status">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[grn.status]}`}>{grn.status}</span>
        </Detail>
        <Detail label="Invoice no.">{grn.supplierInvoiceNo ?? "—"}</Detail>
        <Detail label="Invoice total">{formatMoney(grn.invoiceTotal)}</Detail>
        <Detail label="Received at">{grn.receivedAt ? grn.receivedAt.toLocaleString() : "—"}</Detail>
      </section>

      <section className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface shadow-sm">
        <div className="border-b border-neutral-border bg-neutral-bg px-5 py-4">
          <h2 className="text-sm font-black uppercase tracking-[.18em] text-brand-default">Lines ({grn.lines.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm text-neutral-muted">
            <thead className="bg-neutral-bg border-b border-neutral-border">
              <tr>
                <th className="px-5 py-3 font-semibold text-neutral-text">Product</th>
                <th className="px-5 py-3 font-semibold text-neutral-text">Qty</th>
                <th className="px-5 py-3 font-semibold text-neutral-text">Base qty</th>
                <th className="px-5 py-3 font-semibold text-neutral-text">System batch</th>
                <th className="px-5 py-3 font-semibold text-neutral-text">Supplier lot</th>
                <th className="px-5 py-3 font-semibold text-neutral-text">Expiry</th>
                <th className="px-5 py-3 font-semibold text-neutral-text">MRP</th>
                <th className="px-5 py-3 font-semibold text-neutral-text">Cost</th>
                <th className="px-5 py-3 font-semibold text-neutral-text">Price</th>
                <th className="px-5 py-3 font-semibold text-neutral-text text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grn.lines.map((line) => (
                <tr className="transition hover:bg-neutral-bg bg-neutral-surface" key={line.id}>
                  <td className="px-5 py-3.5 font-bold text-neutral-text">{line.product.name}</td>
                  <td className="px-5 py-3.5 text-neutral-muted">{formatQty(line.qtyInUnit)} {line.unit.unitName}</td>
                  <td className="px-5 py-3.5 text-neutral-muted">{formatQty(line.qtyBase)}</td>
                  <td className="px-5 py-3.5 text-neutral-muted">{line.batchNo ?? "—"}</td>
                  <td className="px-5 py-3.5 text-neutral-muted">{line.supplierBatchNo ?? "—"}</td>
                  <td className="px-5 py-3.5 text-neutral-muted">{line.expiryDate ? line.expiryDate.toLocaleDateString() : "—"}</td>
                  <td className="px-5 py-3.5 text-neutral-muted">{line.mrp ? formatMoney(line.mrp) : "—"}</td>
                  <td className="px-5 py-3.5 text-neutral-muted">{formatMoney(line.costPrice)}</td>
                  <td className="px-5 py-3.5 text-neutral-muted">{formatMoney(line.sellingPrice)}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-neutral-text">{formatMoney(Number(line.qtyInUnit) * Number(line.costPrice))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-neutral-bg">
                <td className="px-5 py-3.5 text-right text-sm font-bold text-neutral-muted" colSpan={9}>Invoice total</td>
                <td className="px-5 py-3.5 text-right text-base font-black text-brand-default">{formatMoney(grn.invoiceTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-border bg-neutral-surface p-5 shadow-sm sm:p-6">
        {grn.status === "DRAFT" ? (
          <ConfirmGrnButton grnId={grn.id} />
        ) : grn.status === "CONFIRMED" ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-status-success-text">
            <CheckCircle2 className="size-4" /> This GRN is confirmed. Stock and payable have been recorded.
          </p>
        ) : (
          <p className="text-sm font-semibold text-neutral-muted">This GRN is cancelled.</p>
        )}
      </section>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-text">{children}</p>
    </div>
  );
}
