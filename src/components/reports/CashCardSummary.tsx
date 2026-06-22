import { Banknote, CreditCard } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { CashCardSummaryRow } from "@/modules/reports/report.types";

export function CashCardSummary({ rows, message }: { rows: CashCardSummaryRow[]; message?: string }) {
  if (!rows.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">{message ?? "No completed sale payments yet"}</div>;
  return <section className="grid gap-4 sm:grid-cols-2">{rows.map((row) => { const Icon = row.method === "CASH" ? Banknote : CreditCard; return <article className="rounded-2xl border border-slate-200 bg-white p-6" key={row.method}><Icon className="size-6 text-teal-600" /><p className="mt-4 text-sm font-bold text-slate-500">{row.method}</p><p className="mt-1 text-3xl font-black text-slate-900">{formatMoney(row.amount)}</p><p className="mt-2 text-xs text-slate-400">{row.paymentCount} payments</p></article>; })}</section>;
}
