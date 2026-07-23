import type { Metadata } from "next";
import { Boxes } from "lucide-react";
import { BatchTable } from "@/components/inventory/BatchTable";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { requirePermission } from "@/modules/auth/permissions";
import { getBatchList } from "@/modules/inventory/inventory.service";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Inventory Batches" };

export default async function BatchesPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string; availability?: string; timeframe?: string; page?: string }> }) {
  await requirePermission("stock.access");
  const filters = await searchParams;
  const currentPage = Math.max(1, parseInt(filters.page ?? "1", 10) || 1);
  
  const { data: rows, total } = await getBatchList({ ...filters, page: currentPage });
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-text sm:text-4xl">
            Batch register
          </h1>
        </div>
        <InventoryTabs active="/stock/batches" />
      </div>
      <div className="mt-6">
        <InventoryFilters 
          action="/stock/batches" 
          search={filters.search} 
          status={filters.status}
          availability={filters.availability}
          timeframe={filters.timeframe}
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
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              baseUrl="/stock/batches" 
              queryParams={{ 
                search: filters.search, 
                status: filters.status,
                availability: filters.availability,
                timeframe: filters.timeframe
              }} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
