import { Prisma, SupplierInvoiceStatus } from "@prisma/client";
import { getExpenseSummary } from "@/modules/finance/expense.service";
import { listSupplierInvoiceBalances, listSupplierPayments } from "@/modules/finance/supplier-payment.service";
import type { ReportDateRange, ReportResult, SupplierPayableRow, SupplierPaymentRow } from "./report.types";
import { toDateWindow } from "./report.service";

function dateRangeToFinanceFilters(range: ReportDateRange) {
  const { start, endExclusive } = toDateWindow(range);
  return {
    from: start.toISOString().slice(0, 10),
    to: new Date(endExclusive.getTime() - 1).toISOString().slice(0, 10),
  };
}

export async function getSupplierPayablesSummary(): Promise<ReportResult<{ outstandingTotal: string; invoiceCount: number; overdueCount: number }, SupplierPayableRow>> {
  const { data: invoices } = await listSupplierInvoiceBalances({ pageSize: 1000 });
  const rows = invoices.map((invoice) => ({
    invoiceId: invoice.supplierInvoiceId,
    supplierName: invoice.supplierName,
    invoiceNumber: invoice.invoiceNumber,
    invoiceTotal: invoice.totalAmount,
    paidAmount: invoice.paidAmount,
    outstandingAmount: invoice.outstandingAmount,
    status: invoice.status,
    dueDate: invoice.dueDate,
    latestPaymentAt: invoice.latestPaymentAt,
  }));
  const outstandingTotal = rows.reduce((sum, row) => sum.add(row.outstandingAmount), new Prisma.Decimal(0));
  const overdueCount = invoices.filter((invoice) => {
    if (!invoice.dueDate) return false;
    if (invoice.status === SupplierInvoiceStatus.PAID || invoice.status === SupplierInvoiceStatus.CANCELLED) return false;
    return new Date(`${invoice.dueDate}T23:59:59`).getTime() < Date.now() && new Prisma.Decimal(invoice.outstandingAmount).gt(0);
  }).length;

  return {
    availability: rows.length ? "ready" : "empty",
    summary: { outstandingTotal: outstandingTotal.toFixed(2), invoiceCount: rows.length, overdueCount },
    rows,
    message: rows.length ? undefined : "No supplier payables found.",
    warnings: invoices.some((invoice) => !invoice.dueDate) ? ["Some supplier invoices do not yet have due dates."] : undefined,
  };
}

export async function getExpensesSummary(range: ReportDateRange) {
  return getExpenseSummary(dateRangeToFinanceFilters(range));
}

export async function getSupplierPaymentsReport(range: ReportDateRange & { page?: number }): Promise<ReportResult<{ totalAmount: string; paymentCount: number; totalPages?: number }, SupplierPaymentRow>> {
  const { data: payments, total } = await listSupplierPayments({ ...dateRangeToFinanceFilters(range), limit: 10, page: range.page });
  const rows = payments.map((payment) => ({
    paymentId: payment.id,
    paymentNumber: payment.paymentNumber,
    supplierName: payment.supplierName,
    invoiceNumber: payment.invoiceNumber,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    reference: payment.reference,
    paidAt: payment.paidAt,
    createdBy: payment.createdBy,
    outstandingAfter: payment.outstandingAfter,
  }));

  const totalAmount = rows.reduce((sum, row) => sum.add(row.amount), new Prisma.Decimal(0));
  return {
    availability: rows.length ? "ready" : "empty",
    summary: { totalAmount: totalAmount.toFixed(2), paymentCount: total, totalPages: Math.ceil(total / 10) },
    rows,
    message: rows.length ? undefined : "No supplier payments found.",
  };
}
