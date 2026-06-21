"use client";

import { useEffect, useRef, useState } from "react";
import { Barcode, CornerDownLeft } from "lucide-react";

export function BarcodeInput({ onScan }: { onScan: (barcode: string) => void }) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = () => {
    const barcode = value.trim();
    if (!barcode) return;
    onScan(barcode);
    setValue("");
    inputRef.current?.focus();
  };

  return <div className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-white p-2 shadow-[0_8px_30px_rgba(15,51,58,.06)] focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-500/10"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><Barcode className="size-6" /></span><input ref={inputRef} aria-label="Scan barcode" className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base font-medium text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400" onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); submit(); } }} placeholder="Scan barcode or enter code…" value={value} /><button className="hidden items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 sm:flex" onClick={submit} type="button">Add<CornerDownLeft className="size-4" /></button></div>;
}
