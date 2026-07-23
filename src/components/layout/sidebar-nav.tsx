"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Banknote, Boxes, ClipboardList, LayoutDashboard, PackagePlus, PackageSearch, ReceiptText, Settings, ShoppingCart, Truck, UsersRound, type LucideIcon } from "lucide-react";

type NavItem = { label: string; href: string; permission: string; icon: LucideIcon; group: string };

const items: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", permission: "reports.dashboard.read", icon: LayoutDashboard, group: "Main" },
  { label: "Billing", href: "/pos", permission: "pos.sale.read", icon: ShoppingCart, group: "Main" },
  
  { label: "Stock", href: "/stock", permission: "inventory.stock.read", icon: Boxes, group: "Inventory" },
  { label: "Receive stock", href: "/stock/grn", permission: "procurement.grn.manage", icon: PackagePlus, group: "Inventory" },
  { label: "Products", href: "/products", permission: "inventory.product.manage", icon: PackageSearch, group: "Inventory" },
  
  { label: "Sale history", href: "/sales", permission: "pos.sale.create", icon: ReceiptText, group: "Finance & Sales" },
  { label: "Expenses", href: "/expenses", permission: "expenses.read", icon: ReceiptText, group: "Finance & Sales" },
  { label: "Reports", href: "/reports", permission: "reports.read", icon: BarChart3, group: "Finance & Sales" },

  { label: "Suppliers", href: "/suppliers", permission: "suppliers.manage", icon: Truck, group: "Purchasing" },
  { label: "Pay suppliers", href: "/suppliers/payments", permission: "suppliers.payments.read", icon: Banknote, group: "Purchasing" },
  
  { label: "Users", href: "/admin/users", permission: "admin.users.manage", icon: UsersRound, group: "Admin" },
  { label: "Roles", href: "/admin/roles", permission: "admin.roles.manage", icon: ClipboardList, group: "Admin" },
  { label: "Permissions", href: "/admin/permissions", permission: "admin.permissions.read", icon: Settings, group: "Admin" },
  { label: "Audit logs", href: "/admin/audit", permission: "audit.read", icon: ClipboardList, group: "Admin" },
];

export function SidebarNav({ permissions, mobile = false }: { permissions: string[]; mobile?: boolean }) {
  const pathname = usePathname();
  const available = items.filter((item) => permissions.includes(item.permission));
  const activeHref = available
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;

  if (mobile) {
    return (
      <nav className="fixed inset-x-3 bottom-3 z-50 flex justify-around rounded-2xl border border-neutral-border bg-neutral-surface/95 p-2 shadow-[0_14px_45px_rgba(15,23,42,.18)] backdrop-blur lg:hidden">
        {available.slice(0, 5).map(({ label, href, icon: Icon }) => {
          const active = activeHref === href;
          return (
            <Link
              aria-label={label}
              className={`grid min-w-14 place-items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold ${active ? "bg-brand-pale text-brand-default" : "text-neutral-muted"}`}
              href={href}
              key={href}
            >
              <Icon className="size-5" />
              <span>{label === "Billing" ? "POS" : label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  // Group items
  const groups = available.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof available>);

  return (
    <nav className="flex flex-col gap-3">
      {Object.entries(groups).map(([groupName, groupItems]) => (
        <div key={groupName} className="grid gap-0.5">
          {groupName !== "Main" && (
            <p className="mb-0.5 ml-3 text-[10px] font-bold uppercase tracking-widest text-neutral-muted/70">
              {groupName}
            </p>
          )}
          {groupItems.map(({ label, href, icon: Icon }) => {
            const active = activeHref === href;
            return (
              <Link
                className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active ? "bg-brand-pale text-brand-hover shadow-sm" : "text-neutral-muted hover:bg-neutral-bg hover:text-brand-hover"
                }`}
                href={href}
                key={href}
              >
                <Icon className="size-[18px]" strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
