import type { StockMovementRecord, StockMovementType } from "@/modules/inventory/inventory.types";
import { formatInventoryQty, formatMovementDate } from "@/modules/inventory/inventory.utils";

const movementStyle: Record<StockMovementType, string> = {
  GRN_IN: "bg-emerald-50 text-emerald-700",
  SALE_OUT: "bg-blue-50 text-blue-700",
  RETURN_IN: "bg-cyan-50 text-cyan-700",
  WRITE_OFF: "bg-red-50 text-red-700",
  ADJUSTMENT: "bg-amber-50 text-amber-700",
};

export function StockMovementTable({ rows }: { rows: StockMovementRecord[] }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,51,58,.05)]"><div className="overflow-x-auto"><table className="w-full min-w-[1000px] border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{["Date", "Product", "Batch", "Movement Type", "Qty Base", "Reference", "Created By"].map((heading) => <th className="border-b border-slate-200 px-5 py-4 font-bold" key={heading}>{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((movement) => { const quantity = Number(movement.qtyBase); return <tr className="hover:bg-teal-50/30" key={movement.id}><td className="px-5 py-4 text-slate-500">{formatMovementDate(movement.occurredAt)}</td><td className="px-5 py-4 font-bold text-slate-800">{movement.productName}</td><td className="px-5 py-4 font-semibold text-slate-600">{movement.batchNumber ?? "—"}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${movementStyle[movement.movementType]}`}>{movement.movementType}</span></td><td className={`px-5 py-4 font-black ${quantity >= 0 ? "text-emerald-600" : "text-red-600"}`}>{quantity > 0 ? "+" : ""}{formatInventoryQty(movement.qtyBase)} <span className="text-xs font-normal text-slate-400">{movement.baseUnit}</span></td><td className="px-5 py-4 text-slate-600">{movement.reference}</td><td className="px-5 py-4 text-slate-600">{movement.createdBy ?? "System"}</td></tr>; })}{rows.length === 0 && <tr><td className="px-5 py-16 text-center text-slate-400" colSpan={7}>No stock movements found.</td></tr>}</tbody></table></div></section>;
}
