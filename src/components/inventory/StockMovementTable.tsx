import type { StockMovementRecord, StockMovementType } from "@/modules/inventory/inventory.types";
import { formatInventoryQty, formatMovementDate } from "@/modules/inventory/inventory.utils";

const movementStyle: Record<StockMovementType, string> = {
  GRN_IN: "bg-status-success-bg text-status-success-text",
  SALE_OUT: "bg-blue-50 text-blue-700",
  RETURN_IN: "bg-cyan-50 text-cyan-700",
  WRITE_OFF: "bg-status-danger-bg text-status-danger-text",
  ADJUSTMENT: "bg-status-warning-bg text-status-warning-text",
  SUPPLIER_RETURN: "bg-purple-50 text-purple-700 border border-purple-200",
};

const movementLabel: Record<StockMovementType, string> = {
  GRN_IN: "GRN_IN",
  SALE_OUT: "SALE_OUT",
  RETURN_IN: "RETURN_IN",
  WRITE_OFF: "Expired Stock",
  ADJUSTMENT: "ADJUSTMENT",
  SUPPLIER_RETURN: "Supplier Return",
};

const directionStyle = {
  IN: "bg-status-success-bg text-status-success-text",
  OUT: "bg-status-danger-bg text-status-danger-text",
};

export function StockMovementTable({ rows }: { rows: StockMovementRecord[] }) {
  return <section className="overflow-hidden rounded-2xl border border-neutral-border bg-neutral-surface shadow-[0_8px_30px_rgba(15,51,58,.05)]"><div className="overflow-x-auto"><table className="w-full min-w-[1260px] border-collapse text-left text-sm"><thead className="bg-neutral-bg text-xs uppercase tracking-wider text-neutral-muted"><tr>{["Date", "Product", "System Batch", "Supplier Lot", "Movement Type", "Direction", "Qty Base", "Created By"].map((heading) => <th className="border-b border-neutral-border px-5 py-4 font-bold" key={heading}>{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((movement) => { const quantity = Number(movement.qtyBase); return <tr className="hover:bg-brand-pale/30" key={movement.id}><td className="px-5 py-4 text-neutral-muted">{formatMovementDate(movement.occurredAt)}</td><td className="px-5 py-4 font-bold text-neutral-text">{movement.productName}</td><td className="px-5 py-4 font-semibold text-neutral-muted">{movement.batchNumber ?? "—"}</td><td className="px-5 py-4 font-semibold text-neutral-muted">{movement.supplierLotNumber ?? "—"}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${movementStyle[movement.movementType]}`}>{movementLabel[movement.movementType]}</span></td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${directionStyle[movement.direction]}`}>{movement.direction}</span></td><td className={`px-5 py-4 font-black ${quantity >= 0 ? "text-status-success-text" : "text-status-danger-text"}`}>{quantity > 0 ? "+" : ""}{formatInventoryQty(movement.qtyBase)} <span className="text-xs font-normal text-neutral-muted">{movement.baseUnit}</span></td><td className="px-5 py-4 text-neutral-muted">{movement.createdBy ?? "System"}</td></tr>; })}{rows.length === 0 && <tr><td className="px-5 py-16 text-center text-neutral-muted" colSpan={8}>No stock movements found.</td></tr>}</tbody></table></div></section>;
}
