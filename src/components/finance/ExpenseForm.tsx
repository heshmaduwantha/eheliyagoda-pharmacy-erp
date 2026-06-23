"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { createExpenseAction } from "@/modules/finance/finance.actions";
import { EXPENSE_CATEGORIES } from "@/modules/finance/expense.types";
import { idleFormState } from "@/lib/forms";
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
    <form action={formAction} className="grid gap-4" ref={formRef}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field htmlFor="date" label="Expense date" error={state.status === "error" ? state.fieldErrors?.date : undefined}>
          <input className={inputClass} defaultValue={date} id="date" name="date" type="date" required />
        </Field>
        <Field htmlFor="category" label="Category" error={state.status === "error" ? state.fieldErrors?.category : undefined}>
          <select className={inputClass} defaultValue="OTHER" id="category" name="category" required>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {formatCategoryLabel(category)}
              </option>
            ))}
          </select>
        </Field>
        <Field htmlFor="amount" label="Amount" error={state.status === "error" ? state.fieldErrors?.amount : undefined}>
          <input className={inputClass} id="amount" name="amount" min="0.01" step="0.01" type="number" required />
        </Field>
        <Field htmlFor="paymentMethod" label="Payment method" error={state.status === "error" ? state.fieldErrors?.paymentMethod : undefined}>
          <select className={inputClass} defaultValue="CASH" id="paymentMethod" name="paymentMethod" required>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method === "CASH" ? "Cash" : "Card"}
              </option>
            ))}
          </select>
        </Field>
        <Field htmlFor="description" label="Description">
          <input className={inputClass} id="description" name="description" placeholder="Electricity bill for June" />
        </Field>
        <Field htmlFor="reference" label="Reference">
          <input className={inputClass} id="reference" name="reference" placeholder="Receipt / bill no." />
        </Field>
      </div>
      <Field htmlFor="notes" label="Notes">
        <textarea className={`${inputClass} min-h-24`} id="notes" name="notes" placeholder="Optional notes" />
      </Field>
      <FormAlert state={state} />
      <div>
        <SubmitButton>Add expense</SubmitButton>
      </div>
    </form>
  );
}
