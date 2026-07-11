"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Banknote, Boxes, ClipboardList, LayoutDashboard, PackagePlus, PackageSearch, ReceiptText, Settings, ShoppingCart, Truck, UsersRound, type LucideIcon } from "lucide-react";

type NavItem = { label: string; href: string; permission: string; icon: LucideIcon; admin?: boolean };

const items: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", permission: "reports.dashboard.read", icon: LayoutDashboard },
  { label: "Point of Sale", href: "/pos", permission: "pos.sale.read", icon: ShoppingCart },
  { label: "Stock", href: "/stock", permission: "inventory.stock.read", icon: Boxes },
  { label: "Sales", href: "/sales", permission: "pos.sale.create", icon: ReceiptText },
  { label: "Goods Received", href: "/stock/grn", permission: "procurement.grn.manage", icon: PackagePlus },
  { label: "Products", href: "/products", permission: "inventory.product.manage", icon: PackageSearch },
  { label: "Suppliers", href: "/suppliers", permission: "suppliers.manage", icon: Truck },
  { label: "Expenses", href: "/expenses", permission: "expenses.read", icon: ReceiptText },
  { label: "Supplier Payments", href: "/suppliers/payments", permission: "suppliers.payments.read", icon: Banknote },
  { label: "Reports", href: "/reports", permission: "reports.read", icon: BarChart3 },
  { label: "Users", href: "/admin/users", permission: "admin.users.manage", icon: UsersRound, admin: true },
  { label: "Roles", href: "/admin/roles", permission: "admin.roles.manage", icon: ClipboardList, admin: true },
  { label: "Permissions", href: "/admin/permissions", permission: "admin.permissions.read", icon: Settings, admin: true },
  { label: "Audit Logs", href: "/admin/audit", permission: "audit.read", icon: ClipboardList, admin: true },
];

export function SidebarNav({ permissions, mobile = false }: { permissions: string[]; mobile?: boolean }) {
  const pathname = usePathname();
  const available = items.filter((item) => permissions.includes(item.permission));
  const activeHref = available
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;

  if (mobile) {
    return <nav className="fixed inset-x-3 bottom-3 z-50 flex justify-around rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_14px_45px_rgba(15,23,42,.18)] backdrop-blur lg:hidden">{available.slice(0, 5).map(({ label, href, icon: Icon }) => { const active = activeHref === href; return <Link aria-label={label} className={`grid min-w-14 place-items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold ${active ? "bg-teal-50 text-teal-700" : "text-slate-500"}`} href={href} key={href}><Icon className="size-5" /><span>{label === "Point of Sale" ? "POS" : label}</span></Link>; })}</nav>;
  }

  const primary = available.filter((item) => !item.admin);
  const admin = available.filter((item) => item.admin);
  const renderLink = ({ label, href, icon: Icon }: NavItem) => { const active = activeHref === href; return <Link className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-gradient-to-r from-teal-500 to-emerald-400 text-white shadow-lg shadow-teal-950/15" : "text-teal-50/80 hover:bg-white/8 hover:text-white"}`} href={href} key={href}><Icon className="size-[18px]" strokeWidth={active ? 2.4 : 2} /><span>{label}</span></Link>; };

  return <nav className="grid gap-1">{primary.map(renderLink)}{admin.length > 0 && <><p className="mb-1 mt-6 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-teal-100/40">Administration</p>{admin.map(renderLink)}</>}</nav>;
}
