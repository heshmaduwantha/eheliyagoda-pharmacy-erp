import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { afterEach } from "node:test";
import { PaymentMethod, SupplierInvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ForbiddenError } from "@/modules/auth/permissions";
import { createExpense, deleteExpense, getExpenseSummary, listExpenses, updateExpense } from "./expense.service";
import { FinanceError } from "./expense.types";
import { getSupplierPayablesSummary, getSupplierPaymentsReport } from "@/modules/reports/payables-report.service";
import { recordSupplierPayment } from "./supplier-payment.service";

type FinanceActor = {
  id: string;
  name: string;
  username: string;
  roleCode: string;
  permissions: string[];
};

const cleanupTasks: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (cleanupTasks.length > 0) {
    const cleanup = cleanupTasks.pop();
    if (cleanup) await cleanup();
  }
});

async function getFinanceActor(permissionCode: string): Promise<FinanceActor> {
  const user = await prisma.user.findFirst({
    where: {
      isActive: true,
      role: {
        rolePermissions: {
          some: { permission: { code: permissionCode } },
        },
      },
    },
    select: {
      id: true,
      name: true,
      username: true,
      role: {
        select: {
          code: true,
          rolePermissions: {
            select: {
              permission: { select: { code: true } },
            },
          },
        },
      },
    },
  });

  assert.ok(user, `Expected a seeded user with ${permissionCode} permission.`);
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    roleCode: user.role.code,
    permissions: user.role.rolePermissions.map(({ permission }) => permission.code),
  };
}

async function createSupplierInvoiceFixture(totalAmount: string, paidAmount = "0.00") {
  const supplier = await prisma.supplier.create({
    data: {
      name: `Finance Supplier ${randomUUID().slice(0, 8)}`,
      creditTermDays: 30,
      isActive: true,
    },
  });
  const paid = Number(paidAmount);
  const total = Number(totalAmount);
  const invoice = await prisma.supplierInvoice.create({
    data: {
      supplierId: supplier.id,
      invoiceNo: `INV-${randomUUID().slice(0, 8).toUpperCase()}`,
      totalAmount,
      paidAmount,
      status: paid <= 0 ? SupplierInvoiceStatus.OPEN : paid >= total ? SupplierInvoiceStatus.PAID : SupplierInvoiceStatus.PARTIALLY_PAID,
      dueDate: new Date("2026-07-23"),
    },
  });

  cleanupTasks.push(async () => {
    await prisma.supplierPayment.deleteMany({ where: { supplierInvoiceId: invoice.id } });
    await prisma.supplierInvoice.deleteMany({ where: { id: invoice.id } });
    await prisma.supplier.deleteMany({ where: { id: supplier.id } });
  });

  return { supplier, invoice };
}

async function cleanupExpense(expenseId: string) {
  await prisma.auditLog.deleteMany({ where: { entityType: "EXPENSE", entityId: expenseId } });
  await prisma.expense.deleteMany({ where: { id: expenseId } });
}

async function cleanupSupplierPayment(paymentId: string) {
  await prisma.auditLog.deleteMany({ where: { entityType: "SUPPLIER_PAYMENT", entityId: paymentId } });
  await prisma.supplierPayment.deleteMany({ where: { id: paymentId } });
}

test("create expense persists row and writes audit", async () => {
  const actor = await getFinanceActor("expenses.create");
  const expense = await createExpense(
    {
      date: "2026-06-23",
      category: "ELECTRICITY",
      amount: "1250.50",
      paymentMethod: PaymentMethod.CASH,
      description: "Electricity bill",
      reference: "EL-001",
    },
    actor,
  );

  const stored = await prisma.expense.findUnique({ where: { id: expense.id } });
  assert.ok(stored);
  assert.equal(stored?.amount.toFixed(2), "1250.50");
  const audit = await prisma.auditLog.findFirst({
    where: { entityType: "EXPENSE", entityId: expense.id, action: "expense.created" },
  });
  assert.ok(audit);
  await cleanupExpense(expense.id);
});

test("update expense persists change and writes audit", async () => {
  const actor = await getFinanceActor("expenses.update");
  const expense = await createExpense(
    {
      date: "2026-06-23",
      category: "RENT",
      amount: "1000.00",
      paymentMethod: PaymentMethod.CASH,
      description: "Monthly rent",
    },
    await getFinanceActor("expenses.create"),
  );

  const updated = await updateExpense(
    expense.id,
    {
      amount: "1250.25",
      description: "Monthly rent updated",
    },
    actor,
  );

  assert.equal(updated.amount.toFixed(2), "1250.25");
  const audit = await prisma.auditLog.findFirst({
    where: { entityType: "EXPENSE", entityId: expense.id, action: "expense.updated" },
  });
  assert.ok(audit);
  await cleanupExpense(expense.id);
});

test("expense summary groups by category and payment method and excludes deleted rows", async () => {
  const actor = await getFinanceActor("expenses.create");
  const expense1 = await createExpense(
    { date: "2026-06-23", category: "RENT", amount: "5000.00", paymentMethod: PaymentMethod.CASH },
    actor,
  );
  const expense2 = await createExpense(
    { date: "2026-06-23", category: "RENT", amount: "1200.00", paymentMethod: PaymentMethod.CARD },
    actor,
  );
  const expense3 = await createExpense(
    { date: "2026-06-23", category: "WATER", amount: "300.00", paymentMethod: PaymentMethod.CASH },
    actor,
  );
  await deleteExpense(expense3.id, actor);

  const summary = await getExpenseSummary({ from: "2026-06-01", to: "2026-06-30" });
  assert.equal(summary.availability, "ready");
  assert.equal(summary.summary?.totalAmount, "6200.00");
  assert.equal(summary.summary?.expenseCount, 2);
  assert.equal(summary.rows.length, 2);
  assert.ok(summary.rows.some((row) => row.category === "RENT" && row.paymentMethod === PaymentMethod.CASH && row.totalAmount === "5000.00"));
  assert.ok(summary.rows.some((row) => row.category === "RENT" && row.paymentMethod === PaymentMethod.CARD && row.totalAmount === "1200.00"));

  const listed = await listExpenses({ from: "2026-06-01", to: "2026-06-30" });
  assert.equal(listed.length, 2);
  await cleanupExpense(expense1.id);
  await cleanupExpense(expense2.id);
  await cleanupExpense(expense3.id);
});

test("deleted expense is excluded from reports", async () => {
  const actor = await getFinanceActor("expenses.create");
  const expense = await createExpense(
    { date: "2026-06-23", category: "OTHER", amount: "77.00", paymentMethod: PaymentMethod.CASH },
    actor,
  );
  await deleteExpense(expense.id, actor);
  const summary = await getExpenseSummary({ from: "2026-06-01", to: "2026-06-30" });
  assert.equal(summary.availability, "empty");
  assert.equal(summary.rows.length, 0);
  const audit = await prisma.auditLog.findFirst({
    where: { entityType: "EXPENSE", entityId: expense.id, action: "expense.deleted" },
  });
  assert.ok(audit);
});

test("permission guard blocks unauthorized expense create", async () => {
  const actor: FinanceActor = {
    id: "00000000-0000-0000-0000-000000000000",
    name: "No Access",
    username: "no.access",
    roleCode: "NO_ACCESS",
    permissions: [],
  };

  await assert.rejects(
    () =>
      createExpense(
        { date: "2026-06-23", category: "OTHER", amount: "10.00", paymentMethod: PaymentMethod.CASH },
        actor as never,
      ),
    (error: unknown) => error instanceof ForbiddenError,
  );
});

test("supplier payment creates payment row and updates invoice status", async () => {
  const actor = await getFinanceActor("suppliers.payments.create");
  const { invoice } = await createSupplierInvoiceFixture("1000.00", "0.00");

  const payment = await recordSupplierPayment(
    {
      supplierInvoiceId: invoice.id,
      amount: "400.00",
      paymentMethod: PaymentMethod.CASH,
      reference: "PAY-001",
    },
    actor,
  );

  const storedPayment = await prisma.supplierPayment.findUnique({ where: { id: payment.id } });
  const storedInvoice = await prisma.supplierInvoice.findUnique({ where: { id: invoice.id } });
  assert.ok(storedPayment);
  assert.equal(storedPayment?.amount.toFixed(2), "400.00");
  assert.ok(storedInvoice);
  assert.equal(storedInvoice?.paidAmount.toFixed(2), "400.00");
  assert.equal(storedInvoice?.status, SupplierInvoiceStatus.PARTIALLY_PAID);
  const recordedAudit = await prisma.auditLog.findFirst({
    where: { entityType: "SUPPLIER_PAYMENT", entityId: payment.id, action: "supplier_payment.recorded" },
  });
  const statusAudit = await prisma.auditLog.findFirst({
    where: { entityType: "SUPPLIER_INVOICE", entityId: invoice.id, action: "supplier_invoice.status_updated" },
  });
  assert.ok(recordedAudit);
  assert.ok(statusAudit);
});

test("full supplier payment sets invoice status paid", async () => {
  const actor = await getFinanceActor("suppliers.payments.create");
  const { invoice } = await createSupplierInvoiceFixture("250.00", "0.00");

  await recordSupplierPayment(
    {
      supplierInvoiceId: invoice.id,
      amount: "250.00",
      paymentMethod: PaymentMethod.CARD,
      reference: "PAY-002",
    },
    actor,
  );

  const storedInvoice = await prisma.supplierInvoice.findUnique({ where: { id: invoice.id } });
  assert.ok(storedInvoice);
  assert.equal(storedInvoice?.paidAmount.toFixed(2), "250.00");
  assert.equal(storedInvoice?.status, SupplierInvoiceStatus.PAID);
});

test("already paid invoice rejects extra payment", async () => {
  const actor = await getFinanceActor("suppliers.payments.create");
  const { invoice } = await createSupplierInvoiceFixture("150.00", "150.00");

  await assert.rejects(
    () =>
      recordSupplierPayment(
        {
          supplierInvoiceId: invoice.id,
          amount: "1.00",
          paymentMethod: PaymentMethod.CASH,
        },
        actor,
      ),
    (error: unknown) => error instanceof FinanceError && error.code === "CONFLICT",
  );

  const storedInvoice = await prisma.supplierInvoice.findUnique({ where: { id: invoice.id } });
  assert.ok(storedInvoice);
  assert.equal(storedInvoice?.paidAmount.toFixed(2), "150.00");
  assert.equal(storedInvoice?.status, SupplierInvoiceStatus.PAID);
});

test("overpayment is rejected and invoice is unchanged", async () => {
  const actor = await getFinanceActor("suppliers.payments.create");
  const { invoice } = await createSupplierInvoiceFixture("300.00", "50.00");

  await assert.rejects(
    () =>
      recordSupplierPayment(
        {
          supplierInvoiceId: invoice.id,
          amount: "500.00",
          paymentMethod: PaymentMethod.CASH,
        },
        actor,
      ),
    (error: unknown) => error instanceof FinanceError && error.code === "VALIDATION_ERROR",
  );

  const storedInvoice = await prisma.supplierInvoice.findUnique({ where: { id: invoice.id } });
  assert.ok(storedInvoice);
  assert.equal(storedInvoice?.paidAmount.toFixed(2), "50.00");
  assert.equal(storedInvoice?.status, SupplierInvoiceStatus.PARTIALLY_PAID);
});

test("supplier payment does not create expense", async () => {
  const actor = await getFinanceActor("suppliers.payments.create");
  const { invoice } = await createSupplierInvoiceFixture("100.00", "0.00");
  const beforeExpenses = await prisma.expense.count();

  const payment = await recordSupplierPayment(
    {
      supplierInvoiceId: invoice.id,
      amount: "25.00",
      paymentMethod: PaymentMethod.CASH,
    },
    actor,
  );

  const afterExpenses = await prisma.expense.count();
  assert.equal(afterExpenses, beforeExpenses);
  await cleanupSupplierPayment(payment.id);
});

test("unauthorized supplier payment create is blocked", async () => {
  const actor: FinanceActor = {
    id: "00000000-0000-0000-0000-000000000000",
    name: "No Access",
    username: "no.access",
    roleCode: "NO_ACCESS",
    permissions: [],
  };
  const { invoice } = await createSupplierInvoiceFixture("100.00", "0.00");

  await assert.rejects(
    () =>
      recordSupplierPayment(
        {
          supplierInvoiceId: invoice.id,
          amount: "10.00",
          paymentMethod: PaymentMethod.CASH,
        },
        actor as never,
      ),
    (error: unknown) => error instanceof ForbiddenError,
  );
});

test("supplier payables and supplier payment reports use real records", async () => {
  const actor = await getFinanceActor("suppliers.payments.create");
  const { invoice } = await createSupplierInvoiceFixture("500.00", "0.00");
  await recordSupplierPayment(
    {
      supplierInvoiceId: invoice.id,
      amount: "200.00",
      paymentMethod: PaymentMethod.CASH,
    },
    actor,
  );

  const payables = await getSupplierPayablesSummary();
  assert.ok(payables.summary);
  const invoiceRow = payables.rows.find((row) => row.invoiceNumber === invoice.invoiceNo);
  assert.ok(invoiceRow);
  assert.equal(invoiceRow?.outstandingAmount, "300.00");

  const today = new Date().toISOString().slice(0, 10);
  const payments = await getSupplierPaymentsReport({ from: today, to: today });
  assert.equal(payments.availability, "ready");
  assert.ok(payments.rows.some((row) => row.invoiceNumber === invoice.invoiceNo));
});
