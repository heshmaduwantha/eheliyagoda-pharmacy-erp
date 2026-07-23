"use server";

import { revalidatePath } from "next/cache";
import { PrescriptionRule, ProductType } from "@prisma/client";
import { z } from "zod";
import { type FormState, toFieldErrors } from "@/lib/forms";
import { requirePermission } from "@/modules/auth/permissions";
import { createProduct } from "./catalog.service";
import { UNIT_OPTIONS } from "./unit-options";

const unitSchema = z.object({
  unitName: z.enum(UNIT_OPTIONS),
  factorToBase: z.coerce.number().positive(),
  isPurchaseDefault: z.boolean().optional(),
  isSaleDefault: z.boolean().optional(),
  barcode: z.string().trim().max(120).optional(),
});

const createProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  genericName: z.string().trim().max(200).optional(),
  strength: z.string().trim().max(80).optional(),
  form: z.string().trim().max(80).optional(),
  productType: z.nativeEnum(ProductType),
  category: z.string().trim().max(120).optional(),
  baseUnitName: z.string().trim().min(1, "Base unit is required").max(60),
  prescriptionRule: z.nativeEnum(PrescriptionRule),
  isControlled: z.coerce.boolean(),
  defaultSellingPrice: z.coerce.number().nonnegative().optional(),
  reorderLevel: z.coerce.number().nonnegative().optional(),
  units: z.array(unitSchema).min(1, "Select at least one sold-in unit"),
}).superRefine((input, context) => {
  const names = new Set<string>();
  input.units.forEach((unit, index) => {
    if (names.has(unit.unitName)) {
      context.addIssue({ code: "custom", path: ["units", index, "unitName"], message: "Duplicate units are not allowed" });
    }
    names.add(unit.unitName);
  });
});

export async function createProductAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePermission("product.manage", { onDenied: "throw" });

  let units: unknown[] = [];
  try {
    units = JSON.parse(String(formData.get("units") ?? "[]"));
  } catch {
    return { status: "error", message: "Invalid unit configuration." };
  }

  const baseUnitName = formData.get("baseUnitName")?.toString().trim() || "";
  
  const parsed = createProductSchema.safeParse({
    name: formData.get("name"),
    genericName: formData.get("genericName") || undefined,
    strength: formData.get("strength") || undefined,
    form: formData.get("form") || undefined,
    productType: formData.get("productType"),
    category: formData.get("category") || undefined,
    baseUnitName,
    prescriptionRule: (formData.get("isControlled") === "on" || formData.get("isControlled") === "true") 
      ? "HARD_REQUIRED_CONTROLLED" 
      : formData.get("prescriptionRule"),
    isControlled: formData.get("isControlled") === "on" || formData.get("isControlled") === "true",
    defaultSellingPrice: formData.get("defaultSellingPrice") || undefined,
    reorderLevel: formData.get("reorderLevel") || undefined,
    units,
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      status: "error",
      message: "Please check the form for errors.",
      fieldErrors: toFieldErrors(flat.fieldErrors),
    };
  }

  try {
    const product = await createProduct(parsed.data, actor.id);
    revalidatePath("/products");
    return { status: "success", message: `Product "${product.name}" created.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product.";
    const friendly = message.includes("Unique constraint")
      ? "A barcode you entered is already used by another product."
      : message;
    return { status: "error", message: friendly };
  }
}
