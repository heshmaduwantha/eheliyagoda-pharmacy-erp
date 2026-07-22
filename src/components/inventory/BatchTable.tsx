"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { removeExpiredBatchAction } from "@/modules/inventory/inventory.actions";
import type { InventoryBatchRecord, InventoryBatchStatus } from "@/modules/inventory/inventory.types";
import { formatInventoryDate, formatInventoryMoney, formatInventoryQty } from "@/modules/inventory/inventory.utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

const statusStyle: Record<InventoryBatchStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  QUARANTINED: "bg-red-50 text-red-700",
  DEPLETED: "bg-slate-100 text-slate-500",
};

export function BatchTable({ rows }: { rows: InventoryBatchRecord[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const [isPending, startTransition] = useTransition();
  const [writeOffBatchId, setWriteOffBatchId] = useState<string | null>(null);

  const handleConfirmRemove = () => {
    if (!writeOffBatchId) return;
    
    startTransition(async () => {
      try {
        await removeExpiredBatchAction(writeOffBatchId);
        toast.success("Batch successfully written off!");
        setWriteOffBatchId(null);
      } catch (error) {
        toast.error("Failed to remove batch: " + (error as Error).message);
      }
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,51,58,.05)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              {["Product", "Batch No", "Expiry Date", "MRP", "Cost Price", "Selling Price", "Qty On Hand Base", "Status", "Actions"].map((heading) => (
                <th className="border-b border-slate-200 px-5 py-4 font-bold" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((batch) => {
              let daysLeft: number | null = null;
              if (batch.expiryDate) {
                const expDate = new Date(batch.expiryDate);
                expDate.setHours(0, 0, 0, 0);
                daysLeft = (expDate.getTime() - todayMs) / (1000 * 60 * 60 * 24);
              }

              let dateColorClass = "text-slate-600";
              const isExpired = daysLeft !== null && daysLeft < 0;
              const isNearExpiry = daysLeft !== null && daysLeft >= 0 && daysLeft <= 90;

              if (batch.status === "ACTIVE" || batch.status === "QUARANTINED") {
                if (isExpired) {
                  dateColorClass = "font-bold text-red-600";
                } else if (isNearExpiry) {
                  dateColorClass = "font-bold text-amber-600";
                }
              }

              const canRemove = isExpired && batch.status !== "DEPLETED" && Number(batch.qtyOnHandBase) > 0;

              return (
                <tr className="hover:bg-teal-50/30" key={batch.id}>
                  <td className="px-5 py-4">
                    <strong className="block text-slate-800">{batch.productName}</strong>
                    <span className="mt-1 block text-xs text-slate-400">
                      {batch.primaryBarcode ? `Barcode: ${batch.primaryBarcode}` : batch.baseUnit}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-700">{batch.batchNumber ?? "—"}</td>
                  <td className={`px-5 py-4 ${dateColorClass}`}>
                    {formatInventoryDate(batch.expiryDate)}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{formatInventoryMoney(batch.mrp)}</td>
                  <td className="px-5 py-4 text-slate-600">{formatInventoryMoney(batch.costPrice)}</td>
                  <td className="px-5 py-4 font-semibold text-slate-700">{formatInventoryMoney(batch.sellingPrice)}</td>
                  <td className="px-5 py-4">
                    <strong className="text-slate-800">{formatInventoryQty(batch.qtyOnHandBase)}</strong>
                    <span className="ml-1 text-xs text-slate-400">{batch.baseUnit}</span>
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
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                        title="Remove expired batch (Write-off)"
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
                <td className="px-5 py-16 text-center text-slate-400" colSpan={9}>
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
        title="Remove expired batch"
        description="Are you sure you want to write-off this expired batch? This will deduct the remaining quantity from your stock. This action cannot be undone."
        confirmText="Write-off Batch"
        isDestructive={true}
        isPending={isPending}
      />
    </section>
  );
}
