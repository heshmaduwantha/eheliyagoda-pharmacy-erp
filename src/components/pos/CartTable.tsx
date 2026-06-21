"use client";

import { ShoppingBasket } from "lucide-react";
import type { PosCartLine } from "@/modules/sales/pos.types";
import { CartLine } from "./CartLine";

type Props = {
  lines: PosCartLine[];
  onQuantityChange: (lineId: string, quantity: number) => void;
  onSelectUnit: (line: PosCartLine) => void;
  onRemove: (lineId: string) => void;
};

export function CartTable(props: Props) {
  return <section><div className="mb-3 flex items-center justify-between"><div><h2 className="font-black text-slate-900">Current cart</h2><p className="mt-1 text-xs text-slate-500">{props.lines.length} line{props.lines.length === 1 ? "" : "s"}</p></div><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><ShoppingBasket className="size-5" /></span></div><div className="grid max-h-[600px] gap-3 overflow-y-auto pr-1">{props.lines.map((line) => <CartLine key={line.id} line={line} onQuantityChange={props.onQuantityChange} onRemove={props.onRemove} onSelectUnit={props.onSelectUnit} />)}{props.lines.length === 0 && <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center"><div><ShoppingBasket className="mx-auto size-10 text-slate-300" /><h3 className="mt-4 font-bold text-slate-700">Cart is empty</h3><p className="mt-2 text-sm text-slate-400">Scan a barcode or choose a mock product.</p></div></div>}</div></section>;
}
