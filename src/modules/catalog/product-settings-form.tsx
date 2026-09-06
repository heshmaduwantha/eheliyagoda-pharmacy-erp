"use client";

import { useActionState, useState } from "react";
import type { PrescriptionRule } from "@prisma/client";
import { Field, FormAlert, SubmitButton, inputClass } from "@/components/ui/form";
import { idleFormState } from "@/lib/forms";
import { updateProductSettingsAction } from "./product-settings.actions";

export function ProductSettingsForm({ product }: { product: {
  id: string; primaryBarcode: string; reorderLevel: string; baseUnitName: string;
  isControlled: boolean; prescriptionRule: PrescriptionRule;
} }) {
  const [state, action] = useActionState(updateProductSettingsAction, idleFormState);
  const [controlled, setControlled] = useState(product.isControlled);
  const [rule, setRule] = useState<PrescriptionRule>(product.prescriptionRule);
  return (
    <form action={action} className="grid gap-5 rounded-2xl border border-neutral-border bg-neutral-surface p-5 shadow-sm">
      <input type="hidden" name="productId" value={product.id} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Primary Barcode (Optional)" htmlFor="primaryBarcode" error={state.status === "error" ? state.fieldErrors?.primaryBarcode : undefined} hint="Replace or clear the primary barcode. Package barcodes stay available.">
          <input className={inputClass} id="primaryBarcode" name="primaryBarcode" defaultValue={product.primaryBarcode} maxLength={120} placeholder="Scan or enter barcode" />
        </Field>
        <Field label="Low Stock Alert Level" htmlFor="reorderLevel" error={state.status === "error" ? state.fieldErrors?.reorderLevel : undefined} hint={`Measured in ${product.baseUnitName}. Set 0 to disable low-stock alerts.`}>
          <input className={inputClass} id="reorderLevel" name="reorderLevel" type="number" min="0" max="99999999999.999" step="0.001" required defaultValue={product.reorderLevel} />
        </Field>
      </div>
      <fieldset className="grid gap-4 border-t border-neutral-border pt-4">
        <legend className="text-sm font-bold text-neutral-text">Prescription Settings</legend>
        <label className="flex items-center gap-3 text-sm font-semibold text-neutral-text">
          <input type="checkbox" name="isControlled" checked={controlled} onChange={(event) => setControlled(event.target.checked)} className="size-4 accent-brand-default" />
          Controlled Drug
        </label>
        <input type="hidden" name="prescriptionRule" value={controlled ? "HARD_REQUIRED_CONTROLLED" : rule} />
        <Field label="Prescription requirement" htmlFor="prescriptionRule" hint={controlled ? "Controlled drugs always require prescription details." : "Changes apply to future sale checks, including carts already open."}>
          <select className={inputClass} id="prescriptionRule" disabled={controlled} value={controlled ? "HARD_REQUIRED_CONTROLLED" : rule} onChange={(event) => setRule(event.target.value as PrescriptionRule)}>
            <option value="NONE">No prescription required</option>
            <option value="PROMPT_SKIPPABLE">Requires prescription — prompt at POS</option>
            <option value="HARD_REQUIRED_CONTROLLED">Prescription details mandatory</option>
          </select>
        </Field>
      </fieldset>
      <FormAlert state={state} />
      <div><SubmitButton>Save changes</SubmitButton></div>
    </form>
  );
}
