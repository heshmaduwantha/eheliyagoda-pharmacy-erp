import { AlertTriangle, Boxes, CalendarClock, ShieldAlert } from "lucide-react";
import type { StockSummary } from "@/modules/inventory/inventory.types";

export function StockSummaryCards({ summary }: { summary: StockSummary }) {
  const cards = [
    { label: "Active products", value: summary.totalActiveProducts, note: "Active catalogue records", icon: Boxes, tone: "teal" },
    { label: "Low stock", value: summary.lowStockCount, note: "At or below reorder level", icon: AlertTriangle, tone: "amber" },
    { label: "Expiring within 6 months", value: summary.expiringWithinSixMonthsCount, note: "Active, in-stock batches", icon: CalendarClock, tone: "blue" },
    { label: "Expired / quarantined", value: summary.expiredOrQuarantinedCount, note: "Batches requiring attention", icon: ShieldAlert, tone: "red" },
  ] as const;

  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, note, icon: Icon, tone }) => <article className="rounded-2xl border border-neutral-border bg-neutral-surface p-5 shadow-[0_8px_30px_rgba(15,51,58,.05)]" key={label}><div className={`grid size-11 place-items-center rounded-2xl ${tone === "teal" ? "bg-brand-pale text-brand-default" : tone === "amber" ? "bg-status-warning-bg text-status-warning-text" : tone === "blue" ? "bg-blue-50 text-blue-600" : "bg-status-danger-bg text-status-danger-text"}`}><Icon className="size-5" /></div><p className="mt-5 text-sm font-medium text-neutral-muted">{label}</p><p className="mt-1 text-3xl font-black text-neutral-text">{value}</p><p className="mt-2 text-xs text-neutral-muted">{note}</p></article>)}</section>;
}
