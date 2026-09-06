"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, PackageCheck, AlertCircle, CalendarClock } from "lucide-react";
import type { PosBatchPreview } from "@/modules/sales/pos.types";
import { formatLkr } from "@/modules/sales/pos.utils";

type Props = {
  batch?: PosBatchPreview;
  error?: boolean;
  onRetry?: () => void;
  selectedBatchId?: string;
  onChange?: (batchId: string) => void;
};

function isExpiringSoon(expiryDate: string | null) {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 180;
}

function isExpired(expiryDate: string | null) {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return expiry < now;
}

export function BatchPreviewCard({ batch, selectedBatchId, onChange, error, onRetry }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-status-warning-bg bg-status-warning-bg px-2.5 py-1 text-[11px] text-status-warning-text flex items-center justify-between">
        <span>Could not load batch.</span>
        <button type="button" onClick={onRetry} className="font-bold underline ml-1">Retry</button>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-border bg-neutral-bg px-2.5 py-1 text-[11px] text-neutral-muted">
        Loading batch details…
      </div>
    );
  }

  if (batch.candidates.length === 0) {
    return (
      <div className="rounded-lg border border-status-warning-bg bg-status-warning-bg px-2.5 py-1 text-[11px] text-status-warning-text">
        No sellable active stock.
      </div>
    );
  }

  const currentBatchId = selectedBatchId ?? batch.candidates[0]?.id;
  const candidate = batch.candidates.find((b) => b.id === currentBatchId) ?? batch.candidates[0];

  const expiringSoon = isExpiringSoon(candidate.expiryDate);
  const expired = isExpired(candidate.expiryDate);
  const canFulfilCandidate = Number(candidate.availableQtyBase) >= Number(batch.requestedQtyBase);

  return (
    <div className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
      canFulfilCandidate ? "border-neutral-border bg-neutral-bg/60" : "border-status-warning-bg bg-status-warning-bg"
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <PackageCheck className="size-3.5 text-brand-default shrink-0" />
          {batch.candidates.length > 1 ? (
            <select
              aria-label="Select Batch"
              className="min-w-0 flex-1 rounded-md border border-neutral-border bg-white py-0.5 px-1.5 text-xs font-semibold text-neutral-text outline-none focus:border-brand-default focus:ring-1 focus:ring-brand-default/40 truncate"
              value={currentBatchId}
              onChange={(e) => onChange?.(e.target.value)}
            >
              {batch.candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.batchNumber ?? "No Batch"} (Exp: {c.expiryDate ?? "N/A"}) — Stock: {c.availableQtyBase}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-semibold text-neutral-text truncate text-[11px]">
              {candidate.batchNumber ?? "Auto Batch"}
              <span className="text-neutral-muted font-normal ml-1">
                (Exp: {candidate.expiryDate ?? "—"})
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!canFulfilCandidate && (
            <span className="text-[10px] font-bold text-status-danger-text">Low Stock</span>
          )}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-0.5 text-[10px] font-medium text-neutral-muted hover:text-brand-default transition-colors"
          >
            <span>{showDetails ? "Hide" : "Details"}</span>
            {showDetails ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-2 pt-2 border-t border-neutral-border/60 flex flex-col gap-1 text-[11px]">
          <div className="flex justify-between items-center text-neutral-muted">
            <span>MRP ({batch.unitName}):</span>
            <span className="font-semibold text-neutral-text">
              {candidate.mrp ? formatLkr(Number(candidate.mrp)) : "—"}
            </span>
          </div>
          <div className="flex justify-between items-center text-neutral-muted">
            <span>Available Base Qty:</span>
            <span className="font-semibold text-neutral-text">{candidate.availableQtyBase}</span>
          </div>
          <div className="flex justify-between items-center text-neutral-muted">
            <span>Expiry Status:</span>
            <span className={`font-semibold flex items-center gap-1 ${
              expired ? "text-status-danger-text" : expiringSoon ? "text-amber-600" : "text-neutral-text"
            }`}>
              {(expired || expiringSoon) && <AlertCircle className="size-3 shrink-0" />}
              {expired ? "Expired" : expiringSoon ? "Expiring Soon" : candidate.expiryDate ?? "No Expiry"}
            </span>
          </div>
          {!selectedBatchId && (
            <p className="mt-0.5 text-[10px] text-neutral-muted italic">
              Auto-selected by FEFO (earliest expiry first).
            </p>
          )}
        </div>
      )}
    </div>
  );
}

