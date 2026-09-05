"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, CreditCard, ShieldCheck, X } from "lucide-react";
import type { PosPaymentInput } from "@/modules/sales/pos.types";
import { calculateRemaining, formatLkr, isPaymentExact } from "@/modules/sales/pos.utils";
import type { PosPaymentMode } from "./PosSummaryPanel";

const moneyInputClass =
  "min-w-0 w-full bg-transparent py-3 font-[inherit] text-sm font-semibold tabular-nums text-neutral-text outline-none placeholder:font-medium placeholder:text-neutral-muted [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

type Props = {
  open: boolean;
  mode: PosPaymentMode;
  total: number;
  onClose: () => void;
  onComplete: (payments: PosPaymentInput[]) => void;
};

function positiveMoney(value: string) {
  const amount = Math.max(0, Number(value) || 0);
  return amount.toFixed(2);
}

export function PaymentModal({ open, mode, total, onClose, onComplete }: Props) {
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [cardReference, setCardReference] = useState("");

  useEffect(() => {
    if (!open) return;
    setCashAmount(mode === "cash" ? total.toFixed(2) : "");
    setCardAmount(mode === "card" ? total.toFixed(2) : "");
    setCardReference("");
  }, [mode, open, total]);

  const payments = useMemo<PosPaymentInput[]>(() => {
    const result: PosPaymentInput[] = [];
    if (Number(cashAmount) > 0) result.push({ method: "CASH", amount: positiveMoney(cashAmount) });
    if (Number(cardAmount) > 0) result.push({ method: "CARD", amount: positiveMoney(cardAmount), cardReference: cardReference || undefined });
    return result;
  }, [cardAmount, cardReference, cashAmount]);
  const remaining = useMemo(() => calculateRemaining(total, payments), [payments, total]);
  const valid = total > 0 && isPaymentExact(total, payments);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <section aria-modal="true" className="w-full max-w-lg rounded-3xl bg-neutral-surface p-6 shadow-2xl sm:p-7" role="dialog">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-default">Payment</p>
            <h2 className="mt-1 text-2xl font-black text-neutral-text">Collect {formatLkr(total)}</h2>
          </div>
          <button aria-label="Close" className="grid size-9 place-items-center rounded-full text-neutral-muted hover:bg-slate-100" onClick={onClose} type="button">
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-neutral-text">
            Cash amount
            <span className="flex min-w-0 items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-3 shadow-sm transition focus-within:border-brand-default focus-within:ring-2 focus-within:ring-brand-default/15">
              <Banknote className="size-4 shrink-0 text-neutral-muted" />
              <input
                className={moneyInputClass}
                inputMode="decimal"
                min="0"
                onChange={(event) => setCashAmount(event.target.value)}
                placeholder="0.00"
                step="0.01"
                type="number"
                value={cashAmount}
              />
            </span>
          </label>
          <label className="grid gap-2 text-sm font-bold text-neutral-text">
            Card amount
            <span className="flex min-w-0 items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-3 shadow-sm transition focus-within:border-brand-default focus-within:ring-2 focus-within:ring-brand-default/15">
              <CreditCard className="size-4 shrink-0 text-neutral-muted" />
              <input
                className={moneyInputClass}
                inputMode="decimal"
                min="0"
                onChange={(event) => setCardAmount(event.target.value)}
                placeholder="0.00"
                step="0.01"
                type="number"
                value={cardAmount}
              />
            </span>
          </label>
        </div>
        <label className="mt-4 grid gap-2 text-sm font-bold text-neutral-text">
          Card reference
          <input
            className="w-full rounded-xl border border-neutral-border bg-neutral-surface px-4 py-3 text-sm font-semibold text-neutral-text shadow-sm outline-none transition placeholder:font-medium placeholder:text-neutral-muted focus:border-brand-default focus:ring-2 focus:ring-brand-default/15"
            onChange={(event) => setCardReference(event.target.value)}
            placeholder="Optional reference / last 4 digits"
            value={cardReference}
          />
        </label>
        <div className={`mt-5 flex items-center justify-between rounded-2xl p-4 ${remaining === 0 ? "bg-status-success-bg text-status-success-text" : "bg-status-warning-bg text-status-warning-text"}`}>
          <span className="text-sm font-bold">Remaining amount</span>
          <strong className="text-xl">{formatLkr(remaining)}</strong>
        </div>
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-neutral-bg p-3 text-xs leading-5 text-neutral-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-default" />
          Complete after any required prescription checks.
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="rounded-xl border border-neutral-border px-4 py-3 font-bold text-neutral-muted" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="rounded-xl bg-brand-default px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={!valid} onClick={() => onComplete(payments)} type="button">
            Continue
          </button>
        </div>
      </section>
    </div>
  );
}
