import type { Metadata } from "next";
import Link from "next/link";

import { SaleVoidButton } from "@/components/sales/SaleVoidButton";
import { formatMoney } from "@/lib/money";
import { hasPermission, requirePermission } from "@/modules/auth/permissions";
import { listSalesForVoidPage } from "@/modules/sales/sale-void.service";
import { AutoSubmit } from "@/components/ui/auto-submit";
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
          className="inline-flex items-center gap-2 rounded-lg bg-brand-default px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-default"
          href="/pos"
        >
          Start a sale →
        </Link>
      </div>

      {/* Filter */}
      <form className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex w-full max-w-xs items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-3 py-2 shadow-sm">
          <input
            className="w-full bg-transparent text-sm outline-none"
            defaultValue={params.q ?? ""}
            name="q"
            placeholder="Sale number, cashier name…"
          />
        </div>
        <select
          className="rounded-full border border-neutral-border bg-neutral-surface px-4 py-1.5 text-sm font-semibold outline-none focus:border-brand-default"
          defaultValue={status}
          name="status"
        >
          <option value="ALL">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="VOIDED">Cancelled</option>
          <option value="HELD">Held</option>
        </select>
        <div className="flex items-center gap-2">
          <input className="rounded-full border border-neutral-border bg-neutral-surface px-4 py-1.5 text-sm font-semibold outline-none focus:border-brand-default" defaultValue={from ?? ""} name="from" type="date" title="From Date" />
          <span className="text-neutral-muted text-sm">to</span>
          <input className="rounded-full border border-neutral-border bg-neutral-surface px-4 py-1.5 text-sm font-semibold outline-none focus:border-brand-default" defaultValue={to ?? ""} name="to" type="date" title="To Date" />
        </div>
        <AutoSubmit />
      </form>

      {/* Sale list */}
      <section className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm text-neutral-muted">
            <thead className="bg-neutral-bg border-b border-neutral-border">
              <tr>
                <th className="px-5 py-3 font-semibold text-neutral-text">Sale No.</th>
                <th className="px-5 py-3 font-semibold text-neutral-text">Date & Cashier</th>
                <th className="px-5 py-3 font-semibold text-neutral-text">Total</th>
                <th className="px-5 py-3 font-semibold text-neutral-text">Status</th>
                <th className="px-5 py-3 font-semibold text-neutral-text">Action</th>
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
                    <tr className="transition hover:bg-neutral-bg bg-neutral-surface" key={sale.saleId}>
                      <td className="px-5 py-3.5 font-bold text-neutral-text">{sale.saleNumber}</td>
                      <td className="px-5 py-3.5 text-neutral-muted">
                        {sale.activityAt.slice(0, 10)} <br />
                        <span className="text-xs text-neutral-muted">{sale.cashierName}</span>
                      </td>
                      <td className="px-5 py-3.5 font-black text-neutral-text">{formatMoney(sale.total)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
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
                              {sale.status === "COMPLETED" && (
                                <div className="mt-4 border-t border-neutral-border pt-3">
                                  <a
                                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-default px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-hover"
                                    href={`/api/print/receipt/${sale.saleId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Print bill ⎙
                                  </a>
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
