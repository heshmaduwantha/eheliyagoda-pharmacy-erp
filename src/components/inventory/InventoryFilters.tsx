import Link from "next/link";
import { Filter, Search, X } from "lucide-react";

type FilterOption = { value: string; label: string };

export function InventoryFilters({ action, search = "", status = "ALL", statusOptions }: { action: string; search?: string; status?: string; statusOptions: FilterOption[] }) {
  const active = Boolean(search) || status !== "ALL";
  return <form action={action} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-teal-400"><Search className="size-4 text-slate-400" /><input className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" defaultValue={search} name="search" placeholder="Search product, batch, reference…" /></label><label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-500"><Filter className="size-4" /><select className="min-w-40 bg-transparent py-2.5 font-semibold text-slate-700 outline-none" defaultValue={status} name="status"><option value="ALL">All statuses</option>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><button className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-800" type="submit">Apply</button>{active && <Link aria-label="Clear filters" className="grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50" href={action}><X className="size-4" /></Link>}</form>;
}
