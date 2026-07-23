import { CalendarClock, PackageCheck } from "lucide-react";
import type { PosBatchPreview } from "@/modules/sales/pos.types";
import { formatLkr } from "@/modules/sales/pos.utils";

export function BatchPreviewCard({ batch }: { batch?: PosBatchPreview }) {
  if (!batch) return <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">No active batch preview available</div>;
  const candidate = batch.candidates[0];
  if (!candidate) return <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">No sellable active stock. Preview only; no stock is reserved.</div>;
  return <div className={`grid grid-cols-2 gap-2 rounded-xl border p-2.5 text-[11px] ${batch.canFulfil ? "border-teal-100 bg-teal-50/60" : "border-amber-100 bg-amber-50"}`}><span className="flex items-center gap-1.5 text-slate-600"><PackageCheck className="size-3.5 text-teal-600" />{candidate.batchNumber ?? "No batch number"}</span><span className="text-right font-semibold text-slate-700">{batch.unitName} MRP {candidate.mrp ? formatLkr(Number(candidate.mrp)) : "—"}</span><span className="flex items-center gap-1.5 text-slate-500"><CalendarClock className="size-3.5 text-amber-500" />Exp {candidate.expiryDate ?? "—"}</span><span className="text-right text-slate-500">Available {batch.totalAvailableQtyBase}</span><span className="col-span-2 text-slate-500">Advisory FEFO preview only · {batch.canFulfil ? "quantity available" : "insufficient quantity"}</span></div>;
}
