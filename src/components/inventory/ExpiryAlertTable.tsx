import type { ExpiryAlertRecord, ExpiryAlertState } from "@/modules/inventory/inventory.types";
import { formatInventoryDate, formatInventoryQty } from "@/modules/inventory/inventory.utils";

const statusStyle: Record<ExpiryAlertState, string> = {
  EXPIRED: "bg-red-50 text-red-700",
  NEAR_EXPIRY: "bg-amber-50 text-amber-700",
  QUARANTINED: "bg-purple-50 text-purple-700",
};

export function ExpiryAlertTable({ rows }: { rows: ExpiryAlertRecord[] }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,51,58,.05)]"><div className="overflow-x-auto"><table className="w-full min-w-[820px] border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{["Product", "Batch", "Expiry Date", "Days Left", "Qty", "Status"].map((heading) => <th className="border-b border-slate-200 px-5 py-4 font-bold" key={heading}>{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((alert) => <tr className="hover:bg-teal-50/30" key={alert.id}><td className="px-5 py-4 font-bold text-slate-800">{alert.productName}</td><td className="px-5 py-4 font-semibold text-slate-600">{alert.batchNumber ?? "—"}</td><td className="px-5 py-4 text-slate-600">{formatInventoryDate(alert.expiryDate)}</td><td className={`px-5 py-4 font-black ${alert.daysLeft == null ? "text-slate-400" : alert.daysLeft < 0 ? "text-red-600" : alert.daysLeft <= 30 ? "text-amber-600" : "text-slate-700"}`}>{alert.daysLeft == null ? "—" : alert.daysLeft < 0 ? `${Math.abs(alert.daysLeft)} days overdue` : `${alert.daysLeft} days`}</td><td className="px-5 py-4"><strong className="text-slate-800">{formatInventoryQty(alert.qty)}</strong><span className="ml-1 text-xs text-slate-400">{alert.baseUnit}</span></td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[alert.alertState]}`}>{alert.alertState.replace("_", " ")}</span></td></tr>)}{rows.length === 0 && <tr><td className="px-5 py-16 text-center text-slate-400" colSpan={6}>No expiry alerts.</td></tr>}</tbody></table></div></section>;
}
