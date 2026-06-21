"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, CreditCard, ShieldCheck, X } from "lucide-react";
import type { PosPaymentInput } from "@/modules/sales/pos.types";
import { calculateRemaining, formatLkr, isPaymentExact } from "@/modules/sales/pos.utils";
import type { PosPaymentMode } from "./PosSummaryPanel";

type Props = {
  open: boolean;
  mode: PosPaymentMode;
  total: number;
  onClose: () => void;
  onComplete: (payment: PosPaymentInput) => void;
};

const toAmount = (value: string) => Math.max(0, Number(value) || 0);

export function PaymentModal({ open, mode, total, onClose, onComplete }: Props) {
  const [payment, setPayment] = useState<PosPaymentInput>({ cashAmount: 0, cardAmount: 0, cardReference: "" });

  useEffect(() => {
    if (!open) return;
    setPayment({ cashAmount: mode === "cash" ? total : 0, cardAmount: mode === "card" ? total : 0, cardReference: "" });
  }, [mode, open, total]);

  const remaining = useMemo(() => calculateRemaining(total, payment), [payment, total]);
  const valid = total > 0 && isPaymentExact(total, payment);
  if (!open) return null;

  return <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"><section aria-modal="true" className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7" role="dialog"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Payment preview</p><h2 className="mt-1 text-2xl font-black text-slate-900">Collect {formatLkr(total)}</h2></div><button aria-label="Close" className="grid size-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100" onClick={onClose} type="button"><X className="size-5" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-slate-700">Cash amount<span className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-teal-400"><Banknote className="size-4 text-slate-400" /><input className="min-w-0 flex-1 py-3 outline-none" min="0" onChange={(event) => setPayment((current) => ({ ...current, cashAmount: toAmount(event.target.value) }))} step="0.01" type="number" value={payment.cashAmount} /></span></label><label className="grid gap-2 text-sm font-bold text-slate-700">Card amount<span className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-teal-400"><CreditCard className="size-4 text-slate-400" /><input className="min-w-0 flex-1 py-3 outline-none" min="0" onChange={(event) => setPayment((current) => ({ ...current, cardAmount: toAmount(event.target.value) }))} step="0.01" type="number" value={payment.cardAmount} /></span></label></div><label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">Card reference<input className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-teal-400" onChange={(event) => setPayment((current) => ({ ...current, cardReference: event.target.value }))} placeholder="Optional reference / last 4 digits" value={payment.cardReference} /></label><div className={`mt-5 flex items-center justify-between rounded-2xl p-4 ${remaining === 0 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}><span className="text-sm font-bold">Remaining amount</span><strong className="text-xl">{formatLkr(remaining)}</strong></div><div className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-600" />Preview only. No sale, stock deduction, or payment record will be created.</div><div className="mt-6 grid grid-cols-2 gap-3"><button className="rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-600" onClick={onClose} type="button">Cancel</button><button className="rounded-xl bg-teal-700 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={!valid} onClick={() => onComplete(payment)} type="button">Complete preview</button></div></section></div>;
}
