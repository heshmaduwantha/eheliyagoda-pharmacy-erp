-- Product.defaultSellingPrice remains temporarily for backwards-compatible reads
-- of historical data only. New pricing is owned by the inventory batch.
ALTER TABLE "Batch"
  ADD COLUMN "priceUnitId" UUID,
  ADD COLUMN "priceSetById" UUID,
  ADD COLUMN "priceSetAt" TIMESTAMPTZ(6);

ALTER TABLE "SaleLine"
  ADD COLUMN "unitFactorToBaseAtSale" DECIMAL(14,3) NOT NULL DEFAULT 1;

CREATE TABLE "InventorySetting" (
  "id" INTEGER NOT NULL,
  "expiryAlertMonths" INTEGER NOT NULL DEFAULT 6,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventorySetting_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "inventory_setting_expiry_alert_months_positive" CHECK ("expiryAlertMonths" > 0)
);

INSERT INTO "InventorySetting" ("id", "expiryAlertMonths") VALUES (1, 6)
ON CONFLICT ("id") DO NOTHING;

-- A confirmed GRN already records the price unit. Legacy direct batches are
-- assigned the product sale-default unit, then the smallest configured unit.
UPDATE "Batch" b
SET "priceUnitId" = gl."unitId",
    "priceSetAt" = COALESCE(b."priceSetAt", b."createdAt")
FROM "GrnLine" gl
WHERE gl.id = b."grnLineId";

UPDATE "Batch" b
SET "priceUnitId" = (
      SELECT pu.id
      FROM "ProductUnit" pu
      WHERE pu."productId" = b."productId"
      ORDER BY pu."isSaleDefault" DESC, pu."factorToBase" ASC, pu."createdAt" ASC
      LIMIT 1
    ),
    "priceSetAt" = COALESCE(b."priceSetAt", b."createdAt")
WHERE b."priceUnitId" IS NULL;

UPDATE "SaleLine"
SET "unitFactorToBaseAtSale" = CASE
  WHEN qty <> 0 THEN "qtyBase" / qty
  ELSE 1
END
WHERE "unitFactorToBaseAtSale" = 1;

ALTER TABLE "Batch"
  ADD CONSTRAINT "Batch_priceUnitId_fkey"
  FOREIGN KEY ("priceUnitId") REFERENCES "ProductUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Batch_priceSetById_fkey"
  FOREIGN KEY ("priceSetById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Batch_priceUnitId_idx" ON "Batch"("priceUnitId");
