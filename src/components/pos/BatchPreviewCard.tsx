import { CalendarClock, PackageCheck, AlertCircle } from "lucide-react";
import type { PosBatchPreview } from "@/modules/sales/pos.types";
import { formatLkr } from "@/modules/sales/pos.utils";
import { getExpiryStatus } from "@/modules/inventory/expiry";

type Props = {
  batch?: PosBatchPreview;
  selectedBatchId?: string;
  onChange?: (batchId: string) => void;
};

export function BatchPreviewCard({ batch, selectedBatchId, onChange }: Props) {
  if (!batch) return <div className="rounded-lg border border-dashed border-neutral-border bg-neutral-bg px-3 py-2 text-xs text-neutral-muted">No active batch preview available</div>;
  
  if (batch.candidates.length === 0) return <div className="rounded-lg border border-status-warning-bg bg-status-warning-bg px-3 py-2 text-xs text-status-warning-text">No sellable active stock. Preview only; no stock is reserved.</div>;

  const currentBatchId = selectedBatchId ?? batch.candidates[0]?.id;
  const candidate = batch.candidates.find(b => b.id === currentBatchId) ?? batch.candidates[0];

  const expiryStatus = getExpiryStatus(candidate.expiryDate);
  const expiringSoon = expiryStatus === "CRITICAL_EXPIRY" || expiryStatus === "NEAR_EXPIRY";
  const expired = expiryStatus === "EXPIRED";

  const canFulfilCandidate = Number(candidate.availableQtyBase) >= Number(batch.requestedQtyBase);

  return (
    <div className={`flex flex-col gap-2 rounded-xl border p-2.5 text-[11px] ${canFulfilCandidate ? "border-brand-default/20 bg-brand-pale/60" : "border-status-warning-bg bg-status-warning-bg"}`}>
      {batch.candidates.length > 1 ? (
        <select 
          className="w-full rounded-md border border-brand-default/20 bg-white pl-2 pr-8 py-1.5 text-xs text-neutral-text outline-none focus:border-brand-default focus:ring-1 focus:ring-brand-default text-ellipsis overflow-hidden"
          value={currentBatchId}
          onChange={(e) => onChange?.(e.target.value)}
        >
          {batch.candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.batchNumber ?? "No batch"} — {c.expiryDate ? `Exp: ${c.expiryDate}` : "No exp"} — Qty: {c.availableQtyBase} — {formatLkr(Number(c.sellingPrice))}
            </option>
          ))}
        </select>
      ) : null}

      <div className="flex flex-col gap-1.5 mt-0.5">
        <div className="flex justify-between items-start gap-2">
          <span className="flex items-center gap-1.5 text-neutral-muted">
            <PackageCheck className="size-3.5 text-brand-default shrink-0" />
            <span className="truncate">{candidate.batchNumber ?? "No batch number"}</span>
          </span>
          <span className="text-right font-semibold text-neutral-text shrink-0">
            {batch.unitName} MRP {candidate.mrp ? formatLkr(Number(candidate.mrp)) : "—"}
          </span>
        </div>
        
        <div className="flex justify-between items-center gap-2">
          <span className={`flex items-center gap-1.5 ${expired ? 'text-status-danger-text font-bold' : expiringSoon ? 'text-status-orange-text font-bold' : 'text-neutral-muted'}`}>
            {expired || expiringSoon ? <AlertCircle className="size-3.5 shrink-0" /> : <CalendarClock className="size-3.5 text-amber-500 shrink-0" />}
            Exp {candidate.expiryDate ?? "—"}
          </span>
          <span className="text-right text-neutral-muted shrink-0">
            Available {candidate.availableQtyBase}
          </span>
        </div>
      </div>
      
      {!selectedBatchId && (
        <span className="text-neutral-muted">Oldest batch auto-selected · {batch.canFulfil ? "stock available" : "insufficient stock"}</span>
      )}
      {selectedBatchId && !canFulfilCandidate && (
        <span className="text-status-danger-text font-semibold">Insufficient quantity in selected batch.</span>
      )}
    </div>
  );
}
