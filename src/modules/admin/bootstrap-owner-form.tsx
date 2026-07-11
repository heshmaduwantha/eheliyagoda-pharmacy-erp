"use client";

import { useActionState, useEffect, useRef } from "react";
import { bootstrapOwnerAction } from "./rbac.actions";
import { idleFormState } from "@/lib/forms";
import { Field, FormAlert, SubmitButton, inputClass } from "@/components/ui/form";

export function BootstrapOwnerForm() {
  const [state, formAction] = useActionState(bootstrapOwnerAction, idleFormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4" ref={formRef}>
      <Field error={state.status === "error" ? state.fieldErrors?.name : undefined} htmlFor="name" label="Owner name">
        <input className={inputClass} id="name" name="name" placeholder="Owner Doctor" required />
      </Field>
      <Field error={state.status === "error" ? state.fieldErrors?.username : undefined} htmlFor="username" label="Username">
        <input className={inputClass} autoComplete="username" id="username" name="username" placeholder="owner" required />
      </Field>
      <Field error={state.status === "error" ? state.fieldErrors?.password : undefined} htmlFor="password" label="Password">
        <input className={inputClass} autoComplete="new-password" id="password" name="password" minLength={6} type="password" required />
      </Field>
      <Field htmlFor="phone" label="Phone">
        <input className={inputClass} id="phone" name="phone" placeholder="0771234567" />
      </Field>
      <FormAlert state={state} />
      <div>
        <SubmitButton>Bootstrap owner</SubmitButton>
      </div>
    </form>
  );
}
