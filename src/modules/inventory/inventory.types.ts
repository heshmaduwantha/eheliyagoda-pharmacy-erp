export type UUID = string;
export type ISODate = string;
export type ISODateTime = string;
export type DecimalString = string;
export type QuantityString = DecimalString;
export type MoneyString = DecimalString;

export type ProductType = "MEDICINE" | "GENERAL_ITEM";
export type PrescriptionRule = "NONE" | "PROMPT_SKIPPABLE" | "HARD_REQUIRED_CONTROLLED";
export type BatchStatus = "ACTIVE" | "QUARANTINED" | "DEPLETED";
export type StockMovementType = "GRN_IN" | "SALE_OUT" | "RETURN_IN" | "WRITE_OFF" | "ADJUSTMENT";
export type StockMovementDirection = "IN" | "OUT";
export type SaleStatus = "HELD" | "COMPLETED" | "VOIDED";
export type PaymentMethod = "CASH" | "CARD";

export type InventoryBatchStatus = BatchStatus;

export type InventoryUnavailableStock = {
  quantity: QuantityString;
  batchCount: number;
  reason: string;
};

export type InventoryProductSummaryRecord = {
  id: UUID;
  productName: string;
  primaryBarcode: string | null;
  baseUnit: string;
  activeQuantity: QuantityString;
  activeBatchCount: number;
  unavailableStock: InventoryUnavailableStock[];
};

export type InventoryBatchRecord = {
  id: UUID;
  productId: UUID;
  productName: string;
  primaryBarcode: string | null;
  batchNumber: string | null;
  supplierLotNumber: string | null;
  expiryDate: ISODate | null;
  mrp: MoneyString | null;
  costPrice: MoneyString;
  sellingPrice: MoneyString;
  qtyOnHandBase: QuantityString;
  baseUnit: string;
  status: BatchStatus;
};

export type StockMovementRecord = {
  id: UUID;
  occurredAt: ISODateTime;
  productName: string;
  batchNumber: string | null;
  supplierLotNumber: string | null;
  movementType: StockMovementType;
  direction: StockMovementDirection;
  qtyBase: QuantityString;
  baseUnit: string;
  reference: string;
  createdBy: string | null;
};

export type ExpiryAlertState = "EXPIRED" | "NEAR_EXPIRY" | "QUARANTINED";

export type ExpiryAlertRecord = {
  id: UUID;
  productName: string;
  batchNumber: string | null;
  supplierLotNumber: string | null;
  expiryDate: ISODate | null;
  daysLeft: number | null;
  qty: QuantityString;
  baseUnit: string;
  status: BatchStatus;
  alertState: ExpiryAlertState;
};

export type StockSummary = {
  totalActiveProducts: number;
  lowStockCount: number;
  nearExpiryCount: number;
  expiredOrQuarantinedCount: number;
};

export type InventoryFilterInput = {
  status?: string;
  direction?: string;
  availability?: string;
  timeframe?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};
