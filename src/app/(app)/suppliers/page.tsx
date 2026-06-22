import { PageHeader } from "@/components/ui/form";
import { requirePermission } from "@/modules/auth/permissions";
import { listSuppliers } from "@/modules/procurement/supplier.service";
import { SupplierForm } from "@/modules/procurement/supplier-form";

export default async function SuppliersPage() {
  await requirePermission("supplier.manage");
  const suppliers = await listSuppliers();

  return (
    <div className="grid gap-7">
      <PageHeader description="Suppliers are the source of Direct GRN stock-in. Payables are tracked separately from expenses." title="Suppliers" />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-800">New supplier</h2>
        <SupplierForm />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-800">Suppliers ({suppliers.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="py-2.5 pr-4">Name</th>
                <th className="py-2.5 pr-4">Contact</th>
                <th className="py-2.5 pr-4">Phone</th>
                <th className="py-2.5 pr-4">Credit days</th>
                <th className="py-2.5 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 && (
                <tr>
                  <td className="py-8 text-center text-slate-400" colSpan={5}>No suppliers found.</td>
                </tr>
              )}
              {suppliers.map((supplier) => (
                <tr className="border-b border-slate-100" key={supplier.id}>
                  <td className="py-3 pr-4 font-semibold text-slate-800">{supplier.name}</td>
                  <td className="py-3 pr-4 text-slate-600">{supplier.contactPerson ?? "—"}</td>
                  <td className="py-3 pr-4 text-slate-600">{supplier.phone ?? "—"}</td>
                  <td className="py-3 pr-4 text-slate-600">{supplier.creditTermDays}</td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${supplier.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {supplier.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
