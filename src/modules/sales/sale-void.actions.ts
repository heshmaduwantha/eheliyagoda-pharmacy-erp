"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ForbiddenError, UnauthorizedError, requirePermission } from "@/modules/auth/permissions";
import { SaleVoidError } from "./sale-void.types";
import { voidSale } from "./sale-void.service";

const voidSaleSchema = z.object({
  saleId: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
  refundAmount: z.string().trim().min(1).optional(),
  refundMethod: z.enum(["CASH", "CARD"]).optional(),
  refundReference: z.string().trim().max(120).optional(),
  stockPolicy: z.enum(["NO_STOCK_RETURN", "RETURN_TO_ACTIVE"]).optional(),
});

export async function voidSaleAction(rawInput: unknown) {
  try {
    const actor = await requirePermission("sale.void", { onDenied: "throw" });
    const input = voidSaleSchema.parse(rawInput);
    const saleVoid = await voidSale(input, actor);
    revalidatePath("/sales");
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    revalidatePath("/stock");
    revalidatePath("/stock/batches");
    revalidatePath("/stock/movements");
    revalidatePath("/stock/expiry");
    revalidatePath("/admin/audit");
    revalidatePath("/pos");
    return { ok: true as const, saleVoid };
  } catch (error) {
    if (error instanceof SaleVoidError) {
      return { ok: false as const, error: { code: error.code, message: error.message, details: error.details ?? null } };
    }
    if (error instanceof ForbiddenError) {
      return { ok: false as const, error: { code: "FORBIDDEN", message: "You do not have permission to void sales.", details: null } };
    }
    if (error instanceof UnauthorizedError) {
      return { ok: false as const, error: { code: "UNAUTHORIZED", message: "Your session is no longer valid.", details: null } };
    }
    if (error instanceof z.ZodError) {
      return {
        ok: false as const,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues[0]?.message ?? "Void input is invalid.",
          details: error.flatten(),
        },
      };
    }
    return { ok: false as const, error: { code: "INTERNAL_ERROR", message: "Sale void failed.", details: null } };
  }
}
