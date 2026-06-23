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
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        role="dialog"
      >
        <div className="flex justify-end">
          <button
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="text-center">
          <CheckCircle2 className="mx-auto size-14 text-emerald-500" />
          <h2 className="mt-4 text-2xl font-black text-slate-900">Sale completed</h2>
          <p className="mt-1 text-xs font-medium text-slate-400">{receipt.saleNumber}</p>
          <p className="mt-1 text-xs text-slate-500">{receipt.completedAt}</p>
        </div>

        <div className="mt-6 space-y-3 border-y border-dashed border-slate-200 py-4">
          {receipt.lines.map((line) => (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-sm" key={line.clientLineId}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-slate-800">
                    {line.quantity} × {line.productName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {line.unitName} · {formatLkr(Number(line.unitPrice))} each
                  </p>
                </div>
                <strong className="text-slate-900">{formatLkr(Number(line.lineTotal))}</strong>
              </div>
              <div className="mt-3 space-y-2">
                {line.batchAllocations.map((allocation) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-xs text-slate-500"
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
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span>{formatLkr(Number(receipt.subtotal))}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Discount</span>
            <span>- {formatLkr(Number(receipt.discountAmount))}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Tax</span>
            <span>{formatLkr(Number(receipt.taxAmount))}</span>
          </div>
          <div className="flex justify-between text-lg font-black text-slate-900">
            <span>Total</span>
            <span>{formatLkr(Number(receipt.total))}</span>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-emerald-50 p-3 text-center text-xs font-medium leading-5 text-emerald-800">
          The sale, stock deduction, and payment records were written in a single PostgreSQL transaction.
        </div>

        <button
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 px-4 py-3 font-bold text-teal-700"
          onClick={onClose}
          type="button"
        >
          <Printer className="size-4" />
          Close receipt
        </button>
      </section>
    </div>
  );
}
