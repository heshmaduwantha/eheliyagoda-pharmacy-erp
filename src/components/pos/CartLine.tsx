"use client";

import { Minus, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { PosCartLine } from "@/modules/sales/pos.types";
import { formatLkr } from "@/modules/sales/pos.utils";
import { BatchPreviewCard } from "./BatchPreviewCard";

type Props = {
  line: PosCartLine;
  onQuantityChange: (lineId: string, quantity: number) => void;
  onSelectUnit: (line: PosCartLine) => void;
  onRemove: (lineId: string) => void;
  onChangeBatch: (lineId: string, batchId: string) => void;
};

export function CartLine({ line, onQuantityChange, onSelectUnit, onRemove, onChangeBatch }: Props) {
  return <article className="rounded-xl border border-neutral-border bg-neutral-surface p-3 shadow-sm"><div className="flex gap-3"><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="font-bold text-sm text-neutral-text line-clamp-1">{line.productName}</h3><p className="mt-0.5 text-[10px] text-neutral-muted truncate">{line.primaryBarcode ? `Barcode: ${line.primaryBarcode}` : "No primary barcode"}</p></div><button aria-label={`Remove ${line.productName}`} className="grid size-7 shrink-0 place-items-center rounded-lg text-neutral-muted hover:bg-status-danger-bg hover:text-status-danger-text" onClick={() => onRemove(line.id)} type="button"><Trash2 className="size-4" /></button></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><div className="flex h-8 items-center rounded-lg border border-neutral-border"><button aria-label="Decrease quantity" className="grid size-8 place-items-center text-neutral-muted hover:bg-neutral-bg" onClick={() => onQuantityChange(line.id, line.quantity - 1)} type="button"><Minus className="size-3" /></button><input aria-label="Quantity" className="w-10 border-x border-neutral-border bg-transparent text-center text-xs font-bold outline-none" min="1" onChange={(event) => onQuantityChange(line.id, Number(event.target.value))} type="number" value={line.quantity} /><button aria-label="Increase quantity" className="grid size-8 place-items-center text-neutral-muted hover:bg-neutral-bg" onClick={() => onQuantityChange(line.id, line.quantity + 1)} type="button"><Plus className="size-3" /></button></div><button className="flex h-8 items-center justify-between gap-1.5 rounded-lg border border-neutral-border px-2 text-left text-xs font-semibold text-neutral-text hover:border-brand-default/20" onClick={() => onSelectUnit(line)} type="button"><span className="truncate max-w-[60px]">{line.unitLabel}</span><RefreshCw className="size-3 text-brand-default shrink-0" /></button></div><div className="text-right ml-auto pl-2"><p className="text-[11px] font-medium text-neutral-muted">{formatLkr(line.unitPrice)}</p><p className="text-base font-black text-brand-default tracking-tight">{formatLkr(line.lineTotal)}</p></div></div><div className="mt-2"><BatchPreviewCard batch={line.batchPreview} selectedBatchId={line.selectedBatchId} onChange={(batchId) => onChangeBatch(line.id, batchId)} /></div></div></div></article>;
}
