import { AlertTriangle, Boxes, CalendarClock, ShieldAlert } from "lucide-react";
import { formatMoney } from "@/lib/money";

type Props = {
  stockValuation: string;
  lowStockCount: number;
  nearExpiryCount: number;
  expiredQuarantinedCount: number;
};

export function StockAlertCards(props: Props) {
  const cards = [
    { label: "Active stock valuation", value: formatMoney(props.stockValuation), icon: Boxes, tone: "text-brand-default" },
    { label: "Low-stock products", value: String(props.lowStockCount), icon: AlertTriangle, tone: "text-status-warning-text" },
    { label: "Near-expiry batches", value: String(props.nearExpiryCount), icon: CalendarClock, tone: "text-blue-600" },
    { label: "Expired / quarantined", value: String(props.expiredQuarantinedCount), icon: ShieldAlert, tone: "text-status-danger-text" },
  ];
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, tone }) => <article className="rounded-2xl border border-neutral-border bg-neutral-surface p-5" key={label}><Icon className={`size-5 ${tone}`} /><p className="mt-4 text-sm text-neutral-muted">{label}</p><p className="mt-1 text-2xl font-black text-neutral-text">{value}</p></article>)}</section>;
}
