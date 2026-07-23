import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/modules/auth/actions";
import { SidebarNav } from "./sidebar-nav";
import { Brand } from "@/components/ui/brand";
import type { CurrentUser } from "@/modules/auth/session";
import { NotificationBell } from "./notification-bell";
import type { AlertCounts } from "@/modules/dashboard/dashboard.service";
import { Breadcrumbs } from "./breadcrumbs";

export function AppShell({ children, user, alerts }: Readonly<{ children: React.ReactNode; user: CurrentUser; alerts: AlertCounts }>) {
  const initials = user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f4f8f8]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-hidden bg-[#064e59] px-4 pt-6 pb-6 shadow-xl lg:flex">
        <div className="px-2">
          <Link href="/dashboard">
            <Brand inverse />
          </Link>
        </div>
        <div className="mt-6 flex-1 overflow-y-auto">
          <SidebarNav permissions={user.permissions} />
        </div>
        {/* User badge at bottom */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-teal-500 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          </div>
          <form action={logoutAction} className="ml-auto">
            <button aria-label="Log out" className="grid size-7 place-items-center rounded-lg text-teal-300 transition hover:bg-white/10 hover:text-white" type="submit">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-12 items-center gap-4 px-4 sm:px-6 lg:px-8">
            <Link className="lg:hidden" href="/dashboard">
              <Brand compact />
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <NotificationBell alerts={alerts} />

            </div>
          </div>
        </header>
        <main className="mx-auto flex-1 min-w-0 w-full max-w-[1480px] px-2 py-4 pb-12 sm:px-4 lg:px-6 lg:py-4">
          <Breadcrumbs />
          {children}
        </main>

        <footer className="mt-auto border-t border-slate-200/60 bg-white/50 py-4 text-center text-xs font-medium text-slate-500 pb-20 lg:pb-4">
          All rights reserved by Medicare © 2026
        </footer>
      </div>

      {/* Mobile bottom nav */}
      <SidebarNav mobile permissions={user.permissions} />
    </div>
  );
}
