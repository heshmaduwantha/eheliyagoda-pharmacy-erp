"use client";

import { Banknote, CreditCard, Eraser, PauseCircle, ReceiptText, Split } from "lucide-react";
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

export function PosSummaryPanel({ subtotal, discount, tax, total, hasLines, onPayment, onHold, onClear }: Props) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,51,58,.07)]"><h2 className="font-black text-slate-900">Invoice summary</h2><div className="mt-4 grid gap-2 text-sm"><div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatLkr(subtotal)}</span></div><div className="flex justify-between text-slate-500"><span>Discount</span><span>- {formatLkr(discount)}</span></div><div className="flex justify-between text-slate-500"><span>Tax</span><span>{formatLkr(tax)}</span></div><div className="mt-2 flex items-end justify-between border-t border-slate-100 pt-4"><span className="font-bold text-slate-800">Total</span><strong className="text-2xl font-black text-teal-700">{formatLkr(total)}</strong></div></div><div className="mt-5 grid grid-cols-3 gap-2"><button className="grid place-items-center gap-1 rounded-xl border border-slate-200 px-2 py-3 text-xs font-bold text-slate-600 hover:border-teal-300 hover:bg-teal-50" disabled={!hasLines} onClick={() => onPayment("cash")} type="button"><Banknote className="size-5 text-teal-600" />Cash</button><button className="grid place-items-center gap-1 rounded-xl border border-slate-200 px-2 py-3 text-xs font-bold text-slate-600 hover:border-teal-300 hover:bg-teal-50" disabled={!hasLines} onClick={() => onPayment("card")} type="button"><CreditCard className="size-5 text-teal-600" />Card</button><button className="grid place-items-center gap-1 rounded-xl border border-slate-200 px-2 py-3 text-xs font-bold text-slate-600 hover:border-teal-300 hover:bg-teal-50" disabled={!hasLines} onClick={() => onPayment("split")} type="button"><Split className="size-5 text-teal-600" />Split</button></div><button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-4 py-3.5 font-black text-white shadow-lg shadow-teal-600/20 disabled:cursor-not-allowed disabled:opacity-40" disabled={!hasLines} onClick={() => onPayment("split")} type="button"><ReceiptText className="size-5" />Complete Sale</button><div className="mt-3 grid grid-cols-2 gap-2"><button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-amber-50" disabled={!hasLines} onClick={onHold} type="button"><PauseCircle className="size-4" />Hold</button><button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-red-50 hover:text-red-600" disabled={!hasLines} onClick={onClear} type="button"><Eraser className="size-4" />Clear Cart</button></div></section>;
}
