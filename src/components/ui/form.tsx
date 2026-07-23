"use client";

import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { FormState } from "@/lib/forms";

export const inputClass =
  "w-full rounded-lg border border-neutral-border bg-neutral-surface px-2.5 py-1.5 text-sm text-neutral-text shadow-sm outline-none transition placeholder:text-neutral-muted focus:border-brand-default focus:ring-1 focus:ring-brand-default/50";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1" htmlFor={htmlFor}>
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-muted">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-neutral-muted">{hint}</span>}
      {error && <span className="text-xs font-semibold text-status-danger-text">{error}</span>}
    </label>
  );
}

export function SubmitButton({ children, disabled = false, className = "" }: { children: React.ReactNode; disabled?: boolean; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-brand-default px-3 py-1.5 text-sm font-bold text-white transition hover:bg-brand-default disabled:opacity-60 ${className}`}
      disabled={pending || disabled}
      type="submit"
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function FormAlert({ state }: { state: FormState }) {
  if (state.status === "success") {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-status-success-bg bg-status-success-bg px-3 py-2 text-sm font-semibold text-status-success-text">
        <CheckCircle2 className="size-4" />
        {state.message}
      </p>
    );
  }
  if (state.status === "error") {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-red-200 bg-status-danger-bg px-3 py-2 text-sm font-semibold text-status-danger-text">
        <AlertCircle className="size-4" />
        {state.message}
      </p>
    );
  }
  return null;
}

export function PageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-text">{title}</h1>
        <p className="mt-0.5 max-w-2xl text-sm text-neutral-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
