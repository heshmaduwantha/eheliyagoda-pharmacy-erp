"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Ban, CheckCircle2, Loader2 } from "lucide-react";
import type { FormState } from "@/lib/forms";
import { voidGrnAction } from "./actions";

export function VoidGrnButton({
  grnId,
  disabled,
  isDraft,
}: {
  grnId: string;
  disabled?: boolean;
  isDraft?: boolean;
}) {
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

  if (disabled) return null;

  const buttonText = "Cancel draft";
  const modalTitle = "Cancel Draft Confirmation";
  const modalDesc = "This action will mark the draft GRN as cancelled.";
  const modalQuestion = "Are you sure you want to cancel this draft GRN?";
  const actionButtonText = "Yes, Cancel Draft";

  return (
    <>
      <button
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
        onClick={() => setConfirming(true)}
        type="button"
      >
        <Ban className="size-3.5" />
        {buttonText}
      </button>

      {result.status === "error" && (
        <p className="mt-2 flex items-center gap-2 rounded-lg border border-red-200 bg-status-danger-bg px-3 py-2 text-xs font-semibold text-status-danger-text">
          <AlertCircle className="size-3.5" />{result.message}
        </p>
      )}
      {result.status === "success" && (
        <p className="mt-2 flex items-center gap-2 rounded-lg border border-status-success-bg bg-status-success-bg px-3 py-2 text-xs font-semibold text-status-success-text">
          <CheckCircle2 className="size-3.5" />{result.message}
        </p>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-neutral-border bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-red-100 text-red-600">
                <Ban className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-text">{modalTitle}</h3>
                <p className="text-xs text-neutral-muted">{modalDesc}</p>
              </div>
            </div>

            <p className="text-xs font-medium text-neutral-muted">
              {modalQuestion}
            </p>

            <input
              type="text"
              placeholder="Reason for cancelling (optional)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-neutral-border bg-slate-50 px-3.5 py-2 text-xs text-neutral-text focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                className="rounded-xl border border-neutral-border bg-white px-4 py-2 text-xs font-bold text-neutral-muted hover:bg-slate-50"
                disabled={pending}
                onClick={() => setConfirming(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
                disabled={pending}
                onClick={onVoid}
                type="button"
              >
                {pending && <Loader2 className="size-3.5 animate-spin" />}
                {actionButtonText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
