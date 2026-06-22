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
};

export function CartLine({ line, onQuantityChange, onSelectUnit, onRemove }: Props) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex gap-3"><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{line.productName}</h3><p className="mt-0.5 text-xs text-slate-400">{line.primaryBarcode ? `Barcode: ${line.primaryBarcode}` : "No primary barcode"}</p></div><button aria-label={`Remove ${line.productName}`} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500" onClick={() => onRemove(line.id)} type="button"><Trash2 className="size-4" /></button></div><div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-3"><div className="flex items-center rounded-xl border border-slate-200"><button aria-label="Decrease quantity" className="grid size-9 place-items-center text-slate-500 hover:bg-slate-50" onClick={() => onQuantityChange(line.id, line.quantity - 1)} type="button"><Minus className="size-3.5" /></button><input aria-label="Quantity" className="w-12 border-x border-slate-200 py-2 text-center text-sm font-bold outline-none" min="1" onChange={(event) => onQuantityChange(line.id, Number(event.target.value))} type="number" value={line.quantity} /><button aria-label="Increase quantity" className="grid size-9 place-items-center text-slate-500 hover:bg-slate-50" onClick={() => onQuantityChange(line.id, line.quantity + 1)} type="button"><Plus className="size-3.5" /></button></div><button className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:border-teal-300" onClick={() => onSelectUnit(line)} type="button"><span>{line.unitLabel}</span><RefreshCw className="size-3.5 text-teal-600" /></button><div className="text-right"><p className="text-xs text-slate-400">{formatLkr(line.unitPrice)} each</p><p className="font-black text-teal-700">{formatLkr(line.lineTotal)}</p></div></div><div className="mt-3"><BatchPreviewCard batch={line.batchPreview} /></div></div></div></article>;
}
