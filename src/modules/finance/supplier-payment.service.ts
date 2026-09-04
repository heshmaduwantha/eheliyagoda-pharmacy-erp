import { Prisma, SupplierInvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/modules/audit/audit.service";
import { ForbiddenError, UnauthorizedError, hasPermission } from "@/modules/auth/permissions";
import type { CurrentUser } from "@/modules/auth/session";
import { serverOnly } from "@/lib/server-only";
import { FinanceError } from "./expense.types";
import type {
  CreateSupplierPaymentInput,
  SupplierInvoiceBalanceRow,
  SupplierPaymentListFilters,
  SupplierPaymentListRow,
} from "./supplier-payment.types";

serverOnly();

export type SupplierPaymentSummaryResult = {
  availability: "ready" | "empty";
  summary: { paymentCount: number; totalAmount: string } | null;
  rows: SupplierPaymentListRow[];
  message?: string;
};

function assertActorPermission(actor: CurrentUser | undefined, permission: string) {
  if (!actor?.id) throw new UnauthorizedError();
  if (!hasPermission(actor, permission)) throw new ForbiddenError();
}

function decimal(value: string | number | Prisma.Decimal | undefined, field: string) {
  try {
    if (value == null || value === "") throw new Error("missing");
    const parsed = value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
    if (!parsed.isFinite()) throw new Error("invalid");
    return parsed;
  } catch {
    throw new FinanceError("VALIDATION_ERROR", `${field} is invalid.`);
  }
}

function parseDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new FinanceError("VALIDATION_ERROR", "A valid date is required.");
  }
  return date;
}

function datePart(date = new Date()) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

async function nextDailyNumber(prefix: string, latest: string | null | undefined) {
  let seq = 1;
  if (latest) {
    const parsed = Number(latest.slice(prefix.length + 1));
    if (Number.isFinite(parsed)) seq = parsed + 1;
  }
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

function paymentWhere(filters: SupplierPaymentListFilters = {}) {
  const where: Prisma.SupplierPaymentWhereInput = {};
  if (filters.from || filters.to) {
    where.paidAt = {};
    if (filters.from) where.paidAt.gte = parseDateOnly(filters.from);
    if (filters.to) {
      const end = parseDateOnly(filters.to);
      end.setDate(end.getDate() + 1);
      where.paidAt.lt = end;
    }
  }
  if (filters.supplierId) where.supplierId = filters.supplierId;
  if (filters.invoiceId) where.supplierInvoiceId = filters.invoiceId;
  return where;
}

export async function listSupplierInvoiceBalances(options: { page?: number; pageSize?: number } = {}): Promise<{ data: SupplierInvoiceBalanceRow[]; total: number }> {
  const { page = 1, pageSize = 10 } = options;
  const where = { status: { not: SupplierInvoiceStatus.CANCELLED } };

  const [invoices, total] = await Promise.all([
    prisma.supplierInvoice.findMany({
      where,
      select: {
        id: true,
        supplierId: true,
        invoiceNo: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        dueDate: true,
        supplier: { select: { name: true } },
        payments: { select: { paidAt: true }, orderBy: { paidAt: "desc" }, take: 1 },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.supplierInvoice.count({ where }),
  ]);

  const mapped = invoices.map((invoice) => {
    const outstanding = Prisma.Decimal.max(invoice.totalAmount.sub(invoice.paidAmount), 0);
    return {
      supplierInvoiceId: invoice.id,
      supplierId: invoice.supplierId,
      supplierName: invoice.supplier.name,
      invoiceNumber: invoice.invoiceNo,
      totalAmount: invoice.totalAmount.toFixed(2),
      paidAmount: invoice.paidAmount.toFixed(2),
      outstandingAmount: outstanding.toFixed(2),
      status: invoice.status,
      dueDate: invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : null,
      latestPaymentAt: invoice.payments[0]?.paidAt ? invoice.payments[0].paidAt.toISOString() : null,
    };
  });

  return { data: mapped, total };
}

export async function listSupplierPayments(filters: SupplierPaymentListFilters = {}): Promise<{ data: SupplierPaymentListRow[]; total: number }> {
  const page = filters.page ?? 1;
  const pageSize = filters.limit ?? 10;
  
  const where = paymentWhere(filters);
  const [payments, total] = await Promise.all([
    prisma.supplierPayment.findMany({
      where,
      select: {
        id: true,
        paymentNumber: true,
        amount: true,
        paymentMethod: true,
        reference: true,
        paidAt: true,
        supplierInvoice: { select: { invoiceNo: true, totalAmount: true, paidAmount: true } },
        supplier: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.supplierPayment.count({ where }),
  ]);

  const rows: SupplierPaymentListRow[] = [];
  for (const payment of payments) {
    const currentOutstanding = Prisma.Decimal.max(payment.supplierInvoice.totalAmount.sub(payment.supplierInvoice.paidAmount), 0);
    rows.push({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      supplierName: payment.supplier.name,
      invoiceNumber: payment.supplierInvoice.invoiceNo,
      amount: payment.amount.toFixed(2),
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      paidAt: payment.paidAt.toISOString(),
      createdBy: payment.createdBy?.name ?? null,
      outstandingAfter: currentOutstanding.toFixed(2),
    });
  }
  return { data: rows, total };
}

export async function recordSupplierPayment(input: CreateSupplierPaymentInput, actor: CurrentUser) {
  assertActorPermission(actor, "supplier_payment.create");

  const amount = decimal(input.amount, "amount");
  if (amount.lte(0)) throw new FinanceError("VALIDATION_ERROR", "Supplier payment amount must be greater than zero.");
  const paidAt = input.paidAt ? parseDateOnly(input.paidAt) : new Date();

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "SupplierInvoice" WHERE id = ${input.supplierInvoiceId}::uuid FOR UPDATE`;

    const invoice = await tx.supplierInvoice.findUnique({
      where: { id: input.supplierInvoiceId },
      include: { supplier: true },
    });
    if (!invoice) throw new FinanceError("NOT_FOUND", "Supplier invoice not found.");
    if (invoice.status === SupplierInvoiceStatus.CANCELLED) {
      throw new FinanceError("CONFLICT", "Cancelled supplier invoices cannot receive payments.");
    }

    const outstanding = Prisma.Decimal.max(invoice.totalAmount.sub(invoice.paidAmount), 0);
    if (outstanding.lte(0)) {
      throw new FinanceError("CONFLICT", "Supplier invoice is already fully paid.");
    }
    if (amount.gt(outstanding)) {
      throw new FinanceError("VALIDATION_ERROR", "Supplier payment cannot exceed the outstanding balance.");
    }

    const nextPaidAmount = invoice.paidAmount.add(amount);
    const nextStatus =
      nextPaidAmount.equals(0)
        ? SupplierInvoiceStatus.OPEN
        : nextPaidAmount.gte(invoice.totalAmount)
          ? SupplierInvoiceStatus.PAID
          : SupplierInvoiceStatus.PARTIALLY_PAID;

    const stamp = datePart(paidAt);
    const prefix = `SP-${stamp}`;
    const latest = await tx.supplierPayment.findFirst({
      where: { paymentNumber: { startsWith: prefix } },
      orderBy: { paymentNumber: "desc" },
      select: { paymentNumber: true },
    });
    const paymentNumber = await nextDailyNumber(prefix, latest?.paymentNumber);

    const payment = await tx.supplierPayment.create({
      data: {
        paymentNumber,
        supplierInvoiceId: invoice.id,
        supplierId: invoice.supplierId,
        amount,
        paymentMethod: input.paymentMethod,
        reference: input.reference?.trim() || null,
        paidAt,
        notes: input.notes?.trim() || null,
        createdById: actor.id,
      },
    });

    await tx.supplierInvoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: nextPaidAmount,
        status: nextStatus,
      },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "supplier_payment.recorded",
        entityType: "SUPPLIER_PAYMENT",
        entityId: payment.id,
        afterData: {
          paymentNumber,
          supplierInvoiceId: invoice.id,
          supplierName: invoice.supplier.name,
          amount: amount.toFixed(2),
          paymentMethod: payment.paymentMethod,
          reference: payment.reference,
          paidAt: payment.paidAt.toISOString(),
        },
      },
      tx,
    );

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "supplier_invoice.status_updated",
        entityType: "SUPPLIER_INVOICE",
        entityId: invoice.id,
        beforeData: {
          status: invoice.status,
          paidAmount: invoice.paidAmount.toFixed(2),
        },
        afterData: {
          status: nextStatus,
          paidAmount: nextPaidAmount.toFixed(2),
          outstandingAmount: outstanding.sub(amount).toFixed(2),
        },
      },
      tx,
    );

    return payment;
  }, { maxWait: 10000, timeout: 20000 });
}

export async function getSupplierPaymentReceiptById(id: string) {
  const payment = await prisma.supplierPayment.findUnique({
    where: { id },
    include: {
      supplier: true,
      supplierInvoice: true,
      createdBy: { select: { name: true } },
    },
  });

  if (!payment) return null;

  const currentOutstanding = Prisma.Decimal.max(
    payment.supplierInvoice.totalAmount.sub(payment.supplierInvoice.paidAmount),
    0
  );

  return {
    id: payment.id,
    paymentNumber: payment.paymentNumber,
    paidAt: payment.paidAt.toISOString(),
    amount: payment.amount.toFixed(2),
    paymentMethod: payment.paymentMethod,
    reference: payment.reference,
    notes: payment.notes,
    supplierName: payment.supplier.name,
    supplierPhone: payment.supplier.phone,
    invoiceNumber: payment.supplierInvoice.invoiceNo,
    invoiceTotal: payment.supplierInvoice.totalAmount.toFixed(2),
    invoicePaid: payment.supplierInvoice.paidAmount.toFixed(2),
    outstandingAfter: currentOutstanding.toFixed(2),
    createdBy: payment.createdBy?.name ?? "System Administrator",
  };
}
