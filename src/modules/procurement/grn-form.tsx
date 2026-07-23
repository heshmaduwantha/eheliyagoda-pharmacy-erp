"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Field, FormAlert, SubmitButton, inputClass } from "@/components/ui/form";
import { formatMoney } from "@/lib/money";
import { idleFormState } from "@/lib/forms";
import { createGrnDraftAction, updateGrnDraftAction } from "./actions";

export type GrnFormProduct = {
  id: string;
  name: string;
  productType: "MEDICINE" | "GENERAL_ITEM";
  units: { id: string; unitName: string; isPurchaseDefault: boolean }[];
};

type GrnFormSupplier = { id: string; name: string };

type LineRow = {
  productId: string;
  unitId: string;
  qtyInUnit: string;
  batchNo: string;
  supplierBatchNo: string;
  expiryDate: string;
  mrp: string;
  costPrice: string;
  sellingPrice: string;
};

export type GrnFormInitialData = {
  id: string;
  supplierId: string;
  notes: string;
  lines: LineRow[];
};

const emptyLine = (): LineRow => ({
  productId: "",
  unitId: "",
  qtyInUnit: "",
  batchNo: "",
  supplierBatchNo: "",
  expiryDate: "",
  mrp: "",
  costPrice: "",
  sellingPrice: "",
});

const lineTotal = (line: LineRow) => (Number(line.qtyInUnit) || 0) * (Number(line.costPrice) || 0);

export function GrnForm({
  suppliers,
  products,
  initialData,
}: {
  suppliers: GrnFormSupplier[];
  products: GrnFormProduct[];
  initialData?: GrnFormInitialData;
}) {
  const [state, formAction] = useActionState(
    initialData ? updateGrnDraftAction.bind(null, initialData.id) : createGrnDraftAction,
    idleFormState
  );
  const [lines, setLines] = useState<LineRow[]>(initialData?.lines.length ? initialData.lines : [emptyLine()]);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const grandTotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);

  const updateLine = (index: number, patch: Partial<LineRow>) =>
    setLines((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const onProductChange = (index: number, productId: string) => {
    const product = productById.get(productId);
    const defaultUnit = product?.units.find((u) => u.isPurchaseDefault) ?? product?.units[0];
    updateLine(index, { productId, unitId: defaultUnit?.id ?? "" });
  };

  const linesPayload = JSON.stringify(
    lines
      .filter((l) => l.productId && l.unitId && l.qtyInUnit)
      .map((l) => ({
        productId: l.productId,
        unitId: l.unitId,
        qtyInUnit: Number(l.qtyInUnit),
        supplierBatchNo: l.supplierBatchNo.trim() || undefined,
        expiryDate: l.expiryDate || undefined,
        mrp: l.mrp ? Number(l.mrp) : undefined,
        costPrice: Number(l.costPrice || 0),
        sellingPrice: Number(l.sellingPrice || 0),
      })),
  );

  const cell = "px-2 py-1.5 align-top";

  return (
    <form action={formAction} className="grid gap-6">
      <input name="lines" type="hidden" value={linesPayload} />

      <p className="rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-2.5 text-sm font-medium text-teal-800">
        The invoice number and total are generated automatically (e.g. <span className="font-bold">INV-{new Date().toISOString().slice(0, 10).replace(/-/g, "")}-0001</span>) — no need to type them.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={state.status === "error" ? state.fieldErrors?.supplierId : undefined} htmlFor="supplierId" label="Supplier">
          <SearchableSelect
            id="supplierId"
            name="supplierId"
            defaultValue={initialData?.supplierId ?? ""}
            required
            placeholder="Select supplier..."
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          />
        </Field>
        <Field htmlFor="notes" label="Note">
          <input className={inputClass} defaultValue={initialData?.notes ?? ""} id="notes" name="notes" placeholder="Optional remark" />
        </Field>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700">Items</h3>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700"
            onClick={() => setLines((rows) => [...rows, emptyLine()])}
            type="button"
          >
            <Plus className="size-3.5" /> Add item
          </button>
        </div>
        {state.status === "error" && state.fieldErrors?.lines && (
          <p className="text-xs font-semibold text-red-600">{state.fieldErrors.lines}</p>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-2 py-2.5">Product</th>
                <th className="px-2 py-2.5">Unit</th>
                <th className="px-2 py-2.5">Qty</th>
                <th className="px-2 py-2.5">System batch</th>
                <th className="px-2 py-2.5">Supplier lot</th>
                <th className="px-2 py-2.5">Expiry</th>
                <th className="px-2 py-2.5">MRP</th>
                <th className="px-2 py-2.5">Cost</th>
                <th className="px-2 py-2.5">Price</th>
                <th className="px-2 py-2.5 text-right">Total</th>
                <th className="px-2 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => {
                const product = productById.get(line.productId);
                return (
                  <tr className="border-t border-slate-100" key={index}>
                    <td className={`${cell} w-[15%] min-w-[200px]`}>
                      <SearchableSelect
                        name={`productId_${index}`}
                        defaultValue={line.productId}
                        onChange={(val) => onProductChange(index, val)}
                        placeholder="Search product..."
                        options={products.map((p) => ({ value: p.id, label: p.name }))}
                      />
                    </td>
                    <td className={`${cell} w-[9%]`}>
                      <select className={inputClass} onChange={(e) => updateLine(index, { unitId: e.target.value })} value={line.unitId}>
                        <option disabled value="">—</option>
                        {product?.units.map((u) => (
                          <option key={u.id} value={u.id}>{u.unitName}</option>
                        ))}
                      </select>
                    </td>
                    <td className={`${cell} w-[9%]`}><input className={inputClass} min="0" onChange={(e) => updateLine(index, { qtyInUnit: e.target.value })} step="0.001" type="number" value={line.qtyInUnit} /></td>
                    <td className={`${cell} w-[11%] pt-3 text-xs font-semibold text-teal-700`}>{line.batchNo || "Generated on save"}</td>
                    <td className={`${cell} w-[11%]`}><input aria-label="Supplier batch or lot number" className={inputClass} onChange={(e) => updateLine(index, { supplierBatchNo: e.target.value })} placeholder="Optional" value={line.supplierBatchNo} /></td>
                    <td className={`${cell} w-[12%]`}><input className={inputClass} onChange={(e) => updateLine(index, { expiryDate: e.target.value })} type="date" value={line.expiryDate} /></td>
                    <td className={`${cell} w-[9%]`}><input className={inputClass} min="0" onChange={(e) => updateLine(index, { mrp: e.target.value })} step="0.01" type="number" value={line.mrp} /></td>
                    <td className={`${cell} w-[9%]`}><input className={inputClass} min="0" onChange={(e) => updateLine(index, { costPrice: e.target.value })} step="0.01" type="number" value={line.costPrice} /></td>
                    <td className={`${cell} w-[9%]`}><input className={inputClass} min="0" onChange={(e) => updateLine(index, { sellingPrice: e.target.value })} step="0.01" type="number" value={line.sellingPrice} /></td>
                    <td className={`${cell} w-[10%] pt-3.5 text-right font-semibold text-slate-700`}>{formatMoney(lineTotal(line))}</td>
                    <td className={`${cell} w-[4%] pt-2.5`}>
                      {lines.length > 1 && (
                        <button className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => setLines((rows) => rows.filter((_, i) => i !== index))} type="button">
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td className="px-2 py-3 text-right text-sm font-bold text-slate-600" colSpan={8}>Invoice total</td>
                <td className="px-2 py-3 text-right text-base font-black text-teal-700">{formatMoney(grandTotal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-xs text-slate-400">A system batch number is always generated and used for stock tracking. Supplier batch/lot is optional, but enter the value printed on the supplier invoice or medicine pack when available. Medicine items still require an expiry date and MRP; selling price cannot exceed MRP.</p>
      </div>

      <FormAlert state={state} />
      <div>
        <SubmitButton>Save draft</SubmitButton>
      </div>
    </form>
  );
}
