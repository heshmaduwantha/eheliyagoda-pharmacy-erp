import type { Metadata } from "next";
import { CalendarClock } from "lucide-react";
import { ExpiryAlertTable } from "@/components/inventory/ExpiryAlertTable";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { requirePermission } from "@/modules/auth/permissions";
import { getExpiryAlerts } from "@/modules/inventory/inventory.service";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Expiry Alerts" };

export default async function ExpiryAlertsPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string; page?: string }> }) {
  await requirePermission("stock.access");
  const filters = await searchParams;
  const currentPage = Math.max(1, parseInt(filters.page ?? "1", 10) || 1);
  const { data: rows, total } = await getExpiryAlerts({ ...filters, page: currentPage });
  const totalPages = Math.ceil(total / 10);

  return <div><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="flex items-center gap-2 text-sm font-bold text-teal-700"><CalendarClock className="size-4" />Inventory workspace</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Expiry alerts</h1><p className="mt-2 text-slate-500">Expired, quarantined, and near-expiry batches calculated from live batch dates.</p></div><InventoryTabs active="/stock/expiry" /></div><div className="mt-6"><InventoryFilters action="/stock/expiry" search={filters.search} status={filters.status} statusOptions={[{ value: "ACTIVE", label: "Active" }, { value: "QUARANTINED", label: "Quarantined" }, { value: "DEPLETED", label: "Depleted" }]} /></div><div className="mt-4"><ExpiryAlertTable rows={rows} />{rows.length > 0 && <div className="mt-4"><Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/stock/expiry" queryParams={{ search: filters.search, status: filters.status }} /></div>}</div></div>;
}
