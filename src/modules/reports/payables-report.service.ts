import "server-only";

import { Prisma, SupplierInvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ReportResult, SupplierPayableRow } from "./report.types";

export async function getSupplierPayablesSummary(): Promise<ReportResult<{ outstandingTotal: string; invoiceCount: number }, SupplierPayableRow>> {
  const invoices = await prisma.supplierInvoice.findMany({
    where: { status: { not: SupplierInvoiceStatus.CANCELLED } },
    select: {
      id: true, invoiceNo: true, totalAmount: true, paidAmount: true, status: true,
      supplier: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
  const rows = invoices.map((invoice) => ({
    invoiceId: invoice.id,
    supplierName: invoice.supplier.name,
    invoiceNumber: invoice.invoiceNo,
    invoiceTotal: invoice.totalAmount.toFixed(2),
    paidAmount: invoice.paidAmount.toFixed(2),
    outstandingAmount: Prisma.Decimal.max(invoice.totalAmount.sub(invoice.paidAmount), 0).toFixed(2),
    status: invoice.status,
    dueDate: null,
  }));
  const outstandingTotal = rows.reduce(
    (sum, row) => sum.add(row.outstandingAmount),
    new Prisma.Decimal(0),
  );
  return {
    availability: rows.length ? "ready" : "empty",
    summary: { outstandingTotal: outstandingTotal.toFixed(2), invoiceCount: rows.length },
    rows,
    message: rows.length ? undefined : "No supplier payables found.",
    warnings: ["Due dates are unavailable because SupplierInvoice has no due-date field."],
  };
}

// SupplierInvoice/Supplier payments are procurement liabilities and are never queried as expenses here.
export async function getExpensesSummary(): Promise<ReportResult<null, never>> {
  return {
    availability: "unavailable",
    summary: null,
    rows: [],
    message: "Expense reporting is unavailable because an Expense model has not been implemented.",
    warnings: ["Supplier payables are excluded from expenses."],
  };
}
