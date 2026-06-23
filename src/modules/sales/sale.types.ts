import type {
  PrescriptionDecisionInput,
  PrescriptionPatientInput,
  PrescriptionPrescriberInput,
} from "@/modules/prescriptions/prescription.types";

export type UUID = string;
export type ISODate = string;
export type ISODateTime = string;
export type DecimalString = string;
export type QuantityString = DecimalString;
export type MoneyString = DecimalString;

export type SaleRequestedStatus = "HELD" | "COMPLETED";
export type SaleStatus = "HELD" | "COMPLETED" | "VOIDED";
export type SalePaymentMethod = "CASH" | "CARD";

export type SaleLineInput = {
  clientLineId: UUID;
  productId: UUID;
  unitId: UUID;
  quantity: QuantityString;
  quotedUnitPrice: MoneyString;
  barcodeUsed?: string;
};

export type SalePaymentInput = {
  method: SalePaymentMethod;
  amount: MoneyString;
  cardReference?: string;
};

export type SaleCompletionInput = {
  clientRequestId: UUID;
  requestedStatus: SaleRequestedStatus;
  lines: SaleLineInput[];
  payments: SalePaymentInput[];
  expectedTotal: MoneyString;
  discountAmount?: MoneyString;
  taxAmount?: MoneyString;
  patient?: PrescriptionPatientInput;
  prescriber?: PrescriptionPrescriberInput;
  prescription?: PrescriptionDecisionInput;
  notes?: string;
};

export type SaleBatchAllocation = {
  saleLineId: UUID;
  clientLineId: UUID;
  productId: UUID;
  productName: string;
  unitId: UUID;
  unitName: string;
  batchId: UUID;
  batchNumber: string | null;
  expiryDate: ISODate | null;
  qty: QuantityString;
  qtyBase: QuantityString;
  unitPrice: MoneyString;
  lineTotal: MoneyString;
  costPriceAtSale: MoneyString;
  mrpAtSale: MoneyString | null;
};

export type SaleReceiptLine = {
  clientLineId: UUID;
  productId: UUID;
  productName: string;
  unitId: UUID;
  unitName: string;
  quantity: QuantityString;
  qtyBase: QuantityString;
  unitPrice: MoneyString;
  lineTotal: MoneyString;
  batchAllocations: SaleBatchAllocation[];
};

export type SaleReceiptPayment = {
  method: SalePaymentMethod;
  amount: MoneyString;
  cardReference: string | null;
};

export type SaleReceipt = {
  saleId: UUID;
  saleNumber: string;
  status: SaleStatus;
  completedAt: ISODateTime;
  subtotal: MoneyString;
  discountAmount: MoneyString;
  taxAmount: MoneyString;
  total: MoneyString;
  lines: SaleReceiptLine[];
  payments: SaleReceiptPayment[];
  allocations: SaleBatchAllocation[];
};

export type SaleCompletionResult = {
  saleId: UUID;
  saleNumber: string;
  status: SaleStatus;
  subtotal: MoneyString;
  discountAmount: MoneyString;
  taxAmount: MoneyString;
  total: MoneyString;
  allocations: SaleBatchAllocation[];
  completedAt: ISODateTime;
  receipt: SaleReceipt;
};

export type SaleCompletionErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CATALOG_PRODUCT_NOT_FOUND"
  | "CATALOG_UNIT_INVALID"
  | "INVENTORY_NO_ACTIVE_STOCK"
  | "INVENTORY_INSUFFICIENT_STOCK"
  | "SALE_PRICE_EXCEEDS_MRP"
  | "SALE_PRICE_CHANGED"
  | "SALE_PRESCRIPTION_REQUIRED"
  | "SALE_CONTROLLED_DRUG_DETAILS_REQUIRED"
  | "SALE_PAYMENT_TOTAL_MISMATCH"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export class SaleCompletionError extends Error {
  constructor(
    public readonly code: SaleCompletionErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "SaleCompletionError";
  }
}
