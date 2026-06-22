import assert from "node:assert/strict";
import test from "node:test";
import { validatePrescriptionDecision } from "./prescription.rules";
import { PrescriptionValidationError, type PrescriptionRequirement } from "./prescription.types";

const none: PrescriptionRequirement = {
  rule: "NONE", promptedProductIds: [], controlledProductIds: [], requiresPrescriptionDecision: false, requiresControlledDetails: false,
};
const prompted: PrescriptionRequirement = {
  rule: "PROMPT_SKIPPABLE", promptedProductIds: ["product-prompted"], controlledProductIds: [], requiresPrescriptionDecision: true, requiresControlledDetails: false,
};
const controlled: PrescriptionRequirement = {
  rule: "HARD_REQUIRED_CONTROLLED", promptedProductIds: [], controlledProductIds: ["product-controlled"], requiresPrescriptionDecision: false, requiresControlledDetails: true,
};

function expectValidationError(callback: () => unknown, code: string) {
  assert.throws(callback, (error: unknown) => error instanceof PrescriptionValidationError && error.code === code);
}

test("NONE product passes without prescription data", () => {
  assert.deepEqual(validatePrescriptionDecision(none), { shouldPersist: false, auditActions: [] });
});

test("PROMPT_SKIPPABLE fails if skipped without a reason", () => {
  expectValidationError(() => validatePrescriptionDecision(prompted, { mode: "SKIPPED" }), "SALE_PRESCRIPTION_REQUIRED");
});

test("PROMPT_SKIPPABLE passes with a skip reason", () => {
  const result = validatePrescriptionDecision(prompted, { mode: "SKIPPED", skipReason: "Patient presented no prescription." });
  assert.equal(result.shouldPersist, true);
  assert.deepEqual(result.auditActions, ["prescription.skipped"]);
});

test("HARD_REQUIRED_CONTROLLED fails without patient", () => {
  expectValidationError(() => validatePrescriptionDecision(controlled, { mode: "CAPTURED", prescriber: { name: "Dr Silva", reference: "SLMC-1" } }), "SALE_CONTROLLED_DRUG_DETAILS_REQUIRED");
});

test("HARD_REQUIRED_CONTROLLED fails without prescriber", () => {
  expectValidationError(() => validatePrescriptionDecision(controlled, { mode: "CAPTURED", patient: { name: "Patient", nic: "200012345678" } }), "SALE_CONTROLLED_DRUG_DETAILS_REQUIRED");
});

test("HARD_REQUIRED_CONTROLLED passes with patient and prescriber", () => {
  const result = validatePrescriptionDecision(controlled, { mode: "CAPTURED", patient: { name: "Patient", phone: "0771234567" }, prescriber: { name: "Dr Silva", reference: "SLMC-1" } });
  assert.equal(result.shouldPersist, true);
});

test("controlled prescription image is not required for MVP", () => {
  assert.doesNotThrow(() => validatePrescriptionDecision(controlled, { mode: "CAPTURED", patient: { name: "Patient", patientReference: "PT-1" }, prescriber: { name: "Dr Silva", reference: "SLMC-1" } }));
});

test("controlled validation prepares audit actions", () => {
  const result = validatePrescriptionDecision(controlled, { mode: "CAPTURED", patient: { name: "Patient", nic: "200012345678" }, prescriber: { name: "Dr Silva", reference: "SLMC-1" } });
  assert.deepEqual(result.auditActions, ["prescription.captured", "controlled_drug.sale_validated"]);
});
