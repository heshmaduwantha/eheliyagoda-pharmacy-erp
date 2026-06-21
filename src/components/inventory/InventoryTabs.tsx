import Link from "next/link";

const tabs = [
  ["Overview", "/stock"],
  ["Batches", "/stock/batches"],
  ["Movements", "/stock/movements"],
  ["Expiry alerts", "/stock/expiry"],
] as const;

export function InventoryTabs({ active }: { active: (typeof tabs)[number][1] }) {
  return <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">{tabs.map(([label, href]) => <Link className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold ${active === href ? "bg-teal-700 text-white shadow-md" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`} href={href} key={href}>{label}</Link>)}</nav>;
}
