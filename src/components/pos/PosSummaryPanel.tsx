"use client";

import { ReceiptText, Eraser } from "lucide-react";
import { formatLkr } from "@/modules/sales/pos.utils";

export type PosPaymentMode = "cash" | "card" | "split";

type Props = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  hasLines: boolean;
  onPayment: (mode: PosPaymentMode) => void;
  onHold: () => void;
  onClear: () => void;
};

export function PosSummaryPanel({ subtotal, discount, tax, total, hasLines, onPayment, onClear }: Props) {
  return (
    <section className="rounded-2xl border border-neutral-border bg-neutral-surface p-5">
      <h2 className="font-bold text-neutral-text">Order total</h2>
      <div className="mt-4 grid gap-2 text-sm">
        <div className="flex justify-between text-neutral-muted">
          <span>Subtotal</span>
          <span>{formatLkr(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-neutral-muted">
            <span>Discount</span>
            <span>− {formatLkr(discount)}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between text-neutral-muted">
            <span>Tax</span>
            <span>{formatLkr(tax)}</span>
          </div>
        )}
        <div className="mt-2 flex items-end justify-between border-t border-neutral-border pt-3">
          <span className="text-base font-bold text-neutral-text">Total to pay</span>
          <strong className="text-3xl font-black text-brand-default">{formatLkr(total)}</strong>
        </div>
      </div>

      {/* Single primary action */}
      <button
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-default px-4 py-4 text-base font-bold text-white transition hover:bg-brand-default disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!hasLines}
        onClick={() => onPayment("split")}
        type="button"
        id="take-payment-btn"
      >
        <ReceiptText className="size-5" />
        Take payment →
      </button>

      {/* Quiet secondary action */}
      <button
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-border px-3 py-2.5 text-sm font-medium text-neutral-muted transition hover:border-neutral-border hover:text-status-danger-text disabled:opacity-30"
        disabled={!hasLines}
        onClick={onClear}
        type="button"
      >
        <Eraser className="size-4" />
        Clear cart
      </button>
    </section>
  );
}
