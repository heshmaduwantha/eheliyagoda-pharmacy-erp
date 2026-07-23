import { BadgeDollarSign, ReceiptText, Tags, WalletCards } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { DailySalesSummary } from "@/modules/reports/report.types";

export function SalesSummaryCards({ summary, message }: { summary: DailySalesSummary | null; message?: string }) {
  if (!summary) return <div className="rounded-2xl border border-dashed border-neutral-border bg-neutral-surface p-8 text-center"><ReceiptText className="mx-auto size-9 text-slate-300" /><p className="mt-3 font-bold text-neutral-text">{message ?? "No completed sales yet"}</p></div>;
  const cards = [
    { label: "Subtotal", value: formatMoney(summary.subtotal), icon: BadgeDollarSign },
    { label: "Discount", value: formatMoney(summary.discount), icon: Tags },
    { label: "Tax", value: formatMoney(summary.tax), icon: WalletCards },
    { label: "Total", value: formatMoney(summary.total), icon: ReceiptText },
  ];
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon }) => <article className="rounded-2xl border border-neutral-border bg-neutral-surface p-5" key={label}><Icon className="size-5 text-brand-default" /><p className="mt-4 text-sm text-neutral-muted">{label}</p><p className="mt-1 text-2xl font-black text-neutral-text">{value}</p></article>)}</section>;
}
