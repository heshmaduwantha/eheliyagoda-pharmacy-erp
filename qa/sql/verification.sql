-- Read-only reconciliation checks. Run only against the isolated QA database.
-- psql "$QA_DATABASE_URL" -v product_id="<uuid>" -f qa/sql/verification.sql

SELECT current_database() AS database_under_test, current_user AS database_user;

-- Cached batch quantity must never be negative.
SELECT id, "productId", "batchNo", "qtyOnHandBase", status
FROM "Batch"
WHERE "qtyOnHandBase" < 0;

-- For a product whose complete history begins in this database, movement sum
-- must equal the cached quantity across all batches.
SELECT
  p.id,
  p.name,
  COALESCE((SELECT SUM(b."qtyOnHandBase") FROM "Batch" b WHERE b."productId" = p.id), 0) AS cached_qty,
  COALESCE((SELECT SUM(m."qtyBase") FROM "StockMovement" m WHERE m."productId" = p.id), 0) AS ledger_qty,
  COALESCE((SELECT SUM(b."qtyOnHandBase") FROM "Batch" b WHERE b."productId" = p.id), 0)
    - COALESCE((SELECT SUM(m."qtyBase") FROM "StockMovement" m WHERE m."productId" = p.id), 0) AS variance
FROM "Product" p
WHERE p.id = :'product_id'::uuid;

-- Supplier invoice invariants.
SELECT id, "supplierId", "invoiceNo", "totalAmount", "paidAmount", status
FROM "SupplierInvoice"
WHERE "paidAmount" < 0 OR "totalAmount" < 0 OR "paidAmount" > "totalAmount";

-- Sales header versus payment totals.
SELECT s.id, s."saleNumber", s.status, s.total,
       COALESCE(SUM(p.amount), 0) AS payments,
       s.total - COALESCE(SUM(p.amount), 0) AS variance
FROM "Sale" s
LEFT JOIN "SalePayment" p ON p."saleId" = s.id
GROUP BY s.id
HAVING s.status = 'COMPLETED' AND s.total <> COALESCE(SUM(p.amount), 0);

-- Sales header versus line gross totals and allocated discounts.
SELECT s.id, s."saleNumber", s.subtotal, s."discountAmount", s."taxAmount", s.total,
       COALESCE(SUM(l."lineTotal"), 0) AS line_subtotal,
       COALESCE(SUM(l."discountAmount"), 0) AS allocated_discount
FROM "Sale" s
LEFT JOIN "SaleLine" l ON l."saleId" = s.id
GROUP BY s.id
HAVING s.subtotal <> COALESCE(SUM(l."lineTotal"), 0)
    OR s.total <> s.subtotal - s."discountAmount" + s."taxAmount";

-- Orphan ledger/reference checks.
SELECT m.* FROM "StockMovement" m
LEFT JOIN "Batch" b ON b.id = m."batchId"
LEFT JOIN "Product" p ON p.id = m."productId"
WHERE b.id IS NULL OR p.id IS NULL;
