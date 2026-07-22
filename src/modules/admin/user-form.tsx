"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import type { AdminRoleListRow, AdminUserDetail } from "./rbac.service";
import { saveUserAction } from "./rbac.actions";
import { idleFormState } from "@/lib/forms";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Field, FormAlert, SubmitButton, inputClass } from "@/components/ui/form";

type UserFormProps = {
  user?: AdminUserDetail | null;
  roles: AdminRoleListRow[];
};

export function UserForm({ user, roles }: UserFormProps) {
  const [state, formAction] = useActionState(saveUserAction, idleFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const defaultPrimaryRoleId = useMemo(() => user?.primaryRoleId ?? roles.find((role) => role.isActive)?.id ?? roles[0]?.id ?? "", [roles, user?.primaryRoleId]);
  const selectedRoleIds = useMemo(() => new Set(user?.roleIds ?? [defaultPrimaryRoleId]), [defaultPrimaryRoleId, user?.roleIds]);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form action={formAction} className="grid gap-5" ref={formRef}>
      {user ? <input name="userId" type="hidden" value={user.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={state.status === "error" ? state.fieldErrors?.name : undefined} htmlFor="name" label="Name">
          <input className={inputClass} defaultValue={user?.name} id="name" name="name" placeholder="Staff name" required />
        </Field>
        <Field error={state.status === "error" ? state.fieldErrors?.username : undefined} htmlFor="username" label="Username">
          <input className={inputClass} autoComplete="username" defaultValue={user?.username} id="username" name="username" placeholder="username" required />
        </Field>
        <Field htmlFor="phone" label="Phone">
          <input className={inputClass} defaultValue={user?.phone ?? ""} id="phone" name="phone" placeholder="0771234567" />
        </Field>
        <Field error={state.status === "error" ? state.fieldErrors?.password : undefined} htmlFor="password" label={user ? "Reset password" : "Password"}>
          <input className={inputClass} autoComplete={user ? "new-password" : "new-password"} id="password" name="password" minLength={user ? undefined : 6} placeholder={user ? "Leave blank to keep current password" : "Temporary password"} type="password" required={!user} />
        </Field>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Status</p>
            <p className="mt-1 text-sm text-slate-600">Inactive users cannot sign in, but their history remains intact.</p>
          </div>
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            <input defaultChecked={user?.isActive ?? true} name="isActive" type="checkbox" />
            Active
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
        <Field error={state.status === "error" ? state.fieldErrors?.primaryRoleId : undefined} htmlFor="primaryRoleId" label="Primary role">
          <SearchableSelect
            id="primaryRoleId"
            name="primaryRoleId"
            defaultValue={defaultPrimaryRoleId}
            required
            placeholder="Select a role..."
            options={roles.map((role) => ({
              value: role.id,
              label: `${role.name} ${role.isActive ? "" : "(inactive)"}`,
            }))}
          />
        </Field>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Role assignment</p>
          <p className="mt-1 text-sm text-slate-500">A user can hold more than one role. Keep the primary role selected above.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {roles.map((role) => (
              <label className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm ${role.isActive ? "border-slate-200 bg-slate-50 text-slate-700" : "border-amber-200 bg-amber-50 text-amber-800"}`} key={role.id}>
                <span>
                  <strong className="block">{role.name}</strong>
                  <span className="text-xs text-slate-400">{role.code}</span>
                </span>
                {selectedRoleIds.has(role.id) && !role.isActive ? <input name="roleIds" type="hidden" value={role.id} /> : null}
                <input defaultChecked={selectedRoleIds.has(role.id)} disabled={!role.isActive} name="roleIds" type="checkbox" value={role.id} />
              </label>
            ))}
          </div>
          {state.status === "error" ? <p className="mt-2 text-xs font-semibold text-red-600">{state.fieldErrors?.roleIds ?? ""}</p> : null}
        </div>
      </div>

      <FormAlert state={state} />
      <div>
        <SubmitButton>{user ? "Save user" : "Create user"}</SubmitButton>
      </div>
    </form>
  );
}
