-- Confirmed batches hold monetary values per base unit. This migration protects
-- future catalog writes from zero or negative conversion factors.
ALTER TABLE "ProductUnit"
  ADD CONSTRAINT "product_unit_factor_to_base_positive"
  CHECK ("factorToBase" > 0);

-- Preserve the invoice that received an approved supplier-return credit.
ALTER TABLE "SupplierReturn"
  ADD COLUMN "settledInvoiceId" UUID;

ALTER TABLE "SupplierReturn"
  ADD CONSTRAINT "SupplierReturn_settledInvoiceId_fkey"
  FOREIGN KEY ("settledInvoiceId") REFERENCES "SupplierInvoice"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "SupplierReturn_settledInvoiceId_idx"
  ON "SupplierReturn"("settledInvoiceId");
