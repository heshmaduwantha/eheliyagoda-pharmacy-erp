"use client";

import { ShoppingCart } from "lucide-react";
import type { PosCartLine } from "@/modules/sales/pos.types";
import { CartLine } from "./CartLine";

type Props = {
  lines: PosCartLine[];
  onQuantityChange: (lineId: string, quantity: number) => void;
  onSelectUnit: (line: PosCartLine) => void;
  onSelectBatch: (line: PosCartLine) => void;
  onRemove: (lineId: string) => void;
};

export function CartTable(props: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between px-1">
        <h2 className="font-black text-neutral-text">Current cart</h2>
        <span className="text-xs font-semibold text-neutral-muted">{props.lines.length} line{props.lines.length === 1 ? "" : "s"}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-1 flex flex-col gap-3">
        {props.lines.map((line) => (
          <CartLine 
            key={line.id} 
            line={line} 
            onQuantityChange={props.onQuantityChange} 
            onRemove={props.onRemove} 
            onSelectUnit={props.onSelectUnit} 
            onSelectBatch={props.onSelectBatch}
          />
        ))}
        {props.lines.length === 0 && (
          <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
            <ShoppingCart className="size-12 text-slate-300" strokeWidth={1.5} />
            <h3 className="mt-4 text-sm font-semibold text-neutral-muted">Cart is empty</h3>
            <p className="mt-1 text-[11px] text-neutral-muted/70">Scan a barcode or choose a product.</p>
          </div>
        )}
      </div>
    </div>
  );
}
