-- CreateTable
CREATE TABLE "Patient" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(40),
    "nic" VARCHAR(80),
    "patientReference" VARCHAR(120),
    "age" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" UUID NOT NULL,
    "saleId" UUID NOT NULL,
    "patientId" UUID,
    "prescriberName" VARCHAR(200),
    "prescriberRef" VARCHAR(120),
    "imageKey" VARCHAR(2048),
    "skipReason" VARCHAR(500),
    "capturedById" UUID,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionSaleLine" (
    "id" UUID NOT NULL,
    "prescriptionId" UUID NOT NULL,
    "saleLineId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "qtyBase" DECIMAL(14,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescriptionSaleLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Patient_phone_idx" ON "Patient"("phone");

-- CreateIndex
CREATE INDEX "Patient_nic_idx" ON "Patient"("nic");

-- CreateIndex
CREATE INDEX "Patient_patientReference_idx" ON "Patient"("patientReference");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_saleId_key" ON "Prescription"("saleId");

-- CreateIndex
CREATE INDEX "Prescription_patientId_idx" ON "Prescription"("patientId");

-- CreateIndex
CREATE INDEX "Prescription_capturedById_idx" ON "Prescription"("capturedById");

-- CreateIndex
CREATE INDEX "PrescriptionSaleLine_productId_idx" ON "PrescriptionSaleLine"("productId");

-- CreateIndex
CREATE INDEX "PrescriptionSaleLine_batchId_idx" ON "PrescriptionSaleLine"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionSaleLine_prescriptionId_saleLineId_key" ON "PrescriptionSaleLine"("prescriptionId", "saleLineId");

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_capturedById_fkey" FOREIGN KEY ("capturedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionSaleLine" ADD CONSTRAINT "PrescriptionSaleLine_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionSaleLine" ADD CONSTRAINT "PrescriptionSaleLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionSaleLine" ADD CONSTRAINT "PrescriptionSaleLine_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
