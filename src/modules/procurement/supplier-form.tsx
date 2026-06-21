"use client";

import { useActionState, useEffect, useRef } from "react";
import { Field, FormAlert, SubmitButton, inputClass } from "@/components/ui/form";
import { idleFormState } from "@/lib/forms";
import { createSupplierAction } from "./actions";

export function SupplierForm() {
  const [state, formAction] = useActionState(createSupplierAction, idleFormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4" ref={formRef}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={state.status === "error" ? state.fieldErrors?.name : undefined} htmlFor="name" label="Supplier name">
          <input className={inputClass} id="name" name="name" placeholder="ABC Distributors" required />
        </Field>
        <Field htmlFor="contactPerson" label="Contact person">
          <input className={inputClass} id="contactPerson" name="contactPerson" />
        </Field>
        <Field htmlFor="phone" label="Phone">
          <input className={inputClass} id="phone" name="phone" />
        </Field>
        <Field error={state.status === "error" ? state.fieldErrors?.email : undefined} htmlFor="email" label="Email">
          <input className={inputClass} id="email" name="email" type="email" />
        </Field>
        <Field htmlFor="creditTermDays" label="Credit term (days)">
          <input className={inputClass} defaultValue={0} id="creditTermDays" min="0" name="creditTermDays" type="number" />
        </Field>
        <Field htmlFor="address" label="Address">
          <input className={inputClass} id="address" name="address" />
        </Field>
      </div>
      <FormAlert state={state} />
      <div>
        <SubmitButton>Create supplier</SubmitButton>
      </div>
    </form>
  );
}
