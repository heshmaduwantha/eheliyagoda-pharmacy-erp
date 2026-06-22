"use client";

import { X } from "lucide-react";
import type { PosCartLine, PosUnitOption } from "@/modules/sales/pos.types";
import { formatLkr } from "@/modules/sales/pos.utils";

export function UnitSelectorModal({ line, onClose, onSelect }: { line: PosCartLine | null; onClose: () => void; onSelect: (lineId: string, unit: PosUnitOption) => void }) {
  if (!line) return null;
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm" role="presentation"><section aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" role="dialog"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Unit selection</p><h2 className="mt-1 text-xl font-black text-slate-900">{line.productName}</h2></div><button aria-label="Close" className="grid size-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100" onClick={onClose} type="button"><X className="size-5" /></button></div><div className="mt-5 grid gap-2">{line.availableUnits.map((unit) => <button className={`flex items-center justify-between rounded-xl border p-4 text-left ${unit.id === line.unitId ? "border-teal-400 bg-teal-50" : "border-slate-200 hover:border-teal-200"}`} key={unit.id} onClick={() => { onSelect(line.id, unit); onClose(); }} type="button"><span><strong className="block text-slate-800">{unit.unitName}</strong><span className="mt-1 block text-xs text-slate-400">{unit.factorToBase} base units</span></span><strong className="text-teal-700">{unit.sellingPrice ? formatLkr(Number(unit.sellingPrice)) : "Price pending"}</strong></button>)}</div></section></div>;
}
