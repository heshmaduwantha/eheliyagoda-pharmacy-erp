"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/modules/auth/permissions";
import { createSupplierReturn, depriveExpiredBatches, processSupplierReturnSettlement, removeExpiredBatch } from "./inventory.service";

export async function removeExpiredBatchAction(batchId: string) {
  const user = await requirePermission("inventory.stock.writeoff");
  await removeExpiredBatch(batchId, user.id);
  revalidatePath("/stock/batches");
  revalidatePath("/stock/expiry");
  revalidatePath("/dashboard");
}

export async function depriveExpiredBatchesAction() {
  const user = await requirePermission("inventory.stock.writeoff");
  const result = await depriveExpiredBatches(user.id);
  revalidatePath("/stock/batches");
  revalidatePath("/stock/expiry");
  revalidatePath("/dashboard");
  return result;
}

const supplierReturnSchema = z.object({
  batchId: z.string().uuid("Invalid batch ID"),
  supplierId: z.string().uuid().optional().or(z.literal("")),
  qtyBase: z.coerce.number().positive("Quantity must be greater than 0"),
  reason: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function createSupplierReturnAction(input: {
  batchId: string;
  supplierId?: string;
  qtyBase: number;
  reason?: string;
  notes?: string;
}) {
  const user = await requirePermission("inventory.stock.writeoff");
  const parsed = supplierReturnSchema.parse(input);
  
  const supplierReturn = await createSupplierReturn(
    {
      ...parsed,
      supplierId: parsed.supplierId || undefined,
    },
    user.id,
  );

  revalidatePath("/stock/expiry");
  revalidatePath("/stock/batches");
  revalidatePath("/suppliers/returns");
  revalidatePath("/dashboard");

  return { ok: true, returnNumber: supplierReturn.returnNumber };
}

const processSettlementSchema = z.object({
  returnId: z.string().uuid(),
  action: z.enum(["REFUND_RECEIVED", "DEDUCT_INVOICE"]),
  invoiceId: z.string().uuid().optional().or(z.literal("")),
  paymentMethod: z.enum(["CASH", "CARD"]).optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function processSupplierReturnSettlementAction(input: {
  returnId: string;
  action: "REFUND_RECEIVED" | "DEDUCT_INVOICE";
  invoiceId?: string;
  paymentMethod?: "CASH" | "CARD";
  notes?: string;
}) {
  const user = await requirePermission("supplier.manage");
  const parsed = processSettlementSchema.parse(input);

  await processSupplierReturnSettlement(
    {
      ...parsed,
      invoiceId: parsed.invoiceId || undefined,
    },
    user.id,
  );

  revalidatePath("/suppliers/returns");
  revalidatePath("/suppliers");
  revalidatePath("/reports");
  revalidatePath("/dashboard");

  return { ok: true };
}
