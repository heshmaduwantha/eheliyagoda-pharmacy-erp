"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, X } from "lucide-react";
import type { PrescriptionDecisionInput } from "@/modules/prescriptions/prescription.types";

type Props = {
  open: boolean;
  productCount: number;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (decision: PrescriptionDecisionInput) => void;
};

const inputClass = "rounded-xl border border-neutral-border bg-neutral-surface px-3 py-3 outline-none transition focus:border-brand-default focus:ring-2 focus:ring-brand-default/20";

export function ControlledDrugModal({ open, productCount, isSubmitting = false, onClose, onConfirm }: Props) {
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientNic, setPatientNic] = useState("");
  const [patientReference, setPatientReference] = useState("");
  const [prescriberName, setPrescriberName] = useState("");
  const [prescriberReference, setPrescriberReference] = useState("");

  useEffect(() => {
    if (!open) return;
    setPatientName("");
    setPatientPhone("");
    setPatientNic("");
    setPatientReference("");
    setPrescriberName("");
    setPrescriberReference("");
  }, [open]);

  if (!open) return null;
  const hasPatientIdentifier = Boolean(patientPhone.trim() || patientNic.trim() || patientReference.trim());
  const canContinue = Boolean(patientName.trim() && hasPatientIdentifier && prescriberName.trim() && prescriberReference.trim());

  return <div className="fixed inset-0 z-[86] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"><section aria-modal="true" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-neutral-surface p-6 shadow-2xl sm:p-7" role="dialog"><div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-status-danger-text"><ShieldAlert className="size-4" />Controlled medicine</p><h2 className="mt-1 text-2xl font-black text-neutral-text">Patient and prescriber details required</h2><p className="mt-2 text-sm leading-6 text-neutral-muted">{productCount} controlled item{productCount === 1 ? "" : "s"} cannot be skipped. Prescription image upload is not required for this MVP.</p></div><button aria-label="Close" className="grid size-9 place-items-center rounded-full text-neutral-muted hover:bg-slate-100" disabled={isSubmitting} onClick={onClose} type="button"><X className="size-5" /></button></div><div className="mt-6 grid gap-6 sm:grid-cols-2"><fieldset className="grid gap-3"><legend className="font-bold text-neutral-text">Patient details</legend><label className="grid gap-1.5 text-sm font-semibold text-neutral-text">Patient name <input className={inputClass} onChange={(event) => setPatientName(event.target.value)} required value={patientName} /></label><label className="grid gap-1.5 text-sm font-semibold text-neutral-text">Phone <input className={inputClass} onChange={(event) => setPatientPhone(event.target.value)} value={patientPhone} /></label><label className="grid gap-1.5 text-sm font-semibold text-neutral-text">NIC <input className={inputClass} onChange={(event) => setPatientNic(event.target.value)} value={patientNic} /></label><label className="grid gap-1.5 text-sm font-semibold text-neutral-text">Patient reference <input className={inputClass} onChange={(event) => setPatientReference(event.target.value)} value={patientReference} /></label><p className="text-xs leading-5 text-neutral-muted">Provide at least one identifier: phone, NIC, or patient reference.</p></fieldset><fieldset className="grid gap-3"><legend className="font-bold text-neutral-text">Prescriber details</legend><label className="grid gap-1.5 text-sm font-semibold text-neutral-text">Prescriber name <input className={inputClass} onChange={(event) => setPrescriberName(event.target.value)} required value={prescriberName} /></label><label className="grid gap-1.5 text-sm font-semibold text-neutral-text">Registration reference <input className={inputClass} onChange={(event) => setPrescriberReference(event.target.value)} required value={prescriberReference} /></label></fieldset></div><div className="mt-6 grid grid-cols-2 gap-3"><button className="rounded-xl border border-neutral-border px-4 py-3 font-bold text-neutral-muted" disabled={isSubmitting} onClick={onClose} type="button">Cancel</button><button className="rounded-xl bg-red-700 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={!canContinue || isSubmitting} onClick={() => onConfirm({ mode: "CAPTURED", patient: { name: patientName.trim(), phone: patientPhone.trim() || undefined, nic: patientNic.trim() || undefined, patientReference: patientReference.trim() || undefined }, prescriber: { name: prescriberName.trim(), reference: prescriberReference.trim() } })} type="button">{isSubmitting ? "Validating…" : "Validate details"}</button></div></section></div>;
}
