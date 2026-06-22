import "server-only";

import { PrescriptionRule } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  PrescriptionRequirement,
  PrescriptionValidationInput,
  PrescriptionValidationResult,
} from "@/modules/prescriptions/prescription.types";
import { PrescriptionValidationError } from "@/modules/prescriptions/prescription.types";
import { validatePrescriptionDecision } from "@/modules/prescriptions/prescription.rules";

type ProductReader = Pick<typeof prisma, "product">;

/** Resolves the strongest per-product prescription requirement for a sale request. */
export async function resolvePrescriptionRequirement(
  lines: PrescriptionValidationInput["lines"],
  client: ProductReader = prisma,
): Promise<PrescriptionRequirement> {
  const productIds = [...new Set(lines.map((line) => line.productId).filter(Boolean))];
  if (productIds.length === 0) {
    return {
      rule: PrescriptionRule.NONE,
      promptedProductIds: [],
      controlledProductIds: [],
      requiresPrescriptionDecision: false,
      requiresControlledDetails: false,
    };
  }

  const products = await client.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, prescriptionRule: true },
  });
  if (products.length !== productIds.length) {
    throw new PrescriptionValidationError("VALIDATION_ERROR", "One or more selected products are unavailable.");
  }

  const promptedProductIds = products
    .filter((product) => product.prescriptionRule === PrescriptionRule.PROMPT_SKIPPABLE)
    .map((product) => product.id);
  const controlledProductIds = products
    .filter((product) => product.prescriptionRule === PrescriptionRule.HARD_REQUIRED_CONTROLLED)
    .map((product) => product.id);
  const rule = controlledProductIds.length > 0
    ? PrescriptionRule.HARD_REQUIRED_CONTROLLED
    : promptedProductIds.length > 0
      ? PrescriptionRule.PROMPT_SKIPPABLE
      : PrescriptionRule.NONE;

  return {
    rule,
    promptedProductIds,
    controlledProductIds,
    requiresPrescriptionDecision: rule === PrescriptionRule.PROMPT_SKIPPABLE,
    requiresControlledDetails: rule === PrescriptionRule.HARD_REQUIRED_CONTROLLED,
  };
}

/**
 * Server-side validation boundary for current POS previews and future sale completion.
 * A future sale service must invoke this inside its PostgreSQL transaction before any
 * stock allocation, payment persistence, or receipt creation.
 */
export async function validatePrescriptionForSale(
  input: PrescriptionValidationInput,
  client: ProductReader = prisma,
): Promise<PrescriptionValidationResult> {
  const requirement = await resolvePrescriptionRequirement(input.lines, client);
  const outcome = validatePrescriptionDecision(requirement, input.prescription);
  return { requirement, ...outcome };
}
