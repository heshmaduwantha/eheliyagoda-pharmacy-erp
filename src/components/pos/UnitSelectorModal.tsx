"use client";

import { X } from "lucide-react";
import type { PosCartLine, PosUnitOption } from "@/modules/sales/pos.types";
import { formatLkr } from "@/modules/sales/pos.utils";

export function UnitSelectorModal({ line, onClose, onSelect }: { line: PosCartLine | null; onClose: () => void; onSelect: (lineId: string, unit: PosUnitOption) => void }) {
  if (!line) return null;
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm" role="presentation"><section aria-modal="true" className="w-full max-w-md rounded-3xl bg-neutral-surface p-6 shadow-2xl" role="dialog"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-brand-default">Unit selection</p><h2 className="mt-1 text-xl font-black text-neutral-text">{line.productName}</h2></div><button aria-label="Close" className="grid size-9 place-items-center rounded-full text-neutral-muted hover:bg-slate-100" onClick={onClose} type="button"><X className="size-5" /></button></div><div className="mt-5 grid gap-2">{line.availableUnits.map((unit) => <button className={`flex items-center justify-between rounded-xl border p-4 text-left ${unit.id === line.unitId ? "border-brand-default bg-brand-pale" : "border-neutral-border hover:border-brand-default/20"}`} key={unit.id} onClick={() => { onSelect(line.id, unit); onClose(); }} type="button"><span><strong className="block text-neutral-text">{unit.unitName}</strong><span className="mt-1 block text-xs text-neutral-muted">{unit.factorToBase} base units</span></span><strong className="text-brand-default">{unit.sellingPrice ? formatLkr(Number(unit.sellingPrice)) : "Price pending"}</strong></button>)}</div></section></div>;
}
