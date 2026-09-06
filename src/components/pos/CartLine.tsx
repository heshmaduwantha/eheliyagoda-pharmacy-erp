"use client";

import { useEffect, useState } from "react";
import { getPosBatchPreviewAction } from "@/modules/sales/pos.actions";
import { startBatchPreviewRequest } from "@/modules/sales/batch-preview-request";
import { Minus, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { PosCartLine } from "@/modules/sales/pos.types";
import { formatLkr } from "@/modules/sales/pos.utils";
import { BatchPreviewCard } from "./BatchPreviewCard";

type Props = {
  line: PosCartLine;
  onQuantityChange: (lineId: string, quantity: number) => void;
  onSelectUnit: (line: PosCartLine) => void;
  onRemove: (lineId: string) => void;
  onBatchPreview: (lineId: string, quantity: number, preview: PosCartLine["batchPreview"]) => void;
  onChangeBatch: (lineId: string, batchId: string) => void;
};

export function CartLine({ line, onQuantityChange, onSelectUnit, onRemove, onChangeBatch, onBatchPreview }: Props) {
  const [previewError, setPreviewError] = useState(false);
  const [retry, setRetry] = useState(0);
  const { id, productId, unitId, quantity } = line;
  useEffect(() => {
    setPreviewError(false);
    return startBatchPreviewRequest(
      () => getPosBatchPreviewAction(productId, unitId, String(quantity)),
      (preview) => onBatchPreview(id, quantity, preview),
      () => setPreviewError(true),
    );
  }, [id, productId, unitId, quantity, retry, onBatchPreview]);

  return (
    <article className="rounded-xl border border-neutral-border bg-neutral-surface p-3 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm text-neutral-text truncate" title={line.productName}>{line.productName}</h3>
              {line.primaryBarcode ? (
                <p className="text-[10px] text-neutral-muted truncate" title={line.primaryBarcode}>
                  Barcode: {line.primaryBarcode}
                </p>
              ) : null}
            </div>
            <button
              aria-label={`Remove ${line.productName}`}
              className="grid size-6 shrink-0 place-items-center rounded-lg text-neutral-muted transition-colors hover:bg-status-danger-bg hover:text-status-danger-text"
              onClick={() => onRemove(line.id)}
              type="button"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="flex h-8 items-center rounded-lg border border-neutral-border bg-white">
                <button
                  aria-label="Decrease quantity"
                  className="grid size-8 place-items-center text-neutral-muted transition-colors hover:bg-neutral-bg"
                  onClick={() => onQuantityChange(line.id, line.quantity - 1)}
                  type="button"
                >
                  <Minus className="size-3" />
                </button>
                <input
                  aria-label="Quantity"
                  className="w-10 border-x border-neutral-border bg-transparent text-center text-xs font-bold outline-none"
                  min="1"
                  step="1"
                  aria-keyshortcuts="ArrowUp ArrowDown"
                  onChange={(event) => onQuantityChange(line.id, Number(event.target.value))}
                  type="number"
                  value={line.quantity}
                />
                <button
                  aria-label="Increase quantity"
                  className="grid size-8 place-items-center text-neutral-muted transition-colors hover:bg-neutral-bg"
                  onClick={() => onQuantityChange(line.id, line.quantity + 1)}
                  type="button"
                >
                  <Plus className="size-3" />
                </button>
              </div>
              <button
                className="flex h-8 items-center justify-between gap-1.5 rounded-lg border border-neutral-border bg-white px-2.5 text-left text-xs font-semibold text-neutral-text transition-colors hover:border-brand-default/40"
                onClick={() => onSelectUnit(line)}
                type="button"
              >
                <span className="truncate max-w-[64px]">{line.unitLabel}</span>
                <RefreshCw className="size-3 text-brand-default shrink-0" />
              </button>
            </div>

            <div className="text-right shrink-0">
              <p className="text-[10px] font-medium text-neutral-muted">{formatLkr(line.unitPrice)}</p>
              <p className="text-sm font-black text-brand-default tracking-tight">{formatLkr(line.lineTotal)}</p>
            </div>
          </div>

          <div className="mt-2">
            <BatchPreviewCard
              batch={line.batchPreview}
              error={previewError}
              onRetry={() => setRetry((value) => value + 1)}
              selectedBatchId={line.selectedBatchId}
              onChange={(batchId) => onChangeBatch(line.id, batchId)}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
