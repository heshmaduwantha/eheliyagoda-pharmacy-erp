"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { AdminRoleListRow, AdminUserDetail } from "./rbac.service";
import { saveUserAction } from "./rbac.actions";
import { idleFormState } from "@/lib/forms";
import { Field, FormAlert, SubmitButton, inputClass } from "@/components/ui/form";

type UserFormProps = {
  user?: AdminUserDetail | null;
  roles: AdminRoleListRow[];
};

export function UserForm({ user, roles }: UserFormProps) {
  const [state, formAction] = useActionState(saveUserAction, idleFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const initialRoleIds = useMemo(
    () => new Set(user?.roleIds ?? (roles.length > 0 ? [roles[0].id] : [])),
    [user?.roleIds, roles]
  );

  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(initialRoleIds);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setSelectedRoleIds(initialRoleIds);
    }
  }, [state, initialRoleIds]);

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(roleId);
      } else {
        next.delete(roleId);
      }
      return next;
    });
  };

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

      <div className="rounded-2xl border border-neutral-border bg-neutral-bg p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-muted">Status</p>
            <p className="mt-1 text-sm text-neutral-muted">Inactive users cannot sign in, but their history remains intact.</p>
          </div>
          <label className="inline-flex items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-4 py-2 text-sm font-semibold text-neutral-text">
            <input defaultChecked={user?.isActive ?? true} name="isActive" type="checkbox" />
            Active
          </label>
        </div>
      </div>

      {/* Role Selection Grid */}
      <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-5 shadow-sm">
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-muted">Assigned Roles</p>
          <p className="mt-0.5 text-xs text-neutral-muted">Check all roles that apply to this user account.</p>
          {state.status === "error" && state.fieldErrors?.roleIds && (
            <p className="mt-1 text-xs font-semibold text-status-danger-text">{state.fieldErrors.roleIds[0]}</p>
          )}
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => {
            const isChecked = selectedRoleIds.has(role.id);

            return (
              <label
                key={role.id}
                className={`flex items-center justify-between rounded-xl border p-3.5 text-sm transition-all cursor-pointer ${
                  isChecked
                    ? "border-brand-default bg-brand-pale/40 text-neutral-text font-bold shadow-sm"
                    : "border-neutral-border/80 bg-neutral-bg/50 text-neutral-muted hover:border-neutral-border"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    name="roleIds"
                    value={role.id}
                    checked={isChecked}
                    onChange={(e) => handleRoleToggle(role.id, e.target.checked)}
                    className="size-4 rounded border-neutral-border text-brand-default focus:ring-brand-default"
                  />
                  <span className="truncate">{role.name}</span>
                </div>
                {!role.isActive && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-muted">
                    inactive
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      <FormAlert state={state} />
      <div>
        <SubmitButton>{user ? "Save user" : "Create user"}</SubmitButton>
      </div>
    </form>
  );
}
