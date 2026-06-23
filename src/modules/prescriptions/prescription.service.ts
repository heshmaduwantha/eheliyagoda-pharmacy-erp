import { Prisma } from "@prisma/client";
import { writeAuditLog } from "@/modules/audit/audit.service";
import { validatePrescriptionForSale } from "@/modules/sales/prescription-rule.service";
import { validatePrescriptionDecision } from "./prescription.rules";
import type { PersistPrescriptionInput, PrescriptionDecisionInput, PrescriptionSaleLinePersistenceInput } from "./prescription.types";
import { serverOnly } from "@/lib/server-only";

serverOnly();

/**
 * Persists prescription records only from a future successful sale transaction.
 * It deliberately does not create sales, payments, or stock movements itself.
 */
export async function persistPrescriptionForCompletedSale(
  input: PersistPrescriptionInput,
  tx: Prisma.TransactionClient,
) {
  if (!input.validation.shouldPersist) return null;

  const patientInput = input.decision.patient;
  // Defend the persistence boundary as well: a future sale service must validate
  // requirements in its transaction, but malformed callers cannot persist a
  // controlled-drug prescription without mandatory details.
  validatePrescriptionDecision(input.validation.requirement, input.decision);
  if (input.validation.requirement.requiresControlledDetails && !patientInput?.name?.trim()) {
    throw new Error("Controlled prescription patient details must be validated before persistence.");
  }
  const patient = input.validation.requirement.requiresControlledDetails && patientInput
    ? await tx.patient.create({
        data: {
          name: patientInput.name!.trim(),
          phone: patientInput.phone?.trim() || null,
          nic: patientInput.nic?.trim() || null,
          patientReference: patientInput.patientReference?.trim() || null,
          age: patientInput.age ?? null,
        },
      })
    : null;
  const requiredProductIds = new Set([
    ...input.validation.requirement.promptedProductIds,
    ...input.validation.requirement.controlledProductIds,
  ]);

  const prescription = await tx.prescription.create({
    data: {
      saleId: input.saleId,
      patientId: patient?.id ?? null,
      prescriberName: input.decision.prescriber?.name?.trim() || null,
      prescriberRef: input.decision.prescriber?.reference?.trim() || null,
      imageKey: input.decision.imageKey?.trim() || null,
      skipReason: input.decision.skipReason?.trim() || null,
      capturedById: input.actorUserId,
      saleLines: {
        create: input.lines
          .filter((line) => requiredProductIds.has(line.productId))
          .map((line) => ({
            saleLineId: line.saleLineId,
            productId: line.productId,
            batchId: line.batchId,
            qtyBase: new Prisma.Decimal(line.qtyBase),
          })),
      },
    },
  });

  for (const action of input.validation.auditActions) {
    await writeAuditLog(
      {
        actorUserId: input.actorUserId,
        action,
        entityType: "PRESCRIPTION",
        entityId: prescription.id,
        afterData: {
          saleId: input.saleId,
          rule: input.validation.requirement.rule,
          controlledLineCount: input.validation.requirement.controlledProductIds.length,
          prescriptionLineCount: input.lines.length,
        },
      },
      tx,
    );
  }

  return prescription;
}

/**
 * Future sale completion integration point. Call this from the sale transaction
 * only after authoritative sale lines and FEFO batch allocations exist. It does
 * not create a sale, deduct stock, or persist payments on its own.
 */
export async function validateAndPersistPrescriptionForCompletedSale(
  input: {
    saleId: string;
    actorUserId: string;
    decision: PrescriptionDecisionInput;
    lines: PrescriptionSaleLinePersistenceInput[];
  },
  tx: Prisma.TransactionClient,
) {
  const validation = await validatePrescriptionForSale(
    { lines: input.lines.map((line) => ({ productId: line.productId })), prescription: input.decision },
    tx,
  );
  return persistPrescriptionForCompletedSale({ ...input, validation }, tx);
}
