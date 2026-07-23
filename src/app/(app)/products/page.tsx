import { Search, Plus, Package, ChevronDown } from "lucide-react";
import Link from "next/link";
import { formatMoney, formatQty } from "@/lib/money";
import { requirePermission } from "@/modules/auth/permissions";
import { searchProducts } from "@/modules/catalog/catalog.service";
import { ProductForm } from "@/modules/catalog/product-form";
import { Pagination } from "@/components/ui/pagination";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; page?: string }> }) {
  await requirePermission("product.manage");
  const { q, filter, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const { data: products, total } = await searchProducts({ query: q, filter, page: currentPage });
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-teal-700">
            <Package className="size-4" />
            Catalog workspace
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Products
          </h1>
          <p className="mt-2 text-slate-500">
            {total} product{total === 1 ? "" : "s"} in catalogue
          </p>
        </div>
      </div>

      {/* Add product — collapsible */}
      <details className="rounded-2xl border border-teal-200 bg-white" id="add-product-section">
        <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 marker:content-none">
          <span className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-700">
            <Plus className="size-4" />
            Add a product
          </span>
          <span className="text-sm text-slate-400">Click to expand</span>
        </summary>
        <div className="border-t border-slate-100 px-5 pb-6 pt-4">
          <ProductForm />
        </div>
      </details>

      {/* Product list */}
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Link 
              href="/products" 
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${!filter ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              All products
            </Link>
            <Link 
              href="/products?filter=controlled" 
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${filter === "controlled" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700"}`}
            >
              Controlled drugs
            </Link>
          </div>
          <form className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <Search className="size-4 shrink-0 text-slate-400" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              defaultValue={q}
              name="q"
              placeholder="Search by name or barcode"
            />
            {filter === "controlled" && <input type="hidden" name="filter" value="controlled" />}
          </form>
        </div>

        {products.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400">
            No products found matching your criteria.
          </div>
        )}

        {products.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-slate-800">Product Name</th>
                    <th className="px-5 py-3 font-semibold text-slate-800">Generic</th>
                    <th className="px-5 py-3 font-semibold text-slate-800">Type &amp; Form</th>
                    <th className="px-5 py-3 font-semibold text-slate-800">Sold in &amp; unit pricing</th>
                    <th className="px-5 py-3 font-semibold text-slate-800">Barcode</th>
                    <th className="px-5 py-3 text-right font-semibold text-slate-800">Selling Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(product => (
                    <tr key={product.id} className={`transition hover:bg-slate-50 ${product.isControlled ? "bg-red-50/40" : "bg-white"}`}>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {product.name}
                        {product.isControlled && <span className="ml-2 inline-flex items-center rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">Controlled</span>}
                      </td>
                      <td className="px-5 py-3.5">{product.genericName || "—"}</td>
                      <td className="px-5 py-3.5">
                        {product.productType === "MEDICINE" ? "Medicine" : "General"} 
                        {product.form ? ` · ${product.form}` : ""}
                      </td>
                      <td className="px-5 py-3.5">
                        {product.units.length ? (
                          <details className="group min-w-60">
                            <summary className="flex cursor-pointer list-none items-center gap-1.5 marker:content-none">
                              <div className="flex flex-wrap gap-1.5" title={product.units.map((unit) => unit.unitName).join(", ")}>
                                {product.units.slice(0, 2).map((unit) => (
                                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700" key={unit.id}>{unit.unitName}</span>
                                ))}
                                {product.units.length > 2 ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">+{product.units.length - 2}</span> : null}
                              </div>
                              <ChevronDown className="size-3.5 shrink-0 text-slate-400 transition group-open:rotate-180" />
                            </summary>
                            <div className="mt-2 grid gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                              {product.units.map((unit) => {
                                const unitPrice = product.defaultSellingPrice == null
                                  ? null
                                  : Number(product.defaultSellingPrice) * Number(unit.factorToBase);
                                return (
                                  <div className="flex items-center justify-between gap-3 text-xs" key={unit.id}>
                                    <span className="font-semibold text-slate-700">{unit.unitName} <span className="font-normal text-slate-400">· {formatQty(unit.factorToBase)} {product.baseUnitName}</span></span>
                                    <strong className="whitespace-nowrap text-teal-700">{unitPrice == null ? "Price pending" : `${formatMoney(unitPrice)} each`}</strong>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                        {product.barcodes.length > 0 ? product.barcodes[0].barcode : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                        {product.defaultSellingPrice ? formatMoney(product.defaultSellingPrice) : "—"}
                        <span className="ml-1 text-xs font-normal text-slate-400">/{product.baseUnitName}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/products" queryParams={{ q, filter }} />
          </div>
        )}
      </section>
    </div>
  );
}
