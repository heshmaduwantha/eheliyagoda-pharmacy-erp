import type { Metadata } from "next";
import { ExpiryAlertTable } from "@/components/inventory/ExpiryAlertTable";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { requirePermission } from "@/modules/auth/permissions";
import { getExpiryAlerts } from "@/modules/inventory/inventory.service";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Expiry Alerts" };

export default async function ExpiryAlertsPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string; availability?: string; timeframe?: string; page?: string }> }) {
  await requirePermission("stock.access");
  const filters = await searchParams;
  const currentPage = Math.max(1, parseInt(filters.page ?? "1", 10) || 1);
  const { data: rows, total } = await getExpiryAlerts({ ...filters, page: currentPage });
  const totalPages = Math.ceil(total / 10);

  return (
    <div>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-text sm:text-3xl">Expiry alerts</h1>
        </div>
        <InventoryTabs active="/stock/expiry" />
      </div>
      <div className="mt-6">
        <InventoryFilters 
          action="/stock/expiry" 
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
        <ExpiryAlertTable rows={rows} />
        {rows.length > 0 && (
          <div className="mt-4">
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              baseUrl="/stock/expiry" 
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
