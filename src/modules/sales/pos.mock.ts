import type { PosBatchPreview, PosProductSearchResult } from "./pos.types";

export const mockPosProducts: PosProductSearchResult[] = [
  {
    id: "mock-paracetamol-500",
    name: "Paracetamol 500mg",
    genericName: "Paracetamol",
    sku: "PAR500",
    barcode: "890100000001",
    requiresPrescription: false,
    mockAvailableQty: 1250,
    units: [
      { code: "TABLET", label: "Tablet", unitPrice: 12 },
      { code: "STRIP", label: "Strip (10)", unitPrice: 120 },
    ],
  },
  {
    id: "mock-amoxicillin-250",
    name: "Amoxicillin 250mg",
    genericName: "Amoxicillin",
    sku: "AMX250",
    barcode: "890100000002",
    requiresPrescription: true,
    mockAvailableQty: 320,
    units: [
      { code: "CAPSULE", label: "Capsule", unitPrice: 28 },
      { code: "STRIP", label: "Strip (10)", unitPrice: 280 },
    ],
  },
  {
    id: "mock-cetirizine-10",
    name: "Cetirizine 10mg",
    genericName: "Cetirizine",
    sku: "CET10",
    barcode: "890100000003",
    requiresPrescription: false,
    mockAvailableQty: 85,
    units: [
      { code: "TABLET", label: "Tablet", unitPrice: 8.5 },
      { code: "STRIP", label: "Strip (10)", unitPrice: 85 },
    ],
  },
  {
    id: "mock-saline-100",
    name: "Normal Saline 100ml",
    genericName: "Sodium Chloride",
    sku: "NS100",
    barcode: "890100000004",
    requiresPrescription: false,
    mockAvailableQty: 44,
    units: [{ code: "BOTTLE", label: "Bottle", unitPrice: 185 }],
  },
];

export const mockBatchPreviews: Record<string, PosBatchPreview> = {
  "mock-paracetamol-500": { batchNumber: "PAR500-0626", expiryDate: "2027-08-31", availableQty: 500, mrp: 12, status: "SELLABLE" },
  "mock-amoxicillin-250": { batchNumber: "AMX250-0526", expiryDate: "2026-11-30", availableQty: 25, mrp: 28, status: "LOW_STOCK" },
  "mock-cetirizine-10": { batchNumber: "CET10-0426", expiryDate: "2026-09-15", availableQty: 10, mrp: 8.5, status: "NEAR_EXPIRY" },
  "mock-saline-100": { batchNumber: "NS100-0726", expiryDate: "2027-01-20", availableQty: 44, mrp: 185, status: "SELLABLE" },
};
