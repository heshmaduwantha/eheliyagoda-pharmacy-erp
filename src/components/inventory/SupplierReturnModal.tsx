"use client";

import { useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { createSupplierReturnAction } from "@/modules/inventory/inventory.actions";

type Props = {
  batchId: string;
  productName: string;
  batchNumber: string | null;
  maxQty: number;
  baseUnit: string;
  onClose: () => void;
};

export function SupplierReturnModal({ batchId, productName, batchNumber, maxQty, baseUnit, onClose }: Props) {
  const [qty, setQty] = useState(String(maxQty));
  const [reason, setReason] = useState("Near Expiry Return");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = Number(qty);
    if (!qtyNum || qtyNum <= 0 || qtyNum > maxQty) {
      setError(`Return quantity must be between 0 and ${maxQty}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createSupplierReturnAction({
        batchId,
        qtyBase: qtyNum,
        reason,
        notes,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process supplier return.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-neutral-border bg-neutral-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-border">
          <div className="flex items-center gap-2 text-brand-default font-bold">
            <RotateCcw className="size-5" />
            <h2 className="text-lg text-neutral-text">Return Stock to Supplier</h2>
          </div>
          <button
            aria-label="Close"
            className="rounded-lg p-1 text-neutral-muted hover:bg-neutral-bg hover:text-neutral-text"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
          <div className="rounded-xl border border-neutral-border bg-neutral-bg p-3 text-xs leading-relaxed text-neutral-muted">
            <p className="font-bold text-neutral-text text-sm">{productName}</p>
            <p>Batch: <span className="font-semibold text-neutral-text">{batchNumber ?? "—"}</span></p>
            <p>Available on hand: <span className="font-bold text-brand-default">{maxQty} {baseUnit}</span></p>
          </div>

          <label className="grid gap-1 text-sm font-bold text-neutral-text">
            Quantity to Return ({baseUnit})
            <input
              className="rounded-xl border border-neutral-border px-3 py-2 outline-none focus:border-brand-default"
              max={maxQty}
              min="0.001"
              onChange={(e) => setQty(e.target.value)}
              required
              step="0.001"
              type="number"
              value={qty}
            />
          </label>

          <label className="grid gap-1 text-sm font-bold text-neutral-text">
            Return Reason
            <select
              className="rounded-xl border border-neutral-border px-3 py-2 outline-none focus:border-brand-default bg-neutral-surface"
              onChange={(e) => setReason(e.target.value)}
              value={reason}
            >
              <option value="Near Expiry Return">Near Expiry Return</option>
              <option value="Expired Stock Return">Expired Stock Return</option>
              <option value="Damaged / Quality Issue">Damaged / Quality Issue</option>
              <option value="Supplier Recall">Supplier Recall</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm font-bold text-neutral-text">
            Notes / Reference
            <input
              className="rounded-xl border border-neutral-border px-3 py-2 outline-none focus:border-brand-default"
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Credit note requested"
              value={notes}
            />
          </label>

          {error ? (
            <p className="rounded-xl bg-status-danger-bg p-3 text-xs font-bold text-status-danger-text">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              className="rounded-xl border border-neutral-border px-4 py-2 text-sm font-semibold text-neutral-muted hover:bg-neutral-bg"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-brand-default px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-hover disabled:opacity-50"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Processing..." : "Confirm Return"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
