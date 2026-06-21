import type { Metadata } from "next";
import { ArrowLeftRight } from "lucide-react";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { StockMovementTable } from "@/components/inventory/StockMovementTable";
import { requirePermission } from "@/modules/auth/permissions";
import { listStockMovements } from "@/modules/inventory/inventory.service";

export const metadata: Metadata = { title: "Stock Movements" };

export default async function StockMovementsPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string }> }) {
  await requirePermission("stock.access");
  const filters = await searchParams;
  const rows = listStockMovements(filters);

  return <div><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="flex items-center gap-2 text-sm font-bold text-teal-700"><ArrowLeftRight className="size-4" />Append-only preview</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Stock movements</h1><p className="mt-2 text-slate-500">Mock ledger entries; this screen cannot create or change movements.</p></div><InventoryTabs active="/stock/movements" /></div><div className="mt-6"><InventoryFilters action="/stock/movements" search={filters.search} status={filters.status} statusOptions={[{ value: "GRN_IN", label: "GRN in" }, { value: "SALE_OUT", label: "Sale out" }, { value: "RETURN_IN", label: "Return in" }, { value: "WRITE_OFF", label: "Write-off" }, { value: "ADJUSTMENT", label: "Adjustment" }]} /></div><div className="mt-4"><StockMovementTable rows={rows} /></div></div>;
}
