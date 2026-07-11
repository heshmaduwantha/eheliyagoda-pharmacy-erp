"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { groupPermissionsByModule, permissionRegistry } from "@/modules/auth/permission-registry";
import { saveRoleAction } from "./rbac.actions";
import type { AdminRoleDetail } from "./rbac.service";
import { idleFormState } from "@/lib/forms";
import { Field, FormAlert, SubmitButton, inputClass } from "@/components/ui/form";

type RoleFormProps = {
  role?: AdminRoleDetail | null;
};

export function RoleForm({ role }: RoleFormProps) {
  const [state, formAction] = useActionState(saveRoleAction, idleFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const groups = useMemo(() => groupPermissionsByModule(permissionRegistry), []);
  const selectedCodes = useMemo(() => new Set(role?.permissionCodes ?? []), [role?.permissionCodes]);
  const isOwnerRole = role?.code === "owner";

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form action={formAction} className="grid gap-5" ref={formRef}>
      {role ? <input name="roleId" type="hidden" value={role.id} /> : null}
      {isOwnerRole ? <input name="code" type="hidden" value={role?.code ?? "owner"} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={state.status === "error" ? state.fieldErrors?.code : undefined} htmlFor="code" label="Code">
          <input className={inputClass} defaultValue={role?.code} id="code" name="code" placeholder="inventory_manager" readOnly={isOwnerRole} required />
        </Field>
        <Field error={state.status === "error" ? state.fieldErrors?.name : undefined} htmlFor="name" label="Name">
          <input className={inputClass} defaultValue={role?.name} id="name" name="name" placeholder="Inventory Manager" required />
        </Field>
        <Field htmlFor="description" label="Description">
          <input className={inputClass} defaultValue={role?.description ?? ""} id="description" name="description" placeholder="Optional role note" />
        </Field>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Status</p>
          <label className={`mt-3 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${isOwnerRole ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-700"}`}>
            {isOwnerRole ? <input name="isActive" type="hidden" value="on" /> : null}
            <input defaultChecked={role?.isActive ?? true} disabled={isOwnerRole} name="isActive" type="checkbox" />
            Active
          </label>
          {isOwnerRole ? <p className="mt-2 text-xs font-semibold text-amber-700">Owner permissions are locked to the full registry.</p> : null}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Permission matrix</p>
            <h3 className="mt-1 text-lg font-black text-slate-900">Grouped by module</h3>
          </div>
          <p className="text-xs text-slate-500">{permissionRegistry.length} seeded permissions</p>
        </div>
        <div className="mt-5 grid gap-4">
          {groups.map((group) => (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={group.module}>
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-black uppercase tracking-[.16em] text-teal-700">{group.module}</h4>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">{group.permissions.length} permissions</span>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {group.permissions.map((permission) => (
                  <label className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-sm ${permission.isSensitive ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`} key={permission.code}>
                    <input
                      defaultChecked={isOwnerRole || selectedCodes.has(permission.code)}
                      disabled={isOwnerRole}
                      name="permissionCodes"
                      type="checkbox"
                      value={permission.code}
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold text-slate-800">{permission.code}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{permission.description}</span>
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">
                        {permission.resource}.{permission.action}
                        {permission.isSensitive ? <span className="text-rose-600">Sensitive</span> : null}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {isOwnerRole ? permissionRegistry.map((permission) => <input key={permission.code} name="permissionCodes" type="hidden" value={permission.code} />) : null}
      <FormAlert state={state} />
      <div>
        <SubmitButton>{role ? "Save role" : "Create role"}</SubmitButton>
      </div>
    </form>
  );
}
