"use server";

import { withPerformanceTrace } from "@/lib/performance";
import { requirePermission } from "@/modules/auth/permissions";
import { ForbiddenError, UnauthorizedError } from "@/modules/auth/permissions";
import {
  PrescriptionValidationError,
  type PrescriptionValidationInput,
} from "@/modules/prescriptions/prescription.types";
import {
  resolvePrescriptionRequirement,
  validatePrescriptionForSale,
} from "./prescription-rule.service";
import {
  getPosBatchPreview,
  lookupProductByBarcode,
  searchProductsForPos,
} from "./pos.service";

export async function searchProductsForPosAction(query: string) {
  return withPerformanceTrace({ route: "/pos/search", method: "ACTION" }, async () => {
    await requirePermission("pos.access", { onDenied: "throw" });
    return searchProductsForPos(query);
  });
}

export async function lookupProductByBarcodeAction(barcode: string) {
  return withPerformanceTrace({ route: "/pos/barcode", method: "ACTION" }, async () => {
    await requirePermission("pos.access", { onDenied: "throw" });
    return lookupProductByBarcode(barcode);
  });
}

export async function getPosBatchPreviewAction(productId: string, unitId: string, quantity: string) {
  return withPerformanceTrace({ route: "/pos/batch-preview", method: "ACTION" }, async () => {
    await requirePermission("pos.access", { onDenied: "throw" });
    return getPosBatchPreview(productId, unitId, quantity);
  });
}

/** Validates prescription requirements without creating a sale, payment, or stock movement. */
export async function validatePrescriptionForPreviewAction(input: PrescriptionValidationInput) {
  return withPerformanceTrace({ route: "/pos/prescription-preview", method: "ACTION" }, async () => {
    try {
      await requirePermission("pos.access", { onDenied: "throw" });
      const requirement = await resolvePrescriptionRequirement(input.lines);
      if (requirement.requiresControlledDetails) {
        await requirePermission("controlled_drug.sell", { onDenied: "throw" });
      }
      const validation = await validatePrescriptionForSale(input);
      return { ok: true as const, validation };
    } catch (error) {
      if (error instanceof PrescriptionValidationError) {
        return { ok: false as const, error: { code: error.code, message: error.message } };
      }
      if (error instanceof ForbiddenError) {
        return { ok: false as const, error: { code: "FORBIDDEN", message: "You do not have permission to validate a controlled medicine sale." } };
      }
      if (error instanceof UnauthorizedError) {
        return { ok: false as const, error: { code: "FORBIDDEN", message: "Your session is no longer valid." } };
      }
      return { ok: false as const, error: { code: "VALIDATION_ERROR", message: "Prescription validation is temporarily unavailable." } };
    }
  });
}
