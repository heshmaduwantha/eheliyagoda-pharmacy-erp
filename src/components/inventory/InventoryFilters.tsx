"use client";

import Link from "next/link";
import { Filter, Search, X } from "lucide-react";
import { useRef } from "react";

type FilterOption = { value: string; label: string };

export function InventoryFilters({ 
  action, 
  search = "", 
  status = "ALL", 
  statusOptions,
  direction = "ALL",
  directionOptions = [],
  showAvailability = true,
  showTimeframe = true,
  availability = "ALL",
  timeframe = "ALL",
}: { 
  action: string; 
  search?: string; 
  status?: string; 
  statusOptions: FilterOption[];
  direction?: string;
  directionOptions?: FilterOption[];
  showAvailability?: boolean;
  showTimeframe?: boolean;
  availability?: string;
  timeframe?: string;
}) {
  const active = Boolean(search) || status !== "ALL" || direction !== "ALL" || availability !== "ALL" || timeframe !== "ALL";
  const formRef = useRef<HTMLFormElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  const handleInput = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 300);
  };

  const handleChange = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3 rounded-2xl border border-neutral-border bg-neutral-surface p-4 shadow-sm sm:flex-row flex-wrap">
      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-neutral-border bg-neutral-bg px-3 focus-within:border-brand-default min-w-[200px]">
        <Search className="size-4 text-neutral-muted shrink-0" />
        <input className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" defaultValue={search} name="search" placeholder="Search product, batch, reference…" onInput={handleInput} />
      </label>
      
      <label className="flex items-center gap-2 rounded-xl border border-neutral-border px-3 text-sm text-neutral-muted shrink-0">
        <Filter className="size-4 shrink-0" />
        <select className="bg-transparent py-2.5 font-semibold text-neutral-text outline-none" defaultValue={status} name="status" onChange={handleChange}>
          <option value="ALL">All statuses</option>
          {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>

      {directionOptions.length > 0 ? <label className="flex items-center gap-2 rounded-xl border border-neutral-border px-3 text-sm text-neutral-muted shrink-0">
        <Filter className="size-4 shrink-0" />
        <select className="bg-transparent py-2.5 font-semibold text-neutral-text outline-none" defaultValue={direction} name="direction" onChange={handleChange}>
          <option value="ALL">All directions</option>
          {directionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label> : null}

      {showAvailability ? <label className="flex items-center gap-2 rounded-xl border border-neutral-border px-3 text-sm text-neutral-muted shrink-0">
        <Filter className="size-4 shrink-0" />
        <select className="bg-transparent py-2.5 font-semibold text-neutral-text outline-none" defaultValue={availability} name="availability" onChange={handleChange}>
          <option value="ALL">Any stock level</option>
          <option value="IN_STOCK">In stock</option>
          <option value="OUT_OF_STOCK">Out of stock</option>
        </select>
      </label> : null}

      {showTimeframe ? <label className="flex items-center gap-2 rounded-xl border border-neutral-border px-3 text-sm text-neutral-muted shrink-0">
        <Filter className="size-4 shrink-0" />
        <select className="bg-transparent py-2.5 font-semibold text-neutral-text outline-none" defaultValue={timeframe} name="timeframe" onChange={handleChange}>
          <option value="ALL">Any expiry</option>
          <option value="NEAR_EXPIRY">Near expiry (30d)</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </label> : null}
      
      {active && (
        <Link aria-label="Clear filters" className="grid size-11 shrink-0 place-items-center rounded-xl border border-neutral-border text-neutral-muted hover:bg-neutral-bg" href={action}>
          <X className="size-4" />
        </Link>
      )}
    </form>
  );
}
