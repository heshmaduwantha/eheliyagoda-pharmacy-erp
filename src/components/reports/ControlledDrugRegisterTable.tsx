import type { ControlledDrugRegisterRow } from "@/modules/reports/report.types";
import { ReportTable } from "./ReportTable";

export function ControlledDrugRegisterTable({ rows, emptyMessage }: { rows: ControlledDrugRegisterRow[]; emptyMessage: string }) {
  return <ReportTable
    emptyMessage={emptyMessage}
    headers={["Sale date", "Product", "Batch", "Qty", "Patient", "Prescriber", "Captured by", "Sale no."]}
    rows={rows.map((row) => [row.saleDateTime, row.productName, row.batchNumber ?? "—", row.qtyDispensed, `${row.patientName}${row.patientReference ? ` · ${row.patientReference}` : ""}`, `${row.prescriberName} · ${row.prescriberReference}`, row.capturedBy ?? "—", row.saleNumber ?? "—"])}
  />;
}
