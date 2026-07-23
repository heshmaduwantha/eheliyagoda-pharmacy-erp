import Link from "next/link";
import { Filter, Search, X } from "lucide-react";

type FilterOption = { value: string; label: string };

export function InventoryFilters({ 
  action, 
  search = "", 
  status = "ALL", 
  statusOptions,
  availability = "ALL",
  timeframe = "ALL",
}: { 
  action: string; 
  search?: string; 
  status?: string; 
  statusOptions: FilterOption[];
  availability?: string;
  timeframe?: string;
}) {
  const active = Boolean(search) || status !== "ALL" || availability !== "ALL" || timeframe !== "ALL";
  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row flex-wrap">
      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-teal-400 min-w-[200px]">
        <Search className="size-4 text-slate-400 shrink-0" />
        <input className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" defaultValue={search} name="search" placeholder="Search product, batch, reference…" />
      </label>
      
      <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-500 shrink-0">
        <Filter className="size-4 shrink-0" />
        <select className="bg-transparent py-2.5 font-semibold text-slate-700 outline-none" defaultValue={status} name="status">
          <option value="ALL">All statuses</option>
          {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>

      <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-500 shrink-0">
        <Filter className="size-4 shrink-0" />
        <select className="bg-transparent py-2.5 font-semibold text-slate-700 outline-none" defaultValue={availability} name="availability">
          <option value="ALL">Any stock level</option>
          <option value="IN_STOCK">In stock</option>
          <option value="OUT_OF_STOCK">Out of stock</option>
        </select>
      </label>

      <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-500 shrink-0">
        <Filter className="size-4 shrink-0" />
        <select className="bg-transparent py-2.5 font-semibold text-slate-700 outline-none" defaultValue={timeframe} name="timeframe">
          <option value="ALL">Any expiry</option>
          <option value="NEAR_EXPIRY">Near expiry (90d)</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </label>

      <button className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-800 shrink-0" type="submit">Apply</button>
      
      {active && (
        <Link aria-label="Clear filters" className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50" href={action}>
          <X className="size-4" />
        </Link>
      )}
    </form>
  );
}
