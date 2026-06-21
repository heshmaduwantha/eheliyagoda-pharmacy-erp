import type { ExpiryAlertRecord, InventoryBatchRecord, StockMovementRecord } from "./inventory.types";

export const mockInventoryBatches: InventoryBatchRecord[] = [
  { id: "batch-1", productId: "p-1", productName: "Paracetamol 500mg", sku: "PAR500", batchNumber: "PAR500-0626", expiryDate: "2027-08-31", mrp: 12, costPrice: 7.5, sellingPrice: 11.5, qtyOnHandBase: 1250, baseUnit: "tablets", status: "ACTIVE" },
  { id: "batch-2", productId: "p-2", productName: "Amoxicillin 250mg", sku: "AMX250", batchNumber: "AMX250-0526", expiryDate: "2026-07-15", mrp: 28, costPrice: 19, sellingPrice: 27, qtyOnHandBase: 25, baseUnit: "capsules", status: "ACTIVE" },
  { id: "batch-3", productId: "p-3", productName: "Cetirizine 10mg", sku: "CET10", batchNumber: "CET10-0426", expiryDate: "2026-06-15", mrp: 8.5, costPrice: 4.25, sellingPrice: 8, qtyOnHandBase: 10, baseUnit: "tablets", status: "QUARANTINED" },
  { id: "batch-4", productId: "p-4", productName: "Metformin 500mg", sku: "MET500", batchNumber: "MET500-0326", expiryDate: "2026-08-08", mrp: 18, costPrice: 12, sellingPrice: 17, qtyOnHandBase: 44, baseUnit: "tablets", status: "ACTIVE" },
  { id: "batch-5", productId: "p-5", productName: "Omeprazole 20mg", sku: "OME20", batchNumber: "OME20-0126", expiryDate: "2027-01-31", mrp: 24, costPrice: 16.5, sellingPrice: 23, qtyOnHandBase: 230, baseUnit: "capsules", status: "ACTIVE" },
  { id: "batch-6", productId: "p-6", productName: "Salbutamol Inhaler", sku: "SALB100", batchNumber: "SALB100-0526", expiryDate: "2026-06-30", mrp: 850, costPrice: 665, sellingPrice: 820, qtyOnHandBase: 8, baseUnit: "inhalers", status: "ACTIVE" },
  { id: "batch-7", productId: "p-7", productName: "Vitamin C 500mg", sku: "VITC500", batchNumber: "VITC500-1125", expiryDate: "2026-12-31", mrp: 15, costPrice: 8, sellingPrice: 14, qtyOnHandBase: 0, baseUnit: "tablets", status: "DEPLETED" },
];

export const mockStockMovements: StockMovementRecord[] = [
  { id: "mov-1", occurredAt: "2026-06-21T08:35:00+05:30", productName: "Paracetamol 500mg", batchNumber: "PAR500-0626", movementType: "GRN_IN", qtyBase: 500, baseUnit: "tablets", reference: "GRN-1024", createdBy: "Owner Doctor" },
  { id: "mov-2", occurredAt: "2026-06-21T09:12:00+05:30", productName: "Paracetamol 500mg", batchNumber: "PAR500-0626", movementType: "SALE_OUT", qtyBase: -20, baseUnit: "tablets", reference: "SALE-3487", createdBy: "Certified Pharmacist" },
  { id: "mov-3", occurredAt: "2026-06-20T16:42:00+05:30", productName: "Amoxicillin 250mg", batchNumber: "AMX250-0526", movementType: "RETURN_IN", qtyBase: 10, baseUnit: "capsules", reference: "RET-0042", createdBy: "Certified Pharmacist" },
  { id: "mov-4", occurredAt: "2026-06-20T11:05:00+05:30", productName: "Cetirizine 10mg", batchNumber: "CET10-0426", movementType: "WRITE_OFF", qtyBase: -10, baseUnit: "tablets", reference: "WO-0123", createdBy: "Owner Doctor" },
  { id: "mov-5", occurredAt: "2026-06-19T14:20:00+05:30", productName: "Metformin 500mg", batchNumber: "MET500-0326", movementType: "ADJUSTMENT", qtyBase: -2, baseUnit: "tablets", reference: "ADJ-0018", createdBy: "Owner Doctor" },
];

export const mockExpiryAlerts: ExpiryAlertRecord[] = [
  { id: "exp-1", productName: "Cetirizine 10mg", batchNumber: "CET10-0426", expiryDate: "2026-06-15", daysLeft: -6, qty: 10, baseUnit: "tablets", status: "QUARANTINED" },
  { id: "exp-2", productName: "Salbutamol Inhaler", batchNumber: "SALB100-0526", expiryDate: "2026-06-30", daysLeft: 9, qty: 8, baseUnit: "inhalers", status: "ACTIVE" },
  { id: "exp-3", productName: "Amoxicillin 250mg", batchNumber: "AMX250-0526", expiryDate: "2026-07-15", daysLeft: 24, qty: 25, baseUnit: "capsules", status: "ACTIVE" },
  { id: "exp-4", productName: "Metformin 500mg", batchNumber: "MET500-0326", expiryDate: "2026-08-08", daysLeft: 48, qty: 44, baseUnit: "tablets", status: "ACTIVE" },
];
