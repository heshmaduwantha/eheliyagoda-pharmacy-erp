import type { ControlledDrugRegisterRow } from "@/modules/reports/report.types";
import { ReportTable } from "./ReportTable";

export function ControlledDrugRegisterTable({ rows, emptyMessage }: { rows: ControlledDrugRegisterRow[]; emptyMessage: string }) {
  return (
    <ReportTable
      emptyMessage={emptyMessage}
      headers={["Sale date", "Product", "Batch", "Qty", "Patient", "Prescriber", "Captured by", "Sale no."]}
      rows={rows.map((row) => [
        row.saleDateTime,
        row.productName,
        row.batchNumber ?? "—",
        row.qtyDispensed,
        <div className="flex flex-col gap-0.5" key={row.prescriptionId + "-patient"}>
          <span className="font-bold text-neutral-text">{row.patientName}</span>
          {row.patientNic || row.patientPhone || row.patientReference ? (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-muted">
              {row.patientNic && (
                <span className="font-semibold text-neutral-text">NIC: {row.patientNic}</span>
              )}
              {row.patientPhone && (
                <span className="font-semibold text-neutral-text">Tel: {row.patientPhone}</span>
              )}
              {row.patientReference && (
                <span>Ref: {row.patientReference}</span>
              )}
            </div>
          ) : null}
        </div>,
        `${row.prescriberName} · ${row.prescriberReference}`,
        row.capturedBy ?? "—",
        row.saleNumber ?? "—",
      ])}
    />
  );
}
