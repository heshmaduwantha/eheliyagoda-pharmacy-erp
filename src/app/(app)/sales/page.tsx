import { userHasAdminRole } from "@/modules/auth/admin-approval";
import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, History } from "lucide-react";

import { SalesTable } from "@/components/sales/SalesTable";
import { hasPermission, requirePermission } from "@/modules/auth/permissions";
import { listSalesForVoidPage } from "@/modules/sales/sale-void.service";
import { AutoSubmit } from "@/components/ui/auto-submit";
import type { SaleVoidListStatusFilter } from "@/modules/sales/sale-void.types";
import { Pagination } from "@/components/ui/pagination";
import { compactDateInputClass } from "@/components/ui/input-styles";

export const metadata: Metadata = {
  title: "Sale history",
};

function normalizeStatus(value?: string): SaleVoidListStatusFilter {
  if (value === "HELD" || value === "COMPLETED" || value === "VOIDED" || value === "ALL") return value;
  return "ALL";
}

function normalizeDateOnly(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : value;
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; from?: string; to?: string; page?: string }>;
}) {
  const user = await requirePermission("sale.create");
  const isAdmin = await userHasAdminRole(user.id);
  const params = await searchParams;
  const status = normalizeStatus(params.status);
  
  const today = getTodayDateString();
  const from = isAdmin ? normalizeDateOnly(params.from) : today;
  const to = isAdmin ? normalizeDateOnly(params.to) : today;

  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const { data: sales, total } = await listSalesForVoidPage({
    status,
    search: params.q?.trim() || undefined,
    from,
    to,
    page: currentPage,
  });
  const totalPages = Math.ceil(total / 10);
  const canVoid = hasPermission(user, "sale.void");
  const needsAdminApproval = canVoid && !isAdmin;

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-neutral-text sm:text-3xl">
              {isAdmin ? "Sale history" : "Daily sales"}
            </h1>
            {isAdmin ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-pale px-3 py-1 text-xs font-bold text-brand-default border border-brand-default/20">
                <History className="size-3.5" /> Total History
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                <Calendar className="size-3.5" /> Today ({today})
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-muted">
            {isAdmin
              ? "Viewing total sales history across all dates."
              : `Viewing today's transactions (${today}) for cashier counter operations.`}
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-lg bg-brand-default px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-default shadow-sm"
          href="/pos"
        >
          Start a sale
        </Link>
      </div>

      {/* Filter */}
      <form className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex w-full max-w-xs items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-3 py-2 shadow-sm">
          <input
            className="w-full bg-transparent text-sm outline-none"
            defaultValue={params.q ?? ""}
            name="q"
            placeholder={isAdmin ? "Sale number, cashier name…" : "Sale number, product name…"}
          />
        </div>
        <select
          className="rounded-full border border-neutral-border bg-neutral-surface px-4 py-1.5 text-sm font-semibold outline-none focus:border-brand-default"
          defaultValue={status}
          name="status"
        >
          <option value="ALL">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="VOIDED">Cancelled</option>
          <option value="HELD">Held</option>
        </select>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <input className={compactDateInputClass} defaultValue={from ?? ""} name="from" type="date" title="From Date" />
            <span className="text-neutral-muted text-sm">to</span>
            <input className={compactDateInputClass} defaultValue={to ?? ""} name="to" type="date" title="To Date" />
          </div>
        )}
        <AutoSubmit />
      </form>

      {/* Sale list */}
      <section className="rounded-xl border border-neutral-border bg-neutral-surface shadow-sm">
        <SalesTable canVoid={canVoid} needsAdminApproval={needsAdminApproval} sales={sales} />
        {sales.length > 0 && (
          <div className="border-t border-slate-100 p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="/sales"
              queryParams={{
                status,
                q: params.q,
                ...(isAdmin ? { from, to } : {}),
              }}
            />
          </div>
        )}
      </section>
    </div>
  );
}
