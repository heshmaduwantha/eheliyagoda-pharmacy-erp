import type { ExpiryAlertRecord, ExpiryAlertState } from "@/modules/inventory/inventory.types";
import { formatInventoryDate, formatInventoryQty } from "@/modules/inventory/inventory.utils";

const statusStyle: Record<ExpiryAlertState, string> = {
  EXPIRED: "bg-status-danger-bg text-status-danger-text",
  NEAR_EXPIRY: "bg-status-warning-bg text-status-warning-text",
  QUARANTINED: "bg-purple-50 text-purple-700",
};

export function ExpiryAlertTable({ rows }: { rows: ExpiryAlertRecord[] }) {
  return <section className="overflow-hidden rounded-2xl border border-neutral-border bg-neutral-surface shadow-[0_8px_30px_rgba(15,51,58,.05)]"><div className="overflow-x-auto"><table className="w-full min-w-[960px] border-collapse text-left text-sm"><thead className="bg-neutral-bg text-xs uppercase tracking-wider text-neutral-muted"><tr>{["Product", "System Batch", "Supplier Lot", "Expiry Date", "Days Left", "Qty", "Status"].map((heading) => <th className="border-b border-neutral-border px-5 py-4 font-bold" key={heading}>{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((alert) => <tr className="hover:bg-brand-pale/30" key={alert.id}><td className="px-5 py-4 font-bold text-neutral-text">{alert.productName}</td><td className="px-5 py-4 font-semibold text-neutral-muted">{alert.batchNumber ?? "—"}</td><td className="px-5 py-4 font-semibold text-neutral-muted">{alert.supplierLotNumber ?? "—"}</td><td className="px-5 py-4 text-neutral-muted">{formatInventoryDate(alert.expiryDate)}</td><td className={`px-5 py-4 font-black ${alert.daysLeft == null ? "text-neutral-muted" : alert.daysLeft < 0 ? "text-status-danger-text" : alert.daysLeft <= 30 ? "text-status-warning-text" : "text-neutral-text"}`}>{alert.daysLeft == null ? "—" : alert.daysLeft < 0 ? `${Math.abs(alert.daysLeft)} days overdue` : `${alert.daysLeft} days`}</td><td className="px-5 py-4"><strong className="text-neutral-text">{formatInventoryQty(alert.qty)}</strong><span className="ml-1 text-xs text-neutral-muted">{alert.baseUnit}</span></td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[alert.alertState]}`}>{alert.alertState.replace("_", " ")}</span></td></tr>)}{rows.length === 0 && <tr><td className="px-5 py-16 text-center text-neutral-muted" colSpan={7}>No expiry alerts.</td></tr>}</tbody></table></div></section>;
}
