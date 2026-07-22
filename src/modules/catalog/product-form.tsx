"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Field, FormAlert, SubmitButton, inputClass } from "@/components/ui/form";
import { idleFormState } from "@/lib/forms";
import { createProductAction } from "./actions";

type UnitRow = {
  unitName: string;
  factorToBase: string;
  isPurchaseDefault: boolean;
  isSaleDefault: boolean;
  barcode: string;
};

const emptyUnit = (): UnitRow => ({
  unitName: "",
  factorToBase: "",
  isPurchaseDefault: false,
  isSaleDefault: false,
  barcode: "",
});

export function ProductForm() {
  const [state, formAction] = useActionState(createProductAction, idleFormState);
  const [isControlled, setIsControlled] = useState(false);
  const [units, setUnits] = useState<UnitRow[]>([{ ...emptyUnit(), unitName: "", factorToBase: "1", isSaleDefault: true }]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setIsControlled(false);
      setUnits([{ ...emptyUnit(), factorToBase: "1", isSaleDefault: true }]);
    }
  }, [state]);

  const updateUnit = (index: number, patch: Partial<UnitRow>) =>
    setUnits((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const unitsPayload = JSON.stringify(
    units
      .filter((u) => u.unitName.trim() && u.factorToBase.trim())
      .map((u) => ({
        unitName: u.unitName.trim(),
        factorToBase: Number(u.factorToBase),
        isPurchaseDefault: u.isPurchaseDefault,
        isSaleDefault: u.isSaleDefault,
        barcode: u.barcode.trim() || undefined,
      })),
  );

  return (
    <form action={formAction} className="grid gap-5" ref={formRef}>
      <input name="units" type="hidden" value={unitsPayload} />

      {/* Required fields — always visible */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={state.status === "error" ? state.fieldErrors?.name : undefined} htmlFor="name" label="Product name">
          <input className={inputClass} id="name" name="name" placeholder="Panadol 500mg" required />
        </Field>
        <Field
          error={state.status === "error" ? state.fieldErrors?.baseUnitName : undefined}
          htmlFor="baseUnitName"
          hint="e.g. tablet, box, piece, bottle"
          label="Sold in"
        >
          <input className={inputClass} id="baseUnitName" name="baseUnitName" placeholder="tablet" required />
        </Field>
        <Field htmlFor="defaultSellingPrice" label="Selling price (LKR)">
          <input className={inputClass} id="defaultSellingPrice" min="0" name="defaultSellingPrice" step="0.01" type="number" placeholder="0.00" />
        </Field>
      </div>

      {/* Progressive disclosure — more options */}
      <details className="rounded-xl border border-slate-200 bg-slate-50">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-600 marker:content-none">
          <ChevronDown className="size-4 text-slate-400" />
          More options
          <span className="ml-1 text-xs font-normal text-slate-400">(generic name, category, prescription, barcode…)</span>
        </summary>
        <div className="grid gap-4 border-t border-slate-200 px-4 pb-4 pt-4 sm:grid-cols-2">
          <Field htmlFor="genericName" label="Generic name">
            <input className={inputClass} id="genericName" name="genericName" placeholder="e.g. Paracetamol" />
          </Field>
          <Field htmlFor="productType" label="Product type">
            <select className={inputClass} defaultValue="MEDICINE" id="productType" name="productType">
              <option value="MEDICINE">Medicine</option>
              <option value="GENERAL_ITEM">General item</option>
            </select>
          </Field>
          <Field htmlFor="category" label="Category">
            <input className={inputClass} id="category" name="category" placeholder="e.g. Analgesic" />
          </Field>
          <Field htmlFor="strength" label="Strength">
            <input className={inputClass} id="strength" name="strength" placeholder="e.g. 500mg" />
          </Field>
          <Field htmlFor="form" label="Form">
            <input className={inputClass} id="form" name="form" placeholder="e.g. Tablet, Syrup" />
          </Field>
          <Field htmlFor="reorderLevel" label="Alert me when stock drops below">
            <input className={inputClass} id="reorderLevel" min="0" name="reorderLevel" step="0.001" type="number" placeholder="0" />
          </Field>
          <Field htmlFor="prescriptionRule" label="Prescription required?">
            <select
              className={inputClass}
              disabled={isControlled}
              id="prescriptionRule"
              name="prescriptionRule"
              value={isControlled ? "HARD_REQUIRED_CONTROLLED" : undefined}
              defaultValue={isControlled ? undefined : "NONE"}
            >
              <option value="NONE">No prescription needed</option>
              <option value="PROMPT_SKIPPABLE">Ask at checkout (skippable)</option>
              <option value="HARD_REQUIRED_CONTROLLED">Always required (controlled drug)</option>
            </select>
          </Field>

          {/* Controlled drug checkbox */}
          <div className="sm:col-span-2">
            <label className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm font-semibold text-amber-800">
              <input
                checked={isControlled}
                name="isControlled"
                onChange={(e) => setIsControlled(e.target.checked)}
                type="checkbox"
                className="mt-0.5"
              />
              <span>This is a controlled drug (requires patient + prescriber details at every sale)</span>
            </label>
          </div>

          {/* Units & barcodes */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700">Units &amp; barcodes</p>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100"
                onClick={() => setUnits((rows) => [...rows, emptyUnit()])}
                type="button"
              >
                <Plus className="size-3.5" /> Add unit
              </button>
            </div>
            {state.status === "error" && state.fieldErrors?.units && (
              <p className="mt-1 text-xs font-semibold text-red-600">{state.fieldErrors.units}</p>
            )}
            <div className="mt-2 grid gap-2">
              {units.map((unit, index) => (
                <div className="grid items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 sm:grid-cols-[1.2fr_0.9fr_1.4fr_auto]" key={index}>
                  <input
                    className={inputClass}
                    onChange={(e) => updateUnit(index, { unitName: e.target.value })}
                    placeholder="Unit name (e.g. box, strip)"
                    value={unit.unitName}
                  />
                  <input
                    className={inputClass}
                    min="0"
                    onChange={(e) => updateUnit(index, { factorToBase: e.target.value })}
                    placeholder="How many tablets?"
                    step="0.001"
                    type="number"
                    value={unit.factorToBase}
                  />
                  <input
                    className={inputClass}
                    onChange={(e) => updateUnit(index, { barcode: e.target.value })}
                    placeholder="Barcode (optional)"
                    value={unit.barcode}
                  />
                  <div className="flex items-center gap-2 px-1">
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500" title="Default for selling">
                      <input checked={unit.isSaleDefault} onChange={(e) => updateUnit(index, { isSaleDefault: e.target.checked })} type="checkbox" /> Sell
                    </label>
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500" title="Default for purchasing">
                      <input checked={unit.isPurchaseDefault} onChange={(e) => updateUnit(index, { isPurchaseDefault: e.target.checked })} type="checkbox" /> Buy
                    </label>
                    {units.length > 1 && (
                      <button
                        className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setUnits((rows) => rows.filter((_, i) => i !== index))}
                        type="button"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>

      <FormAlert state={state} />
      <div>
        <SubmitButton>Add product</SubmitButton>
      </div>
    </form>
  );
}
