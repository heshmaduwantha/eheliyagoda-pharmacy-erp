import type { Metadata } from "next";
import { Boxes } from "lucide-react";
import { BatchTable } from "@/components/inventory/BatchTable";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { requirePermission } from "@/modules/auth/permissions";
import { getBatchList } from "@/modules/inventory/inventory.service";

export const metadata: Metadata = { title: "Inventory Batches" };

export default async function BatchesPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string }> }) {
  await requirePermission("stock.access");
  const filters = await searchParams;
  const rows = await getBatchList(filters);

  return <div><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="flex items-center gap-2 text-sm font-bold text-teal-700"><Boxes className="size-4" />Read-only inventory</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Batch register</h1><p className="mt-2 text-slate-500">Pricing, quantity, expiry, and canonical batch status previews.</p></div><InventoryTabs active="/stock/batches" /></div><div className="mt-6"><InventoryFilters action="/stock/batches" search={filters.search} status={filters.status} statusOptions={[{ value: "ACTIVE", label: "Active" }, { value: "QUARANTINED", label: "Quarantined" }, { value: "DEPLETED", label: "Depleted" }]} /></div><div className="mt-4"><BatchTable rows={rows} /></div></div>;
}
