export type DecimalString = string;
export type MoneyString = DecimalString;
export type QuantityString = DecimalString;
export type ISODate = string;
export type ISODateTime = string;

export type ReportType =
  | "daily-sales"
  | "cash-card"
  | "product-sales"
  | "gross-profit"
  | "stock-valuation"
  | "low-stock"
  | "near-expiry"
  | "expired-quarantined"
  | "supplier-payables"
  | "expenses"
  | "controlled-drugs";

export type ReportDateRange = {
  from: ISODate;
  to: ISODate;
};

export type ReportAvailability = "ready" | "empty" | "unavailable";

export type ReportResult<TSummary, TRow> = {
  availability: ReportAvailability;
  summary: TSummary | null;
  rows: TRow[];
  message?: string;
  warnings?: string[];
};

export type DailySalesSummary = {
  subtotal: MoneyString;
  discount: MoneyString;
  tax: MoneyString;
  total: MoneyString;
  saleCount: number;
};

export type CashCardSummaryRow = {
  method: "CASH" | "CARD";
  amount: MoneyString;
  paymentCount: number;
};

export type ProductSalesRow = {
  productId: string;
  productName: string;
  qtyBaseSold: QuantityString;
  grossSales: MoneyString;
  discount: MoneyString;
  netSales: MoneyString;
  batchAwareCogs: MoneyString;
  grossProfitEstimate: MoneyString;
};

export type StockValuationRow = {
  batchId: string;
  productName: string;
  batchNumber: string | null;
  qtyOnHandBase: QuantityString;
  costPrice: MoneyString;
  valuation: MoneyString;
};

export type LowStockRow = {
  productId: string;
  productName: string;
  availableQtyBase: QuantityString;
  reorderLevel: QuantityString;
};

export type ExpiryReportRow = {
  batchId: string;
  productName: string;
  batchNumber: string | null;
  expiryDate: ISODate | null;
  daysLeft: number | null;
  qtyOnHandBase: QuantityString;
  status: "ACTIVE" | "QUARANTINED" | "DEPLETED";
  valuation: MoneyString;
};

export type SupplierPayableRow = {
  invoiceId: string;
  supplierName: string;
  invoiceNumber: string | null;
  invoiceTotal: MoneyString;
  paidAmount: MoneyString;
  outstandingAmount: MoneyString;
  status: "OPEN" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
  dueDate: ISODate | null;
};

export type ExpenseSummaryRow = {
  category: string;
  paymentMethod: string;
  totalAmount: MoneyString;
};

export type ControlledDrugRegisterRow = {
  prescriptionId: string;
  productName: string;
  batchNumber: string | null;
  expiryDate: ISODate | null;
  qtyDispensed: QuantityString;
  patientName: string;
  patientReference: string | null;
  prescriberName: string;
  prescriberReference: string;
  capturedBy: string | null;
  saleDateTime: ISODateTime;
  saleNumber: string | null;
};

export type DashboardReportSummary = {
  todaySales: MoneyString | null;
  cashTotal: MoneyString | null;
  cardTotal: MoneyString | null;
  grossProfitEstimate: MoneyString | null;
  supplierPayableTotal: MoneyString;
  expensesThisMonth: MoneyString | null;
  salesAvailable: boolean;
  expensesAvailable: boolean;
};
