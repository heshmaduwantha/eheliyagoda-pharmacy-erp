import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { SaleVoidButton } from "@/components/sales/SaleVoidButton";
import { formatMoney } from "@/lib/money";
import { hasPermission, requirePermission } from "@/modules/auth/permissions";
import { listSalesForVoidPage } from "@/modules/sales/sale-void.service";
import type { SaleVoidListStatusFilter } from "@/modules/sales/sale-void.types";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = {
  title: "Sale history",
};

function normalizeStatus(value?: string): SaleVoidListStatusFilter {
  if (value === "HELD" || value === "COMPLETED" || value === "VOIDED" || value === "ALL") return value;
  return "ALL";
}

function normalizeDateOnly(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : value;
}

function statusBadge(status: string) {
  if (status === "COMPLETED") return { label: "Completed", cls: "bg-status-success-bg text-status-success-text border border-status-success-bg" };
  if (status === "VOIDED") return { label: "Cancelled", cls: "bg-status-danger-bg text-status-danger-text border border-red-200" };
  return { label: "Held", cls: "bg-status-warning-bg text-status-warning-text border border-status-warning-bg" };
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; from?: string; to?: string; page?: string }>;
}) {
  const user = await requirePermission("sale.create");
  const params = await searchParams;
  const status = normalizeStatus(params.status);
  const from = normalizeDateOnly(params.from);
  const to = normalizeDateOnly(params.to);
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const { data: sales, total } = await listSalesForVoidPage({
    status,
    search: params.q?.trim() || undefined,
    from,
    to,
    page: currentPage,
  });
  const totalPages = Math.ceil(total / 10);
  const canVoid = hasPermission(user, "sale.void");

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-text sm:text-4xl">
            Sale history
          </h1>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-lg bg-brand-default px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-default"
          href="/pos"
        >
          Start a sale →
        </Link>
      </div>

      {/* Filter */}
      <div className="rounded-xl border border-neutral-border bg-neutral-surface p-4 shadow-sm">
        <form className="flex flex-col gap-3 sm:flex-row xl:grid xl:grid-cols-[1.3fr_.8fr_.8fr_.8fr_auto]">
          <label className="grid gap-1.5 text-sm font-medium text-neutral-text">
            Search
            <input
              className="rounded-lg border border-neutral-border px-3 py-2 text-sm outline-none focus:border-brand-default"
              defaultValue={params.q ?? ""}
              name="q"
              placeholder="Sale number, cashier name…"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-neutral-text">
            Status
            <select
              className="rounded-lg border border-neutral-border px-3 py-2 text-sm outline-none focus:border-brand-default"
              defaultValue={status}
              name="status"
            >
              <option value="ALL">All</option>
              <option value="COMPLETED">Completed</option>
              <option value="VOIDED">Cancelled</option>
              <option value="HELD">Held</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-neutral-text">
            From
            <input className="rounded-lg border border-neutral-border px-3 py-2 text-sm outline-none focus:border-brand-default" defaultValue={from ?? ""} name="from" type="date" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-neutral-text">
            To
            <input className="rounded-lg border border-neutral-border px-3 py-2 text-sm outline-none focus:border-brand-default" defaultValue={to ?? ""} name="to" type="date" />
          </label>
          <div className="flex items-end">
            <button className="w-full rounded-lg bg-brand-default px-4 py-2 text-sm font-bold text-white hover:bg-brand-default" type="submit">
              Apply
            </button>
          </div>
        </form>
      </div>

      {/* Sale list */}
      <section className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left text-sm text-neutral-muted">
            <thead className="bg-neutral-bg text-xs uppercase tracking-wider text-neutral-muted">
              <tr>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Sale No.</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Date & Cashier</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Total</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Status</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.length === 0 ? (
                <tr>
                  <td className="px-5 py-16 text-center text-neutral-muted" colSpan={5}>
                    No sales matched the current filters.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const badge = statusBadge(sale.status);
                  return (
                    <tr className="align-middle hover:bg-neutral-bg/50" key={sale.saleId}>
                      <td className="px-5 py-4 font-bold text-neutral-text">{sale.saleNumber}</td>
                      <td className="px-5 py-4 text-neutral-muted">
                        {sale.activityAt.slice(0, 10)} <br />
                        <span className="text-xs text-neutral-muted">{sale.cashierName}</span>
                      </td>
                      <td className="px-5 py-4 font-black text-neutral-text">{formatMoney(sale.total)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2">
                          {canVoid && sale.status === "COMPLETED" && (
                            <SaleVoidButton saleId={sale.saleId} saleNumber={sale.saleNumber} total={sale.total} />
                          )}
                          <details className="group relative">
                            <summary className="cursor-pointer text-xs font-semibold text-brand-default hover:underline marker:content-none">
                              View details
                            </summary>
                            <div className="absolute right-0 z-10 mt-2 w-80 rounded-xl border border-neutral-border bg-neutral-surface p-4 shadow-xl">
                              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-muted">Items sold</p>
                              <div className="grid gap-2">
                                {sale.lines.map((line) => (
                                  <div className="flex items-center justify-between border-b border-slate-50 pb-2 text-xs" key={line.saleLineId}>
                                    <div>
                                      <p className="font-semibold text-neutral-text">{line.productName}</p>
                                      <p className="text-neutral-muted">{line.quantity} × {line.unitName}</p>
                                    </div>
                                    <strong className="text-neutral-text">{formatMoney(line.lineTotal)}</strong>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4">
                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-muted">Payment</p>
                                {sale.payments.map((payment) => (
                                  <div className="flex items-center justify-between text-xs" key={payment.salePaymentId}>
                                    <span className="font-medium text-neutral-text">{payment.method === "CASH" ? "Cash" : "Card"}</span>
                                    <strong>{formatMoney(payment.amount)}</strong>
                                  </div>
                                ))}
                              </div>
                              {sale.voidRecord && (
                                <div className="mt-3 rounded-lg border border-red-100 bg-status-danger-bg p-2 text-xs text-status-danger-text">
                                  <p className="font-bold">Cancelled</p>
                                  <p>{sale.voidRecord.reason}</p>
                                </div>
                              )}
                            </div>
                          </details>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {sales.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/sales" queryParams={{ status, q: params.q, from, to }} />
        )}
      </section>
    </div>
  );
}
