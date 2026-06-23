import type { PaymentMethod, SaleStatus } from "@prisma/client";

export type SaleVoidStockPolicy = "NO_STOCK_RETURN" | "RETURN_TO_ACTIVE";
export type SaleVoidListStatusFilter = "ALL" | SaleStatus;

export type VoidSaleInput = {
  saleId: string;
  reason: string;
  refundAmount?: string;
  refundMethod?: PaymentMethod;
  refundReference?: string;
  stockPolicy?: SaleVoidStockPolicy;
};

export type SaleVoidListFilters = {
  status?: SaleVoidListStatusFilter;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export type SaleVoidLineItem = {
  saleLineId: string;
  productName: string;
  batchNumber: string | null;
  expiryDate: string | null;
  quantity: string;
  unitName: string;
  unitPrice: string;
  lineTotal: string;
  qtyBase: string;
};

export type SaleVoidPaymentItem = {
  salePaymentId: string;
  method: PaymentMethod;
  amount: string;
  cardReference: string | null;
};

export type SaleVoidRecord = {
  saleVoidId: string;
  reason: string;
  refundAmount: string;
  refundMethod: PaymentMethod | null;
  refundReference: string | null;
  stockPolicy: SaleVoidStockPolicy;
  voidedAt: string;
  voidedByName: string | null;
};

export type SaleVoidListItem = {
  saleId: string;
  saleNumber: string;
  status: SaleStatus;
  createdAt: string;
  completedAt: string | null;
  voidedAt: string | null;
  activityAt: string;
  cashierName: string;
  cashierUsername: string;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
  lineCount: number;
  paymentCount: number;
  lines: SaleVoidLineItem[];
  payments: SaleVoidPaymentItem[];
  voidRecord: SaleVoidRecord | null;
};

export type SaleVoidResult = {
  saleVoidId: string;
  saleId: string;
  saleNumber: string;
  status: "VOIDED";
  voidedAt: string;
  refundAmount: string;
  stockPolicy: SaleVoidStockPolicy;
  returnedStockMovements: Array<{
    stockMovementId: string;
    saleLineId: string;
    productId: string;
    batchId: string;
    qtyBase: string;
  }>;
  auditStatus: "written";
};

export type SaleVoidErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export class SaleVoidError extends Error {
  constructor(
    public readonly code: SaleVoidErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "SaleVoidError";
  }
}
