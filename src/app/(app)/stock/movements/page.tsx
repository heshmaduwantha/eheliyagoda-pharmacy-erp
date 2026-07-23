import type { Metadata } from "next";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { StockMovementTable } from "@/components/inventory/StockMovementTable";
import { requirePermission } from "@/modules/auth/permissions";
import { getStockMovementList } from "@/modules/inventory/inventory.service";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Stock Movements" };

export default async function StockMovementsPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string; direction?: string; page?: string }> }) {
  await requirePermission("stock.access");
  const filters = await searchParams;
  const currentPage = Math.max(1, parseInt(filters.page ?? "1", 10) || 1);
  const { data: rows, total } = await getStockMovementList({ ...filters, page: currentPage });
  const totalPages = Math.ceil(total / 10);

  return <div className="min-w-0"><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><h1 className="text-3xl font-black tracking-tight text-neutral-text sm:text-4xl">Stock movements</h1></div><InventoryTabs active="/stock/movements" /></div><div className="mt-6"><InventoryFilters action="/stock/movements" search={filters.search} status={filters.status} statusOptions={[{ value: "GRN_IN", label: "GRN in" }, { value: "SALE_OUT", label: "Sale out" }, { value: "RETURN_IN", label: "Return in" }, { value: "WRITE_OFF", label: "Expired Stock" }, { value: "ADJUSTMENT", label: "Adjustment" }]} direction={filters.direction} directionOptions={[{ value: "IN", label: "Stock In" }, { value: "OUT", label: "Stock Out" }]} showAvailability={false} showTimeframe={false} /></div><div className="mt-4"><StockMovementTable rows={rows} />{rows.length > 0 && <div className="mt-4"><Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/stock/movements" queryParams={{ search: filters.search, status: filters.status, direction: filters.direction }} /></div>}</div></div>;
}
