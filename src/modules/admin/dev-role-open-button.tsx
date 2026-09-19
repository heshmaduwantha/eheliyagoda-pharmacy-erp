"use client";

import { useActionState, useState } from "react";
import { idleFormState } from "@/lib/forms";
import { unlockDevRoleAction } from "./rbac.actions";

export function DevRoleOpenButton({ roleId }: { roleId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(unlockDevRoleAction, idleFormState);

  return (
    <>
      <button className="rounded-lg border border-neutral-border bg-neutral-surface px-3 py-2 text-sm font-semibold text-neutral-text hover:bg-neutral-bg" onClick={() => setOpen(true)} type="button">
        Open
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <form action={formAction} className="w-full max-w-sm rounded-2xl border border-neutral-border bg-neutral-surface p-6 text-left shadow-xl" onClick={(e) => e.stopPropagation()}>
            <input name="roleId" type="hidden" value={roleId} />
            <h3 className="text-lg font-black text-neutral-text">Password required</h3>
            <p className="mt-1 text-sm text-neutral-muted">Enter the password to open the development role.</p>
            <input autoFocus className="mt-4 w-full rounded-xl border border-neutral-border bg-neutral-bg px-3 py-2 text-sm outline-none focus:border-brand-default" name="password" placeholder="Password" required type="password" />
            {state.status === "error" ? <p className="mt-2 text-sm font-semibold text-status-danger-text">{state.message}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-lg border border-neutral-border px-4 py-2 text-sm font-semibold text-neutral-text" onClick={() => setOpen(false)} type="button">
                Cancel
              </button>
              <button className="rounded-lg bg-brand-default px-4 py-2 text-sm font-bold text-white disabled:opacity-60" disabled={pending} type="submit">
                {pending ? "Checking…" : "Open"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
