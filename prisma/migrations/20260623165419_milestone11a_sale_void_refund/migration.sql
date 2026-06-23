-- CreateEnum
CREATE TYPE "SaleVoidStockPolicy" AS ENUM ('NO_STOCK_RETURN', 'RETURN_TO_ACTIVE');

-- CreateTable
CREATE TABLE "SaleVoid" (
    "id" UUID NOT NULL,
    "saleId" UUID NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "refundAmount" DECIMAL(12,2) NOT NULL,
    "refundMethod" "PaymentMethod",
    "refundReference" VARCHAR(120),
    "stockPolicy" "SaleVoidStockPolicy" NOT NULL DEFAULT 'NO_STOCK_RETURN',
    "voidedById" UUID NOT NULL,
    "voidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleVoid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SaleVoid_saleId_key" ON "SaleVoid"("saleId");

-- CreateIndex
CREATE INDEX "SaleVoid_voidedAt_idx" ON "SaleVoid"("voidedAt");

-- CreateIndex
CREATE INDEX "SaleVoid_voidedById_idx" ON "SaleVoid"("voidedById");

-- AddForeignKey
ALTER TABLE "SaleVoid" ADD CONSTRAINT "SaleVoid_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleVoid" ADD CONSTRAINT "SaleVoid_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
