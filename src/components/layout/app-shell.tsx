"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { logoutAction } from "@/modules/auth/actions";
import { SidebarNav } from "./sidebar-nav";
import { Brand } from "@/components/ui/brand";
import type { CurrentUser } from "@/modules/auth/session";
import { NotificationBell } from "./notification-bell";
import type { AlertCounts } from "@/modules/dashboard/dashboard.service";
import { Breadcrumbs } from "./breadcrumbs";

export function AppShell({
  children,
  user,
  alerts,
}: Readonly<{
  children: React.ReactNode;
  user: CurrentUser;
  alerts: AlertCounts;
}>) {
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar_collapsed");
    if (stored === "true") setIsCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-neutral-bg">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col bg-brand-pale border-r border-brand-default/10 pt-6 pb-6 shadow-xl transition-all duration-300 lg:flex ${
          isCollapsed ? "w-20 px-3" : "w-64 px-4"
        }`}
      >
        {/* Floating Circle Toggle Button on Border Line */}
        <button
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3.5 top-6 z-50 hidden lg:grid size-7 place-items-center rounded-full bg-brand-default text-white shadow-md hover:bg-brand-hover hover:scale-110 transition border-2 border-white cursor-pointer"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
        >
          {isCollapsed ? <ChevronRight className="size-4" strokeWidth={2.5} /> : <ChevronLeft className="size-4" strokeWidth={2.5} />}
        </button>

        <div className={`flex items-center ${isCollapsed ? "justify-center" : "px-3"}`}>
          <Link href="/dashboard" className="overflow-hidden">
            <Brand compact={isCollapsed} />
          </Link>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto no-scrollbar">
          <SidebarNav
            permissions={user.permissions}
            collapsed={isCollapsed}
          />
        </div>

        {/* User badge at bottom */}
        <div
          className={`mt-4 flex items-center gap-3 rounded-xl border border-neutral-border bg-neutral-surface ${
            isCollapsed ? "justify-center p-2" : "px-3 py-2.5"
          }`}
        >
          <div
            className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-default text-xs font-bold text-white shadow-sm"
            title={user.name}
          >
            {initials}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-text">{user.name}</p>
            </div>
          )}
          {!isCollapsed && (
            <form action={logoutAction} className="ml-auto">
              <button
                aria-label="Log out"
                className="grid size-7 place-items-center rounded-lg text-neutral-muted transition hover:bg-neutral-border hover:text-neutral-text"
                type="submit"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`flex min-h-screen min-w-0 flex-col transition-all duration-300 ${
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <header className="sticky top-0 z-30 border-b border-neutral-border/80 bg-neutral-surface/90 backdrop-blur-xl">
          <div className="flex h-13 items-center gap-4 px-4 sm:px-6 lg:px-8">
            <Link className="lg:hidden" href="/dashboard">
              <Brand compact />
            </Link>

            <div className="ml-auto flex items-center gap-3">
              <NotificationBell alerts={alerts} />
            </div>
          </div>
        </header>

        <main className="mx-auto flex-1 min-w-0 w-full max-w-[1550px] px-3 py-4 pb-12 sm:px-5 lg:px-7 lg:py-4">
          <Breadcrumbs />
          {children}
        </main>

        <footer className="mt-auto border-t border-neutral-border/60 bg-neutral-surface/50 py-4 text-center text-xs font-medium text-neutral-muted pb-20 lg:pb-4">
          All rights reserved by Medicare © 2026
        </footer>
      </div>

      {/* Mobile bottom nav */}
      <SidebarNav mobile permissions={user.permissions} />
    </div>
  );
}
