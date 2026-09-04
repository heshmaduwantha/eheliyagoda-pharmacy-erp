"use client";

import { useState } from "react";
import { X, CheckCircle2, DollarSign, FileText } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { processSupplierReturnSettlementAction } from "@/modules/inventory/inventory.actions";

export type SupplierReturnModalItem = {
  id: string;
  returnNumber: string;
  supplierName: string;
  productName: string;
  totalCost: string;
  supplierOpenInvoices: {
    id: string;
    invoiceNo: string;
    totalAmount: string;
    paidAmount: string;
    balanceDue: string;
  }[];
};

type Props = {
  item: SupplierReturnModalItem;
  onClose: () => void;
};

export function ProcessSupplierReturnModal({ item, onClose }: Props) {
  const [action, setAction] = useState<"REFUND_RECEIVED" | "DEDUCT_INVOICE">(
    item.supplierOpenInvoices.length > 0 ? "DEDUCT_INVOICE" : "REFUND_RECEIVED"
  );
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    item.supplierOpenInvoices[0]?.id ?? ""
  );
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (action === "DEDUCT_INVOICE" && !selectedInvoiceId) {
        throw new Error("Please select an open supplier invoice.");
      }

      const res = await processSupplierReturnSettlementAction({
        returnId: item.id,
        action,
        invoiceId: action === "DEDUCT_INVOICE" ? selectedInvoiceId : undefined,
        paymentMethod: action === "REFUND_RECEIVED" ? paymentMethod : undefined,
        notes: notes.trim() || undefined,
      });

      if (!res.ok) throw new Error("Failed to process settlement.");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-border bg-neutral-surface shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-border bg-brand-pale/40 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-text">
              Process Return Settlement
            </h2>
            <p className="text-xs font-mono font-semibold text-brand-default">
              #{item.returnNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-muted hover:bg-neutral-bg hover:text-neutral-text transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Summary Box */}
          <div className="rounded-xl border border-neutral-border/70 bg-neutral-bg p-4 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-neutral-muted">
                {item.supplierName}
              </p>
              <p className="text-sm font-semibold text-neutral-text">
                {item.productName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-neutral-muted">Refund Amount</p>
              <p className="text-lg font-bold text-status-success-text">
                {formatMoney(item.totalCost)}
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* Action Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-muted">
              Settlement Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAction("DEDUCT_INVOICE")}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition ${
                  action === "DEDUCT_INVOICE"
                    ? "border-brand-default bg-brand-pale text-brand-hover shadow-sm"
                    : "border-neutral-border bg-neutral-surface text-neutral-muted hover:border-neutral-muted"
                }`}
              >
                <FileText className="size-4" />
                Deduct from Invoice
              </button>

              <button
                type="button"
                onClick={() => setAction("REFUND_RECEIVED")}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition ${
                  action === "REFUND_RECEIVED"
                    ? "border-brand-default bg-brand-pale text-brand-hover shadow-sm"
                    : "border-neutral-border bg-neutral-surface text-neutral-muted hover:border-neutral-muted"
                }`}
              >
                <DollarSign className="size-4" />
                Cash / Bank Refund
              </button>
            </div>
          </div>

          {/* Option A: Deduct Invoice details */}
          {action === "DEDUCT_INVOICE" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-muted">
                Select Supplier Invoice
              </label>
              {item.supplierOpenInvoices.length > 0 ? (
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-border bg-neutral-surface px-3 py-2 text-sm font-semibold outline-none focus:border-brand-default"
                >
                  {item.supplierOpenInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      Invoice #{inv.invoiceNo} — Balance Due: {formatMoney(inv.balanceDue)}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs font-medium text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                  No open invoices found for {item.supplierName}. You can mark this as Cash / Bank Refund instead.
                </p>
              )}
            </div>
          )}

          {/* Option B: Refund Method */}
          {action === "REFUND_RECEIVED" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-muted">
                Payment Type Received
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-text cursor-pointer">
                  <input
                    type="radio"
                    name="pm"
                    checked={paymentMethod === "CASH"}
                    onChange={() => setPaymentMethod("CASH")}
                    className="accent-brand-default"
                  />
                  Cash
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-text cursor-pointer">
                  <input
                    type="radio"
                    name="pm"
                    checked={paymentMethod === "CARD"}
                    onChange={() => setPaymentMethod("CARD")}
                    className="accent-brand-default"
                  />
                  Bank / Card Transfer
                </label>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-muted">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add optional notes or reference numbers..."
              className="w-full rounded-xl border border-neutral-border bg-neutral-surface px-3 py-2 text-sm outline-none focus:border-brand-default"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-neutral-muted hover:bg-neutral-bg hover:text-neutral-text transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (action === "DEDUCT_INVOICE" && !selectedInvoiceId)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-default px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-hover disabled:opacity-50 transition"
            >
              <CheckCircle2 className="size-4" />
              {isSubmitting ? "Processing..." : "Confirm Settlement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
