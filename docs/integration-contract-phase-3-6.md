# Medisquare Integration Contract — Phases 3–6

Status: **Draft v1**  
Scope: Catalog, Direct GRN, Inventory read models, and future POS sale completion  
Transport assumption: JSON over server actions or route handlers

This document defines the boundary between frontend screens and backend domain services. It does not implement endpoints, FEFO allocation, stock mutation, sale completion, or payment persistence.

## Serialization rules

- UUIDs are serialized as strings.
- Dates use `YYYY-MM-DD`; timestamps use ISO 8601 UTC strings.
- Quantities and conversion factors use decimal strings, such as `"10.000"`.
- Money uses decimal strings with two fractional digits, such as `"1250.00"`.
- JSON clients must never send final database money or quantities as floating-point numbers.
- The backend converts decimal strings to `Prisma.Decimal` or an equivalent decimal type and recalculates all authoritative totals.
- The frontend may use a decimal library for display calculations, but its totals are not authoritative.
- Batch previews are advisory read models. They do not reserve or allocate stock.

```ts
type UUID = string;
type ISODate = string; // YYYY-MM-DD
type ISODateTime = string; // ISO 8601 UTC
type DecimalString = string; // Runtime pattern: /^-?\d+(\.\d+)?$/
type QuantityString = DecimalString;
type MoneyString = DecimalString;

type ProductType = "MEDICINE" | "GENERAL_ITEM";

type PrescriptionRule =
  | "NONE"
  | "PROMPT_SKIPPABLE"
  | "HARD_REQUIRED_CONTROLLED";

type BatchStatus = "ACTIVE" | "QUARANTINED" | "DEPLETED";
type SaleStatus = "HELD" | "COMPLETED" | "VOIDED";

type PaymentMethod = "CASH" | "CARD";

interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta?: {
    requestId?: string;
    generatedAt?: ISODateTime;
  };
}
```

## Shared catalog shapes

```ts
interface PosProductSummary {
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
}

interface ProductUnitResponse {
  id: UUID;
  productId: UUID;
  unitName: string;
  factorToBase: QuantityString;
  isPurchaseDefault: boolean;
  isSaleDefault: boolean;
  barcode: string | null;
  sellingPrice: MoneyString | null;
}
```

`factorToBase` is the number of base units represented by one selected unit. For example, a strip containing ten tablets uses `"10.000"`.

## 1. Barcode lookup

Suggested boundary: `lookupProductByBarcode(barcode)` or `GET /api/catalog/barcodes/:barcode`.

```ts
interface BarcodeLookupData {
  barcode: string;
  product: PosProductSummary;
  matchedUnit: ProductUnitResponse | null;
  saleUnits: ProductUnitResponse[];
  inventory: {
    hasActiveStock: boolean;
    availableQtyBase: QuantityString;
    batchPreview: PosBatchPreviewResponse | null;
  };
}

type BarcodeLookupResponse = ApiSuccess<BarcodeLookupData>;
```

The backend must perform an exact barcode match. A barcode linked directly to a unit returns that unit in `matchedUnit`; otherwise it may be `null` and the UI asks the cashier to select a unit.

## 2. Product search

Suggested boundary: `searchProducts(input)` or `GET /api/catalog/products?q=...`.

```ts
interface ProductSearchItem extends PosProductSummary {
  primaryBarcode: string | null;
  defaultSaleUnit: ProductUnitResponse | null;
  availableQtyBase: QuantityString;
  hasActiveStock: boolean;
  nextExpiryDate: ISODate | null;
}

interface ProductSearchResponse {
  ok: true;
  data: {
    items: ProductSearchItem[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  meta?: {
    requestId?: string;
    generatedAt?: ISODateTime;
  };
}
```

Search results are read-only summaries. `hasActiveStock` does not guarantee availability at sale completion time.

## 3. Product units

Suggested boundary: `getProductUnits(productId)` or `GET /api/catalog/products/:id/units`.

```ts
interface ProductUnitsResponse {
  ok: true;
  data: {
    productId: UUID;
    baseUnitName: string;
    units: ProductUnitResponse[];
  };
}
```

The server must validate the selected `unitId` belongs to the selected `productId` when it later receives a cart line.

## 4. Batch preview

Suggested boundary: `getPosBatchPreview(productId, unitId, quantity)` or `GET /api/inventory/products/:id/batch-preview`.

```ts
interface PosBatchCandidate {
  id: UUID;
  batchNumber: string | null;
  expiryDate: ISODate | null;
  status: BatchStatus;
  availableQtyBase: QuantityString;
  mrp: MoneyString | null;
  costPrice: MoneyString;
  sellingPrice: MoneyString;
  fefoRank: number;
}

interface PosBatchPreviewResponse {
  productId: UUID;
  requestedQtyBase: QuantityString;
  totalAvailableQtyBase: QuantityString;
  canFulfil: boolean;
  candidates: PosBatchCandidate[];
  generatedAt: ISODateTime;
}

interface BatchPreviewApiResponse extends ApiSuccess<PosBatchPreviewResponse> {}
```

Candidates must contain only `ACTIVE` batches with positive quantity. The backend should order dated batches by expiry date and apply its documented null-expiry policy. The preview does **not** lock stock; authoritative FEFO allocation occurs only inside a future sale-completion transaction.

## 5. Cart line input

```ts
interface PosCartLineInput {
  clientLineId: string;
  productId: UUID;
  unitId: UUID;
  quantity: QuantityString;
  quotedUnitPrice: MoneyString;
  barcodeUsed?: string;
}
```

- `quantity` is expressed in the selected sale unit and must be positive.
- The backend resolves `factorToBase` and recalculates base quantity.
- `quotedUnitPrice` supports optimistic mismatch detection only; the backend validates the current selling price and MRP.
- A client must not submit `batchId` as an authoritative allocation decision.

## 6. Payment input

Split payments are represented by multiple payment entries.

```ts
interface PosPaymentInput {
  method: PaymentMethod;
  amount: MoneyString;
  cardReference?: string;
}
```

Rules reserved for the future sale command:

- Every amount must be greater than zero.
- `cardReference` is required by deployment policy when `method` is `CARD`.
- The sum of all payment amounts must equal the server-calculated invoice total.
- Payment records are persisted only inside the successful sale-completion transaction.

## 7. Future complete-sale input

Suggested future boundary: `completeSale(input)` or `POST /api/sales`.

```ts
interface SalePatientInput {
  patientId?: UUID;
  patientName?: string;
  patientReference?: string;
}

interface SalePrescriberInput {
  prescriberId?: UUID;
  prescriberName?: string;
  registrationNumber?: string;
}

interface FutureCompleteSaleInput {
  clientRequestId: string; // Idempotency key generated once per checkout attempt
  requestedStatus: Extract<SaleStatus, "HELD" | "COMPLETED">;
  lines: PosCartLineInput[];
  payments: PosPaymentInput[];
  expectedTotal: MoneyString;
  discountAmount?: MoneyString;
  patient?: SalePatientInput;
  prescriber?: SalePrescriberInput;
  notes?: string;
}

interface CompleteSaleLineAllocation {
  batchId: UUID;
  batchNumber: string | null;
  qtyBase: QuantityString;
  unitPrice: MoneyString;
  lineTotal: MoneyString;
}

interface FutureCompleteSaleResponse {
  ok: true;
  data: {
    saleId: UUID;
    saleNumber: string;
    status: SaleStatus;
    subtotal: MoneyString;
    discountAmount: MoneyString;
    taxAmount: MoneyString;
    total: MoneyString;
    allocations: CompleteSaleLineAllocation[];
    completedAt: ISODateTime | null;
  };
}
```

The future backend must ignore client arithmetic as authoritative. It must reload products, units, permissions, prescription requirements, prices, batches, and stock in one PostgreSQL transaction. Redis must not participate in stock or payment truth.

## 8. Error response format

```ts
type IntegrationErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CATALOG_BARCODE_NOT_FOUND"
  | "CATALOG_PRODUCT_NOT_FOUND"
  | "CATALOG_UNIT_INVALID"
  | "INVENTORY_NO_ACTIVE_STOCK"
  | "INVENTORY_INSUFFICIENT_STOCK"
  | "SALE_PRICE_EXCEEDS_MRP"
  | "SALE_PRICE_CHANGED"
  | "SALE_PRESCRIPTION_REQUIRED"
  | "SALE_CONTROLLED_DRUG_DETAILS_REQUIRED"
  | "SALE_PAYMENT_TOTAL_MISMATCH"
  | "SALE_IDEMPOTENCY_CONFLICT"
  | "CONFLICT"
  | "INTERNAL_ERROR";

interface ApiFieldError {
  field: string;
  message: string;
}

interface ApiErrorResponse {
  ok: false;
  error: {
    code: IntegrationErrorCode;
    message: string; // Safe for display; never includes SQL, stack, or secret data
    fieldErrors?: ApiFieldError[];
    details?: Record<string, string | number | boolean | null>;
    requestId: string;
  };
}
```

Recommended HTTP mapping:

| Status | Usage |
|---|---|
| `400` | Malformed request |
| `401` | No valid session |
| `403` | Missing permission |
| `404` | Barcode/product not found |
| `409` | No/insufficient stock, idempotency conflict, changed state |
| `422` | Valid shape but domain rule rejected |
| `500` | Unexpected internal failure with a safe message |

## Contract examples

### Barcode found

```ts
const barcodeFound: BarcodeLookupResponse = {
  ok: true,
  data: {
    barcode: "890100000001",
    product: {
      id: "eaf4a2f5-4c27-44dd-9238-b9a9a6eb052e",
      name: "Paracetamol 500mg",
      genericName: "Paracetamol",
      strength: "500mg",
      form: "Tablet",
      productType: "MEDICINE",
      category: "Analgesic",
      baseUnitName: "tablet",
      prescriptionRule: "NONE",
      isControlled: false,
      isSpecialDrug: false,
      isActive: true,
    },
    matchedUnit: {
      id: "86ab3cce-e43d-4a78-a2af-c8de41196470",
      productId: "eaf4a2f5-4c27-44dd-9238-b9a9a6eb052e",
      unitName: "tablet",
      factorToBase: "1.000",
      isPurchaseDefault: false,
      isSaleDefault: true,
      barcode: "890100000001",
      sellingPrice: "12.00",
    },
    saleUnits: [],
    inventory: {
      hasActiveStock: true,
      availableQtyBase: "1250.000",
      batchPreview: {
        productId: "eaf4a2f5-4c27-44dd-9238-b9a9a6eb052e",
        requestedQtyBase: "1.000",
        totalAvailableQtyBase: "1250.000",
        canFulfil: true,
        candidates: [],
        generatedAt: "2026-06-21T08:30:00.000Z",
      },
    },
  },
};
```

### Barcode not found

```ts
const barcodeNotFound: ApiErrorResponse = {
  ok: false,
  error: {
    code: "CATALOG_BARCODE_NOT_FOUND",
    message: "No active product was found for this barcode.",
    details: { barcode: "999999999999" },
    requestId: "req_01JZBARCODE",
  },
};
```

### Product has no active stock

```ts
const noActiveStock: ApiErrorResponse = {
  ok: false,
  error: {
    code: "INVENTORY_NO_ACTIVE_STOCK",
    message: "This product has no sellable stock.",
    details: {
      productId: "eaf4a2f5-4c27-44dd-9238-b9a9a6eb052e",
      requestedQtyBase: "10.000",
      availableQtyBase: "0.000",
    },
    requestId: "req_01JZNOSTOCK",
  },
};
```

### Medicine price above MRP

```ts
const priceAboveMrp: ApiErrorResponse = {
  ok: false,
  error: {
    code: "SALE_PRICE_EXCEEDS_MRP",
    message: "The selling price cannot exceed the batch MRP.",
    fieldErrors: [{ field: "lines[0].quotedUnitPrice", message: "Price exceeds MRP." }],
    details: { quotedUnitPrice: "15.00", mrp: "12.00" },
    requestId: "req_01JZMRP",
  },
};
```

### Controlled drug requires patient and prescriber

```ts
const controlledDrugDetailsRequired: ApiErrorResponse = {
  ok: false,
  error: {
    code: "SALE_CONTROLLED_DRUG_DETAILS_REQUIRED",
    message: "Patient and prescriber details are required for this medicine.",
    fieldErrors: [
      { field: "patient", message: "Patient details are required." },
      { field: "prescriber", message: "Prescriber details are required." },
    ],
    details: { prescriptionRule: "HARD_REQUIRED_CONTROLLED" },
    requestId: "req_01JZCONTROLLED",
  },
};
```

### Payment total mismatch

```ts
const paymentMismatch: ApiErrorResponse = {
  ok: false,
  error: {
    code: "SALE_PAYMENT_TOTAL_MISMATCH",
    message: "Payment total must equal the invoice total.",
    fieldErrors: [{ field: "payments", message: "The payment allocation is incomplete." }],
    details: {
      invoiceTotal: "1250.00",
      paymentTotal: "1200.00",
      remainingAmount: "50.00",
    },
    requestId: "req_01JZPAYMENT",
  },
};
```

## Ownership and change control

- Catalog owns product, barcode, and unit response semantics.
- Inventory owns batch availability and preview semantics.
- GRN owns confirmed stock-in creation; POS does not call GRN internals.
- Sales will own authoritative pricing validation, FEFO allocation, stock-out movement creation, payments, and receipt generation.
- Any breaking field or enum change requires updating this document and coordinating frontend and backend consumers before merge.
