"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { ProcessSupplierReturnModal, type SupplierReturnModalItem } from "./ProcessSupplierReturnModal";
import { CheckCircle2, Clock, DollarSign } from "lucide-react";

export type SupplierReturnRow = {
  id: string;
  returnNumber: string;
  supplierId: string;
  supplierName: string;
  supplierOpenInvoices: {
    id: string;
    invoiceNo: string;
    totalAmount: string;
    paidAmount: string;
    balanceDue: string;
  }[];
  productName: string;
  baseUnit: string;
  batchNo: string | null;
  supplierBatchNo: string | null;
  expiryDate: string | null;
  qtyBase: string;
  unitCost: string;
  totalCost: string;
  status: string;
  reason: string | null;
  notes: string | null;
  settledAt: string | null;
  settledNotes: string | null;
  returnedBy: string;
  returnedAt: string;
};

type Props = {
  logs: SupplierReturnRow[];
};

export function SupplierReturnsTable({ logs }: Props) {
  const [selectedReturn, setSelectedReturn] = useState<SupplierReturnModalItem | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm text-neutral-muted">
          <thead className="bg-brand-pale text-xs uppercase tracking-wider font-semibold text-brand-hover border-b border-brand-default/15">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Return No.</th>
              <th className="px-5 py-3.5 font-semibold">Supplier</th>
              <th className="px-5 py-3.5 font-semibold">Product & Batch</th>
              <th className="px-5 py-3.5 font-semibold">Qty Returned</th>
              <th className="px-5 py-3.5 font-semibold">Total Value</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 font-semibold">Action / Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 ? (
              <tr>
                <td className="px-5 py-16 text-center text-neutral-muted" colSpan={7}>
                  No supplier return records found.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isPending = log.status === "PENDING";
                const isRefunded = log.status === "REFUNDED";
                const isAdjusted = log.status === "ADJUSTED";

                return (
                  <tr className="transition hover:bg-neutral-bg bg-neutral-surface" key={log.id}>
                    <td className="px-5 py-3.5">
                      <p className="font-mono text-xs font-bold text-brand-default">{log.returnNumber}</p>
                      <p className="text-[11px] text-neutral-muted">{log.returnedAt.slice(0, 10)}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="font-bold text-neutral-text">{log.supplierName}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-neutral-text">{log.productName}</p>
                      <p className="font-mono text-xs text-neutral-muted">Batch: {log.batchNo ?? "—"}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <strong className="text-status-danger-text">{log.qtyBase}</strong>
                      <span className="ml-1 text-xs text-neutral-muted">{log.baseUnit}</span>
                    </td>

                    <td className="px-5 py-3.5 font-black text-neutral-text">
                      {formatMoney(log.totalCost)}
                    </td>

                    <td className="px-5 py-3.5">
                      {isPending && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          <Clock className="size-3" />
                          Pending Settlement
                        </span>
                      )}
                      {isRefunded && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          <DollarSign className="size-3" />
                          Refund Received
                        </span>
                      )}
                      {isAdjusted && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                          <CheckCircle2 className="size-3" />
                          Invoice Adjusted
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {isPending ? (
                        <button
                          onClick={() => setSelectedReturn(log)}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-brand-default/30 bg-brand-pale px-3 py-1.5 text-xs font-bold text-brand-hover shadow-sm transition hover:bg-brand-default hover:text-white"
                        >
                          Process Refund
                        </button>
                      ) : (
                        <p className="text-xs text-neutral-muted line-clamp-2">
                          {log.settledNotes ?? "Settled"}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedReturn && (
        <ProcessSupplierReturnModal
          item={selectedReturn}
          onClose={() => setSelectedReturn(null)}
        />
      )}
    </>
  );
}
