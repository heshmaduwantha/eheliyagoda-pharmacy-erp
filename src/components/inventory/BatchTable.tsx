import type { InventoryBatchRecord, InventoryBatchStatus } from "@/modules/inventory/inventory.types";
import { formatInventoryDate, formatInventoryMoney, formatInventoryQty } from "@/modules/inventory/inventory.utils";

const statusStyle: Record<InventoryBatchStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  QUARANTINED: "bg-red-50 text-red-700",
  DEPLETED: "bg-slate-100 text-slate-500",
};

export function BatchTable({ rows }: { rows: InventoryBatchRecord[] }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,51,58,.05)]"><div className="overflow-x-auto"><table className="w-full min-w-[1080px] border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{["Product", "Batch No", "Expiry Date", "MRP", "Cost Price", "Selling Price", "Qty On Hand Base", "Status"].map((heading) => <th className="border-b border-slate-200 px-5 py-4 font-bold" key={heading}>{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((batch) => <tr className="hover:bg-teal-50/30" key={batch.id}><td className="px-5 py-4"><strong className="block text-slate-800">{batch.productName}</strong><span className="mt-1 block text-xs text-slate-400">{batch.primaryBarcode ? `Barcode: ${batch.primaryBarcode}` : batch.baseUnit}</span></td><td className="px-5 py-4 font-semibold text-slate-700">{batch.batchNumber ?? "—"}</td><td className="px-5 py-4 text-slate-600">{formatInventoryDate(batch.expiryDate)}</td><td className="px-5 py-4 text-slate-600">{formatInventoryMoney(batch.mrp)}</td><td className="px-5 py-4 text-slate-600">{formatInventoryMoney(batch.costPrice)}</td><td className="px-5 py-4 font-semibold text-slate-700">{formatInventoryMoney(batch.sellingPrice)}</td><td className="px-5 py-4"><strong className="text-slate-800">{formatInventoryQty(batch.qtyOnHandBase)}</strong><span className="ml-1 text-xs text-slate-400">{batch.baseUnit}</span></td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[batch.status]}`}>{batch.status}</span></td></tr>)}{rows.length === 0 && <tr><td className="px-5 py-16 text-center text-slate-400" colSpan={8}>No batches found.</td></tr>}</tbody></table></div></section>;
}
