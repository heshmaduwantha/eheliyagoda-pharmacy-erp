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
      <div className="grid gap-2 text-xs">
        <div className="flex justify-between text-neutral-muted font-medium">
          <span>Subtotal</span>
          <span className="font-semibold text-neutral-text">{formatLkr(subtotal)}</span>
        </div>

        {/* Discount Input Block */}
        <div className="rounded-lg border border-neutral-border bg-neutral-surface p-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-neutral-text mb-1">
            <span className="flex items-center gap-1 text-brand-default">
              <Tag className="size-3" /> Discount
            </span>
            <div className="flex items-center rounded border border-neutral-border bg-neutral-bg p-0.5 text-[9px]">
              <button
                type="button"
                onClick={() => onDiscountChange("AMOUNT", discountValue)}
                className={`px-1.5 py-0.5 rounded font-bold transition ${
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
                className={`px-1.5 py-0.5 rounded font-bold transition ${
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
              className="w-full rounded border border-neutral-border bg-white px-2 py-1.5 text-xs font-semibold text-neutral-text placeholder:text-neutral-muted/60 focus:border-brand-default focus:outline-none disabled:opacity-50"
            />
            {discountType === "PERCENT" && discountValue > 0 && (
              <span className="absolute right-2 text-[10px] font-bold text-emerald-600">
                - {formatLkr(discount)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Footer Bar (Matching Screenshot Layout) */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-border">
        <div className="flex items-center gap-2">
          <button
            className="flex items-center justify-center rounded-lg bg-brand-default px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-hover shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!canCheckout}
            onClick={() => onPayment("split")}
            type="button"
            id="take-payment-btn"
          >
            Take payment
          </button>
          {hasLines && (
            <button
              className="text-[11px] font-semibold text-neutral-muted hover:text-status-danger-text transition px-1"
              onClick={onClear}
              type="button"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-right">
          {discount > 0 && (
            <div>
              <span className="block text-[9px] font-bold text-neutral-muted uppercase">Discount</span>
              <span className="text-xs font-bold text-emerald-600">− {formatLkr(discount)}</span>
            </div>
          )}
          {tax > 0 && (
            <div>
              <span className="block text-[9px] font-bold text-neutral-muted uppercase">Tax</span>
              <span className="text-xs font-bold text-neutral-text">{formatLkr(tax)}</span>
            </div>
          )}
          <div>
            <span className="block text-[9px] font-bold text-neutral-muted uppercase tracking-wider">Total Amount</span>
            <strong className="text-lg font-black tabular-nums text-brand-default">{formatLkr(total)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
