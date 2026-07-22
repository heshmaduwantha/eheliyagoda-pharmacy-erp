import type { Metadata } from "next";
import { Boxes } from "lucide-react";
import { BatchTable } from "@/components/inventory/BatchTable";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { requirePermission } from "@/modules/auth/permissions";
import { getBatchList } from "@/modules/inventory/inventory.service";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Inventory Batches" };

export default async function BatchesPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string; page?: string }> }) {
  await requirePermission("stock.access");
  const filters = await searchParams;
  const currentPage = Math.max(1, parseInt(filters.page ?? "1", 10) || 1);
  
  const { data: rows, total } = await getBatchList({ ...filters, page: currentPage });
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-teal-700">
            <Boxes className="size-4" />
            Inventory workspace
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Batch register
          </h1>
          <p className="mt-2 text-slate-500">Pricing, quantity, expiry, and canonical batch status previews.</p>
        </div>
        <InventoryTabs active="/stock/batches" />
      </div>
      <div className="mt-6">
        <InventoryFilters 
          action="/stock/batches" 
          search={filters.search} 
          status={filters.status} 
          statusOptions={[
            { value: "ACTIVE", label: "Active" }, 
            { value: "QUARANTINED", label: "Quarantined" }, 
            { value: "DEPLETED", label: "Depleted" }
          ]} 
        />
      </div>
      <div className="mt-4">
        <BatchTable rows={rows} />
        {rows.length > 0 && (
          <div className="mt-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/stock/batches" queryParams={{ search: filters.search, status: filters.status }} />
          </div>
        )}
      </div>
    </div>
  );
}
