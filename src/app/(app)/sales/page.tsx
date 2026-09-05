import type { Metadata } from "next";
import Link from "next/link";

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

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; from?: string; to?: string; page?: string }>;
}) {
  const user = await requirePermission("sale.create");
  const params = await searchParams;
  const status = normalizeStatus(params.status);
  const from = normalizeDateOnly(params.from);
  const to = normalizeDateOnly(params.to);
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

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-text sm:text-3xl">
            Sale history
          </h1>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-lg bg-brand-default px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-default"
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
            placeholder="Sale number, cashier name…"
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
        <div className="flex items-center gap-2">
          <input className={compactDateInputClass} defaultValue={from ?? ""} name="from" type="date" title="From Date" />
          <span className="text-neutral-muted text-sm">to</span>
          <input className={compactDateInputClass} defaultValue={to ?? ""} name="to" type="date" title="To Date" />
        </div>
        <AutoSubmit />
      </form>

      {/* Sale list */}
      <section className="rounded-xl border border-neutral-border bg-neutral-surface shadow-sm">
        <SalesTable canVoid={canVoid} sales={sales} />
        {sales.length > 0 && (
          <div className="border-t border-slate-100 p-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/sales" queryParams={{ status, q: params.q, from, to }} />
          </div>
        )}
      </section>
    </div>
  );
}
