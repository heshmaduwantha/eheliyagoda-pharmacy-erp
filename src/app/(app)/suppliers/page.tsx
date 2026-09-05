import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { requirePermission } from "@/modules/auth/permissions";
import { listSuppliers } from "@/modules/procurement/supplier.service";
import { SupplierForm } from "@/modules/procurement/supplier-form";
import { SupplierEditModal } from "@/modules/procurement/supplier-edit-modal";
import { Pagination } from "@/components/ui/pagination";
import { SupplierStatusToggle } from "@/components/suppliers/supplier-status-toggle";
import { AutoSubmit } from "@/components/ui/auto-submit";

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requirePermission("supplier.manage");
  const { q, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const { data: suppliers, total } = await listSuppliers({ search: q, page: currentPage });
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <h1 className="text-2xl font-black tracking-tight text-neutral-text sm:text-3xl">Suppliers</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-3 py-2 shadow-sm">
          <Search className="size-4 text-neutral-muted" />
          <input
            className="bg-transparent text-sm outline-none w-full"
            defaultValue={q}
            name="q"
            placeholder="Search suppliers..."
          />
          <AutoSubmit />
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-border bg-neutral-surface px-4 py-2 text-sm font-semibold text-neutral-text shadow-sm transition hover:bg-neutral-bg"
            href="/suppliers/returns"
          >
            Supplier Returns Log
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-brand-default/20 bg-neutral-surface px-4 py-2 text-sm font-semibold text-brand-default shadow-sm transition hover:bg-brand-pale"
            href="/suppliers/payments"
          >
            Pay suppliers
          </Link>
        </div>
      </div>

      {/* Add supplier — collapsible */}
      <details className="rounded-xl border border-brand-default/20 bg-neutral-surface shadow-sm" id="add-supplier-section">
        <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 marker:content-none">
          <span className="flex items-center gap-2 rounded-lg bg-brand-default px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-default">
            <Plus className="size-4" />
            Add a supplier
          </span>
          <span className="text-sm text-neutral-muted">Click to expand</span>
        </summary>
        <div className="border-t border-neutral-border px-5 pb-6 pt-4">
          <SupplierForm />
        </div>
      </details>

      {/* Supplier list */}
      <section className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm text-neutral-muted">
            <thead className="bg-brand-pale text-xs uppercase tracking-wider font-extrabold text-brand-hover border-b border-brand-default/15">
              <tr>
                <th className="px-5 py-3.5 font-extrabold">Supplier</th>
                <th className="px-5 py-3.5 font-extrabold">Contact</th>
                <th className="px-5 py-3.5 font-extrabold">Terms</th>
                <th className="px-5 py-3.5 font-extrabold">Status</th>
                <th className="px-5 py-3.5 font-extrabold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.length === 0 ? (
                <tr>
                  <td className="px-5 py-16 text-center text-neutral-muted" colSpan={5}>
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr className="transition hover:bg-neutral-bg bg-neutral-surface" key={supplier.id}>
                    <td className="px-5 py-3.5">
                      <strong className="block text-neutral-text font-bold">{supplier.name}</strong>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-muted">
                      <div className="flex flex-col gap-0.5">
                        <span>{supplier.phone ?? "No phone"}</span>
                        {supplier.contactPerson && <span className="text-xs text-neutral-muted">{supplier.contactPerson}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-muted">
                      {supplier.creditTermDays === 0 ? "Pay immediately" : `${supplier.creditTermDays} days`}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${supplier.isActive ? "bg-status-success-bg text-status-success-text" : "bg-slate-100 text-neutral-muted"}`}>
                        {supplier.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right flex items-center justify-end gap-2">
                      <SupplierEditModal supplier={supplier} />
                      <SupplierStatusToggle supplierId={supplier.id} supplierName={supplier.name} isActive={supplier.isActive} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {suppliers.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/suppliers" queryParams={{ q }} />
        )}
      </section>
    </div>
  );
}
