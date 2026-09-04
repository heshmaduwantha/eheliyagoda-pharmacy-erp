"use client";

import React from "react";
import { Printer } from "lucide-react";

interface PrintGrnLabelsButtonProps {
  grnId?: string | null;
  batchId?: string | null;
  batchIds?: (string | null | undefined)[];
  variant?: "primary" | "secondary" | "icon";
  label?: string;
}

export function PrintGrnLabelsButton({
  grnId,
  batchId,
  batchIds,
  variant = "primary",
  label = "Print GRN Batch Label",
}: PrintGrnLabelsButtonProps) {
  const handlePrint = () => {
    const targetId = grnId || batchId || (batchIds && batchIds.find(Boolean));
    if (targetId) {
      window.open(`/api/print/batch-label/${targetId}`, "_blank", "width=450,height=400");
    } else {
      alert("No GRN batch record found for label printing.");
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center justify-center rounded-lg border border-sky-200 bg-sky-50 p-1.5 text-sky-700 hover:bg-sky-100"
        title="Print batch thermal label"
      >
        <Printer className="size-4" />
      </button>
    );
  }

  if (variant === "secondary") {
    return (
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 transition-colors hover:bg-sky-100"
        title="Print GRN batch thermal label"
      >
        <Printer className="size-3.5" />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
    >
      <Printer className="size-4" />
      {label}
    </button>
  );
}
