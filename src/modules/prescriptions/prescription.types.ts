import type { PrescriptionRule } from "@prisma/client";

export type PrescriptionCaptureMode = "CAPTURED" | "SKIPPED";

export type PrescriptionPatientInput = {
  name?: string;
  phone?: string;
  nic?: string;
  patientReference?: string;
  age?: number;
};

export type PrescriptionPrescriberInput = {
  name?: string;
  reference?: string;
};

export type PrescriptionDecisionInput = {
  mode?: PrescriptionCaptureMode;
  skipReason?: string;
  imageKey?: string;
  patient?: PrescriptionPatientInput;
  prescriber?: PrescriptionPrescriberInput;
};

export type PrescriptionValidationLineInput = {
  productId: string;
};

export type PrescriptionSaleLinePersistenceInput = {
  saleLineId: string;
  productId: string;
  batchId: string;
  qtyBase: string;
};

export type PrescriptionRequirement = {
  rule: PrescriptionRule;
  promptedProductIds: string[];
  controlledProductIds: string[];
  requiresPrescriptionDecision: boolean;
  requiresControlledDetails: boolean;
};

export type PrescriptionAuditAction =
  | "prescription.captured"
  | "prescription.skipped"
  | "controlled_drug.sale_validated";

export type PrescriptionValidationResult = {
  requirement: PrescriptionRequirement;
  shouldPersist: boolean;
  auditActions: PrescriptionAuditAction[];
};

export type PrescriptionValidationInput = {
  lines: PrescriptionValidationLineInput[];
  prescription?: PrescriptionDecisionInput;
};

export type PersistPrescriptionInput = {
  saleId: string;
  actorUserId: string;
  lines: PrescriptionSaleLinePersistenceInput[];
  decision: PrescriptionDecisionInput;
  validation: PrescriptionValidationResult;
};

export type PrescriptionValidationErrorCode =
  | "VALIDATION_ERROR"
  | "SALE_PRESCRIPTION_REQUIRED"
  | "SALE_CONTROLLED_DRUG_DETAILS_REQUIRED";

export class PrescriptionValidationError extends Error {
  constructor(
    public readonly code: PrescriptionValidationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PrescriptionValidationError";
  }
}
