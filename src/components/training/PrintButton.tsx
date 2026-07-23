"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return <button className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 print:hidden" onClick={() => window.print()} type="button"><Printer className="size-4" />Print</button>;
}
