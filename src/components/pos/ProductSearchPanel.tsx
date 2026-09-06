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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2">
        {products.slice(0, 18).map((product) => {
          const unit = product.units.find((u) => u.id === product.defaultSaleUnitId) ?? product.units[0];
          const stockStatus = !product.hasActiveStock
            ? { label: "Out of stock", cls: "bg-status-danger-bg text-status-danger-text" }
            : { label: "In stock", cls: "bg-status-success-bg text-status-success-text" };

          const isAvailable = Boolean(unit && product.hasActiveStock);

          return (
            <div
              className={`relative flex flex-col rounded-2xl bg-neutral-surface p-5 text-left shadow-sm border border-neutral-border transition-all ${
                isAvailable
                  ? "cursor-pointer hover:border-brand-default/40 hover:shadow-md active:scale-[0.99]"
                  : "opacity-75"
              }`}
              key={product.id}
              onClick={() => {
                if (isAvailable) onAddProduct(product);
              }}
            >
              {/* Name */}
              <p className="line-clamp-2 text-base font-bold leading-snug text-neutral-text">
                {product.name}
              </p>
              {product.genericName && (
                <p className="mt-0.5 truncate text-xs text-neutral-muted">{product.genericName}</p>
              )}

              {/* Badges Flow */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.prescriptionRule !== "NONE" && (
                  <span className="inline-flex rounded-full bg-status-warning-bg px-2.5 py-0.5 text-[10px] font-bold text-status-warning-text">
                    Rx required
                  </span>
                )}
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${stockStatus.cls}`}>
                  {stockStatus.label}
                </span>
                {product.nextExpiryDate && (
                  <span className="inline-flex rounded-full bg-status-orange-bg px-2.5 py-0.5 text-[10px] font-bold text-status-orange-text">
                    Exp. {product.nextExpiryDate}
                  </span>
                )}
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Price & Add Button */}
              <div className="mt-5 flex items-end justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-black text-brand-default truncate">
                    {unit?.sellingPrice ? formatLkr(Number(unit.sellingPrice)) : "—"}
                  </p>
                  <p className="text-[10px] font-semibold text-neutral-muted truncate">
                    per {unit?.unitName ?? "unit"}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isAvailable) onAddProduct(product);
                  }}
                  disabled={!isAvailable}
                  aria-label={`Add ${product.name} to cart`}
                  className="flex h-10 shrink-0 items-center justify-center gap-1.5 px-3 rounded-xl bg-brand-default text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  type="button"
                >
                  <Plus className="size-4" /><span className="text-sm font-bold">Add</span>
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
