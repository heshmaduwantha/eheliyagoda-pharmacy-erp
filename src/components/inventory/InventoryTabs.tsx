import Link from "next/link";

const tabs = [
  ["Overview", "/stock"],
  ["Batches", "/stock/batches"],
  ["Movements", "/stock/movements"],
  ["Expiry alerts", "/stock/expiry"],
] as const;

export function InventoryTabs({ active }: { active: (typeof tabs)[number][1] }) {
  return <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-neutral-border bg-neutral-surface p-1.5 shadow-sm">{tabs.map(([label, href]) => <Link className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold ${active === href ? "bg-brand-default text-white shadow-md" : "text-neutral-muted hover:bg-neutral-bg hover:text-neutral-text"}`} href={href} key={href}>{label}</Link>)}</nav>;
}
