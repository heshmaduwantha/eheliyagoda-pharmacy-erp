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
    <div className="flex flex-col gap-3">
      {/* Subtotal & Discount row */}
      <div className="grid gap-2 text-xs">
        <div className="flex items-center justify-between text-neutral-muted font-medium">
          <span>Subtotal</span>
          <span className="font-semibold text-neutral-text text-sm">{formatLkr(subtotal)}</span>
        </div>

        {/* Discount Input Block */}
        <div className="rounded-lg border border-neutral-border bg-neutral-surface p-2.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-text mb-1.5">
            <span className="flex items-center gap-1.5 text-brand-default">
              <Tag className="size-3.5" /> Discount
            </span>
            <div className="flex items-center rounded border border-neutral-border bg-neutral-bg p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => onDiscountChange("AMOUNT", discountValue)}
                className={`px-2 py-0.5 rounded font-semibold transition ${
                  discountType === "AMOUNT"
                    ? "bg-brand-default text-white"
                    : "text-neutral-muted hover:text-neutral-text"
                }`}
              >
                LKR
              </button>
              <button
                type="button"
                onClick={() => onDiscountChange("PERCENT", discountValue)}
                className={`px-2 py-0.5 rounded font-semibold transition ${
                  discountType === "PERCENT"
                    ? "bg-brand-default text-white"
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
              placeholder={discountType === "PERCENT" ? "Enter %" : "Enter LKR"}
              value={discountValue || ""}
              onChange={(e) => {
                const val = Math.max(0, parseFloat(e.target.value) || 0);
                onDiscountChange(discountType, val);
              }}
              disabled={!hasLines}
              className="w-full rounded border border-neutral-border bg-white px-3 py-1.5 text-xs font-semibold text-neutral-text placeholder:text-neutral-muted/60 focus:border-brand-default focus:outline-none focus:ring-2 focus:ring-brand-default/15 disabled:opacity-50"
            />
            {discountType === "PERCENT" && discountValue > 0 && (
              <span className="absolute right-2.5 text-xs font-bold text-status-success-text">
                - {formatLkr(discount)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Totals Bar */}
      <div className="flex flex-col gap-2 pt-2 border-t border-neutral-border">
        {discount > 0 && (
          <div className="flex items-center justify-between text-xs text-status-success-text font-semibold">
            <span>Discount Applied</span>
            <span>− {formatLkr(discount)}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex items-center justify-between text-xs text-neutral-muted">
            <span>Tax</span>
            <span className="text-neutral-text font-medium">{formatLkr(tax)}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="block text-xs font-semibold text-neutral-muted uppercase tracking-wider">Total Amount</span>
            <strong className="text-xl font-bold tabular-nums text-brand-default">{formatLkr(total)}</strong>
          </div>

          <div className="flex items-center gap-2">
            {hasLines && (
              <button
                className="text-xs font-semibold text-neutral-muted hover:text-status-danger-text transition px-2 py-1"
                onClick={onClear}
                type="button"
              >
                Clear
              </button>
            )}

            <button
              className="flex items-center justify-center rounded-xl bg-brand-default px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-neutral-border disabled:text-neutral-muted"
              disabled={!canCheckout}
              onClick={() => onPayment("split")}
              type="button"
              id="take-payment-btn"
            >
              Take payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


