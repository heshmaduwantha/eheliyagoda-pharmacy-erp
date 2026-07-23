"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isPending?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isPending = false,
}: ConfirmDialogProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div 
        className="w-full max-w-md overflow-hidden rounded-2xl bg-neutral-surface shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-neutral-border p-5">
          <div className="flex items-center gap-3">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${isDestructive ? 'bg-status-danger-bg text-status-danger-text' : 'bg-brand-pale text-brand-default'}`}>
              <AlertTriangle className="size-5" />
            </div>
            <h2 className="text-lg font-bold text-neutral-text">{title}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-1.5 text-neutral-muted hover:bg-slate-100 hover:text-neutral-muted transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>
        
        <div className="p-5">
          <p className="text-sm text-neutral-muted">{description}</p>
        </div>

        <div className="flex items-center justify-end gap-3 bg-neutral-bg p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl border border-neutral-border bg-neutral-surface px-4 py-2 text-sm font-semibold text-neutral-text shadow-sm transition-colors hover:bg-neutral-bg hover:text-neutral-text disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50 ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700 hover:shadow-red-600/20"
                : "bg-brand-default hover:bg-brand-default hover:shadow-teal-600/20"
            }`}
          >
            {isPending ? (
              <svg className="size-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
