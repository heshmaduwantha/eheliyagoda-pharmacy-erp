-- Enforce the "no negative stock" rule at the database level. Prisma cannot
-- express CHECK constraints in schema.prisma, so they are added here.
ALTER TABLE "Batch"
  ADD CONSTRAINT "batch_qty_on_hand_nonnegative" CHECK ("qtyOnHandBase" >= 0),
  ADD CONSTRAINT "batch_cost_price_nonnegative" CHECK ("costPrice" >= 0),
  ADD CONSTRAINT "batch_selling_price_nonnegative" CHECK ("sellingPrice" >= 0);
