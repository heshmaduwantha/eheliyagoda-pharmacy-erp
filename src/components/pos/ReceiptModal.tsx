"use client";

import { CheckCircle2, Printer, X } from "lucide-react";
import type { SaleReceipt } from "@/modules/sales/sale.types";
import { formatLkr } from "@/modules/sales/pos.utils";

export function ReceiptModal({ receipt, onClose }: { receipt: SaleReceipt | null; onClose: () => void }) {
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <section
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-neutral-surface p-6 shadow-2xl"
        role="dialog"
      >
        <div className="flex justify-end">
          <button
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-neutral-muted hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="text-center">
          <CheckCircle2 className="mx-auto size-14 text-emerald-500" />
          <h2 className="mt-4 text-2xl font-black text-neutral-text">Sale completed</h2>
          <p className="mt-1 text-xs font-medium text-neutral-muted">{receipt.saleNumber}</p>
          <p className="mt-1 text-xs text-neutral-muted">{receipt.completedAt}</p>
        </div>

        <div className="mt-6 space-y-3 border-y border-dashed border-neutral-border py-4">
          {receipt.lines.map((line) => (
            <div className="rounded-2xl border border-neutral-border bg-neutral-bg/80 p-3 text-sm" key={line.clientLineId}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-neutral-text">
                    {line.quantity} × {line.productName}
                  </p>
                  <p className="mt-1 text-xs text-neutral-muted">
                    {line.unitName} · {formatLkr(Number(line.unitPrice))} each
                  </p>
                </div>
                <strong className="text-neutral-text">{formatLkr(Number(line.lineTotal))}</strong>
              </div>
              <div className="mt-3 space-y-2">
                {line.batchAllocations.map((allocation) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-xl bg-neutral-surface px-3 py-2 text-xs text-neutral-muted"
                    key={allocation.saleLineId}
                  >
                    <span>
                      Batch {allocation.batchNumber ?? "—"}
                      {allocation.expiryDate ? ` · Exp ${allocation.expiryDate}` : ""}
                    </span>
                    <span>
                      {allocation.qtyBase} base · {formatLkr(Number(allocation.lineTotal))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between text-neutral-muted">
            <span>Subtotal</span>
            <span>{formatLkr(Number(receipt.subtotal))}</span>
          </div>
          <div className="flex justify-between text-neutral-muted">
            <span>Discount</span>
            <span>- {formatLkr(Number(receipt.discountAmount))}</span>
          </div>
          <div className="flex justify-between text-neutral-muted">
            <span>Tax</span>
            <span>{formatLkr(Number(receipt.taxAmount))}</span>
          </div>
          <div className="flex justify-between text-lg font-black text-neutral-text">
            <span>Total</span>
            <span>{formatLkr(Number(receipt.total))}</span>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-status-success-bg p-3 text-center text-xs font-medium leading-5 text-status-success-text">
          Sale completed and stock updated.
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <a
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-default px-4 py-3 font-bold text-white transition hover:bg-brand-default/90"
            href={`/api/print/receipt/${receipt.saleId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Printer className="size-4" />
            Print Bill
          </a>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-4 py-3 font-bold text-neutral-text hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Close receipt
          </button>
        </div>
      </section>
    </div>
  );
}
