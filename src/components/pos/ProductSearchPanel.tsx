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
  const displayedProducts = query.trim() ? products.slice(0, 18) : products.slice(0, 6);

  return (
    <section className="flex flex-col gap-3">
      {/* Header Text */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted">
          {isLoading ? "Searching catalog…" : query.trim() ? `Search results (${products.length})` : "Fast selling available items"}
        </p>
      </div>

      {/* Product tile grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {displayedProducts.map((product) => {
          const unit = product.units.find((u) => u.id === product.defaultSaleUnitId) ?? product.units[0];
          const stockStatus = !product.hasActiveStock
            ? { label: "Out of stock", cls: "bg-status-danger-bg text-status-danger-text" }
            : { label: "In stock", cls: "bg-status-success-bg text-status-success-text" };

          const isAvailable = Boolean(unit && product.hasActiveStock);

          return (
            <div
              className={`relative flex flex-col justify-between rounded-xl bg-neutral-surface p-3 border border-neutral-border shadow-xs transition-all ${
                isAvailable
                  ? "cursor-pointer hover:border-brand-default hover:bg-brand-pale/10 hover:shadow-sm"
                  : "opacity-60 bg-neutral-bg/40"
              }`}
              key={product.id}
              onClick={() => {
                if (isAvailable) onAddProduct(product);
              }}
            >
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-text" title={product.name}>
                      {product.name}
                    </p>
                    {product.genericName && (
                      <p className="truncate text-xs text-neutral-muted mt-0.5" title={product.genericName}>
                        {product.genericName}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-bold text-brand-default">
                    {unit?.sellingPrice ? formatLkr(Number(unit.sellingPrice)) : "—"}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-1.5 pt-2 border-t border-neutral-border/60">
                <div className="flex items-center gap-1 overflow-hidden">
                  <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${stockStatus.cls}`}>
                    {stockStatus.label}
                  </span>
                  {product.prescriptionRule !== "NONE" && (
                    <span className="inline-flex rounded-md bg-status-warning-bg text-status-warning-text px-2 py-0.5 text-[10px] font-semibold">
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
                  className="flex h-8 shrink-0 items-center justify-center gap-1 px-3 rounded-lg bg-brand-default text-white text-xs font-medium transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-neutral-border disabled:text-neutral-muted"
                  type="button"
                >
                  <Plus className="size-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          );
        })}

        {displayedProducts.length === 0 && !isLoading && (
          <div className="col-span-full py-10 text-center text-sm text-neutral-muted bg-neutral-surface rounded-xl border border-neutral-border">
            No products found.
          </div>
        )}
      </div>
    </section>
  );
}


