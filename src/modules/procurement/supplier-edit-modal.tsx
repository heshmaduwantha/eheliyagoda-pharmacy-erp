"use client";

import { useActionState, useEffect, useState } from "react";
import { Edit, X } from "lucide-react";
import { Field, FormAlert, SubmitButton, inputClass } from "@/components/ui/form";
import { idleFormState } from "@/lib/forms";
import { updateSupplierAction } from "./actions";

type SupplierData = {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  creditTermDays: number;
};

export function SupplierEditModal({ supplier }: { supplier: SupplierData }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(updateSupplierAction, idleFormState);

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
    }
  }, [state]);

  if (!open) {
    return (
      <button
        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-border bg-neutral-surface px-3 py-1.5 text-xs font-semibold text-neutral-text hover:bg-neutral-bg hover:border-brand-default"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Edit className="size-3.5 text-neutral-muted" />
        Edit
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-border bg-neutral-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-border">
          <h2 className="text-xl font-bold text-neutral-text">Edit Supplier</h2>
          <button
            aria-label="Close"
            className="rounded-lg p-1 text-neutral-muted hover:bg-neutral-bg hover:text-neutral-text"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <form action={formAction} className="mt-4 grid gap-4">
          <input name="id" type="hidden" value={supplier.id} />
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Field error={state.status === "error" ? state.fieldErrors?.name : undefined} htmlFor="edit-name" label="Supplier name">
              <input className={inputClass} defaultValue={supplier.name} id="edit-name" name="name" required />
            </Field>

            <Field htmlFor="edit-contactPerson" label="Contact person">
              <input className={inputClass} defaultValue={supplier.contactPerson ?? ""} id="edit-contactPerson" name="contactPerson" />
            </Field>

            <Field htmlFor="edit-phone" label="Phone">
              <input className={inputClass} defaultValue={supplier.phone ?? ""} id="edit-phone" name="phone" />
            </Field>

            <Field error={state.status === "error" ? state.fieldErrors?.email : undefined} htmlFor="edit-email" label="Email">
              <input className={inputClass} defaultValue={supplier.email ?? ""} id="edit-email" name="email" type="email" />
            </Field>

            <Field htmlFor="edit-creditTermDays" label="Credit term (days)">
              <input className={inputClass} defaultValue={supplier.creditTermDays} id="edit-creditTermDays" min="0" name="creditTermDays" type="number" />
            </Field>

            <Field htmlFor="edit-address" label="Address">
              <input className={inputClass} defaultValue={supplier.address ?? ""} id="edit-address" name="address" />
            </Field>
          </div>

          <FormAlert state={state} />

          <div className="flex justify-end gap-3 pt-2">
            <button
              className="rounded-xl border border-neutral-border px-4 py-2 text-sm font-semibold text-neutral-muted hover:bg-neutral-bg"
              onClick={() => setOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <SubmitButton>Save changes</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
