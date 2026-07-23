"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withPerformanceTrace } from "@/lib/performance";
import { ForbiddenError, UnauthorizedError, requirePermission } from "@/modules/auth/permissions";
import { PrescriptionValidationError } from "@/modules/prescriptions/prescription.types";
import { completeSale } from "./sale.service";
import { SaleCompletionError } from "./sale.types";

const decimalLike = z.union([z.string(), z.number()]).transform((value) => String(value));

const saleLineSchema = z.object({
  clientLineId: z.string().min(1),
  productId: z.string().uuid(),
  unitId: z.string().uuid(),
  quantity: decimalLike,
  quotedUnitPrice: decimalLike,
  barcodeUsed: z.string().trim().max(120).optional(),
});

const paymentSchema = z.object({
  method: z.enum(["CASH", "CARD"]),
  amount: decimalLike,
  cardReference: z.string().trim().max(120).optional(),
});

const prescriptionPatientSchema = z.object({
  name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  nic: z.string().trim().optional(),
  patientReference: z.string().trim().optional(),
  age: z.coerce.number().int().positive().optional(),
});

const prescriptionPrescriberSchema = z.object({
  name: z.string().trim().optional(),
  reference: z.string().trim().optional(),
});

const prescriptionSchema = z.object({
  mode: z.enum(["CAPTURED", "SKIPPED"]).optional(),
  skipReason: z.string().trim().max(500).optional(),
  imageKey: z.string().trim().max(2048).optional(),
  patient: prescriptionPatientSchema.optional(),
  prescriber: prescriptionPrescriberSchema.optional(),
}).optional();

const completeSaleSchema = z.object({
  clientRequestId: z.string().uuid(),
  requestedStatus: z.enum(["HELD", "COMPLETED"]),
  lines: z.array(saleLineSchema).min(1),
  payments: z.array(paymentSchema).min(1),
  expectedTotal: decimalLike,
  discountAmount: decimalLike.optional(),
  taxAmount: decimalLike.optional(),
  patient: prescriptionPatientSchema.optional(),
  prescriber: prescriptionPrescriberSchema.optional(),
  prescription: prescriptionSchema,
  notes: z.string().trim().max(500).optional(),
});

export async function completeSaleAction(rawInput: unknown) {
  return withPerformanceTrace({ route: "/pos/complete", method: "ACTION" }, async () => {
    try {
      const actor = await requirePermission("sale.create", { onDenied: "throw" });
      const input = completeSaleSchema.parse(rawInput);
      const sale = await completeSale(input, actor);
      revalidatePath("/sales");
      revalidatePath("/dashboard");
      revalidatePath("/reports");
      revalidatePath("/stock");
      revalidatePath("/stock/batches");
      revalidatePath("/stock/movements");
      revalidatePath("/stock/expiry");
      revalidatePath("/admin/audit");
      return { ok: true as const, sale };
    } catch (error) {
      console.error("[completeSaleAction] error", error);
      if (error instanceof SaleCompletionError) {
        return { ok: false as const, error: { code: error.code, message: error.message, details: error.details ?? null } };
      }
      if (error instanceof PrescriptionValidationError) {
        return { ok: false as const, error: { code: error.code, message: error.message, details: null } };
      }
      if (error instanceof ForbiddenError) {
        return { ok: false as const, error: { code: "FORBIDDEN", message: "You do not have permission to complete sales.", details: null } };
      }
      if (error instanceof UnauthorizedError) {
        return { ok: false as const, error: { code: "UNAUTHORIZED", message: "Your session is no longer valid.", details: null } };
      }
      if (error instanceof z.ZodError) {
        return {
          ok: false as const,
          error: {
            code: "VALIDATION_ERROR",
            message: error.issues[0]?.message ?? "Sale input is invalid.",
            details: error.flatten(),
          },
        };
      }
      return { ok: false as const, error: { code: "INTERNAL_ERROR", message: "Sale completion failed.", details: null } };
    }
  });
}
