import Link from "next/link";
import { Search, Truck } from "lucide-react";
import { requirePermission } from "@/modules/auth/permissions";
import { listSuppliers } from "@/modules/procurement/supplier.service";
import { SupplierForm } from "@/modules/procurement/supplier-form";
import { Pagination } from "@/components/ui/pagination";

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requirePermission("supplier.manage");
  const { q, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const { data: suppliers, total } = await listSuppliers({ search: q, page: currentPage });
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-teal-700">
            <Truck className="size-4" />
            Supplier workspace
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Suppliers
          </h1>
          <p className="mt-2 text-slate-500">
            Manage supplier directory
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-700 shadow-sm transition hover:bg-teal-50"
          href="/suppliers/payments"
        >
          Pay suppliers →
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <Search className="size-4 text-slate-400" />
          <input
            className="bg-transparent text-sm outline-none w-full"
            defaultValue={q}
            name="q"
            placeholder="Search suppliers..."
          />
        </form>
      </div>

      {/* Add supplier — collapsible */}
      <details className="rounded-xl border border-teal-200 bg-white shadow-sm" id="add-supplier-section">
        <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 marker:content-none">
          <span className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-700">
            Add a supplier
          </span>
          <span className="text-sm text-slate-400">Click to expand</span>
        </summary>
        <div className="border-t border-slate-100 px-5 pb-6 pt-4">
          <SupplierForm />
        </div>
      </details>

      {/* Supplier list */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Supplier</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Contact</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Terms</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.length === 0 ? (
                <tr>
                  <td className="px-5 py-16 text-center text-slate-400" colSpan={4}>
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr className="align-middle hover:bg-slate-50/50" key={supplier.id}>
                    <td className="px-5 py-4">
                      <strong className="block text-slate-900">{supplier.name}</strong>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <div className="flex flex-col gap-0.5">
                        <span>{supplier.phone ?? "No phone"}</span>
                        {supplier.contactPerson && <span className="text-xs text-slate-400">{supplier.contactPerson}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {supplier.creditTermDays === 0 ? "Pay immediately" : `${supplier.creditTermDays} days`}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${supplier.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                        {supplier.isActive ? "Active" : "Inactive"}
                      </span>
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
