export type InventoryBatchStatus = "ACTIVE" | "QUARANTINED" | "DEPLETED";

export type StockMovementType = "GRN_IN" | "SALE_OUT" | "RETURN_IN" | "WRITE_OFF" | "ADJUSTMENT";

export type InventoryBatchRecord = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  batchNumber: string;
  expiryDate: string;
  mrp: number;
  costPrice: number;
  sellingPrice: number;
  qtyOnHandBase: number;
  baseUnit: string;
  status: InventoryBatchStatus;
};

export type StockMovementRecord = {
  id: string;
  occurredAt: string;
  productName: string;
  batchNumber: string;
  movementType: StockMovementType;
  qtyBase: number;
  baseUnit: string;
  reference: string;
  createdBy: string;
};

export type ExpiryAlertRecord = {
  id: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  daysLeft: number;
  qty: number;
  baseUnit: string;
  status: InventoryBatchStatus;
};

export type StockSummary = {
  totalActiveProducts: number;
  lowStockCount: number;
  nearExpiryCount: number;
  expiredOrQuarantinedCount: number;
};

export type InventoryFilterInput = {
  search?: string;
  status?: string;
};
