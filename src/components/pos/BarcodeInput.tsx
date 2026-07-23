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

  return <div className="flex items-center gap-3 rounded-2xl border border-brand-default/20 bg-neutral-surface p-2 shadow-[0_8px_30px_rgba(15,51,58,.06)] focus-within:border-brand-default focus-within:ring-4 focus-within:ring-brand-default/50/10"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-pale text-brand-default"><Barcode className="size-6" /></span><input ref={inputRef} aria-label="Scan barcode" className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base font-medium text-neutral-text outline-none placeholder:font-normal placeholder:text-neutral-muted" onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); submit(); } }} placeholder="Scan barcode or enter code…" value={value} /><button className="hidden items-center gap-2 rounded-xl bg-brand-default px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-hover sm:flex" onClick={submit} type="button">Add<CornerDownLeft className="size-4" /></button></div>;
}
