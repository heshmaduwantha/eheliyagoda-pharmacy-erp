import { mockExpiryAlerts, mockInventoryBatches, mockStockMovements } from "./inventory.mock";
import type { InventoryFilterInput, StockSummary } from "./inventory.types";

const includesSearch = (values: string[], search?: string) => {
  if (!search?.trim()) return true;
  const normalized = search.trim().toLowerCase();
  return values.some((value) => value.toLowerCase().includes(normalized));
};

// TODO(inventory): Replace mock reads with Inventory query services once available.
// This module intentionally exposes no create, update, adjustment, or write-off command.
export function getStockSummary(): StockSummary {
  return {
    totalActiveProducts: new Set(mockInventoryBatches.filter((batch) => batch.status === "ACTIVE").map((batch) => batch.productId)).size,
    lowStockCount: mockInventoryBatches.filter((batch) => batch.status === "ACTIVE" && batch.qtyOnHandBase < 50).length,
    nearExpiryCount: mockExpiryAlerts.filter((alert) => alert.daysLeft >= 0 && alert.daysLeft <= 90).length,
    expiredOrQuarantinedCount: mockExpiryAlerts.filter((alert) => alert.daysLeft < 0 || alert.status === "QUARANTINED").length,
  };
}

export function listInventoryBatches(filters: InventoryFilterInput = {}) {
  return mockInventoryBatches.filter((batch) =>
    (!filters.status || filters.status === "ALL" || batch.status === filters.status)
    && includesSearch([batch.productName, batch.sku, batch.batchNumber], filters.search),
  );
}

export function listStockMovements(filters: InventoryFilterInput = {}) {
  return mockStockMovements.filter((movement) =>
    (!filters.status || filters.status === "ALL" || movement.movementType === filters.status)
    && includesSearch([movement.productName, movement.batchNumber, movement.reference, movement.createdBy], filters.search),
  );
}

export function listExpiryAlerts(filters: InventoryFilterInput = {}) {
  return mockExpiryAlerts.filter((alert) =>
    (!filters.status || filters.status === "ALL" || alert.status === filters.status)
    && includesSearch([alert.productName, alert.batchNumber], filters.search),
  );
}
