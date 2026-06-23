import { SaleStatus } from "@prisma/client";
import { writeAuditLog } from "@/modules/audit/audit.service";
import { prisma } from "@/lib/prisma";
import type { ControlledDrugRegisterRow, ReportResult } from "./report.types";
import { serverOnly } from "@/lib/server-only";

serverOnly();

/**
 * Audits every controlled-register view and returns completed-sale rows only.
 * Prescription and Sale are now authoritative, so the register can be read from
 * the completed-sale transaction result instead of staying unavailable.
 */
export async function getControlledDrugRegister(actorUserId: string): Promise<ReportResult<{ rowCount: number }, ControlledDrugRegisterRow>> {
  await writeAuditLog({
    actorUserId,
    action: "controlled_drug_report.viewed",
    entityType: "REPORT",
    afterData: { report: "controlled-drug-register", result: "ready" },
  });

  const prescriptions = await prisma.prescription.findMany({
    where: {
      sale: { status: SaleStatus.COMPLETED },
    },
    select: {
      id: true,
      patient: { select: { name: true, patientReference: true } },
      prescriberName: true,
      prescriberRef: true,
      capturedBy: { select: { name: true } },
      sale: { select: { completedAt: true, saleNumber: true } },
      saleLines: {
        select: {
          qtyBase: true,
          product: { select: { name: true } },
          batch: { select: { batchNo: true, expiryDate: true } },
        },
      },
    },
    orderBy: { sale: { completedAt: "desc" } },
  });

  const rows = prescriptions.flatMap((prescription) => {
    const sale = prescription.sale;
    const completedAt = sale?.completedAt;
    if (!sale || !completedAt) return [];
    return prescription.saleLines.map((line) => ({
      prescriptionId: prescription.id,
      productName: line.product.name,
      batchNumber: line.batch.batchNo,
      expiryDate: line.batch.expiryDate ? line.batch.expiryDate.toISOString().slice(0, 10) : null,
      qtyDispensed: line.qtyBase.toFixed(3),
      patientName: prescription.patient?.name ?? "Unknown",
      patientReference: prescription.patient?.patientReference ?? null,
      prescriberName: prescription.prescriberName ?? "Unknown",
      prescriberReference: prescription.prescriberRef ?? "Unknown",
      capturedBy: prescription.capturedBy?.name ?? null,
      saleDateTime: completedAt.toISOString(),
      saleNumber: sale.saleNumber,
    }));
  });

  if (!rows.length) {
    return {
      availability: "empty",
      summary: { rowCount: 0 },
      rows: [],
      message: "No completed controlled-drug sales yet",
      warnings: ["Prescription and sale records are ready, but no controlled-drug sales have been completed."],
    };
  }

  return {
    availability: "ready",
    summary: { rowCount: rows.length },
    rows,
  };
}
