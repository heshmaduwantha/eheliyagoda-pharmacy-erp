-- Foreign-key indexes confirmed missing by the performance audit.
CREATE INDEX "ProductBarcode_unitId_idx" ON "ProductBarcode"("unitId");
CREATE INDEX "GrnLine_productId_idx" ON "GrnLine"("productId");
CREATE INDEX "GrnLine_unitId_idx" ON "GrnLine"("unitId");
CREATE INDEX "SaleLine_unitId_idx" ON "SaleLine"("unitId");
CREATE INDEX "SupplierPayment_createdById_idx" ON "SupplierPayment"("createdById");
