import { AlertTriangle, Banknote, CalendarClock, CircleDollarSign, CreditCard, ReceiptText, Truck } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/modules/auth/permissions";
import { getStockSummary } from "@/modules/inventory/inventory.service";
import { getSupplierPayablesSummary } from "@/modules/reports/payables-report.service";

const toneClass = {
  teal: "bg-teal-50 text-teal-700",
  blue: "bg-blue-50 text-blue-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-100 text-slate-600",
} as const;

export default async function DashboardPage() {
  const user = await requirePermission("dashboard.view");
  const [stock, payables] = await Promise.all([
    getStockSummary(),
    getSupplierPayablesSummary(),
  ]);
  const date = new Intl.DateTimeFormat("en-LK", { dateStyle: "full" }).format(new Date());
  const cards = [
    { title: "Today sales", value: "No completed sales yet", note: "Sale model pending", icon: CircleDollarSign, tone: "slate" },
    { title: "Cash vs card", value: "Unavailable", note: "Completed-sale payments pending", icon: CreditCard, tone: "blue" },
    { title: "Gross profit", value: "Unavailable", note: "Cost-at-sale snapshots pending", icon: Banknote, tone: "violet" },
    { title: "Low stock", value: stock.lowStockCount.toLocaleString("en-LK"), note: "At or below reorder level", icon: AlertTriangle, tone: "amber" },
    { title: "Near expiry", value: stock.nearExpiryCount.toLocaleString("en-LK"), note: "Active batches within 90 days", icon: CalendarClock, tone: "red" },
    { title: "Supplier payables", value: formatMoney(payables.summary?.outstandingTotal ?? "0.00"), note: "Separate from expenses", icon: Truck, tone: "teal" },
    { title: "Expenses this month", value: "Unavailable", note: "Expense model pending", icon: ReceiptText, tone: "emerald" },
  ] as const;

  return <div><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-teal-700">Welcome back, {user.name}</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Operations overview</h1><p className="mt-2 text-slate-500">Real PostgreSQL metrics and honest availability states.</p></div><div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm">{date}</div></div><section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ title, value, note, icon: Icon, tone }) => <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,51,58,.05)]" key={title}><div className={`grid size-11 place-items-center rounded-2xl ${toneClass[tone]}`}><Icon className="size-5" /></div><p className="mt-5 text-sm font-medium text-slate-500">{title}</p><p className={`mt-1 font-black text-slate-900 ${value.length > 18 ? "text-lg" : "text-2xl"}`}>{value}</p><p className="mt-2 text-xs text-slate-500">{note}</p></article>)}</section><section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-800"><strong>Reporting boundary:</strong> sales, cash/card, profit, and expenses remain unavailable until their authoritative models and completed-sale transaction exist. No estimates are substituted.</section></div>;
}
