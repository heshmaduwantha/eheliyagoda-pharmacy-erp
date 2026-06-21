import { Search } from "lucide-react";
import { PageHeader } from "@/components/ui/form";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/modules/auth/permissions";
import { searchProducts } from "@/modules/catalog/catalog.service";
import { ProductForm } from "@/modules/catalog/product-form";

const ruleLabel: Record<string, string> = {
  NONE: "No Rx",
  PROMPT_SKIPPABLE: "Rx prompt",
  HARD_REQUIRED_CONTROLLED: "Controlled",
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePermission("product.manage");
  const { q } = await searchParams;
  const products = await searchProducts(q);

  return (
    <div className="grid gap-7">
      <PageHeader description="Medicines and general items share one catalogue. Stock is tracked in base units." title="Products" />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-800">New product</h2>
        <ProductForm />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-800">Catalogue ({products.length})</h2>
          <form className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
            <Search className="size-4 text-slate-400" />
            <input className="bg-transparent text-sm outline-none" defaultValue={q} name="q" placeholder="Search name, generic, barcode" />
          </form>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="py-2.5 pr-4">Name</th>
                <th className="py-2.5 pr-4">Type</th>
                <th className="py-2.5 pr-4">Base unit</th>
                <th className="py-2.5 pr-4">Units</th>
                <th className="py-2.5 pr-4">Rx</th>
                <th className="py-2.5 pr-4">Default price</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td className="py-8 text-center text-slate-400" colSpan={6}>No products found.</td>
                </tr>
              )}
              {products.map((product) => (
                <tr className="border-b border-slate-100" key={product.id}>
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-slate-800">{product.name}</p>
                    {product.genericName && <p className="text-xs text-slate-400">{product.genericName}</p>}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{product.productType === "MEDICINE" ? "Medicine" : "General"}</td>
                  <td className="py-3 pr-4 text-slate-600">{product.baseUnitName}</td>
                  <td className="py-3 pr-4 text-slate-600">{product.units.map((u) => u.unitName).join(", ") || "—"}</td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${product.isControlled ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                      {ruleLabel[product.prescriptionRule]}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{product.defaultSellingPrice ? formatMoney(product.defaultSellingPrice) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
