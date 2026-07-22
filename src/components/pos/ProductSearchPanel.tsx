"use client";

import { Search, ShieldAlert } from "lucide-react";
import type { PosProductSearchResult } from "@/modules/sales/pos.types";
import { formatLkr } from "@/modules/sales/pos.utils";

type Props = {
  products: PosProductSearchResult[];
  query: string;
  onQueryChange: (query: string) => void;
  onAddProduct: (product: PosProductSearchResult) => void;
  isLoading?: boolean;
};

export function ProductSearchPanel({ products, query, onQueryChange, onAddProduct, isLoading = false }: Props) {
  return (
    <section className="flex flex-col rounded-2xl border border-slate-200 bg-white">
      {/* Search bar */}
      <div className="border-b border-slate-100 p-4">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-teal-400">
          <Search className="size-4 shrink-0 text-slate-400" />
          <input
            className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search product name or barcode…"
            value={query}
          />
        </label>
        <p className="mt-2 text-xs text-slate-400">
          {isLoading ? "Searching…" : `${products.length} product${products.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {/* Product tile grid */}
      <div className="grid max-h-[580px] grid-cols-2 gap-2 overflow-y-auto p-3 sm:grid-cols-3">
        {products.map((product) => {
          const unit = product.units.find((u) => u.id === product.defaultSaleUnitId) ?? product.units[0];
          const stockStatus = !product.hasActiveStock
            ? { label: "Out of stock", cls: "bg-red-50 text-red-600" }
            : Number(product.availableQtyBase) <= 10
            ? { label: "Low stock", cls: "bg-amber-50 text-amber-700" }
            : { label: "In stock", cls: "bg-green-50 text-green-700" };

          return (
            <button
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-teal-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!unit || !product.hasActiveStock}
              key={product.id}
              onClick={() => onAddProduct(product)}
              type="button"
            >
              {/* Name */}
              <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-800">{product.name}</p>
              {product.genericName && (
                <p className="mt-0.5 truncate text-xs text-slate-400">{product.genericName}</p>
              )}
              {product.prescriptionRule !== "NONE" && (
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                  <ShieldAlert className="size-3" /> Rx required
                </span>
              )}
              {/* Price */}
              <p className="mt-2 text-base font-black text-teal-700">
                {unit?.sellingPrice ? formatLkr(Number(unit.sellingPrice)) : "—"}
              </p>
              <p className="text-[10px] text-slate-400">per {unit?.unitName ?? "unit"}</p>
              {/* Stock badge */}
              <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${stockStatus.cls}`}>
                {stockStatus.label}
              </span>
            </button>
          );
        })}
        {products.length === 0 && !isLoading && (
          <div className="col-span-full py-12 text-center text-sm text-slate-400">
            No products found.
          </div>
        )}
      </div>
    </section>
  );
}
