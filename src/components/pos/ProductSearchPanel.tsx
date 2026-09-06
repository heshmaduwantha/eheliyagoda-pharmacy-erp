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
        {(query.trim() ? products.slice(0, 18) : products.slice(0, 6)).map((product) => {
          const unit = product.units.find((u) => u.id === product.defaultSaleUnitId) ?? product.units[0];
          const stockStatus = !product.hasActiveStock
            ? { label: "Out of stock", cls: "bg-status-danger-bg text-status-danger-text" }
            : { label: "In stock", cls: "bg-status-success-bg text-status-success-text" };

          const isAvailable = Boolean(unit && product.hasActiveStock);

          return (
            <div
              className={`relative flex flex-col rounded-xl bg-neutral-surface p-3.5 text-left shadow-xs border border-neutral-border transition-all ${
                isAvailable
                  ? "cursor-pointer hover:border-brand-default/40 hover:shadow-sm active:scale-[0.99]"
                  : "opacity-75"
              }`}
              key={product.id}
              onClick={() => {
                if (isAvailable) onAddProduct(product);
              }}
            >
              {/* Name */}
              <p className="truncate text-sm font-bold leading-tight text-neutral-text" title={product.name}>
                {product.name}
              </p>
              {product.genericName && (
                <p className="mt-0.5 truncate text-[11px] text-neutral-muted" title={product.genericName}>{product.genericName}</p>
              )}

              {/* Badges Flow */}
              <div className="mt-2 flex flex-wrap gap-1">
                {product.prescriptionRule !== "NONE" && (
                  <span className="inline-flex rounded-full bg-status-warning-bg px-2 py-0.5 text-[9px] font-bold text-status-warning-text">
                    Rx required
                  </span>
                )}
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${stockStatus.cls}`}>
                  {stockStatus.label}
                </span>
                {product.nextExpiryDate && (
                  <span className="inline-flex rounded-full bg-status-orange-bg px-2 py-0.5 text-[9px] font-bold text-status-orange-text">
                    Exp. {product.nextExpiryDate}
                  </span>
                )}
              </div>

              {/* Spacer */}
              <div className="flex-1 min-h-2" />

              {/* Price & Add Button */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-brand-default truncate">
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
                  className="flex h-8 shrink-0 items-center justify-center gap-1 px-2.5 rounded-lg bg-brand-default text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  type="button"
                >
                  <Plus className="size-3.5" /><span className="text-xs font-bold">Add</span>
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
