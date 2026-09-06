"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { type FormState, toFieldErrors } from "@/lib/forms";
import { requirePermission } from "@/modules/auth/permissions";
import { invalidatePosInitialCatalogCache } from "@/modules/sales/pos.service";
import { invalidateAlertCountsCache } from "@/modules/dashboard/dashboard.service";
import { productSettingsSchema, updateProductSettings } from "./product-settings.service";

export async function updateProductSettingsAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePermission("product.manage", { onDenied: "throw" });
  const parsed = productSettingsSchema.safeParse({
    productId: formData.get("productId"), primaryBarcode: formData.get("primaryBarcode"),
    reorderLevel: formData.get("reorderLevel"), isControlled: formData.get("isControlled") === "on",
    prescriptionRule: formData.get("prescriptionRule"),
  });
  if (!parsed.success) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors) };
  try {
    await updateProductSettings(parsed.data, actor.id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) return { status: "error", message: error.code === "P2002" ? "This barcode is already assigned to a product or package unit." : "Could not save product settings. Please try again." };
    return { status: "error", message: error instanceof Error ? error.message : "Could not save product settings." };
  }
  invalidatePosInitialCatalogCache();
  invalidateAlertCountsCache();
  for (const tag of ["pos-catalog", "dashboard", "alerts"]) revalidateTag(tag);
  revalidatePath("/", "layout");
  return { status: "success", message: "Product settings saved. Refresh any already-open POS screen to load the updated settings." };
}
