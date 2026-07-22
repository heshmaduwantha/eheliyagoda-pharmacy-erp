"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { createExpenseAction } from "@/modules/finance/finance.actions";
import { EXPENSE_CATEGORIES } from "@/modules/finance/expense.types";
import { idleFormState } from "@/lib/forms";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Field, FormAlert, SubmitButton, inputClass } from "@/components/ui/form";

const PAYMENT_METHODS = ["CASH", "CARD"] as const;

function formatCategoryLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseForm() {
  const [state, formAction] = useActionState(createExpenseAction, idleFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const date = useMemo(() => todayValue(), []);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form action={formAction} className="grid gap-3" ref={formRef}>
      {/* Compact layout with grid */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Field htmlFor="amount" label="Amount (LKR)" error={state.status === "error" ? state.fieldErrors?.amount : undefined}>
          <input className={inputClass} id="amount" name="amount" min="0.01" step="0.01" type="number" placeholder="0.00" required />
        </Field>
        <div className="sm:col-span-2">
          <Field htmlFor="description" label="What was it for?">
            <input className={inputClass} id="description" name="description" placeholder="e.g. Electricity bill, rent" />
          </Field>
        </div>
        <Field htmlFor="paymentMethod" label="Paid by" error={state.status === "error" ? state.fieldErrors?.paymentMethod : undefined}>
          <select className={inputClass} defaultValue="CASH" id="paymentMethod" name="paymentMethod" required>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method === "CASH" ? "Cash" : "Card"}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* More options inline */}
      <details className="rounded-lg border border-slate-200 bg-slate-50 group">
        <summary className="flex cursor-pointer items-center justify-between px-3 py-2.5 text-xs font-semibold text-slate-600 marker:content-none">
          <div className="flex items-center gap-1.5">
            <ChevronDown className="size-3.5 text-slate-400 group-open:rotate-180 transition-transform" />
            More options <span className="font-normal text-slate-400">(date, category, reference, notes)</span>
          </div>
        </summary>
        <div className="grid gap-3 border-t border-slate-200 p-3 sm:grid-cols-4">
          <Field htmlFor="date" label="Date" error={state.status === "error" ? state.fieldErrors?.date : undefined}>
            <input className={inputClass} defaultValue={date} id="date" name="date" type="date" required />
          </Field>
          <Field htmlFor="category" label="Category" error={state.status === "error" ? state.fieldErrors?.category : undefined}>
            <SearchableSelect
              id="category"
              name="category"
              defaultValue="OTHER"
              required
              placeholder="Select category..."
              options={EXPENSE_CATEGORIES.map((category) => ({
                value: category,
                label: formatCategoryLabel(category),
              }))}
            />
          </Field>
          <Field htmlFor="reference" label="Ref / bill no">
            <input className={inputClass} id="reference" name="reference" placeholder="Optional" />
          </Field>
          <Field htmlFor="notes" label="Notes">
            <input className={inputClass} id="notes" name="notes" placeholder="Extra details" />
          </Field>
        </div>
      </details>

      <FormAlert state={state} />
      <div className="flex justify-end">
        <SubmitButton>Save expense</SubmitButton>
      </div>
    </form>
  );
}
