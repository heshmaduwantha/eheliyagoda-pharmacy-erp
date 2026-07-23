"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
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
          placeholder={selectedUnits.length === 0 ? "Select units" : "Search units"}
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
  const [baseUnitName, setBaseUnitName] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<UnitOption[]>([]);
  const [unitDetails, setUnitDetails] = useState<Partial<Record<UnitOption, UnitDetails>>>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setIsControlled(false);
      setBaseUnitName("");
      setSelectedUnits([]);
      setUnitDetails({});
      document.getElementById("add-product-section")?.removeAttribute("open");
    }
  }, [state]);

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

  const unitsPayload = JSON.stringify(selectedUnits.map((unit, index) => {
    const details = unitDetails[unit] ?? emptyUnitDetails();
    return {
      unitName: unit,
      factorToBase: Number(details.factorToBase),
      isPurchaseDefault: details.isPurchaseDefault,
      isSaleDefault: index === 0,
      barcode: details.barcode.trim() || undefined,
    };
  }));

  return (
    <form action={formAction} className="grid gap-5" ref={formRef}>
      <input name="units" type="hidden" value={unitsPayload} />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Row 1: Product Name | Base Unit */}
        <div className="flex flex-col gap-1">
          <Field error={state.status === "error" ? state.fieldErrors?.name : undefined} htmlFor="name" label="Product name">
            <input className={inputClass} id="name" name="name" placeholder="Panadol 500mg" required />
          </Field>
        </div>
        <div className="flex flex-col gap-1">
          <Field error={state.status === "error" ? state.fieldErrors?.baseUnitName : undefined} htmlFor="baseUnitName" hint="The one unit used for stock calculations." label="Base unit">
            <input className={inputClass} id="baseUnitName" name="baseUnitName" onChange={(event) => setBaseUnitName(event.target.value)} placeholder="e.g. Tablet" required value={baseUnitName} />
          </Field>
        </div>
        {/* Selling prices belong to confirmed GRN batches, not the product master. */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-muted">Sold in</span>
          <SoldInMultiSelect onChange={updateSelectedUnits} selectedUnits={selectedUnits} />
          {state.status === "error" && state.fieldErrors?.units
            ? <span className="text-xs font-semibold text-status-danger-text">{state.fieldErrors.units}</span>
            : <span className="text-xs text-neutral-muted">Select every unit customers can buy. Add the exact conversion for each selection below.</span>}
        </div>
        <p className="rounded-xl border border-brand-default/15 bg-brand-pale px-3 py-2 text-xs leading-relaxed text-brand-default">Selling price is set on each confirmed GRN batch. This keeps the POS price tied to the stock that is actually sold.</p>
      </div>

      {selectedUnits.length > 0 ? <section className="rounded-xl border border-neutral-border bg-neutral-bg p-4">
        <div>
          <p className="text-sm font-bold text-neutral-text">Unit conversions &amp; barcodes</p>
          <p className="mt-1 text-xs text-neutral-muted">A conversion is required for each selected unit. For example, 1 Box = 10 {baseUnitName || "base units"}.</p>
        </div>
        <div className="mt-3 grid gap-2">
          {selectedUnits.map((unit, index) => {
            const details = unitDetails[unit] ?? emptyUnitDetails();
            return <div className="grid items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface p-3 sm:grid-cols-[1fr_1fr_1.4fr_auto]" key={unit}>
              <strong className="text-sm text-neutral-text">{unit}{index === 0 ? <span className="ml-2 text-xs font-medium text-brand-default">Default sale unit</span> : null}</strong>
              <input aria-label={`${unit} conversion factor`} className={inputClass} min="0.001" onChange={(event) => updateUnitDetails(unit, { factorToBase: event.target.value })} placeholder={`Per ${baseUnitName || "base unit"}`} step="0.001" type="number" value={details.factorToBase} />
              <input aria-label={`${unit} barcode`} className={inputClass} onChange={(event) => updateUnitDetails(unit, { barcode: event.target.value })} placeholder="Barcode (optional)" value={details.barcode} />
              <label className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-neutral-muted"><input checked={details.isPurchaseDefault} onChange={(event) => updateUnitDetails(unit, { isPurchaseDefault: event.target.checked })} type="checkbox" /> Default purchase</label>
            </div>;
          })}
        </div>
      </section> : null}

      <details className="rounded-xl border border-neutral-border bg-neutral-bg">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold text-neutral-muted marker:content-none"><ChevronDown className="size-4 text-neutral-muted" />More options<span className="ml-1 text-xs font-normal text-neutral-muted">(generic name, category, prescription…)</span></summary>
        <div className="grid gap-4 border-t border-neutral-border px-4 pb-4 pt-4 sm:grid-cols-2">
          <Field htmlFor="genericName" label="Generic name"><input className={inputClass} id="genericName" name="genericName" placeholder="e.g. Paracetamol" /></Field>
          <Field htmlFor="productType" label="Product type"><select className={inputClass} defaultValue="MEDICINE" id="productType" name="productType"><option value="MEDICINE">Medicine</option><option value="GENERAL_ITEM">General item</option></select></Field>
          <Field htmlFor="category" label="Category"><input className={inputClass} id="category" name="category" placeholder="e.g. Analgesic" /></Field>
          <Field htmlFor="strength" label="Strength"><input className={inputClass} id="strength" name="strength" placeholder="e.g. 500mg" /></Field>
          <Field htmlFor="form" label="Form"><input className={inputClass} id="form" name="form" placeholder="e.g. Tablet, Syrup" /></Field>
          <Field htmlFor="reorderLevel" label="Alert me when stock drops below"><input className={inputClass} id="reorderLevel" min="0" name="reorderLevel" step="0.001" type="number" placeholder="0" /></Field>
          <Field htmlFor="prescriptionRule" label="Prescription required?"><select className={inputClass} disabled={isControlled} id="prescriptionRule" name="prescriptionRule" value={isControlled ? "HARD_REQUIRED_CONTROLLED" : undefined} defaultValue={isControlled ? undefined : "NONE"}><option value="NONE">No prescription needed</option><option value="PROMPT_SKIPPABLE">Ask at checkout (skippable)</option><option value="HARD_REQUIRED_CONTROLLED">Always required (controlled drug)</option></select></Field>
          <div className="sm:col-span-2"><label className="flex items-start gap-2.5 rounded-xl border border-status-warning-bg bg-status-warning-bg px-3.5 py-2.5 text-sm font-semibold text-status-warning-text"><input checked={isControlled} name="isControlled" onChange={(event) => setIsControlled(event.target.checked)} type="checkbox" className="mt-0.5" /><span>This is a controlled drug (requires patient + prescriber details at every sale)</span></label></div>
        </div>
      </details>

      <FormAlert state={state} />
      <div><SubmitButton>Add product</SubmitButton></div>
    </form>
  );
}
