"use client";

import { useState } from "react";
import { Eye, Printer, X } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { SaleVoidListItem } from "@/modules/sales/sale-void.types";
import { SaleVoidButton } from "./SaleVoidButton";

function statusBadge(status: string) {
  if (status === "COMPLETED") return { label: "Completed", cls: "bg-status-success-bg text-status-success-text border border-status-success-bg" };
  if (status === "VOIDED") return { label: "Cancelled", cls: "bg-status-danger-bg text-status-danger-text border border-red-200" };
  return { label: "Held", cls: "bg-status-warning-bg text-status-warning-text border border-status-warning-bg" };
}

export function SalesTable({ sales, canVoid }: { sales: SaleVoidListItem[]; canVoid: boolean }) {
  const [activeSale, setActiveSale] = useState<SaleVoidListItem | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm text-neutral-muted">
          <thead className="bg-brand-pale text-xs uppercase tracking-wider font-extrabold text-brand-hover border-b border-brand-default/15">
            <tr>
              <th className="px-5 py-3.5 font-extrabold">Sale No.</th>
              <th className="px-5 py-3.5 font-extrabold">Date & Cashier</th>
              <th className="px-5 py-3.5 font-extrabold">Total</th>
              <th className="px-5 py-3.5 font-extrabold">Status</th>
              <th className="px-5 py-3.5 font-extrabold">Action</th>
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
                      {String(sale.activityAt).slice(0, 10)} <br />
                      <span className="text-xs text-neutral-muted">{sale.cashierName}</span>
                    </td>
                    <td className="px-5 py-3.5 font-black text-neutral-text">{formatMoney(sale.total)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {canVoid && sale.status === "COMPLETED" && (
                          <SaleVoidButton saleId={sale.saleId} saleNumber={sale.saleNumber} total={sale.total} />
                        )}
                        <button
                          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-border bg-neutral-surface px-3 py-1.5 text-xs font-bold text-brand-default transition hover:bg-brand-pale hover:border-brand-default"
                          onClick={() => setActiveSale(sale)}
                          type="button"
                        >
                          <Eye className="size-3.5" />
                          View details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Sale details modal */}
      {activeSale && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            aria-modal="true"
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-neutral-border bg-neutral-surface p-6 shadow-2xl"
            role="dialog"
          >
            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-neutral-border/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-neutral-text">{activeSale.saleNumber}</h2>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${statusBadge(activeSale.status).cls}`}>
                    {statusBadge(activeSale.status).label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-muted">
                  {String(activeSale.activityAt).slice(0, 10)} · Cashier: {activeSale.cashierName}
                </p>
              </div>
              <button
                aria-label="Close details modal"
                className="grid size-8 place-items-center rounded-full text-neutral-muted transition hover:bg-slate-100 hover:text-neutral-text"
                onClick={() => setActiveSale(null)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Items Sold */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-muted">Items sold</p>
              <div className="grid gap-2 rounded-2xl border border-neutral-border/70 bg-neutral-bg/60 p-3">
                {activeSale.lines.map((line) => (
                  <div className="flex items-center justify-between border-b border-neutral-border/40 pb-2 text-xs last:border-0 last:pb-0" key={line.saleLineId}>
                    <div>
                      <p className="font-bold text-neutral-text">{line.productName}</p>
                      <p className="text-neutral-muted">{line.quantity} × {line.unitName}</p>
                    </div>
                    <strong className="text-neutral-text">{formatMoney(line.lineTotal)}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Info */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-muted">Payment method</p>
              <div className="grid gap-2 rounded-2xl border border-neutral-border/70 bg-neutral-bg/60 p-3 text-xs">
                {activeSale.payments.map((payment) => (
                  <div className="flex items-center justify-between" key={payment.salePaymentId}>
                    <span className="font-semibold text-neutral-text">{payment.method === "CASH" ? "Cash" : "Card"}</span>
                    <strong>{formatMoney(payment.amount)}</strong>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-neutral-border/60 pt-2 text-sm font-black text-neutral-text">
                  <span>Grand Total</span>
                  <span>{formatMoney(activeSale.total)}</span>
                </div>
              </div>
            </div>

            {/* Void Info */}
            {activeSale.voidRecord && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-status-danger-bg p-3.5 text-xs text-status-danger-text">
                <p className="font-bold">Cancelled Sale</p>
                <p className="mt-1">Reason: {activeSale.voidRecord.reason ?? "No reason specified"}</p>
                <p className="mt-0.5 text-[11px] opacity-80">
                  By: {activeSale.voidRecord.voidedByName ?? "System"} on {String(activeSale.voidRecord.voidedAt).slice(0, 10)}
                </p>
              </div>
            )}

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-neutral-border/60 pt-4">
              {activeSale.status === "COMPLETED" && (
                <a
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-default px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-hover shadow-sm"
                  href={`/api/print/receipt/${activeSale.saleId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Printer className="size-4" />
                  Print bill
                </a>
              )}
              <button
                className="rounded-xl border border-neutral-border bg-neutral-surface px-4 py-2.5 text-xs font-bold text-neutral-text transition hover:bg-slate-100"
                onClick={() => setActiveSale(null)}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
