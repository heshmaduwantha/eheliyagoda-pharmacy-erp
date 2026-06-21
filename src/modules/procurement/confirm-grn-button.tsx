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
        <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700">
          <AlertCircle className="size-4" />{result.message}
        </p>
      )}
      {result.status === "success" && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="size-4" />{result.message}
        </p>
      )}

      {confirming ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <ShieldCheck className="size-4" />
            Confirming creates batches, GRN_IN stock movements and a supplier payable. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg disabled:opacity-60"
              disabled={pending}
              onClick={onConfirm}
              type="button"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Yes, confirm GRN
            </button>
            <button className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600" disabled={pending} onClick={() => setConfirming(false)} type="button">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg"
          onClick={() => setConfirming(true)}
          type="button"
        >
          <ShieldCheck className="size-4" /> Confirm GRN
        </button>
      )}
    </div>
  );
}
