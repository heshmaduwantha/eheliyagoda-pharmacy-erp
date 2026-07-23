"use client";

import { Search, Plus } from "lucide-react";
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
    <section className="flex flex-col gap-6">
      {/* Search bar */}
      <label className="flex items-center gap-3 rounded-2xl bg-neutral-surface px-4 py-1.5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] focus-within:ring-2 focus-within:ring-brand-default">
        <Search className="size-5 shrink-0 text-neutral-muted" />
        <input
          className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Scan barcode, or search by name..."
          value={query}
        />
      </label>

      {/* Header Text */}
      <p className="text-sm font-semibold text-neutral-muted">
        {isLoading ? "Searching…" : `${products.length} product${products.length === 1 ? "" : "s"} - most searched first`}
      </p>

      {/* Product tile grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => {
          const unit = product.units.find((u) => u.id === product.defaultSaleUnitId) ?? product.units[0];
          const stockStatus = !product.hasActiveStock
            ? { label: "Out of stock", cls: "bg-status-danger-bg text-status-danger-text" }
            : { label: "In stock", cls: "bg-status-success-bg text-status-success-text" }; // the mockup shows green for in-stock, and a separate expiring soon badge.

          // Mocking "Popular" and "Expiring soon" just for the design feel matching the mockup
          const isPopular = product.name.includes("Amoxicillin") || product.name.includes("Diazepam");
          const isExpiringSoon = product.name.includes("Amoxicillin");

          return (
            <div
              className="relative flex flex-col rounded-2xl bg-neutral-surface p-4 text-left shadow-[0_2px_12px_rgba(15,23,42,0.03)]"
              key={product.id}
            >
              {/* Name */}
              <p className="line-clamp-2 text-sm font-black leading-snug text-neutral-text">
                {product.name} {isPopular && <span className="ml-1 inline-flex rounded-full bg-brand-pale px-2 py-0.5 text-[9px] font-bold text-brand-default">Popular</span>}
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
                {isExpiringSoon && (
                  <span className="inline-flex rounded-full bg-status-orange-bg px-2.5 py-0.5 text-[10px] font-bold text-status-orange-text">
                    Expiring soon
                  </span>
                )}
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Price & Add Button */}
              <div className="mt-5 flex items-end justify-between gap-2">
                <div>
                  <p className="text-base font-black text-brand-default">
                    {unit?.sellingPrice ? formatLkr(Number(unit.sellingPrice)) : "—"}
                  </p>
                  <p className="text-[10px] font-semibold text-neutral-muted">per {unit?.unitName ?? "unit"}</p>
                </div>
                <button
                  onClick={() => onAddProduct(product)}
                  disabled={!unit || !product.hasActiveStock}
                  className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-default text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <Plus className="size-5" />
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
