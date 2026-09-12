"use client";

import { useActionState, useState } from "react";
import type { PrescriptionRule } from "@prisma/client";
import { AlertTriangle } from "lucide-react";
import { Field, FormAlert, SubmitButton, inputClass } from "@/components/ui/form";
import { idleFormState } from "@/lib/forms";
import { formatQty } from "@/lib/money";
import { updateProductSettingsAction } from "./product-settings.actions";

export function ProductSettingsForm({
  product,
  stockOnHand = 0,
}: {
  product: {
    id: string;
    name: string;
    strength?: string;
    primaryBarcode: string;
    reorderLevel: string;
    baseUnitName: string;
    isControlled: boolean;
    prescriptionRule: PrescriptionRule;
  };
  stockOnHand?: number;
}) {
  const [state, action] = useActionState(updateProductSettingsAction, idleFormState);
  const [controlled, setControlled] = useState(product.isControlled);
  const [rule, setRule] = useState<PrescriptionRule>(product.prescriptionRule);
  const isLocked = stockOnHand > 0;

  return (
    <form action={action} className="space-y-6 rounded-2xl border border-neutral-border bg-neutral-surface p-6 shadow-sm sm:p-7">
      <input type="hidden" name="productId" value={product.id} />

      {isLocked && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900">
          <AlertTriangle className="size-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-bold">Editing Locked (Active Stock Available)</p>
            <p className="mt-0.5 text-amber-800">
              This product currently has active inventory on hand ({formatQty(stockOnHand)} {product.baseUnitName}). All product fields (including name and strength) can only be edited when stock on hand is 0.
            </p>
          </div>
        </div>
      )}
      
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Product Name" htmlFor="name" error={state.status === "error" ? state.fieldErrors?.name : undefined}>
          <input
            className={`${inputClass} ${isLocked ? "bg-slate-100 text-neutral-muted cursor-not-allowed" : ""}`}
            id="name"
            name="name"
            defaultValue={product.name}
            maxLength={200}
            required
            disabled={isLocked}
            placeholder="Product brand/trade name"
          />
        </Field>

        <Field label="Strength / Dosage" htmlFor="strength" error={state.status === "error" ? state.fieldErrors?.strength : undefined} hint="e.g. 500mg, 10ml, 250mcg">
          <input
            className={`${inputClass} ${isLocked ? "bg-slate-100 text-neutral-muted cursor-not-allowed" : ""}`}
            id="strength"
            name="strength"
            defaultValue={product.strength ?? ""}
            maxLength={80}
            disabled={isLocked}
            placeholder="e.g. 500mg"
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Primary Barcode" htmlFor="primaryBarcode" error={state.status === "error" ? state.fieldErrors?.primaryBarcode : undefined}>
          <input
            className={`${inputClass} ${isLocked ? "bg-slate-100 text-neutral-muted cursor-not-allowed" : ""}`}
            id="primaryBarcode"
            name="primaryBarcode"
            defaultValue={product.primaryBarcode}
            maxLength={120}
            disabled={isLocked}
            placeholder="Scan or enter barcode"
          />
        </Field>
        
        <Field label="Low Stock Alert Level" htmlFor="reorderLevel" error={state.status === "error" ? state.fieldErrors?.reorderLevel : undefined} hint={`Min qty (${product.baseUnitName})`}>
          <input
            className={`${inputClass} ${isLocked ? "bg-slate-100 text-neutral-muted cursor-not-allowed" : ""}`}
            id="reorderLevel"
            name="reorderLevel"
            type="number"
            min="0"
            max="99999999999.999"
            step="0.001"
            required
            disabled={isLocked}
            defaultValue={product.reorderLevel}
          />
        </Field>
      </div>

      <fieldset className="space-y-4 border-t border-neutral-border/80 pt-5">
        <legend className="text-xs font-bold uppercase tracking-wider text-neutral-muted">Prescription Settings</legend>
        
        <label className={`flex items-center gap-3 text-sm font-bold text-neutral-text ${isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer select-none"}`}>
          <input
            type="checkbox"
            name="isControlled"
            checked={controlled}
            disabled={isLocked}
            onChange={(event) => setControlled(event.target.checked)}
            className="size-4 rounded accent-brand-default cursor-pointer"
          />
          Controlled Drug
        </label>

        <input type="hidden" name="prescriptionRule" value={controlled ? "HARD_REQUIRED_CONTROLLED" : rule} />
        
        <Field label="Prescription Requirement" htmlFor="prescriptionRule">
          <select
            className={`${inputClass} ${isLocked ? "bg-slate-100 text-neutral-muted cursor-not-allowed" : ""}`}
            id="prescriptionRule"
            disabled={controlled || isLocked}
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
        <SubmitButton disabled={isLocked}>Save changes</SubmitButton>
      </div>
    </form>
  );
}
