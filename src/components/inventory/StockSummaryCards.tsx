import { AlertTriangle, Boxes, CalendarClock, ShieldAlert } from "lucide-react";
import type { StockSummary } from "@/modules/inventory/inventory.types";

export function StockSummaryCards({ summary }: { summary: StockSummary }) {
  const cards = [
    { label: "Active products", value: summary.totalActiveProducts, note: "Active catalogue records", icon: Boxes, tone: "teal" },
    { label: "Low stock", value: summary.lowStockCount, note: "At or below reorder level", icon: AlertTriangle, tone: "amber" },
    { label: "Near expiry", value: summary.nearExpiryCount, note: "Active batches within 90 days", icon: CalendarClock, tone: "blue" },
    { label: "Expired / quarantined", value: summary.expiredOrQuarantinedCount, note: "Batches requiring attention", icon: ShieldAlert, tone: "red" },
  ] as const;

  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, note, icon: Icon, tone }) => <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,51,58,.05)]" key={label}><div className={`grid size-11 place-items-center rounded-2xl ${tone === "teal" ? "bg-teal-50 text-teal-700" : tone === "amber" ? "bg-amber-50 text-amber-600" : tone === "blue" ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"}`}><Icon className="size-5" /></div><p className="mt-5 text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-3xl font-black text-slate-900">{value}</p><p className="mt-2 text-xs text-slate-400">{note}</p></article>)}</section>;
}
