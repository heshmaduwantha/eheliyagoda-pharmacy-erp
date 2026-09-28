"use client";

import Link from "next/link";
import {
  Banknote,
  Calendar,
  CreditCard,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { CashierDashboardData } from "@/modules/dashboard/dashboard.service";
import type { CurrentUser } from "@/modules/auth/session";

export function CashierDashboard({
  data,
  user,
}: {
  data: CashierDashboardData;
  user: CurrentUser;
}) {
  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date());

  const expenseNum = Number(data.todayExpenseTotal) || 0;
  const expenseValue = expenseNum === 0 && data.todayExpenseCount === 0
    ? "No expenses yet"
    : formatMoney(data.todayExpenseTotal);
  const expenseHint = data.todayExpenseCount === 0
    ? "0 entries today"
    : `${data.todayExpenseCount} recorded today`;

  return (
    <div className="mx-auto max-w-7xl min-w-0 pb-12 pt-2">
      {/* ── Top Hero / Counter Banner ── */}
      <div className="mb-6 rounded-3xl border border-brand-default/15 bg-gradient-to-r from-brand-pale/90 via-brand-pale/40 to-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-default px-3.5 py-1 text-xs font-bold text-white shadow-sm">
                <Calendar className="size-3.5" /> {todayFormatted}
              </span>
            </div>
            <h1 className="mt-2.5 text-2xl font-black tracking-tight text-neutral-text sm:text-3xl">
              Welcome, {user.name}
            </h1>
            <p className="mt-1 text-sm text-neutral-muted">
              Here is the pharmacy&apos;s daily sales summary for today.
            </p>
          </div>

          <div>
            <Link
              href="/pos"
              className="inline-flex items-center gap-2.5 rounded-xl bg-brand-default px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-brand-hover hover:shadow-lg active:scale-98"
            >
              <ShoppingCart className="size-4.5" strokeWidth={2.5} />
              Open POS / New Sale
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4 Key Counter KPI Cards (Entire Store Full-Day Total) ── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Total Sales */}
        <div className="group flex flex-col gap-3 rounded-2xl border border-neutral-border/70 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-brand-default/40">
          <div className="flex items-center justify-between">
            <div className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:scale-105">
              <TrendingUp className="size-5.5" strokeWidth={2.5} />
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {data.todaySaleCount} bill{data.todaySaleCount === 1 ? "" : "s"}
            </span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-muted">Today&apos;s Total Sales</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-neutral-text">
              {formatMoney(data.todaySalesTotal)}
            </p>
            <p className="mt-1 text-xs text-neutral-muted">Combined sales across all shifts</p>
          </div>
        </div>

        {/* Cash Collected */}
        <div className="group flex flex-col gap-3 rounded-2xl border border-neutral-border/70 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-emerald-300">
          <div className="flex items-center justify-between">
            <div className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:scale-105">
              <Banknote className="size-5.5" strokeWidth={2.5} />
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              Cash Drawer
            </span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-muted">Cash Collected</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-emerald-700">
              {formatMoney(data.todayCashTotal)}
            </p>
            <p className="mt-1 text-xs text-neutral-muted">Total cash collected in drawer</p>
          </div>
        </div>

        {/* Card Payments */}
        <div className="group flex flex-col gap-3 rounded-2xl border border-neutral-border/70 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-violet-300">
          <div className="flex items-center justify-between">
            <div className="grid size-11 place-items-center rounded-xl bg-violet-50 text-violet-600 transition group-hover:scale-105">
              <CreditCard className="size-5.5" strokeWidth={2.5} />
            </div>
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-bold text-violet-700">
              Card Terminal
            </span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-muted">Card Payments</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-violet-700">
              {formatMoney(data.todayCardTotal)}
            </p>
            <p className="mt-1 text-xs text-neutral-muted">Total card transactions sum</p>
          </div>
        </div>

        {/* Expenses */}
        <Link
          href="/expenses"
          className="group flex flex-col gap-3 rounded-2xl border border-neutral-border/70 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-teal-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-600 transition group-hover:scale-110">
              <Receipt className="size-5.5" strokeWidth={2.5} />
            </div>
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700">
              Expenses
            </span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-muted">Today&apos;s Expenses</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-teal-800">
              {expenseValue}
            </p>
            <p className="mt-1 text-xs text-neutral-muted">{expenseHint}</p>
          </div>
        </Link>
      </div>

      {/* ── Fast Moving Products Today ── */}
      <div className="rounded-2xl border border-neutral-border/60 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-text">Fast Moving Products Today</h2>
            <p className="text-xs text-neutral-muted">Items dispensed at counter for current date</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.topSellingItems.length === 0 ? (
            <div className="col-span-full py-10 text-center text-xs text-neutral-muted">
              <Package className="mx-auto mb-2 size-7 text-neutral-border" />
              No items sold yet today.
            </div>
          ) : (
            data.topSellingItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-neutral-bg/50 p-3.5 transition hover:bg-brand-pale/30">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-pale text-xs font-extrabold text-brand-default shadow-xs">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-neutral-text">{item.productName}</p>
                    <p className="text-[11px] text-neutral-muted">{item.unitsSold} units dispensed</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-black text-neutral-text ml-2">
                  {formatMoney(item.revenue)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
