import { CalendarClock, PackageCheck } from "lucide-react";
import type { PosBatchPreview } from "@/modules/sales/pos.types";
import { formatLkr } from "@/modules/sales/pos.utils";

export function BatchPreviewCard({ batch }: { batch?: PosBatchPreview }) {
  if (!batch) return <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">Batch preview pending</div>;
  return <div className="grid grid-cols-2 gap-2 rounded-xl border border-teal-100 bg-teal-50/60 p-2.5 text-[11px]"><span className="flex items-center gap-1.5 text-slate-600"><PackageCheck className="size-3.5 text-teal-600" />{batch.batchNumber}</span><span className="text-right font-semibold text-slate-700">MRP {formatLkr(batch.mrp)}</span><span className="flex items-center gap-1.5 text-slate-500"><CalendarClock className="size-3.5 text-amber-500" />Exp {batch.expiryDate}</span><span className="text-right text-slate-500">Preview qty {batch.availableQty}</span></div>;
}
