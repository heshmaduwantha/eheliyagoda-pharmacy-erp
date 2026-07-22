"use server";
import { requirePermission } from "@/modules/auth/permissions";
import { removeExpiredBatch } from "./inventory.service";
import { revalidatePath } from "next/cache";

export async function removeExpiredBatchAction(batchId: string) {
  const user = await requirePermission("inventory.stock.writeoff");
  await removeExpiredBatch(batchId, user.id);
  revalidatePath("/stock/batches");
  revalidatePath("/dashboard");
}
