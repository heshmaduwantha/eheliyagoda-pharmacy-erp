"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Field, FormAlert, SubmitButton, inputClass } from "@/components/ui/form";
import { idleFormState } from "@/lib/forms";
import { createProductAction } from "./actions";
import { UNIT_OPTIONS, DOSAGE_FORM_OPTIONS, type UnitOption } from "./unit-options";

type SecondaryUnitRow = {
  id: string;
  unitName: UnitOption;
  factorToBase: string;
  sellingPrice?: string;
  isPurchaseDefault: boolean;
  barcode: string;
};

export function ProductForm() {
  const [state, formAction] = useActionState(createProductAction, idleFormState);
  const [isControlled, setIsControlled] = useState(false);
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  
  // Units state
  const [primaryUnit, setPrimaryUnit] = useState<UnitOption | "">("");
  const [primaryBarcode, setPrimaryBarcode] = useState<string>("");
  const [hasSecondaryUnits, setHasSecondaryUnits] = useState(false);
  const [secondaryUnits, setSecondaryUnits] = useState<SecondaryUnitRow[]>([]);

  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [showPkgCalc, setShowPkgCalc] = useState<boolean>(false);
  const [pkgPriceInput, setPkgPriceInput] = useState<string>("");
  const [pkgUnitSelect, setPkgUnitSelect] = useState<string>("");

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setIsControlled(false);
      setRequiresPrescription(false);
      setPrimaryUnit("");
      setPrimaryBarcode("");
      setSellingPrice("");
      setShowPkgCalc(false);
      setPkgPriceInput("");
      setPkgUnitSelect("");
      setHasSecondaryUnits(false);
      setSecondaryUnits([]);
      document.getElementById("add-product-section")?.removeAttribute("open");
    }
  }, [state]);

  const calculateTabletPriceFromPkg = (pkgPriceStr: string, unitName: string) => {
    const pkgPrice = Number(pkgPriceStr);
    const secUnit = secondaryUnits.find((u) => u.unitName === unitName);
    const factor = secUnit ? Number(secUnit.factorToBase) || 1 : 1;
    if (pkgPrice > 0 && factor > 0) {
      const tabletPrice = (pkgPrice / factor).toFixed(4);
      setSellingPrice(String(Number(tabletPrice)));
    }
  };

  const addSecondaryUnit = () => {
    const available = UNIT_OPTIONS.filter(
      (u) => u !== primaryUnit && !secondaryUnits.some((s) => s.unitName === u)
    );
    const defaultUnit = available[0] ?? "Box";
    setSecondaryUnits((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        unitName: defaultUnit,
        factorToBase: "",
        sellingPrice: "",
        isPurchaseDefault: false,
        barcode: "",
      },
    ]);
  };

  const updateSecondaryUnit = (id: string, patch: Partial<SecondaryUnitRow>) => {
    setSecondaryUnits((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeSecondaryUnit = (id: string) => {
    setSecondaryUnits((prev) => prev.filter((row) => row.id !== id));
  };

  // Build JSON payload expected by backend
  const activePrimary = primaryUnit || "Piece";
  const unitsPayload = JSON.stringify([
    {
      unitName: activePrimary,
      factorToBase: 1,
      sellingPrice: Number(sellingPrice) > 0 ? Number(sellingPrice) : undefined,
      isPurchaseDefault: !secondaryUnits.some((s) => s.isPurchaseDefault),
      isSaleDefault: true,
      barcode: primaryBarcode.trim() || undefined,
    },
    ...(hasSecondaryUnits ? secondaryUnits : []).map((row) => ({
      unitName: row.unitName,
      factorToBase: Number(row.factorToBase) > 0 ? Number(row.factorToBase) : 1,
      sellingPrice: Number(row.sellingPrice) > 0 ? Number(row.sellingPrice) : undefined,
      isPurchaseDefault: row.isPurchaseDefault,
      isSaleDefault: false,
      barcode: row.barcode.trim() || undefined,
    })),
  ]);

  return (
    <form action={formAction} className="grid gap-5" ref={formRef}>
      <input name="units" type="hidden" value={unitsPayload} />
      <input name="prescriptionRule" type="hidden" value={isControlled ? "HARD_REQUIRED_CONTROLLED" : requiresPrescription ? "PROMPT_SKIPPABLE" : "NONE"} />

      {/* Basic Info Section */}
      <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-neutral-text border-b border-neutral-border/60 pb-3">
          <Sparkles className="size-4 text-brand-default" />
          <span>Basic Product Information</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={state.status === "error" ? state.fieldErrors?.name : undefined} htmlFor="name" label="Product Name *">
            <input className={inputClass} id="name" name="name" placeholder="e.g. Panadol 500mg" required />
          </Field>

          <Field htmlFor="genericName" label="Generic Name">
            <input className={inputClass} id="genericName" name="genericName" placeholder="e.g. Paracetamol" />
          </Field>

          <Field htmlFor="category" label="Category">
            <input className={inputClass} id="category" name="category" placeholder="e.g. Analgesics" />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field htmlFor="strength" label="Strength">
              <input className={inputClass} id="strength" name="strength" placeholder="e.g. 500mg" />
            </Field>
            <Field htmlFor="form" label="Form">
              <SearchableSelect
                id="form"
                name="form"
                placeholder="Search form (Tablet, Syrup...)"
                options={DOSAGE_FORM_OPTIONS.map((f) => ({ value: f, label: f }))}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Units & Pricing Section */}
      <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-5 space-y-4 shadow-sm">
        <div className="border-b border-neutral-border/60 pb-3">
          <h3 className="text-sm font-bold text-neutral-text">Unit &amp; Selling Price</h3>
          <p className="text-xs text-neutral-muted mt-0.5">Define how this item is measured and priced in your pharmacy</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={state.status === "error" ? state.fieldErrors?.baseUnitName : undefined} htmlFor="baseUnitName" label="Primary Unit *">
            <SearchableSelect
              id="baseUnitName"
              name="baseUnitName"
              defaultValue={primaryUnit}
              placeholder="Search unit (Tablet, Bottle...)"
              required
              onChange={(val) => setPrimaryUnit(val as UnitOption)}
              options={UNIT_OPTIONS.map((u) => ({ value: u, label: u }))}
            />
          </Field>

          <Field error={state.status === "error" ? state.fieldErrors?.defaultSellingPrice : undefined} htmlFor="defaultSellingPrice" label={`Default Selling Price per 1 ${primaryUnit || "Unit"} (LKR, Optional)`}>
            <input
              className={inputClass}
              id="defaultSellingPrice"
              min="0"
              name="defaultSellingPrice"
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="Optional (Can set in GRN)"
              step="any"
              type="number"
              value={sellingPrice}
            />
          </Field>

          <Field htmlFor="primaryBarcode" label="Primary Barcode (Optional)">
            <input
              className={inputClass}
              id="primaryBarcode"
              onChange={(e) => setPrimaryBarcode(e.target.value)}
              placeholder="Scan or enter barcode"
              value={primaryBarcode}
            />
          </Field>

          <Field htmlFor="reorderLevel" label="Low Stock Alert Level">
            <input className={inputClass} id="reorderLevel" min="0" name="reorderLevel" placeholder="0" step="0.001" type="number" />
          </Field>
        </div>

        {/* Live Selling Price Preview & Package Price Helper */}
        {primaryUnit && (sellingPrice || hasSecondaryUnits) && (
          <div className="mt-3 space-y-3">
            {hasSecondaryUnits && secondaryUnits.length > 0 && (
              <div className="rounded-xl border border-brand-default/20 bg-brand-pale/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-default">Live Unit Selling Price Preview</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-brand-hover hover:underline"
                    onClick={() => setShowPkgCalc(!showPkgCalc)}
                  >
                    {showPkgCalc ? "Hide Package Calculator" : "Calculate from Box/Package Price?"}
                  </button>
                </div>

                {showPkgCalc && (
                  <div className="p-3 bg-white rounded-lg border border-brand-default/30 space-y-2">
                    <p className="text-xs font-semibold text-neutral-text">
                      Enter total price for a full package (e.g. LKR 30 for 1 Box of 50 {primaryUnit}s):
                    </p>
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                      <input
                        type="number"
                        step="any"
                        placeholder="Package Price (e.g. 30)"
                        className={inputClass}
                        value={pkgPriceInput}
                        onChange={(e) => {
                          setPkgPriceInput(e.target.value);
                          if (pkgUnitSelect) calculateTabletPriceFromPkg(e.target.value, pkgUnitSelect);
                        }}
                      />
                      <select
                        className={inputClass}
                        value={pkgUnitSelect}
                        onChange={(e) => {
                          setPkgUnitSelect(e.target.value);
                          if (pkgPriceInput) calculateTabletPriceFromPkg(pkgPriceInput, e.target.value);
                        }}
                      >
                        <option value="">Select package unit...</option>
                        {secondaryUnits.map((u) => (
                          <option key={u.id} value={u.unitName}>
                            1 {u.unitName} ({u.factorToBase || 1} {primaryUnit}s)
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="px-3 py-2 bg-brand-default text-white rounded-xl text-xs font-bold"
                        onClick={() => calculateTabletPriceFromPkg(pkgPriceInput, pkgUnitSelect)}
                      >
                        Set Price
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg bg-white p-2.5 border border-neutral-border text-center shadow-xs">
                    <div className="text-[10px] font-bold text-neutral-muted uppercase">1 {primaryUnit}</div>
                    <div className="text-sm font-extrabold text-neutral-text">
                      LKR {Number(sellingPrice || 0).toFixed(2)}
                    </div>
                  </div>
                  {secondaryUnits.map((u) => {
                    const factor = Number(u.factorToBase) || 1;
                    const autoPrice = Number(sellingPrice || 0) * factor;
                    const displayPrice = u.sellingPrice && Number(u.sellingPrice) > 0 ? Number(u.sellingPrice) : autoPrice;
                    const isCustom = u.sellingPrice && Number(u.sellingPrice) > 0;
                    return (
                      <div key={u.id} className="rounded-lg bg-white p-2.5 border border-neutral-border text-center shadow-xs">
                        <div className="text-[10px] font-bold text-neutral-muted uppercase flex items-center justify-center gap-1">
                          <span>1 {u.unitName} ({factor} {primaryUnit}s)</span>
                          {isCustom && <span className="text-[9px] bg-brand-pale text-brand-hover px-1 rounded font-bold">Custom</span>}
                        </div>
                        <div className="text-sm font-extrabold text-brand-hover">
                          LKR {displayPrice.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Secondary Packaging Checkbox */}
        {primaryUnit && (
          <div className="mt-4 pt-3 border-t border-neutral-border/60">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-bold text-neutral-text">
              <input
                type="checkbox"
                className="size-4 rounded accent-brand-default"
                checked={hasSecondaryUnits}
                onChange={(e) => {
                  setHasSecondaryUnits(e.target.checked);
                  if (e.target.checked && secondaryUnits.length === 0) {
                    addSecondaryUnit();
                  }
                }}
              />
              This item is also bought or sold in larger packaging (e.g. Strip, Box, Pack)
            </label>

            {hasSecondaryUnits && (
              <div className="mt-3 space-y-3 rounded-xl border border-brand-default/20 bg-brand-pale/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-default">Packaging Conversion &amp; Custom Prices</h4>
                    <p className="text-xs text-neutral-muted">Define how many {primaryUnit}s are in each package and optional package discount price</p>
                  </div>
                  <button
                    type="button"
                    onClick={addSecondaryUnit}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-default bg-white border border-brand-default/30 px-3 py-1.5 rounded-lg shadow-sm hover:bg-brand-pale"
                  >
                    + Add Package Unit
                  </button>
                </div>

                <div className="space-y-2.5">
                  {secondaryUnits.map((row) => {
                    const autoPkgPrice = (Number(sellingPrice || 0) * (Number(row.factorToBase) || 1)).toFixed(2);
                    return (
                      <div key={row.id} className="grid items-center gap-2 sm:grid-cols-[1.1fr_1.3fr_1.3fr_1fr_auto_auto] bg-white p-3 rounded-xl border border-neutral-border shadow-sm">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-muted uppercase">Package Unit</label>
                          <SearchableSelect
                            name={`secUnit_${row.id}`}
                            defaultValue={row.unitName}
                            placeholder="Search unit..."
                            onChange={(val) => updateSecondaryUnit(row.id, { unitName: val as UnitOption })}
                            options={UNIT_OPTIONS.filter((u) => u !== primaryUnit).map((u) => ({ value: u, label: u }))}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-neutral-muted uppercase">Count ({primaryUnit}s per {row.unitName}) *</label>
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            required
                            className={inputClass}
                            placeholder={`Count in 1 ${row.unitName}`}
                            value={row.factorToBase}
                            onChange={(e) => updateSecondaryUnit(row.id, { factorToBase: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-neutral-muted uppercase">Package Price (Optional)</label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className={inputClass}
                            placeholder={`Auto (LKR ${autoPkgPrice})`}
                            value={row.sellingPrice || ""}
                            onChange={(e) => updateSecondaryUnit(row.id, { sellingPrice: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-neutral-muted uppercase">Package Barcode</label>
                          <input
                            type="text"
                            className={inputClass}
                            placeholder="Optional"
                            value={row.barcode}
                            onChange={(e) => updateSecondaryUnit(row.id, { barcode: e.target.value })}
                          />
                        </div>

                        <div className="pt-4 flex items-center gap-1.5">
                          <label className="flex items-center gap-1 text-xs text-neutral-muted whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={row.isPurchaseDefault}
                              onChange={(e) => updateSecondaryUnit(row.id, { isPurchaseDefault: e.target.checked })}
                            />
                            Default GRN
                          </label>
                        </div>

                        <div className="pt-4">
                          <button
                            type="button"
                            onClick={() => removeSecondaryUnit(row.id)}
                            className="p-1.5 text-neutral-muted hover:text-status-danger-text rounded-lg hover:bg-red-50"
                            title="Remove unit"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prescription Settings */}
      <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-5 space-y-3 shadow-sm">
        <div className="border-b border-neutral-border/60 pb-3">
          <span className="text-sm font-bold text-neutral-text">Prescription Settings</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${isControlled ? "border-amber-400 bg-amber-50/50" : "border-neutral-border bg-neutral-surface hover:bg-neutral-bg"}`}>
            <input
              checked={isControlled}
              className="size-4 accent-amber-600"
              name="isControlled"
              onChange={(e) => {
                const checked = e.target.checked;
                setIsControlled(checked);
                if (checked) setRequiresPrescription(true);
              }}
              type="checkbox"
            />
            <span className="text-sm font-bold text-neutral-text">Controlled Drug</span>
          </label>

          <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${requiresPrescription && !isControlled ? "border-blue-400 bg-blue-50/50" : "border-neutral-border bg-neutral-surface hover:bg-neutral-bg"}`}>
            <input
              checked={requiresPrescription}
              className="size-4 accent-brand-default"
              disabled={isControlled}
              name="requiresPrescription"
              onChange={(e) => setRequiresPrescription(e.target.checked)}
              type="checkbox"
            />
            <span className="text-sm font-bold text-neutral-text">Requires Prescription</span>
          </label>
        </div>
      </div>

      <FormAlert state={state} />

      <div>
        <SubmitButton>Add Product</SubmitButton>
      </div>
    </form>
  );
}
