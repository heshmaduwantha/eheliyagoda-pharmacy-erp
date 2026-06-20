"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, ClipboardList, LayoutDashboard, PackageSearch, ReceiptText, Settings, ShoppingCart, Truck, UsersRound, type LucideIcon } from "lucide-react";

type NavItem = { label: string; href: string; permission: string; icon: LucideIcon; admin?: boolean };

const items: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", permission: "dashboard.view", icon: LayoutDashboard },
  { label: "Point of Sale", href: "/pos", permission: "pos.access", icon: ShoppingCart },
  { label: "Stock", href: "/stock", permission: "stock.access", icon: Boxes },
  { label: "Products", href: "/products", permission: "product.manage", icon: PackageSearch },
  { label: "Suppliers", href: "/suppliers", permission: "supplier.manage", icon: Truck },
  { label: "Expenses", href: "/expenses", permission: "expense.manage", icon: ReceiptText },
  { label: "Reports", href: "/reports", permission: "report.view", icon: BarChart3 },
  { label: "Users & Roles", href: "/admin/users", permission: "user.manage", icon: UsersRound, admin: true },
  { label: "Audit Logs", href: "/admin/audit", permission: "audit.view", icon: ClipboardList, admin: true },
  { label: "Settings", href: "/admin/settings", permission: "settings.manage", icon: Settings, admin: true },
];

export function SidebarNav({ permissions, mobile = false }: { permissions: string[]; mobile?: boolean }) {
  const pathname = usePathname();
  const available = items.filter((item) => permissions.includes(item.permission));

  if (mobile) {
    return <nav className="fixed inset-x-3 bottom-3 z-50 flex justify-around rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_14px_45px_rgba(15,23,42,.18)] backdrop-blur lg:hidden">{available.slice(0, 5).map(({ label, href, icon: Icon }) => { const active = pathname === href; return <Link aria-label={label} className={`grid min-w-14 place-items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold ${active ? "bg-teal-50 text-teal-700" : "text-slate-500"}`} href={href} key={href}><Icon className="size-5" /><span>{label === "Point of Sale" ? "POS" : label}</span></Link>; })}</nav>;
  }

  const primary = available.filter((item) => !item.admin);
  const admin = available.filter((item) => item.admin);
  const renderLink = ({ label, href, icon: Icon }: NavItem) => { const active = pathname === href; return <Link className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-gradient-to-r from-teal-500 to-emerald-400 text-white shadow-lg shadow-teal-950/15" : "text-teal-50/80 hover:bg-white/8 hover:text-white"}`} href={href} key={href}><Icon className="size-[18px]" strokeWidth={active ? 2.4 : 2} /><span>{label}</span></Link>; };

  return <nav className="grid gap-1">{primary.map(renderLink)}{admin.length > 0 && <><p className="mb-1 mt-6 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-teal-100/40">Administration</p>{admin.map(renderLink)}</>}</nav>;
}
