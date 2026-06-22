import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Eye, PackageSearch } from "lucide-react";
import { BatchTable } from "@/components/inventory/BatchTable";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { StockSummaryCards } from "@/components/inventory/StockSummaryCards";
import { requirePermission } from "@/modules/auth/permissions";
import { getLatestActiveBatches, getStockSummary } from "@/modules/inventory/inventory.service";

export const metadata: Metadata = { title: "Inventory & Stock" };

export default async function StockPage() {
  await requirePermission("stock.access");
  const [summary, recentBatches] = await Promise.all([
    getStockSummary(),
    getLatestActiveBatches(4),
  ]);

  return <div><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="flex items-center gap-2 text-sm font-bold text-teal-700"><PackageSearch className="size-4" />Read-only inventory</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Inventory & Stock</h1><p className="mt-2 text-slate-500">Live batch, movement, and expiry information from PostgreSQL.</p></div><div className="w-full xl:w-auto"><InventoryTabs active="/stock" /></div></div><div className="mt-6"><StockSummaryCards summary={summary} /></div><div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800"><Eye className="mt-0.5 size-5 shrink-0" /><p><strong>Read-only view.</strong> No adjustment, write-off, stock allocation, or quantity mutation is available.</p></div><section className="mt-6"><div className="mb-3 flex items-center justify-between"><div><h2 className="text-lg font-black text-slate-900">Recent active batches</h2><p className="mt-1 text-sm text-slate-500">Most recently created batches with positive stock.</p></div><Link className="hidden items-center gap-1 text-sm font-bold text-teal-700 sm:flex" href="/stock/batches">View all batches<ArrowRight className="size-4" /></Link></div><BatchTable rows={recentBatches} /></section></div>;
}
