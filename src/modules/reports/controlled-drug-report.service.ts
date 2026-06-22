import "server-only";

import { writeAuditLog } from "@/modules/audit/audit.service";
import type { ControlledDrugRegisterRow, ReportResult } from "./report.types";

/**
 * Audits every controlled-register view. No register rows are returned until a
 * completed Sale model exists, because Prescription.saleId alone cannot prove
 * that a sale completed or provide an authoritative sale date/number.
 */
export async function getControlledDrugRegister(actorUserId: string): Promise<ReportResult<{ rowCount: number }, ControlledDrugRegisterRow>> {
  await writeAuditLog({
    actorUserId,
    action: "controlled_drug_report.viewed",
    entityType: "REPORT",
    afterData: { report: "controlled-drug-register", result: "sale-model-unavailable" },
  });

  // TODO(sales): Join PrescriptionSaleLine to COMPLETED Sale/SaleLine after those models exist.
  // TODO(storage): Audit prescription_image.viewed when image access is implemented.
  return {
    availability: "unavailable",
    summary: { rowCount: 0 },
    rows: [],
    message: "No completed controlled-drug sales yet",
    warnings: ["Prescription records are not shown without an authoritative completed-sale relation."],
  };
}
