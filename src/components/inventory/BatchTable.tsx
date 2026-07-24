"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { removeExpiredBatchAction } from "@/modules/inventory/inventory.actions";
import type { ExpiryStatus, InventoryBatchRecord, InventoryBatchStatus } from "@/modules/inventory/inventory.types";
import { formatInventoryDate, formatInventoryMoney, formatInventoryQty } from "@/modules/inventory/inventory.utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

const statusStyle: Record<InventoryBatchStatus, string> = {
  ACTIVE: "bg-status-success-bg text-status-success-text",
  QUARANTINED: "bg-status-danger-bg text-status-danger-text",
  DEPLETED: "bg-slate-100 text-neutral-muted",
};

const expiryStatusStyle: Record<ExpiryStatus, string> = {
  EXPIRED: "bg-status-danger-bg text-status-danger-text",
  CRITICAL_EXPIRY: "bg-rose-100 text-rose-700",
  NEAR_EXPIRY: "bg-status-warning-bg text-status-warning-text",
  NORMAL: "bg-status-success-bg text-status-success-text",
};

export function BatchTable({ rows }: { rows: InventoryBatchRecord[] }) {
  const [isPending, startTransition] = useTransition();
  const [writeOffBatchId, setWriteOffBatchId] = useState<string | null>(null);

  const handleConfirmRemove = () => {
    if (!writeOffBatchId) return;
    
    startTransition(async () => {
      try {
        await removeExpiredBatchAction(writeOffBatchId);
        toast.success("Expired stock successfully removed!");
        setWriteOffBatchId(null);
      } catch (error) {
        toast.error("Failed to remove batch: " + (error as Error).message);
      }
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-border bg-neutral-surface shadow-[0_8px_30px_rgba(15,51,58,.05)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1320px] border-collapse text-left text-sm">
          <thead className="bg-neutral-bg text-xs uppercase tracking-wider text-neutral-muted">
            <tr>
              {["Product", "System Batch", "Supplier Lot", "Expiry Date", "Expiry status", "MRP", "Cost Price", "Selling Price", "Qty On Hand Base", "Status", "Actions"].map((heading) => (
                <th className="border-b border-neutral-border px-5 py-4 font-bold" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((batch) => {
              const isExpired = batch.expiryStatus === "EXPIRED";
              const canRemove = isExpired && batch.status !== "DEPLETED" && Number(batch.qtyOnHandBase) > 0;

              return (
                <tr className="hover:bg-brand-pale/30" key={batch.id}>
                  <td className="px-5 py-4">
                    <strong className="block text-neutral-text">{batch.productName}</strong>
                    <span className="mt-1 block text-xs text-neutral-muted">
                      {batch.primaryBarcode ? `Barcode: ${batch.primaryBarcode}` : batch.baseUnit}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-neutral-text">{batch.batchNumber ?? "—"}</td>
                  <td className="px-5 py-4 font-semibold text-neutral-muted">{batch.supplierLotNumber ?? "—"}</td>
                  <td className={`px-5 py-4 ${isExpired ? "font-bold text-status-danger-text" : batch.expiryStatus === "CRITICAL_EXPIRY" ? "font-bold text-rose-700" : batch.expiryStatus === "NEAR_EXPIRY" ? "font-bold text-status-warning-text" : "text-neutral-muted"}`}>
                    {formatInventoryDate(batch.expiryDate)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${expiryStatusStyle[batch.expiryStatus]}`}>
                      {batch.expiryStatus === "EXPIRED" ? "Expired" : batch.expiryStatus === "NORMAL" ? "Valid" : batch.expiryDaysRemaining === 0 ? "Expires today" : `Expires in ${batch.expiryDaysRemaining} days`}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-neutral-muted">{formatInventoryMoney(batch.mrp)}</td>
                  <td className="px-5 py-4 text-neutral-muted">{formatInventoryMoney(batch.costPrice)}</td>
                  <td className="px-5 py-4 font-semibold text-neutral-text">{formatInventoryMoney(batch.sellingPrice)}</td>
                  <td className="px-5 py-4">
                    <strong className="text-neutral-text">{formatInventoryQty(batch.qtyOnHandBase)}</strong>
                    <span className="ml-1 text-xs text-neutral-muted">{batch.baseUnit}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[batch.status]}`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {canRemove ? (
                      <button
                        type="button"
                        onClick={() => setWriteOffBatchId(batch.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-status-danger-bg px-3 py-1.5 text-xs font-semibold text-status-danger-text transition-colors hover:bg-red-100 disabled:opacity-50"
                        title="Remove expired stock"
                      >
                        <Trash2 className="size-3.5" />
                        Remove
                      </button>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="px-5 py-16 text-center text-neutral-muted" colSpan={11}>
                  No batches found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!writeOffBatchId}
        onClose={() => setWriteOffBatchId(null)}
        onConfirm={handleConfirmRemove}
        title="Remove expired stock"
        description="Are you sure you want to remove this expired stock? This will deduct the remaining quantity from your stock. This action cannot be undone."
        confirmText="Remove Expired Stock"
        isDestructive={true}
        isPending={isPending}
      />
    </section>
  );
}
