"use client";

import { useEffect, useState } from "react";
import { FileCheck2, X } from "lucide-react";
import type { PrescriptionDecisionInput } from "@/modules/prescriptions/prescription.types";

type Props = {
  open: boolean;
  productCount: number;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (decision: PrescriptionDecisionInput) => void;
};

export function PrescriptionPromptModal({ open, productCount, isSubmitting = false, onClose, onConfirm }: Props) {
  const [mode, setMode] = useState<"CAPTURED" | "SKIPPED">("CAPTURED");
  const [skipReason, setSkipReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setMode("CAPTURED");
    setSkipReason("");
  }, [open]);

  if (!open) return null;
  const canContinue = mode === "CAPTURED" || skipReason.trim().length > 0;

  return <div className="fixed inset-0 z-[85] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"><section aria-modal="true" className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7" role="dialog"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Prescription decision</p><h2 className="mt-1 text-2xl font-black text-slate-900">Prescription prompt</h2><p className="mt-2 text-sm leading-6 text-slate-500">{productCount} item{productCount === 1 ? "" : "s"} requires a prescription decision. An image is optional for this MVP.</p></div><button aria-label="Close" className="grid size-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100" disabled={isSubmitting} onClick={onClose} type="button"><X className="size-5" /></button></div><div className="mt-6 grid gap-3"><label className={`cursor-pointer rounded-2xl border p-4 ${mode === "CAPTURED" ? "border-teal-400 bg-teal-50" : "border-slate-200"}`}><input checked={mode === "CAPTURED"} className="sr-only" name="prescription-mode" onChange={() => setMode("CAPTURED")} type="radio" /><span className="flex gap-3"><FileCheck2 className="mt-0.5 size-5 text-teal-700" /><span><strong className="block text-slate-800">Record prescription</strong><span className="mt-1 block text-sm text-slate-500">The prescription was reviewed. Image upload can be connected later.</span></span></span></label><label className={`cursor-pointer rounded-2xl border p-4 ${mode === "SKIPPED" ? "border-amber-400 bg-amber-50" : "border-slate-200"}`}><input checked={mode === "SKIPPED"} className="sr-only" name="prescription-mode" onChange={() => setMode("SKIPPED")} type="radio" /><span><strong className="block text-slate-800">Skip prescription</strong><span className="mt-1 block text-sm text-slate-500">A non-empty reason is required and will be audited when sale completion exists.</span></span></label>{mode === "SKIPPED" ? <label className="grid gap-2 text-sm font-bold text-slate-700">Skip reason<textarea className="min-h-28 rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-teal-400" maxLength={500} onChange={(event) => setSkipReason(event.target.value)} placeholder="Explain why the prescription was not recorded" value={skipReason} /></label> : null}</div><div className="mt-6 grid grid-cols-2 gap-3"><button className="rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-600" disabled={isSubmitting} onClick={onClose} type="button">Cancel</button><button className="rounded-xl bg-teal-700 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={!canContinue || isSubmitting} onClick={() => onConfirm({ mode, skipReason: mode === "SKIPPED" ? skipReason.trim() : undefined })} type="button">{isSubmitting ? "Validating…" : "Continue"}</button></div></section></div>;
}
