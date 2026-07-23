import { Search, Plus, Package, ChevronDown } from "lucide-react";
import Link from "next/link";
import { formatMoney, formatQty } from "@/lib/money";
import { requirePermission } from "@/modules/auth/permissions";
import { searchProducts } from "@/modules/catalog/catalog.service";
import { ProductForm } from "@/modules/catalog/product-form";
import { ProductForm } from "@/modules/catalog/product-form";
import { Pagination } from "@/components/ui/pagination";
import { AutoSubmit } from "@/components/ui/auto-submit";

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
          <h1 className="text-3xl font-black tracking-tight text-neutral-text sm:text-4xl">
            Products
          </h1>
        </div>
      </div>

      {/* Add product — collapsible */}
      <details className="rounded-2xl border border-brand-default/20 bg-neutral-surface" id="add-product-section">
        <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 marker:content-none">
          <span className="flex items-center gap-2 rounded-lg bg-brand-default px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-default">
            <Plus className="size-4" />
            Add a product
          </span>
          <span className="text-sm text-neutral-muted">Click to expand</span>
        </summary>
        <div className="border-t border-neutral-border px-5 pb-6 pt-4">
          <ProductForm />
        </div>
      </details>

      {/* Product list */}
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Link 
              href="/products" 
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${!filter ? "bg-slate-800 text-white" : "bg-slate-100 text-neutral-muted hover:bg-slate-200"}`}
            >
              All products
            </Link>
            <Link 
              href="/products?filter=controlled" 
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${filter === "controlled" ? "bg-red-100 text-status-danger-text" : "bg-slate-100 text-neutral-muted hover:bg-status-danger-bg hover:text-status-danger-text"}`}
            >
              Controlled drugs
            </Link>
          </div>
          <form className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-3 py-2 shadow-sm">
            <Search className="size-4 shrink-0 text-neutral-muted" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              defaultValue={q}
              name="q"
              placeholder="Search by name or barcode"
            />
            {filter === "controlled" && <input type="hidden" name="filter" value="controlled" />}
            <AutoSubmit />
          </form>
        </div>

        {products.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-border bg-neutral-surface p-10 text-center text-neutral-muted">
            No products found matching your criteria.
          </div>
        )}

        {products.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-muted">
                <thead className="bg-neutral-bg border-b border-neutral-border">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-neutral-text">Product Name</th>
                    <th className="px-5 py-3 font-semibold text-neutral-text">Generic</th>
                    <th className="px-5 py-3 font-semibold text-neutral-text">Type &amp; Form</th>
                    <th className="px-5 py-3 font-semibold text-neutral-text">Sold in &amp; unit pricing</th>
                    <th className="px-5 py-3 font-semibold text-neutral-text">Barcode</th>
                    <th className="px-5 py-3 text-right font-semibold text-neutral-text">Selling Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(product => (
                    <tr key={product.id} className={`transition hover:bg-neutral-bg ${product.isControlled ? "bg-status-danger-bg/40" : "bg-neutral-surface"}`}>
                      <td className="px-5 py-3.5 font-bold text-neutral-text">
                        {product.name}
                        {product.isControlled && <span className="ml-2 inline-flex items-center rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-status-danger-text">Controlled</span>}
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
                                  <span className="rounded-full bg-brand-pale px-2 py-0.5 text-xs font-semibold text-brand-default" key={unit.id}>{unit.unitName}</span>
                                ))}
                                {product.units.length > 2 ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-neutral-muted">+{product.units.length - 2}</span> : null}
                              </div>
                              <ChevronDown className="size-3.5 shrink-0 text-neutral-muted transition group-open:rotate-180" />
                            </summary>
                            <div className="mt-2 grid gap-1.5 rounded-lg border border-neutral-border bg-neutral-bg p-2.5">
                              {product.units.map((unit) => {
                                const unitPrice = product.defaultSellingPrice == null
                                  ? null
                                  : Number(product.defaultSellingPrice) * Number(unit.factorToBase);
                                return (
                                  <div className="flex items-center justify-between gap-3 text-xs" key={unit.id}>
                                    <span className="font-semibold text-neutral-text">{unit.unitName} <span className="font-normal text-neutral-muted">· {formatQty(unit.factorToBase)} {product.baseUnitName}</span></span>
                                    <strong className="whitespace-nowrap text-brand-default">{unitPrice == null ? "Price pending" : `${formatMoney(unitPrice)} each`}</strong>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        ) : <span className="text-neutral-muted">—</span>}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-neutral-muted">
                        {product.barcodes.length > 0 ? product.barcodes[0].barcode : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-neutral-text">
                        {product.defaultSellingPrice ? formatMoney(product.defaultSellingPrice) : "—"}
                        <span className="ml-1 text-xs font-normal text-neutral-muted">/{product.baseUnitName}</span>
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
