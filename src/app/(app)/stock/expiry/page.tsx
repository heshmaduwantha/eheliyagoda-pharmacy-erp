import type { Metadata } from "next";
import { CalendarClock } from "lucide-react";
import { ExpiryAlertTable } from "@/components/inventory/ExpiryAlertTable";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";
import { requirePermission } from "@/modules/auth/permissions";
import { listExpiryAlerts } from "@/modules/inventory/inventory.service";

export const metadata: Metadata = { title: "Expiry Alerts" };

export default async function ExpiryAlertsPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string }> }) {
  await requirePermission("stock.access");
  const filters = await searchParams;
  const rows = listExpiryAlerts(filters);

  return <div><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="flex items-center gap-2 text-sm font-bold text-teal-700"><CalendarClock className="size-4" />Read-only alerts</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Expiry alerts</h1><p className="mt-2 text-slate-500">Mock days-left calculations and canonical batch statuses.</p></div><InventoryTabs active="/stock/expiry" /></div><div className="mt-6"><InventoryFilters action="/stock/expiry" search={filters.search} status={filters.status} statusOptions={[{ value: "ACTIVE", label: "Active" }, { value: "QUARANTINED", label: "Quarantined" }, { value: "DEPLETED", label: "Depleted" }]} /></div><div className="mt-4"><ExpiryAlertTable rows={rows} /></div></div>;
}
