"use client";

import { PackagePlus, Search, ShieldAlert } from "lucide-react";
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
  return <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,51,58,.05)]"><div className="border-b border-slate-100 p-4"><div className="flex items-center justify-between"><div><h2 className="font-black text-slate-900">Product search</h2><p className="mt-1 text-xs text-slate-500">Search by name, generic name, or barcode</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{isLoading ? "Searching…" : `${products.length} items`}</span></div><label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-teal-400"><Search className="size-4 text-slate-400" /><input className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" onChange={(event) => onQueryChange(event.target.value)} placeholder="Search name, generic, or barcode…" value={query} /></label></div><div className="grid max-h-[610px] gap-2 overflow-y-auto p-3">{products.map((product) => { const unit = product.units.find((item) => item.id === product.defaultSaleUnitId) ?? product.units[0]; return <button className="group flex items-center gap-3 rounded-xl border border-transparent p-3 text-left transition hover:border-teal-100 hover:bg-teal-50/70 disabled:cursor-not-allowed disabled:opacity-50" disabled={!unit} key={product.id} onClick={() => onAddProduct(product)} type="button"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-teal-700 transition group-hover:bg-white"><PackagePlus className="size-5" /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><strong className="truncate text-sm text-slate-800">{product.name}</strong>{product.prescriptionRule !== "NONE" ? <ShieldAlert className="size-3.5 shrink-0 text-amber-500" /> : null}</span><span className="mt-1 block truncate text-xs text-slate-500">{product.genericName ?? product.productType} · {product.primaryBarcode ?? product.baseUnitName}</span><span className={`mt-1 block text-[11px] font-semibold ${product.hasActiveStock ? "text-emerald-600" : "text-amber-600"}`}>{product.hasActiveStock ? `${product.availableQtyBase} ${product.baseUnitName} available` : "No active stock"}</span></span><span className="text-right"><strong className="block text-sm text-slate-800">{unit?.sellingPrice ? formatLkr(Number(unit.sellingPrice)) : "Price pending"}</strong><span className="text-xs text-slate-400">/{unit?.unitName ?? "unit"}</span></span></button>; })}{products.length === 0 && !isLoading ? <div className="px-4 py-12 text-center text-sm text-slate-500">No products found.</div> : null}</div></section>;
}
