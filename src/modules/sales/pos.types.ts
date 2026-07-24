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
export type SaleStatus = "HELD" | "COMPLETED" | "VOIDED";
export type PaymentMethod = "CASH" | "CARD";

export type PosUnitOption = {
  id: UUID;
  productId: UUID;
  unitName: string;
  factorToBase: QuantityString;
  isPurchaseDefault: boolean;
  isSaleDefault: boolean;
  barcode: string | null;
  sellingPrice: MoneyString | null;
};

export type PosProductSearchResult = {
  id: UUID;
  name: string;
  genericName: string | null;
  strength: string | null;
  form: string | null;
  productType: ProductType;
  category: string | null;
  baseUnitName: string;
  prescriptionRule: PrescriptionRule;
  isControlled: boolean;
  isSpecialDrug: boolean;
  isActive: boolean;
  primaryBarcode: string | null;
  units: PosUnitOption[];
  defaultSaleUnitId: UUID | null;
  availableQtyBase: QuantityString;
  hasActiveStock: boolean;
  nextExpiryDate: ISODate | null;
};

export type PosBatchCandidate = {
  id: UUID;
  batchNumber: string | null;
  expiryDate: ISODate | null;
  status: BatchStatus;
  availableQtyBase: QuantityString;
  mrp: MoneyString | null;
  costPrice: MoneyString;
  sellingPrice: MoneyString;
  fefoRank: number;
};

export type PosBatchPreview = {
  productId: UUID;
  unitName: string;
  requestedQtyBase: QuantityString;
  totalAvailableQtyBase: QuantityString;
  canFulfil: boolean;
  candidates: PosBatchCandidate[];
  generatedAt: ISODateTime;
};

// Cart values are local UI state only. Future sale commands use decimal-string contract inputs.
export type PosCartLine = {
  id: string;
  productId: UUID;
  productName: string;
  prescriptionRule: PrescriptionRule;
  primaryBarcode: string | null;
  quantity: number;
  unitId: UUID;
  unitLabel: string;
  unitPrice: number;
  lineTotal: number;
  availableUnits: PosUnitOption[];
  batchPreview?: PosBatchPreview;
  selectedBatchId?: string;
};

export type PosPaymentInput = {
  method: PaymentMethod;
  amount: MoneyString;
  cardReference?: string;
};

export type PosReceiptPreview = {
  receiptNumber: string;
  createdAt: ISODateTime;
  lines: PosCartLine[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payments: PosPaymentInput[];
};

export type PosBarcodeLookupResult = {
  barcode: string;
  product: PosProductSearchResult;
  matchedUnit: PosUnitOption | null;
};
