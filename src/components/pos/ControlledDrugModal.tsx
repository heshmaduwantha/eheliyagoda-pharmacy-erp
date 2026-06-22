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

const inputClass = "rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

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

  return <div className="fixed inset-0 z-[86] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"><section aria-modal="true" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7" role="dialog"><div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-700"><ShieldAlert className="size-4" />Controlled medicine</p><h2 className="mt-1 text-2xl font-black text-slate-900">Patient and prescriber details required</h2><p className="mt-2 text-sm leading-6 text-slate-500">{productCount} controlled item{productCount === 1 ? "" : "s"} cannot be skipped. Prescription image upload is not required for this MVP.</p></div><button aria-label="Close" className="grid size-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100" disabled={isSubmitting} onClick={onClose} type="button"><X className="size-5" /></button></div><div className="mt-6 grid gap-6 sm:grid-cols-2"><fieldset className="grid gap-3"><legend className="font-bold text-slate-800">Patient details</legend><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Patient name <input className={inputClass} onChange={(event) => setPatientName(event.target.value)} required value={patientName} /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Phone <input className={inputClass} onChange={(event) => setPatientPhone(event.target.value)} value={patientPhone} /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">NIC <input className={inputClass} onChange={(event) => setPatientNic(event.target.value)} value={patientNic} /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Patient reference <input className={inputClass} onChange={(event) => setPatientReference(event.target.value)} value={patientReference} /></label><p className="text-xs leading-5 text-slate-500">Provide at least one identifier: phone, NIC, or patient reference.</p></fieldset><fieldset className="grid gap-3"><legend className="font-bold text-slate-800">Prescriber details</legend><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Prescriber name <input className={inputClass} onChange={(event) => setPrescriberName(event.target.value)} required value={prescriberName} /></label><label className="grid gap-1.5 text-sm font-semibold text-slate-700">Registration reference <input className={inputClass} onChange={(event) => setPrescriberReference(event.target.value)} required value={prescriberReference} /></label></fieldset></div><div className="mt-6 grid grid-cols-2 gap-3"><button className="rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-600" disabled={isSubmitting} onClick={onClose} type="button">Cancel</button><button className="rounded-xl bg-red-700 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={!canContinue || isSubmitting} onClick={() => onConfirm({ mode: "CAPTURED", patient: { name: patientName.trim(), phone: patientPhone.trim() || undefined, nic: patientNic.trim() || undefined, patientReference: patientReference.trim() || undefined }, prescriber: { name: prescriberName.trim(), reference: prescriberReference.trim() } })} type="button">{isSubmitting ? "Validating…" : "Validate details"}</button></div></section></div>;
}
