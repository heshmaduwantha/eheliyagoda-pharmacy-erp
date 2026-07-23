"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import type { FormState } from "@/lib/forms";
import { confirmGrnAction } from "./actions";

export function ConfirmGrnButton({ grnId }: { grnId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<FormState>({ status: "idle" });
  const [confirming, setConfirming] = useState(false);

  const onConfirm = () =>
    startTransition(async () => {
      const res = await confirmGrnAction(grnId);
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
        <div className="flex flex-col gap-3 rounded-xl border border-status-warning-bg bg-status-warning-bg p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-status-warning-text">
            <ShieldCheck className="size-4" />
            Confirming creates batches, GRN_IN stock movements and a supplier payable. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-default px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-default disabled:opacity-60"
              disabled={pending}
              onClick={onConfirm}
              type="button"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Yes, confirm GRN
            </button>
            <button className="rounded-xl border border-neutral-border px-5 py-2.5 text-sm font-bold text-neutral-muted" disabled={pending} onClick={() => setConfirming(false)} type="button">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-brand-default px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-default"
          onClick={() => setConfirming(true)}
          type="button"
        >
          <CheckCircle2 className="size-4" />
          Confirm & process GRN
        </button>
      )}
    </div>
  );
}
