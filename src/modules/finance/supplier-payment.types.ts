import type { PaymentMethod } from "@prisma/client";

export type SupplierInvoiceBalanceRow = {
  supplierInvoiceId: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string | null;
  totalAmount: string;
  paidAmount: string;
  outstandingAmount: string;
  status: "OPEN" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
  dueDate: string | null;
  latestPaymentAt: string | null;
};

export type SupplierPaymentListFilters = {
  from?: string;
  to?: string;
  supplierId?: string;
  invoiceId?: string;
  limit?: number;
};

export type SupplierPaymentListRow = {
  id: string;
  paymentNumber: string;
  supplierName: string;
  invoiceNumber: string | null;
  amount: string;
  paymentMethod: PaymentMethod;
  reference: string | null;
  paidAt: string;
  createdBy: string | null;
  outstandingAfter: string;
};

export type CreateSupplierPaymentInput = {
  supplierInvoiceId: string;
  amount: string | number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  paidAt?: string;
};
