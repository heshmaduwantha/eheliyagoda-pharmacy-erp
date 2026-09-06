"use client";

import { Plus } from "lucide-react";
import type { PosProductSearchResult } from "@/modules/sales/pos.types";
import { formatLkr } from "@/modules/sales/pos.utils";

type Props = {
  products: PosProductSearchResult[];
  query: string;
  onQueryChange: (query: string) => void;
  onAddProduct: (product: PosProductSearchResult) => void;
  isLoading?: boolean;
};

export function ProductSearchPanel({ products, query, onAddProduct, isLoading = false }: Props) {
  return (
    <section className="flex flex-col gap-4">
      {/* Header Text */}
      <p className="text-sm font-semibold text-neutral-muted">
        {isLoading ? "Searching…" : query.trim() ? "Search results" : "Fast selling available items"}
      </p>

      {/* Product tile grid */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {(query.trim() ? products.slice(0, 18) : products.slice(0, 6)).map((product) => {
          const unit = product.units.find((u) => u.id === product.defaultSaleUnitId) ?? product.units[0];
          const stockStatus = !product.hasActiveStock
            ? { label: "Out of stock", cls: "bg-status-danger-bg text-status-danger-text" }
            : { label: "In stock", cls: "bg-status-success-bg text-status-success-text" };

          const isAvailable = Boolean(unit && product.hasActiveStock);

          return (
            <div
              className={`relative flex flex-col justify-between rounded-xl bg-neutral-surface p-2.5 border border-neutral-border/80 shadow-2xs transition-all ${
                isAvailable
                  ? "cursor-pointer hover:border-brand-default/50 hover:shadow-xs active:scale-[0.99]"
                  : "opacity-65"
              }`}
              key={product.id}
              onClick={() => {
                if (isAvailable) onAddProduct(product);
              }}
            >
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-1.5">
                  <p className="truncate text-xs font-bold text-neutral-text" title={product.name}>
                    {product.name}
                  </p>
                  <span className="shrink-0 text-xs font-black text-brand-default">
                    {unit?.sellingPrice ? formatLkr(Number(unit.sellingPrice)) : "—"}
                  </span>
                </div>
                {product.genericName && (
                  <p className="truncate text-[10px] text-neutral-muted" title={product.genericName}>
                    {product.genericName}
                  </p>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between gap-1.5 pt-1.5 border-t border-neutral-border/40">
                <div className="flex items-center gap-1 overflow-hidden">
                  <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold ${stockStatus.cls}`}>
                    {stockStatus.label}
                  </span>
                  {product.prescriptionRule !== "NONE" && (
                    <span className="inline-flex rounded-md bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 text-[9px] font-bold">
                      Rx
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isAvailable) onAddProduct(product);
                  }}
                  disabled={!isAvailable}
                  aria-label={`Add ${product.name} to cart`}
                  className="flex h-7 shrink-0 items-center justify-center gap-1 px-2.5 rounded-md bg-brand-default text-white text-[11px] font-bold transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  type="button"
                >
                  <Plus className="size-3" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          );
        })}
        {products.length === 0 && !isLoading && (
          <div className="col-span-full py-12 text-center text-sm text-neutral-muted">
            No products found.
          </div>
        )}
      </div>
    </section>
  );
}
