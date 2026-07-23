import { CalendarClock, PackageCheck } from "lucide-react";
import type { PosBatchPreview } from "@/modules/sales/pos.types";
import { formatLkr } from "@/modules/sales/pos.utils";

export function BatchPreviewCard({ batch }: { batch?: PosBatchPreview }) {
  if (!batch) return <div className="rounded-lg border border-dashed border-neutral-border bg-neutral-bg px-3 py-2 text-xs text-neutral-muted">No active batch preview available</div>;
  const candidate = batch.candidates[0];
  if (!candidate) return <div className="rounded-lg border border-status-warning-bg bg-status-warning-bg px-3 py-2 text-xs text-status-warning-text">No sellable active stock. Preview only; no stock is reserved.</div>;
  return <div className={`grid grid-cols-2 gap-2 rounded-xl border p-2.5 text-[11px] ${batch.canFulfil ? "border-brand-default/20 bg-brand-pale/60" : "border-status-warning-bg bg-status-warning-bg"}`}><span className="flex items-center gap-1.5 text-neutral-muted"><PackageCheck className="size-3.5 text-brand-default" />{candidate.batchNumber ?? "No batch number"}</span><span className="text-right font-semibold text-neutral-text">{batch.unitName} MRP {candidate.mrp ? formatLkr(Number(candidate.mrp)) : "—"}</span><span className="flex items-center gap-1.5 text-neutral-muted"><CalendarClock className="size-3.5 text-amber-500" />Exp {candidate.expiryDate ?? "—"}</span><span className="text-right text-neutral-muted">Available {batch.totalAvailableQtyBase}</span><span className="col-span-2 text-neutral-muted">Advisory FEFO preview only · {batch.canFulfil ? "quantity available" : "insufficient quantity"}</span></div>;
}
