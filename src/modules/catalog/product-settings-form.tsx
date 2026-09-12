"use client";

import { useActionState, useState } from "react";
import type { PrescriptionRule } from "@prisma/client";
import { Field, FormAlert, SubmitButton, inputClass } from "@/components/ui/form";
import { idleFormState } from "@/lib/forms";
import { updateProductSettingsAction } from "./product-settings.actions";

export function ProductSettingsForm({ product }: { product: {
  id: string; name: string; strength?: string; primaryBarcode: string; reorderLevel: string; baseUnitName: string;
  isControlled: boolean; prescriptionRule: PrescriptionRule;
} }) {
  const [state, action] = useActionState(updateProductSettingsAction, idleFormState);
  const [controlled, setControlled] = useState(product.isControlled);
  const [rule, setRule] = useState<PrescriptionRule>(product.prescriptionRule);

  return (
    <form action={action} className="space-y-6 rounded-2xl border border-neutral-border bg-neutral-surface p-6 shadow-sm sm:p-7">
      <input type="hidden" name="productId" value={product.id} />
      
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Product Name" htmlFor="name" hint="Product name cannot be edited" error={state.status === "error" ? state.fieldErrors?.name : undefined}>
          <input type="hidden" name="name" value={product.name} />
          <input className={`${inputClass} bg-slate-100 text-neutral-muted cursor-not-allowed`} id="name" disabled value={product.name} />
        </Field>

        <Field label="Strength / Dosage" htmlFor="strength" hint="Strength cannot be edited" error={state.status === "error" ? state.fieldErrors?.strength : undefined}>
          <input type="hidden" name="strength" value={product.strength ?? ""} />
          <input className={`${inputClass} bg-slate-100 text-neutral-muted cursor-not-allowed`} id="strength" disabled value={product.strength ?? ""} />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Primary Barcode" htmlFor="primaryBarcode" error={state.status === "error" ? state.fieldErrors?.primaryBarcode : undefined}>
          <input className={inputClass} id="primaryBarcode" name="primaryBarcode" defaultValue={product.primaryBarcode} maxLength={120} placeholder="Scan or enter barcode" />
        </Field>
        
        <Field label="Low Stock Alert Level" htmlFor="reorderLevel" error={state.status === "error" ? state.fieldErrors?.reorderLevel : undefined} hint={`Min qty (${product.baseUnitName})`}>
          <input className={inputClass} id="reorderLevel" name="reorderLevel" type="number" min="0" max="99999999999.999" step="0.001" required defaultValue={product.reorderLevel} />
        </Field>
      </div>

      <fieldset className="space-y-4 border-t border-neutral-border/80 pt-5">
        <legend className="text-xs font-bold uppercase tracking-wider text-neutral-muted">Prescription Settings</legend>
        
        <label className="flex items-center gap-3 text-sm font-bold text-neutral-text cursor-pointer select-none">
          <input
            type="checkbox"
            name="isControlled"
            checked={controlled}
            onChange={(event) => setControlled(event.target.checked)}
            className="size-4 rounded accent-brand-default cursor-pointer"
          />
          Controlled Drug
        </label>

        <input type="hidden" name="prescriptionRule" value={controlled ? "HARD_REQUIRED_CONTROLLED" : rule} />
        
        <Field label="Prescription Requirement" htmlFor="prescriptionRule">
          <select
            className={inputClass}
            id="prescriptionRule"
            disabled={controlled}
            value={controlled ? "HARD_REQUIRED_CONTROLLED" : rule}
            onChange={(event) => setRule(event.target.value as PrescriptionRule)}
          >
            <option value="NONE">No prescription required</option>
            <option value="PROMPT_SKIPPABLE">Prescription recommended (prompt at POS)</option>
            <option value="HARD_REQUIRED_CONTROLLED">Prescription mandatory</option>
          </select>
        </Field>
      </fieldset>

      <FormAlert state={state} />
      
      <div className="pt-2">
        <SubmitButton>Save changes</SubmitButton>
      </div>
    </form>
  );
}
