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
        <h2 className="font-semibold text-xs text-neutral-muted uppercase tracking-wider">Current bill</h2>
        <span className="text-xs font-semibold text-neutral-text bg-brand-pale px-2 py-0.5 rounded-md">
          {props.lines.length} {props.lines.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="px-0.5 flex flex-col gap-2">
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
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-neutral-border bg-neutral-bg/20">
            <ShoppingCart className="size-10 text-neutral-muted opacity-40 mb-2" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-neutral-text">Cart is empty</h3>
            <p className="mt-1 text-xs text-neutral-muted">Scan a barcode or select a product.</p>
          </div>
        )}
      </div>
    </div>
  );
}


