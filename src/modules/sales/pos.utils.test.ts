import assert from "node:assert/strict";
import test from "node:test";
import type { PosCartLine, PosBatchPreview } from "./pos.types";
import {
  applyCartLineBatchPreview,
  canCartLineFulfilSelectedBatch,
  updateCartLineBatch,
  updateCartLineQuantity,
} from "./pos.utils";

const preview: PosBatchPreview = {
  productId: "product-1",
  unitName: "STRIP",
  requestedQtyBase: "20.000",
  totalAvailableQtyBase: "450.000",
  canFulfil: true,
  generatedAt: "2026-09-06T00:00:00.000Z",
  candidates: [
    {
      id: "batch-a1",
      batchNumber: "QA-PARA-A1",
      expiryDate: "2027-03-31",
      status: "ACTIVE",
      availableQtyBase: "150.000",
      mrp: "11.00",
      costPrice: "9.00",
      sellingPrice: "10.00",
      fefoRank: 1,
    },
    {
      id: "batch-a2",
      batchNumber: "QA-PARA-A2",
      expiryDate: "2027-08-31",
      status: "ACTIVE",
      availableQtyBase: "300.000",
      mrp: "13.00",
      costPrice: "10.00",
      sellingPrice: "12.00",
      fefoRank: 2,
    },
  ],
};

const line: PosCartLine = {
  id: "product-1-strip",
  productId: "product-1",
  productName: "QA POS Paracetamol 500 mg Tablet",
  prescriptionRule: "NONE",
  primaryBarcode: null,
  quantity: 2,
  unitId: "strip",
  unitLabel: "STRIP",
  unitPrice: 10,
  lineTotal: 20,
  availableUnits: [],
  batchPreview: preview,
};

test("selected batch changes cart price and refreshed previews keep the selected batch price", () => {
  const selectedA2 = updateCartLineBatch(line, "batch-a2");

  assert.equal(selectedA2.unitPrice, 12);
  assert.equal(selectedA2.lineTotal, 24);

  const refreshed = applyCartLineBatchPreview(selectedA2, {
    ...preview,
    requestedQtyBase: "50.000",
    candidates: preview.candidates.map((candidate) =>
      candidate.id === "batch-a2" ? { ...candidate, sellingPrice: "12.50" } : candidate,
    ),
  });

  assert.equal(refreshed.selectedBatchId, "batch-a2");
  assert.equal(refreshed.unitPrice, 12.5);
  assert.equal(refreshed.lineTotal, 25);
});

test("quantity changes preserve selected batch pricing and selected-batch stock validation", () => {
  const selectedA2 = updateCartLineBatch(line, "batch-a2");
  const increased = updateCartLineQuantity(selectedA2, 16);
  const refreshed = applyCartLineBatchPreview(increased, {
    ...preview,
    requestedQtyBase: "160.000",
  });

  assert.equal(refreshed.unitPrice, 12);
  assert.equal(refreshed.lineTotal, 192);
  assert.equal(canCartLineFulfilSelectedBatch(refreshed), true);

  const selectedA1 = updateCartLineBatch(refreshed, "batch-a1");
  assert.equal(canCartLineFulfilSelectedBatch(selectedA1), false);
}
);
