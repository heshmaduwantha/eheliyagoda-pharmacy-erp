import { Banknote, CreditCard } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { CashCardSummaryRow } from "@/modules/reports/report.types";

export function CashCardSummary({ rows, message }: { rows: CashCardSummaryRow[]; message?: string }) {
  if (!rows.length) return <div className="rounded-2xl border border-dashed border-neutral-border bg-neutral-surface p-8 text-center text-neutral-muted">{message ?? "No completed sale payments yet"}</div>;
  return <section className="grid gap-4 sm:grid-cols-2">{rows.map((row) => { const Icon = row.method === "CASH" ? Banknote : CreditCard; return <article className="rounded-2xl border border-neutral-border bg-neutral-surface p-6" key={row.method}><Icon className="size-6 text-brand-default" /><p className="mt-4 text-sm font-bold text-neutral-muted">{row.method}</p><p className="mt-1 text-3xl font-black text-neutral-text">{formatMoney(row.amount)}</p><p className="mt-2 text-xs text-neutral-muted">{row.paymentCount} payments</p></article>; })}</section>;
}
