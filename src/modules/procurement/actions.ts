"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type FormState, toFieldErrors } from "@/lib/forms";
import { requirePermission } from "@/modules/auth/permissions";
import { createSupplier } from "./supplier.service";
import { confirmGrn, createGrnDraft } from "./grn.service";

const createSupplierSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  contactPerson: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email("Invalid email").max(160).optional().or(z.literal("")),
  address: z.string().trim().max(400).optional(),
  creditTermDays: z.coerce.number().int().min(0).max(365).optional(),
});

export async function createSupplierAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePermission("supplier.manage", { onDenied: "throw" });

  const parsed = createSupplierSchema.safeParse({
    name: formData.get("name"),
    contactPerson: formData.get("contactPerson") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    creditTermDays: formData.get("creditTermDays") || undefined,
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      status: "error",
      message: flat.formErrors[0] ?? "Please correct the highlighted fields.",
      fieldErrors: toFieldErrors(flat.fieldErrors),
    };
  }

  try {
    const supplier = await createSupplier(
      { ...parsed.data, email: parsed.data.email || undefined },
      actor.id,
    );
    revalidatePath("/suppliers");
    return { status: "success", message: `Supplier "${supplier.name}" created.` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Failed to create supplier." };
  }
}

const grnLineSchema = z.object({
  productId: z.string().uuid(),
  unitId: z.string().uuid(),
  qtyInUnit: z.coerce.number().positive(),
  batchNo: z.string().trim().max(80).optional(),
  expiryDate: z.string().trim().optional(),
  mrp: z.coerce.number().nonnegative().optional(),
  costPrice: z.coerce.number().nonnegative(),
  sellingPrice: z.coerce.number().nonnegative(),
});

const createGrnSchema = z.object({
  supplierId: z.string().uuid("Select a supplier"),
  notes: z.string().trim().max(500).optional(),
  lines: z.array(grnLineSchema).min(1, "Add at least one line"),
});

export async function createGrnDraftAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePermission("grn.manage", { onDenied: "throw" });

  let lines: unknown = [];
  try {
    lines = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return { status: "error", message: "Invalid GRN line data." };
  }

  const parsed = createGrnSchema.safeParse({
    supplierId: formData.get("supplierId"),
    notes: formData.get("notes") || undefined,
    lines,
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      status: "error",
      message: flat.formErrors[0] ?? "Please correct the highlighted fields.",
      fieldErrors: toFieldErrors(flat.fieldErrors),
    };
  }

  let grnId: string;
  try {
    const grn = await createGrnDraft(parsed.data, actor.id);
    grnId = grn.id;
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Failed to save GRN." };
  }

  revalidatePath("/stock/grn");
  redirect(`/stock/grn/${grnId}`);
}

export async function confirmGrnAction(grnId: string): Promise<FormState> {
  const actor = await requirePermission("grn.manage", { onDenied: "throw" });
  try {
    await confirmGrn(grnId, actor.id);
    revalidatePath("/stock/grn");
    revalidatePath(`/stock/grn/${grnId}`);
    return { status: "success", message: "GRN confirmed. Stock and payable updated." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Failed to confirm GRN." };
  }
}
