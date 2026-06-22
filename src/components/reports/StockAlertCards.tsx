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
    { label: "Active stock valuation", value: formatMoney(props.stockValuation), icon: Boxes, tone: "text-teal-600" },
    { label: "Low-stock products", value: String(props.lowStockCount), icon: AlertTriangle, tone: "text-amber-600" },
    { label: "Near-expiry batches", value: String(props.nearExpiryCount), icon: CalendarClock, tone: "text-blue-600" },
    { label: "Expired / quarantined", value: String(props.expiredQuarantinedCount), icon: ShieldAlert, tone: "text-red-600" },
  ];
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, tone }) => <article className="rounded-2xl border border-slate-200 bg-white p-5" key={label}><Icon className={`size-5 ${tone}`} /><p className="mt-4 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{value}</p></article>)}</section>;
}
