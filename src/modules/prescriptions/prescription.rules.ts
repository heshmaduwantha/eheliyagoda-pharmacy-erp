import type {
  PrescriptionAuditAction,
  PrescriptionDecisionInput,
  PrescriptionRequirement,
} from "./prescription.types";
import { PrescriptionValidationError } from "./prescription.types";

function normalize(value?: string) {
  return value?.trim() || undefined;
}

/** Pure rule validator shared by the database lookup service and future sale transaction. */
export function validatePrescriptionDecision(
  requirement: PrescriptionRequirement,
  decision?: PrescriptionDecisionInput,
) {
  const auditActions: PrescriptionAuditAction[] = [];

  if (requirement.rule === "NONE") {
    return { shouldPersist: false, auditActions };
  }

  if (requirement.rule === "PROMPT_SKIPPABLE") {
    if (!decision?.mode) {
      throw new PrescriptionValidationError("SALE_PRESCRIPTION_REQUIRED", "Choose to record or skip the prescription before continuing.");
    }
    if (decision.mode === "SKIPPED" && !normalize(decision.skipReason)) {
      throw new PrescriptionValidationError("SALE_PRESCRIPTION_REQUIRED", "A skip reason is required before continuing without a prescription.");
    }
    auditActions.push(decision.mode === "SKIPPED" ? "prescription.skipped" : "prescription.captured");
    return { shouldPersist: true, auditActions };
  }

  if (decision?.mode === "SKIPPED") {
    throw new PrescriptionValidationError("SALE_CONTROLLED_DRUG_DETAILS_REQUIRED", "A controlled medicine prescription cannot be skipped.");
  }

  const patientName = normalize(decision?.patient?.name);
  const patientIdentifier = normalize(decision?.patient?.nic)
    ?? normalize(decision?.patient?.phone)
    ?? normalize(decision?.patient?.patientReference);
  const prescriberName = normalize(decision?.prescriber?.name);
  const prescriberReference = normalize(decision?.prescriber?.reference);
  if (!patientName || !patientIdentifier || !prescriberName || !prescriberReference) {
    throw new PrescriptionValidationError(
      "SALE_CONTROLLED_DRUG_DETAILS_REQUIRED",
      "Patient details and prescriber name and registration reference are required for controlled medicine.",
    );
  }

  // imageKey is intentionally optional for MVP controlled-drug checkout.
  auditActions.push("prescription.captured", "controlled_drug.sale_validated");
  return { shouldPersist: true, auditActions };
}
