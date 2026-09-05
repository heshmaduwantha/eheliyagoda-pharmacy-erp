"use client";

import { formatLkr } from "@/modules/sales/pos.utils";

export type PosPaymentMode = "cash" | "card" | "split";

type Props = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  hasLines: boolean;
  canCheckout?: boolean;
  onPayment: (mode: PosPaymentMode) => void;
  onHold: () => void;
  onClear: () => void;
};

export function PosSummaryPanel({ subtotal, discount, tax, total, hasLines, canCheckout = hasLines, onPayment, onClear }: Props) {
  return (
    <div className="flex flex-col">
      <div className="mb-4 grid gap-1.5 text-xs">
        <div className="flex justify-between text-neutral-muted font-medium">
          <span>Subtotal</span>
          <span>{formatLkr(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-neutral-muted font-medium">
            <span>Discount</span>
            <span>− {formatLkr(discount)}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between text-neutral-muted font-medium">
            <span>Tax</span>
            <span>{formatLkr(tax)}</span>
          </div>
        )}
        <div className="mt-2 flex items-end justify-between">
          <span className="text-[15px] font-black text-neutral-text">Total to pay</span>
          <strong className="text-xl font-black text-neutral-text">{formatLkr(total)}</strong>
        </div>
      </div>

      {/* Single primary action */}
      <button
        className="flex w-full items-center justify-center rounded-[10px] bg-brand-default px-4 py-3.5 text-sm font-bold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={!canCheckout}
        onClick={() => onPayment("split")}
        type="button"
        id="take-payment-btn"
      >
        Take payment →
      </button>

      {/* Quiet secondary action */}
      <button
        className="mt-3 flex w-full justify-center text-xs text-neutral-muted hover:text-neutral-text transition disabled:opacity-30"
        disabled={!hasLines}
        onClick={onClear}
        type="button"
      >
        Clear cart
      </button>
    </div>
  );
}
