-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('MEDICINE', 'GENERAL_ITEM');

-- CreateEnum
CREATE TYPE "PrescriptionRule" AS ENUM ('NONE', 'PROMPT_SKIPPABLE', 'HARD_REQUIRED_CONTROLLED');

-- CreateEnum
CREATE TYPE "GrnStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupplierInvoiceStatus" AS ENUM ('OPEN', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('ACTIVE', 'QUARANTINED', 'DEPLETED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('GRN_IN', 'SALE_OUT', 'RETURN_IN', 'WRITE_OFF', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "genericName" VARCHAR(200),
    "strength" VARCHAR(80),
    "form" VARCHAR(80),
    "productType" "ProductType" NOT NULL,
    "category" VARCHAR(120),
    "baseUnitName" VARCHAR(60) NOT NULL,
    "prescriptionRule" "PrescriptionRule" NOT NULL DEFAULT 'NONE',
    "isControlled" BOOLEAN NOT NULL DEFAULT false,
    "isSpecialDrug" BOOLEAN NOT NULL DEFAULT false,
    "reorderLevel" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "reorderQty" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "defaultSellingPrice" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductUnit" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "unitName" VARCHAR(60) NOT NULL,
    "factorToBase" DECIMAL(14,3) NOT NULL,
    "isPurchaseDefault" BOOLEAN NOT NULL DEFAULT false,
    "isSaleDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductBarcode" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "unitId" UUID,
    "barcode" VARCHAR(120) NOT NULL,
    "barcodeType" VARCHAR(40) NOT NULL DEFAULT 'MANUFACTURER',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductBarcode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "contactPerson" VARCHAR(160),
    "phone" VARCHAR(40),
    "email" VARCHAR(160),
    "address" VARCHAR(400),
    "creditTermDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grn" (
    "id" UUID NOT NULL,
    "grnNo" VARCHAR(60) NOT NULL,
    "supplierId" UUID NOT NULL,
    "supplierInvoiceNo" VARCHAR(80),
    "invoiceTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "GrnStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" VARCHAR(500),
    "receivedById" UUID,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrnLine" (
    "id" UUID NOT NULL,
    "grnId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "qtyInUnit" DECIMAL(14,3) NOT NULL,
    "qtyBase" DECIMAL(14,3) NOT NULL,
    "batchNo" VARCHAR(80),
    "expiryDate" DATE,
    "mrp" DECIMAL(12,2),
    "costPrice" DECIMAL(12,2) NOT NULL,
    "sellingPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrnLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierInvoice" (
    "id" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "grnId" UUID,
    "invoiceNo" VARCHAR(80),
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "SupplierInvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "grnLineId" UUID,
    "batchNo" VARCHAR(80),
    "expiryDate" DATE,
    "mrp" DECIMAL(12,2),
    "costPrice" DECIMAL(12,2) NOT NULL,
    "sellingPrice" DECIMAL(12,2) NOT NULL,
    "qtyOnHandBase" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "status" "BatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "movementType" "StockMovementType" NOT NULL,
    "qtyBase" DECIMAL(14,3) NOT NULL,
    "refType" VARCHAR(40) NOT NULL,
    "refId" VARCHAR(60) NOT NULL,
    "note" VARCHAR(400),
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_productType_isActive_idx" ON "Product"("productType", "isActive");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "ProductUnit_productId_idx" ON "ProductUnit"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductUnit_productId_unitName_key" ON "ProductUnit"("productId", "unitName");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBarcode_barcode_key" ON "ProductBarcode"("barcode");

-- CreateIndex
CREATE INDEX "ProductBarcode_productId_idx" ON "ProductBarcode"("productId");

-- CreateIndex
CREATE INDEX "Supplier_isActive_idx" ON "Supplier"("isActive");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Grn_grnNo_key" ON "Grn"("grnNo");

-- CreateIndex
CREATE INDEX "Grn_supplierId_createdAt_idx" ON "Grn"("supplierId", "createdAt");

-- CreateIndex
CREATE INDEX "Grn_status_idx" ON "Grn"("status");

-- CreateIndex
CREATE INDEX "GrnLine_grnId_idx" ON "GrnLine"("grnId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInvoice_grnId_key" ON "SupplierInvoice"("grnId");

-- CreateIndex
CREATE INDEX "SupplierInvoice_supplierId_status_idx" ON "SupplierInvoice"("supplierId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_grnLineId_key" ON "Batch"("grnLineId");

-- CreateIndex
CREATE INDEX "Batch_productId_status_expiryDate_idx" ON "Batch"("productId", "status", "expiryDate");

-- CreateIndex
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "StockMovement"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_batchId_idx" ON "StockMovement"("batchId");

-- AddForeignKey
ALTER TABLE "ProductUnit" ADD CONSTRAINT "ProductUnit_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBarcode" ADD CONSTRAINT "ProductBarcode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductBarcode" ADD CONSTRAINT "ProductBarcode_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "ProductUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grn" ADD CONSTRAINT "Grn_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrnLine" ADD CONSTRAINT "GrnLine_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "Grn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrnLine" ADD CONSTRAINT "GrnLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrnLine" ADD CONSTRAINT "GrnLine_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "ProductUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "Grn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_grnLineId_fkey" FOREIGN KEY ("grnLineId") REFERENCES "GrnLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
