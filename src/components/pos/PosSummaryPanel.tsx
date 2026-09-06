"use client";

import { Tag } from "lucide-react";
import { formatLkr } from "@/modules/sales/pos.utils";

export type PosPaymentMode = "cash" | "card" | "split";

type Props = {
  subtotal: number;
  discount: number;
  discountType: "AMOUNT" | "PERCENT";
  discountValue: number;
  tax: number;
  total: number;
  hasLines: boolean;
  canCheckout?: boolean;
  onDiscountChange: (type: "AMOUNT" | "PERCENT", value: number) => void;
  onPayment: (mode: PosPaymentMode) => void;
  onHold: () => void;
  onClear: () => void;
};

export function PosSummaryPanel({
  subtotal,
  discount,
  discountType,
  discountValue,
  tax,
  total,
  hasLines,
  canCheckout = hasLines,
  onDiscountChange,
  onPayment,
  onClear,
}: Props) {
  return (
    <div className="flex flex-col">
      <div className="mb-4 grid gap-3 text-sm">
        <div className="flex justify-between text-neutral-muted font-medium">
          <span>Subtotal</span>
          <span>{formatLkr(subtotal)}</span>
        </div>

        {/* Discount Input Block */}
        <div className="rounded-xl border border-neutral-border bg-neutral-bg/60 p-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-text mb-1.5">
            <span className="flex items-center gap-1.5 text-brand-default">
              <Tag className="size-3.5" /> Discount
            </span>
            <div className="flex items-center rounded-lg border border-neutral-border bg-neutral-surface p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => onDiscountChange("AMOUNT", discountValue)}
                className={`px-2 py-0.5 rounded font-bold transition ${
                  discountType === "AMOUNT"
                    ? "bg-brand-default text-white shadow-xs"
                    : "text-neutral-muted hover:text-neutral-text"
                }`}
              >
                LKR
              </button>
              <button
                type="button"
                onClick={() => onDiscountChange("PERCENT", discountValue)}
                className={`px-2 py-0.5 rounded font-bold transition ${
                  discountType === "PERCENT"
                    ? "bg-brand-default text-white shadow-xs"
                    : "text-neutral-muted hover:text-neutral-text"
                }`}
              >
                %
              </button>
            </div>
          </div>
          <div className="relative flex items-center">
            <input
              aria-label="Discount amount"
              type="number"
              min="0"
              step={discountType === "PERCENT" ? "1" : "1"}
              placeholder={discountType === "PERCENT" ? "Enter % (e.g. 5)" : "Enter LKR amount"}
              value={discountValue || ""}
              onChange={(e) => {
                const val = Math.max(0, parseFloat(e.target.value) || 0);
                onDiscountChange(discountType, val);
              }}
              disabled={!hasLines}
              className="w-full rounded-lg border border-neutral-border bg-neutral-surface px-3 py-2.5 text-sm font-semibold text-neutral-text placeholder:text-neutral-muted/60 focus:border-brand-default focus:outline-none disabled:opacity-50"
            />
            {discountType === "PERCENT" && discountValue > 0 && (
              <span className="absolute right-2.5 text-[11px] font-bold text-emerald-600">
                - {formatLkr(discount)}
              </span>
            )}
          </div>
        </div>

        {discount > 0 && (
          <div className="flex justify-between font-bold text-emerald-600">
            <span>Discount Applied</span>
            <span>− {formatLkr(discount)}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between text-neutral-muted font-medium">
            <span>Tax</span>
            <span>{formatLkr(tax)}</span>
          </div>
        )}
        <div className="mt-1 flex items-end justify-between border-t border-neutral-border/60 pt-2">
          <span className="text-[15px] font-black text-neutral-text">Total to pay</span>
          <strong className="text-2xl font-black tabular-nums text-brand-default">{formatLkr(total)}</strong>
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
