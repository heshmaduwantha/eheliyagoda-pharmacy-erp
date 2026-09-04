"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Ban, CheckCircle2, Loader2 } from "lucide-react";
import type { FormState } from "@/lib/forms";
import { voidGrnAction } from "./actions";

export function VoidGrnButton({ grnId }: { grnId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<FormState>({ status: "idle" });
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");

  const onVoid = () =>
    startTransition(async () => {
      const res = await voidGrnAction(grnId, reason);
      setResult(res);
      setConfirming(false);
    });

  return (
    <div className="grid gap-3">
      {result.status === "error" && (
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-status-danger-bg px-3.5 py-2.5 text-sm font-semibold text-status-danger-text">
          <AlertCircle className="size-4" />{result.message}
        </p>
      )}
      {result.status === "success" && (
        <p className="flex items-center gap-2 rounded-xl border border-status-success-bg bg-status-success-bg px-3.5 py-2.5 text-sm font-semibold text-status-success-text">
          <CheckCircle2 className="size-4" />{result.message}
        </p>
      )}

      {confirming ? (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-red-800">
            <Ban className="size-4 text-red-600" />
            Are you sure you want to void this GRN? This will reverse all stock entries and cancel any unpaid supplier invoice.
          </p>

          <input
            type="text"
            placeholder="Reason for voiding (optional)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs text-neutral-text focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          <div className="flex gap-2">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
              disabled={pending}
              onClick={onVoid}
              type="button"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Yes, Void GRN
            </button>
            <button className="rounded-lg border border-neutral-border bg-white px-4 py-2 text-sm font-bold text-neutral-muted hover:bg-slate-50" disabled={pending} onClick={() => setConfirming(false)} type="button">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
          onClick={() => setConfirming(true)}
          type="button"
        >
          <Ban className="size-4" />
          Void GRN
        </button>
      )}
    </div>
  );
}
