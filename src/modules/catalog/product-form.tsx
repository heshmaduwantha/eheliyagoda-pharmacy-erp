"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Info, ShieldAlert, Sparkles, X } from "lucide-react";
import { Field, FormAlert, SubmitButton, inputClass } from "@/components/ui/form";
import { idleFormState } from "@/lib/forms";
import { createProductAction } from "./actions";
import { UNIT_OPTIONS, type UnitOption } from "./unit-options";

type UnitDetails = {
  factorToBase: string;
  isPurchaseDefault: boolean;
  barcode: string;
};

const emptyUnitDetails = (): UnitDetails => ({ factorToBase: "", isPurchaseDefault: false, barcode: "" });

function SoldInMultiSelect({ selectedUnits, onChange }: { selectedUnits: UnitOption[]; onChange: (units: UnitOption[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleOptions = UNIT_OPTIONS.filter((unit) => unit.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleUnit = (unit: UnitOption) => {
    onChange(selectedUnits.includes(unit) ? selectedUnits.filter((value) => value !== unit) : [...selectedUnits, unit]);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-3 py-2 focus-within:border-brand-default">
        {selectedUnits.map((unit) => (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-pale px-2.5 py-1 text-xs font-semibold text-brand-default" key={unit}>
            {unit}
            <button aria-label={`Remove ${unit}`} className="rounded-full p-0.5 hover:bg-brand-pale" onClick={() => toggleUnit(unit)} type="button">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          aria-label="Search units"
          className="min-w-28 flex-1 bg-transparent py-1 text-sm outline-none"
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => { if (event.key === "Escape") setIsOpen(false); }}
          placeholder={selectedUnits.length === 0 ? "Select sale units (e.g. Tablet, Box)" : "Add more units"}
          value={query}
        />
        {selectedUnits.length > 0 ? <button className="text-xs font-semibold text-neutral-muted hover:text-neutral-text" onClick={() => onChange([])} type="button">Clear all</button> : null}
        <button aria-expanded={isOpen} aria-label="Toggle unit options" className="rounded p-1 text-neutral-muted hover:bg-slate-100" onClick={() => setIsOpen((open) => !open)} type="button">
          <ChevronDown className="size-4" />
        </button>
      </div>
      {isOpen ? (
        <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-neutral-border bg-neutral-surface p-1.5 shadow-lg" role="listbox" aria-label="Sold in units">
          {visibleOptions.length > 0 ? visibleOptions.map((unit) => {
            const selected = selectedUnits.includes(unit);
            return (
              <button aria-selected={selected} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${selected ? "bg-brand-pale font-semibold text-brand-default" : "text-neutral-text hover:bg-neutral-bg"}`} key={unit} onClick={() => toggleUnit(unit)} role="option" type="button">
                {unit}
                {selected ? <Check className="size-4" /> : null}
              </button>
            );
          }) : <p className="px-3 py-2 text-sm text-neutral-muted">No matching units.</p>}
        </div>
      ) : null}
    </div>
  );
}

export function ProductForm() {
  const [state, formAction] = useActionState(createProductAction, idleFormState);
  const [isControlled, setIsControlled] = useState(false);
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  const [baseUnitName, setBaseUnitName] = useState("Tablet");
  const [selectedUnits, setSelectedUnits] = useState<UnitOption[]>(["Tablet"]);
  const [unitDetails, setUnitDetails] = useState<Partial<Record<UnitOption, UnitDetails>>>({
    Tablet: { factorToBase: "1", isPurchaseDefault: true, barcode: "" }
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setIsControlled(false);
      setRequiresPrescription(false);
      setBaseUnitName("Tablet");
      setSelectedUnits(["Tablet"]);
      setUnitDetails({ Tablet: { factorToBase: "1", isPurchaseDefault: true, barcode: "" } });
      document.getElementById("add-product-section")?.removeAttribute("open");
    }
  }, [state]);

  const handleBaseUnitChange = (newBaseUnit: string) => {
    setBaseUnitName(newBaseUnit);
    if (newBaseUnit.trim() && !selectedUnits.includes(newBaseUnit as UnitOption) && (UNIT_OPTIONS as readonly string[]).includes(newBaseUnit)) {
      updateSelectedUnits([...selectedUnits, newBaseUnit as UnitOption]);
    }
  };

  const updateSelectedUnits = (nextUnits: UnitOption[]) => {
    setSelectedUnits(nextUnits);
    setUnitDetails((current) => {
      const next: Partial<Record<UnitOption, UnitDetails>> = {};
      nextUnits.forEach((unit, index) => {
        next[unit] = current[unit] ?? {
          ...emptyUnitDetails(),
          factorToBase: unit.toLowerCase() === baseUnitName.trim().toLowerCase() ? "1" : "",
          isPurchaseDefault: index === 0,
        };
      });
      return next;
    });
  };

  const updateUnitDetails = (unit: UnitOption, patch: Partial<UnitDetails>) => {
    setUnitDetails((current) => ({ ...current, [unit]: { ...(current[unit] ?? emptyUnitDetails()), ...patch } }));
  };

  const unitsPayload = JSON.stringify(
    (selectedUnits.length > 0 ? selectedUnits : [baseUnitName as UnitOption]).map((unit, index) => {
      const details = unitDetails[unit] ?? emptyUnitDetails();
      return {
        unitName: unit || baseUnitName || "Piece",
        factorToBase: Number(details.factorToBase) || 1,
        isPurchaseDefault: details.isPurchaseDefault,
        isSaleDefault: index === 0,
        barcode: details.barcode.trim() || undefined,
      };
    })
  );

  return (
    <form action={formAction} className="grid gap-6" ref={formRef}>
      <input name="units" type="hidden" value={unitsPayload} />
      <input name="prescriptionRule" type="hidden" value={isControlled ? "HARD_REQUIRED_CONTROLLED" : requiresPrescription ? "PROMPT_SKIPPABLE" : "NONE"} />

      {/* Basic Info Section */}
      <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-neutral-text border-b border-neutral-border pb-3">
          <Sparkles className="size-4 text-brand-default" />
          <span>Product Basic Information</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={state.status === "error" ? state.fieldErrors?.name : undefined} htmlFor="name" label="Product name *">
            <input className={inputClass} id="name" name="name" placeholder="e.g. Panadol 500mg" required />
          </Field>

          <Field htmlFor="genericName" label="Generic name">
            <input className={inputClass} id="genericName" name="genericName" placeholder="e.g. Paracetamol" />
          </Field>

          <Field htmlFor="category" label="Category">
            <input className={inputClass} id="category" name="category" placeholder="e.g. Analgesics / Pain Relief" />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field htmlFor="strength" label="Strength">
              <input className={inputClass} id="strength" name="strength" placeholder="e.g. 500mg" />
            </Field>
            <Field htmlFor="form" label="Form">
              <input className={inputClass} id="form" name="form" placeholder="e.g. Tablet" />
            </Field>
          </div>
        </div>
      </div>

      {/* Units & Pricing Section */}
      <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-border pb-3">
          <span className="text-sm font-bold text-neutral-text">Packaging, Units &amp; Pricing</span>
          <span className="text-xs text-neutral-muted">Set up how stock is counted and sold</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={state.status === "error" ? state.fieldErrors?.baseUnitName : undefined} htmlFor="baseUnitName" hint="The smallest unit counted in inventory (e.g. Tablet, Bottle, Piece)." label="Base Unit *">
            <input
              className={inputClass}
              id="baseUnitName"
              name="baseUnitName"
              onChange={(e) => handleBaseUnitChange(e.target.value)}
              placeholder="e.g. Tablet"
              required
              value={baseUnitName}
            />
          </Field>

          <Field htmlFor="defaultSellingPrice" hint="Price per base unit (e.g. price per 1 Tablet)." label="Selling Price (LKR)">
            <input className={inputClass} id="defaultSellingPrice" min="0" name="defaultSellingPrice" placeholder="0.00" step="0.01" type="number" />
          </Field>

          <div className="sm:col-span-2 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-muted">Units sold in</label>
            <SoldInMultiSelect onChange={updateSelectedUnits} selectedUnits={selectedUnits} />
          </div>
        </div>

        {selectedUnits.length > 0 ? (
          <div className="mt-3 space-y-2 rounded-xl border border-neutral-border bg-neutral-bg p-3">
            <p className="text-xs font-bold text-neutral-text">Unit Conversions &amp; Barcodes</p>
            {selectedUnits.map((unit, index) => {
              const details = unitDetails[unit] ?? emptyUnitDetails();
              return (
                <div className="grid items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface p-3 sm:grid-cols-[1fr_1fr_1.4fr_auto]" key={unit}>
                  <strong className="text-sm text-neutral-text">{unit}{index === 0 ? <span className="ml-2 text-xs font-medium text-brand-default">(Default Sale Unit)</span> : null}</strong>
                  <input
                    aria-label={`${unit} conversion factor`}
                    className={inputClass}
                    min="0.001"
                    onChange={(event) => updateUnitDetails(unit, { factorToBase: event.target.value })}
                    placeholder={`Qty per ${baseUnitName || "base unit"}`}
                    step="0.001"
                    type="number"
                    value={details.factorToBase}
                  />
                  <input
                    aria-label={`${unit} barcode`}
                    className={inputClass}
                    onChange={(event) => updateUnitDetails(unit, { barcode: event.target.value })}
                    placeholder="Barcode (optional)"
                    value={details.barcode}
                  />
                  <label className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-neutral-muted">
                    <input
                      checked={details.isPurchaseDefault}
                      onChange={(event) => updateUnitDetails(unit, { isPurchaseDefault: event.target.checked })}
                      type="checkbox"
                    />
                    Default Purchase
                  </label>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="pt-2 sm:w-1/2">
          <Field htmlFor="reorderLevel" hint="Get alert when total available stock falls below this level." label="Low Stock Alert Threshold">
            <input className={inputClass} id="reorderLevel" min="0" name="reorderLevel" placeholder="0" step="0.001" type="number" />
          </Field>
        </div>
      </div>

      {/* Prescription & Controlled Settings Section */}
      <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-border pb-3">
          <span className="text-sm font-bold text-neutral-text">Prescription &amp; Regulatory Settings</span>
          <span className="text-xs text-neutral-muted">Controls whether POS asks for prescription during sale</span>
        </div>

        <div className="grid gap-3">
          {/* Controlled Drug Option */}
          <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${isControlled ? "border-amber-400 bg-amber-50/50" : "border-neutral-border bg-neutral-surface hover:bg-neutral-bg"}`}>
            <input
              checked={isControlled}
              className="mt-1 size-4 accent-amber-600"
              name="isControlled"
              onChange={(e) => {
                const checked = e.target.checked;
                setIsControlled(checked);
                if (checked) setRequiresPrescription(true);
              }}
              type="checkbox"
            />
            <div>
              <span className="block text-sm font-bold text-neutral-text">This is a Controlled Drug</span>
              <span className="block text-xs text-neutral-muted mt-0.5">Strict regulatory medicine. Requires recording patient NIC/phone &amp; prescriber details on every sale.</span>
            </div>
          </label>

          {/* Standard Prescription Option */}
          <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${requiresPrescription && !isControlled ? "border-blue-400 bg-blue-50/50" : "border-neutral-border bg-neutral-surface hover:bg-neutral-bg"}`}>
            <input
              checked={requiresPrescription}
              className="mt-1 size-4 accent-brand-default"
              disabled={isControlled}
              name="requiresPrescription"
              onChange={(e) => setRequiresPrescription(e.target.checked)}
              type="checkbox"
            />
            <div>
              <span className="block text-sm font-bold text-neutral-text">Requires Doctor Prescription at Checkout</span>
              <span className="block text-xs text-neutral-muted mt-0.5">Prompts the cashier to record prescription or log skip reason during billing.</span>
            </div>
          </label>
        </div>

        {/* Clear Status Indicator */}
        <div className="pt-1">
          {isControlled ? (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
              <ShieldAlert className="size-4 shrink-0 text-amber-600" />
              <span>Controlled Drug Mode: Patient &amp; doctor info will be strictly required at POS checkout.</span>
            </div>
          ) : requiresPrescription ? (
            <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-bold text-blue-800">
              <Info className="size-4 shrink-0 text-blue-600" />
              <span>Prescription Prompt Enabled: Cashier will be prompted to verify prescription.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
              <Check className="size-4 shrink-0 text-emerald-600" />
              <span>Over-The-Counter Medicine: No prescription check required at POS. Cashier can sell directly.</span>
            </div>
          )}
        </div>
      </div>

      <FormAlert state={state} />

      <div>
        <SubmitButton>Add Product</SubmitButton>
      </div>
    </form>
  );
}
