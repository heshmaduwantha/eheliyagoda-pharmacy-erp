export type PosUnitOption = {
  code: string;
  label: string;
  unitPrice: number;
};

export type PosProductSearchResult = {
  id: string;
  name: string;
  genericName?: string;
  sku: string;
  barcode: string;
  requiresPrescription: boolean;
  units: PosUnitOption[];
  mockAvailableQty: number;
};

export type PosBatchPreview = {
  batchNumber: string;
  expiryDate: string;
  availableQty: number;
  mrp: number;
  status: "SELLABLE" | "LOW_STOCK" | "NEAR_EXPIRY";
};

export type PosCartLine = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCode: string;
  unitLabel: string;
  unitPrice: number;
  lineTotal: number;
  availableUnits: PosUnitOption[];
  batchPreview?: PosBatchPreview;
};

export type PosPaymentInput = {
  cashAmount: number;
  cardAmount: number;
  cardReference: string;
};

export type PosReceiptPreview = {
  receiptNumber: string;
  createdAt: string;
  lines: PosCartLine[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment: PosPaymentInput;
};
