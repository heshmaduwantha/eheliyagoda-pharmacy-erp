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
        <div className="rounded-2xl border border-neutral-border bg-neutral-bg p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-muted">Status</p>
          <label className={`mt-3 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${isOwnerRole ? "border-status-warning-bg bg-status-warning-bg text-status-warning-text" : "border-neutral-border bg-neutral-surface text-neutral-text"}`}>
            {isOwnerRole ? <input name="isActive" type="hidden" value="on" /> : null}
            <input defaultChecked={role?.isActive ?? true} disabled={isOwnerRole} name="isActive" type="checkbox" />
            Active
          </label>
          {isOwnerRole ? <p className="mt-2 text-xs font-semibold text-status-warning-text">Owner permissions are locked to the full registry.</p> : null}
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-border bg-neutral-surface p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-muted">Permission matrix</p>
            <h3 className="mt-1 text-lg font-black text-neutral-text">Grouped by module</h3>
          </div>
          <p className="text-xs text-neutral-muted">{permissionRegistry.length} seeded permissions</p>
        </div>
        <div className="mt-5 grid gap-4">
          {groups.map((group) => (
            <section className="rounded-2xl border border-neutral-border bg-neutral-bg p-4" key={group.module}>
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-bold uppercase tracking-widest text-brand-default">{group.module}</h4>
                <div className="flex items-center gap-3">
                  {!isOwnerRole && (
                    <button
                      className="inline-flex items-center gap-1 rounded bg-brand-pale font-bold uppercase tracking-wider text-brand-default transition hover:bg-brand-pale"
                      style={{ fontSize: "9px", padding: "2px 6px" }}
                      type="button"
                      onClick={(e) => {
                        const section = e.currentTarget.closest("section");
                        const checkboxes = section?.querySelectorAll("input[type='checkbox']");
                        if (checkboxes) {
                          const allChecked = Array.from(checkboxes).every((cb) => (cb as HTMLInputElement).checked);
                          checkboxes.forEach((cb) => {
                            if (!(cb as HTMLInputElement).disabled) {
                              (cb as HTMLInputElement).checked = !allChecked;
                            }
                          });
                        }
                      }}
                    >
                      Select all
                    </button>
                  )}
                  <span className="rounded-full bg-neutral-surface px-3 py-1 text-xs font-semibold text-neutral-muted">{group.permissions.length} permissions</span>
                </div>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {group.permissions.map((permission) => (
                  <label className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-sm ${permission.isSensitive ? "border-status-danger-bg bg-status-danger-bg" : "border-neutral-border bg-neutral-surface"}`} key={permission.code}>
                    <input
                      defaultChecked={isOwnerRole || selectedCodes.has(permission.code)}
                      disabled={isOwnerRole}
                      name="permissionCodes"
                      type="checkbox"
                      value={permission.code}
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold text-neutral-text">{permission.code}</span>
                      <span className="mt-0.5 block text-xs text-neutral-muted">{permission.description}</span>
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[.18em] text-neutral-muted">
                        {permission.resource}.{permission.action}
                        {permission.isSensitive ? <span className="text-status-danger-text">Sensitive</span> : null}
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
