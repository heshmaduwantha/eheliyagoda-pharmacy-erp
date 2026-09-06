"use client";

import React from "react";
import { FileText, Printer } from "lucide-react";

interface PrintGrnNoteButtonProps {
  grnId: string;
  variant?: "primary" | "secondary" | "outline" | "icon";
  label?: string;
}

export function PrintGrnNoteButton({
  grnId,
  variant = "primary",
  label = "Print GRN Note",
}: PrintGrnNoteButtonProps) {
  const handlePrint = () => {
    window.open(`/api/print/grn/${grnId}`, "_blank");
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center justify-center rounded-lg border border-neutral-border bg-neutral-surface p-2 text-neutral-text hover:bg-neutral-bg"
        title="Print GRN Note Document"
      >
        <Printer className="size-4" />
      </button>
    );
  }

  if (variant === "outline") {
    return (
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-4 py-2 text-sm font-bold text-neutral-text transition hover:bg-neutral-bg shadow-sm"
        title="Print GRN Note Document"
      >
        <Printer className="size-4 text-brand-default" />
        {label}
      </button>
    );
  }

  if (variant === "secondary") {
    return (
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-default/20 bg-brand-pale px-3 py-1.5 text-xs font-bold text-brand-hover transition hover:bg-brand-default/15"
        title="Print GRN Note Document"
      >
        <FileText className="size-3.5" />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex items-center gap-2 rounded-xl bg-brand-default px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover"
      title="Print GRN Note Document"
    >
      <Printer className="size-4" />
      {label}
    </button>
  );
}
