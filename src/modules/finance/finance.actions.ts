"use server";

import { revalidatePath } from "next/cache";
import { ExpenseCategory, PaymentMethod } from "@prisma/client";
import { z } from "zod";
import { type FormState, toFieldErrors } from "@/lib/forms";
import { requirePermission } from "@/modules/auth/permissions";
import { createExpense, deleteExpense, updateExpense } from "./expense.service";
import { FinanceError } from "./expense.types";
import { recordSupplierPayment } from "./supplier-payment.service";

const expenseSchema = z.object({
  date: z.string().trim().min(1, "Expense date is required"),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().trim().max(255).optional(),
  amount: z
    .string()
    .trim()
    .min(1, "Expense amount is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Expense amount must be a valid money value."),
  paymentMethod: z.nativeEnum(PaymentMethod),
  reference: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});

const expenseUpdateSchema = expenseSchema.partial().extend({
  id: z.string().uuid(),
});

const supplierPaymentSchema = z.object({
  supplierInvoiceId: z.string().uuid("Select a supplier invoice"),
  amount: z
    .string()
    .trim()
    .min(1, "Payment amount is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Payment amount must be a valid money value."),
  paymentMethod: z.nativeEnum(PaymentMethod),
  reference: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
  paidAt: z.string().trim().optional(),
});

const expenseDeleteSchema = z.object({
  id: z.string().uuid(),
});

function financeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof FinanceError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function createExpenseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePermission("expense.create", { onDenied: "throw" });
  const parsed = expenseSchema.safeParse({
    date: formData.get("date"),
    category: formData.get("category"),
    description: formData.get("description") || undefined,
    amount: formData.get("amount"),
    paymentMethod: formData.get("paymentMethod"),
    reference: formData.get("reference") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return { status: "error", message: flat.formErrors[0] ?? "Please correct the highlighted fields.", fieldErrors: toFieldErrors(flat.fieldErrors) };
  }

  try {
    await createExpense({
      ...parsed.data,
    }, actor);
    revalidatePath("/expenses");
    revalidatePath("/reports");
    revalidatePath("/dashboard");
    return { status: "success", message: "Expense recorded successfully." };
  } catch (error) {
    return { status: "error", message: financeErrorMessage(error, "Failed to create expense.") };
  }
}

export async function updateExpenseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePermission("expense.update", { onDenied: "throw" });
  const parsed = expenseUpdateSchema.safeParse({
    id: formData.get("id"),
    date: formData.get("date") || undefined,
    category: formData.get("category") || undefined,
    description: formData.get("description") || undefined,
    amount: formData.get("amount") || undefined,
    paymentMethod: formData.get("paymentMethod") || undefined,
    reference: formData.get("reference") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return { status: "error", message: flat.formErrors[0] ?? "Please correct the highlighted fields.", fieldErrors: toFieldErrors(flat.fieldErrors) };
  }

  try {
    await updateExpense(parsed.data.id, {
      date: parsed.data.date,
      category: parsed.data.category,
      description: parsed.data.description,
      amount: parsed.data.amount,
      paymentMethod: parsed.data.paymentMethod,
      reference: parsed.data.reference,
      notes: parsed.data.notes,
    }, actor);
    revalidatePath("/expenses");
    revalidatePath("/reports");
    revalidatePath("/dashboard");
    return { status: "success", message: "Expense updated." };
  } catch (error) {
    return { status: "error", message: financeErrorMessage(error, "Failed to update expense.") };
  }
}

export async function deleteExpenseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePermission("expense.delete", { onDenied: "throw" });
  const parsed = expenseDeleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return { status: "error", message: flat.formErrors[0] ?? "Please select an expense to delete.", fieldErrors: toFieldErrors(flat.fieldErrors) };
  }

  try {
    await deleteExpense(parsed.data.id, actor);
    revalidatePath("/expenses");
    revalidatePath("/reports");
    revalidatePath("/dashboard");
    return { status: "success", message: "Expense deleted." };
  } catch (error) {
    return { status: "error", message: financeErrorMessage(error, "Failed to delete expense.") };
  }
}

export async function recordSupplierPaymentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePermission("supplier_payment.create", { onDenied: "throw" });
  const parsed = supplierPaymentSchema.safeParse({
    supplierInvoiceId: formData.get("supplierInvoiceId"),
    amount: formData.get("amount"),
    paymentMethod: formData.get("paymentMethod"),
    reference: formData.get("reference") || undefined,
    notes: formData.get("notes") || undefined,
    paidAt: formData.get("paidAt") || undefined,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return { status: "error", message: flat.formErrors[0] ?? "Please correct the highlighted fields.", fieldErrors: toFieldErrors(flat.fieldErrors) };
  }

  try {
    const payment = await recordSupplierPayment({
      supplierInvoiceId: parsed.data.supplierInvoiceId,
      amount: parsed.data.amount,
      paymentMethod: parsed.data.paymentMethod,
      reference: parsed.data.reference,
      notes: parsed.data.notes,
      paidAt: parsed.data.paidAt,
    }, actor);
    revalidatePath("/suppliers");
    revalidatePath("/suppliers/payments");
    revalidatePath("/reports");
    revalidatePath("/dashboard");
    return { status: "success", message: "Supplier payment recorded.", paymentId: payment.id };
  } catch (error) {
    return { status: "error", message: financeErrorMessage(error, "Failed to record supplier payment.") };
  }
}
