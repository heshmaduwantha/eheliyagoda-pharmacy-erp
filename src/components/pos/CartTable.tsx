"use client";

import { ShoppingCart } from "lucide-react";
import type { PosCartLine } from "@/modules/sales/pos.types";
import { CartLine } from "./CartLine";

type Props = {
  lines: PosCartLine[];
  onQuantityChange: (lineId: string, quantity: number) => void;
  onSelectUnit: (line: PosCartLine) => void;
  onRemove: (lineId: string) => void;
  onBatchPreview: (lineId: string, quantity: number, preview: PosCartLine["batchPreview"]) => void;
  onChangeBatch: (lineId: string, batchId: string) => void;
};

export function CartTable(props: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-3 flex items-center justify-between border-b border-neutral-border pb-2.5 px-1">
        <h2 className="font-black text-sm text-neutral-text uppercase tracking-wider">Current bill</h2>
        <span className="text-xs font-semibold text-neutral-muted">{props.lines.length} line{props.lines.length === 1 ? "" : "s"}</span>
      </div>

      <div className="px-1 flex flex-col gap-2">
        {props.lines.map((line) => (
          <CartLine 
            key={line.id} 
            line={line} 
            onQuantityChange={props.onQuantityChange} 
            onRemove={props.onRemove} 
            onSelectUnit={props.onSelectUnit} 
            onChangeBatch={props.onChangeBatch}
            onBatchPreview={props.onBatchPreview}
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
