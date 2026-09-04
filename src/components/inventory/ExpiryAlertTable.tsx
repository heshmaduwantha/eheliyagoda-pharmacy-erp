"use client";

import { useState } from "react";
import { AlertOctagon, RotateCcw, ShieldAlert } from "lucide-react";
import type { ExpiryAlertRecord, ExpiryAlertState } from "@/modules/inventory/inventory.types";
import { formatInventoryDate, formatInventoryQty } from "@/modules/inventory/inventory.utils";
import { SupplierReturnModal } from "./SupplierReturnModal";
import { depriveExpiredBatchesAction } from "@/modules/inventory/inventory.actions";

const statusStyle: Record<ExpiryAlertState, { badge: string; label: string }> = {
  EXPIRED: { badge: "bg-status-danger-bg text-status-danger-text border border-red-200", label: "Expired" },
  NEAR_EXPIRY: { badge: "bg-status-warning-bg text-status-warning-text border border-amber-200", label: "Near Expiry" },
  QUARANTINED: { badge: "bg-purple-50 text-purple-700 border border-purple-200", label: "Quarantined" },
};

export function ExpiryAlertTable({ rows }: { rows: ExpiryAlertRecord[] }) {
  const [returnTarget, setReturnTarget] = useState<ExpiryAlertRecord | null>(null);
  const [isDepriving, setIsDepriving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const hasExpiredBatches = rows.some((row) => row.alertState === "EXPIRED" && Number(row.qty) > 0);

  const handleDepriveAllExpired = async () => {
    if (!confirm("Are you sure you want to deprive/quarantine all expired batches from active stock?")) {
      return;
    }
    setIsDepriving(true);
    setNotice(null);
    try {
      const res = await depriveExpiredBatchesAction();
      setNotice(`Deprived ${res.deprivedCount} expired batch(es) from active stock.`);
    } catch {
      setNotice("Failed to deprive expired stock.");
    } finally {
      setIsDepriving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-neutral-border bg-neutral-surface p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <AlertOctagon className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-text">Expiry Stock Management</h2>
            <p className="text-xs text-neutral-muted">Return near-expiry items to suppliers or deprive expired stock from active balance.</p>
          </div>
        </div>

        {hasExpiredBatches ? (
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-status-danger-bg px-4 py-2 text-xs font-bold text-status-danger-text transition hover:bg-red-100 disabled:opacity-50"
            disabled={isDepriving}
            onClick={handleDepriveAllExpired}
            type="button"
          >
            <ShieldAlert className="size-4" />
            {isDepriving ? "Depriving..." : "Deprive All Expired Batches"}
          </button>
        ) : null}
      </div>

      {notice ? (
        <div className="rounded-xl border border-brand-default/20 bg-brand-pale px-4 py-3 text-sm font-semibold text-brand-default">
          {notice}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-neutral-border bg-neutral-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead className="bg-brand-pale text-xs uppercase tracking-wider font-extrabold text-brand-hover border-b border-brand-default/15">
              <tr>
                {["Product", "System Batch", "Supplier Lot", "Expiry Date", "Days Left", "Qty On Hand", "Status", "Actions"].map((heading) => (
                  <th className="px-5 py-3.5 font-extrabold" key={heading}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((alert) => {
                const statusInfo = statusStyle[alert.alertState] ?? statusStyle.NEAR_EXPIRY;
                const canReturn = Number(alert.qty) > 0;

                return (
                  <tr className="transition hover:bg-neutral-bg/60" key={alert.id}>
                    <td className="px-5 py-4 font-bold text-neutral-text">{alert.productName}</td>
                    <td className="px-5 py-4 font-semibold text-neutral-muted">{alert.batchNumber ?? "—"}</td>
                    <td className="px-5 py-4 font-semibold text-neutral-muted">{alert.supplierLotNumber ?? "—"}</td>
                    <td className="px-5 py-4 font-semibold text-neutral-text">{formatInventoryDate(alert.expiryDate)}</td>
                    <td className={`px-5 py-4 font-black ${
                      alert.daysLeft == null
                        ? "text-neutral-muted"
                        : alert.daysLeft < 0
                        ? "text-status-danger-text"
                        : alert.daysLeft <= 90
                        ? "text-amber-600"
                        : "text-neutral-text"
                    }`}>
                      {alert.daysLeft == null
                        ? "—"
                        : alert.daysLeft < 0
                        ? `${Math.abs(alert.daysLeft)} days overdue`
                        : `${alert.daysLeft} days`}
                    </td>
                    <td className="px-5 py-4">
                      <strong className="text-neutral-text">{formatInventoryQty(alert.qty)}</strong>
                      <span className="ml-1 text-xs text-neutral-muted">{alert.baseUnit}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${statusInfo.badge}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {canReturn ? (
                        <button
                          className="inline-flex items-center justify-center whitespace-nowrap gap-1.5 rounded-lg border border-brand-default/20 bg-brand-pale px-3 py-1.5 text-xs font-bold text-brand-default transition hover:bg-brand-default hover:text-white"
                          onClick={() => setReturnTarget(alert)}
                          type="button"
                        >
                          <RotateCcw className="size-3.5" />
                          Return Stock
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-muted italic">Depleted</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td className="px-5 py-16 text-center text-neutral-muted" colSpan={8}>
                    No expiry alerts or near-expiry batches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {returnTarget ? (
        <SupplierReturnModal
          baseUnit={returnTarget.baseUnit}
          batchId={returnTarget.id}
          batchNumber={returnTarget.batchNumber}
          maxQty={Number(returnTarget.qty)}
          onClose={() => setReturnTarget(null)}
          productName={returnTarget.productName}
        />
      ) : null}
    </div>
  );
}
