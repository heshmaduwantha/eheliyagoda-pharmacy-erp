import { mockBatchPreviews, mockPosProducts } from "./pos.mock";
import type { PosBatchPreview, PosProductSearchResult } from "./pos.types";

// TODO(catalog): Replace with the Catalog service boundary when its API is available.
export function searchPosProducts(query: string): PosProductSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return mockPosProducts;
  return mockPosProducts.filter((product) =>
    [product.name, product.genericName, product.sku, product.barcode]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(normalized)),
  );
}

// TODO(catalog): Replace with an exact barcode lookup from the Catalog service.
export function findMockProductByBarcode(barcode: string) {
  return mockPosProducts.find((product) => product.barcode === barcode.trim()) ?? null;
}

// TODO(inventory): Replace with a read-only FEFO preview supplied by Inventory.
// This function never allocates, reserves, or deducts stock.
export function getMockBatchPreview(productId: string): PosBatchPreview | undefined {
  return mockBatchPreviews[productId];
}
