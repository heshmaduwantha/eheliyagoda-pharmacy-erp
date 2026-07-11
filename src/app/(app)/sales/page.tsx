import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Search } from "lucide-react";
import { SaleVoidButton } from "@/components/sales/SaleVoidButton";
import { formatMoney, formatQty } from "@/lib/money";
import { hasPermission, requirePermission } from "@/modules/auth/permissions";
import { listSalesForVoidPage } from "@/modules/sales/sale-void.service";
import type { SaleVoidListStatusFilter } from "@/modules/sales/sale-void.types";

export const metadata: Metadata = {
  title: "Sales",
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
  searchParams: Promise<{ status?: string; q?: string; from?: string; to?: string }>;
}) {
  const user = await requirePermission("sale.create");
  const params = await searchParams;
  const status = normalizeStatus(params.status);
  const from = normalizeDateOnly(params.from);
  const to = normalizeDateOnly(params.to);
  const sales = await listSalesForVoidPage({
    status,
    search: params.q?.trim() || undefined,
    from,
    to,
    limit: 60,
  });
  const canVoid = hasPermission(user, "sale.void");

  return (
    <div>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-rose-700">
            <AlertTriangle className="size-4" />
            Sale operations
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Sales</h1>
          <p className="mt-2 max-w-2xl text-slate-500">
            Review completed and voided sales.
          </p>
        </div>

        <Link
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-teal-200 hover:text-teal-700"
          href="/pos"
        >
          Go to POS
        </Link>
      </div>

      <form className="mt-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm xl:grid-cols-[1.3fr_.8fr_.8fr_.8fr_auto]">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          <span className="flex items-center gap-2">
            <Search className="size-4 text-slate-400" />
            Search sale number, cashier, product
          </span>
          <input
            className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-teal-400"
            defaultValue={params.q ?? ""}
            name="q"
            placeholder="SALE-20260623-XXXX"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Status
          <select
            className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-teal-400"
            defaultValue={status}
            name="status"
          >
            <option value="ALL">All</option>
            <option value="COMPLETED">Completed</option>
            <option value="VOIDED">Voided</option>
            <option value="HELD">Held</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          From
          <input
            className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-teal-400"
            defaultValue={from ?? ""}
            name="from"
            type="date"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          To
          <input
            className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-teal-400"
            defaultValue={to ?? ""}
            name="to"
            type="date"
          />
        </label>

        <div className="flex items-end">
          <button className="w-full rounded-xl bg-teal-700 px-4 py-3 font-bold text-white" type="submit">
            Filter
          </button>
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
        <span>
          Showing <strong>{sales.length}</strong> sale{sales.length === 1 ? "" : "s"}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider">
          {canVoid ? "Void permission available" : "Void permission unavailable"}
        </span>
      </div>

      <div className="mt-6 grid gap-4">
        {sales.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
            No sales matched the current filters.
          </div>
        ) : null}

        {sales.map((sale) => (
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" key={sale.saleId}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight text-slate-900">{sale.saleNumber}</h2>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                      sale.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700"
                        : sale.status === "VOIDED"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {sale.status}
                  </span>
                  {sale.voidRecord ? (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      Voided
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Cashier {sale.cashierName} ({sale.cashierUsername}) · Activity {sale.activityAt.slice(0, 19).replace("T", " ")}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  Total {formatMoney(sale.total)} · Subtotal {formatMoney(sale.subtotal)} · {sale.lineCount} line{sale.lineCount === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {canVoid && sale.status === "COMPLETED" ? (
                  <SaleVoidButton saleId={sale.saleId} saleNumber={sale.saleNumber} total={sale.total} />
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <section className="rounded-2xl bg-slate-50/90 p-4">
                <p className="text-sm font-black text-slate-800">Sale lines</p>
                <div className="mt-3 grid gap-3">
                  {sale.lines.map((line) => (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm" key={line.saleLineId}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-800">{line.productName}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatQty(line.quantity)} {line.unitName} · Batch {line.batchNumber ?? "—"}
                            {line.expiryDate ? ` · Exp ${line.expiryDate}` : ""}
                          </p>
                        </div>
                        <strong className="text-slate-900">{formatMoney(line.lineTotal)}</strong>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {formatMoney(line.unitPrice)} each · {formatQty(line.qtyBase)} base units
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-4">
                <div className="rounded-2xl bg-slate-50/90 p-4">
                  <p className="text-sm font-black text-slate-800">Payments</p>
                  <div className="mt-3 grid gap-3">
                    {sale.payments.map((payment) => (
                      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm" key={payment.salePaymentId}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-bold text-slate-800">{payment.method}</span>
                          <strong className="text-slate-900">{formatMoney(payment.amount)}</strong>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{payment.cardReference ?? "No card reference"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {sale.voidRecord ? (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-900">
                    <p className="font-black">Void record</p>
                    <p className="mt-2">Reason: {sale.voidRecord.reason}</p>
                    <p className="mt-1">
                      Refund {formatMoney(sale.voidRecord.refundAmount)} · Policy {sale.voidRecord.stockPolicy}
                    </p>
                    <p className="mt-1">
                      Voided at {sale.voidRecord.voidedAt.slice(0, 19).replace("T", " ")}
                      {sale.voidRecord.voidedByName ? ` by ${sale.voidRecord.voidedByName}` : ""}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                    No void record for this sale.
                  </div>
                )}
              </section>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
