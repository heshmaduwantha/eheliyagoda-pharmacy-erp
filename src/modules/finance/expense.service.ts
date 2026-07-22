import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/modules/audit/audit.service";
import { ForbiddenError, UnauthorizedError, hasPermission } from "@/modules/auth/permissions";
import type { CurrentUser } from "@/modules/auth/session";
import { serverOnly } from "@/lib/server-only";
import {
  EXPENSE_CATEGORIES,
  type CreateExpenseInput,
  type ExpenseListFilters,
  type ExpenseListRow,
  type ExpenseSummaryRow,
  type UpdateExpenseInput,
  FinanceError,
} from "./expense.types";

serverOnly();

export type ExpenseSummaryResult = {
  availability: "ready" | "empty";
  summary: { totalAmount: string; expenseCount: number } | null;
  rows: ExpenseSummaryRow[];
  message?: string;
  warnings?: string[];
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

function parseDateOnly(value: string | Date) {
  const date = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new FinanceError("VALIDATION_ERROR", "A valid expense date is required.");
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

function expenseWhere(filters: ExpenseListFilters = {}) {
  const where: Prisma.ExpenseWhereInput = {
    deletedAt: filters.includeDeleted ? undefined : null,
  };
  if (filters.from || filters.to) {
    where.date = {};
    if (filters.from) where.date.gte = parseDateOnly(filters.from);
    if (filters.to) {
      const end = parseDateOnly(filters.to);
      end.setDate(end.getDate() + 1);
      where.date.lt = end;
    }
  }
  if (filters.category) where.category = filters.category;
  if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
  return where;
}

export async function listExpenses(filters: ExpenseListFilters = {}): Promise<{ data: ExpenseListRow[]; total: number }> {
  const { page = 1, pageSize = 10 } = filters;
  const where = expenseWhere(filters);

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      select: {
        id: true,
        expenseNumber: true,
        date: true,
        category: true,
        description: true,
        amount: true,
        paymentMethod: true,
        reference: true,
        notes: true,
        deletedAt: true,
        createdBy: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.expense.count({ where }),
  ]);

  const rows = expenses.map((expense) => ({
    id: expense.id,
    expenseNumber: expense.expenseNumber,
    date: expense.date.toISOString().slice(0, 10),
    category: expense.category,
    description: expense.description,
    amount: expense.amount.toFixed(2),
    paymentMethod: expense.paymentMethod,
    reference: expense.reference,
    notes: expense.notes,
    createdBy: expense.createdBy?.name ?? null,
    deletedAt: expense.deletedAt ? expense.deletedAt.toISOString() : null,
  }));

  return { data: rows, total };
}

export async function getExpenseSummary(filters: ExpenseListFilters = {}): Promise<ExpenseSummaryResult> {
  const where = expenseWhere(filters);
  const grouped = await prisma.expense.groupBy({
    by: ["category", "paymentMethod"],
    where,
    _sum: { amount: true },
    _count: { _all: true },
  });

  const rows = grouped
    .map((row) => ({
      category: row.category,
      paymentMethod: row.paymentMethod,
      totalAmount: row._sum.amount?.toFixed(2) ?? "0.00",
      expenseCount: row._count._all,
    }))
    .sort((left, right) => left.category.localeCompare(right.category) || left.paymentMethod.localeCompare(right.paymentMethod));

  const totalAmount = rows.reduce((sum, row) => sum.add(row.totalAmount), new Prisma.Decimal(0));
  const expenseCount = rows.reduce((sum, row) => sum + row.expenseCount, 0);

  if (rows.length === 0) {
    return {
      availability: "empty",
      summary: null,
      rows,
      message: "No expenses found for the selected range.",
    };
  }

  return {
    availability: "ready",
    summary: { totalAmount: totalAmount.toFixed(2), expenseCount },
    rows,
  };
}

export async function createExpense(input: CreateExpenseInput, actor: CurrentUser) {
  assertActorPermission(actor, "expense.create");

  const amount = decimal(input.amount, "amount");
  if (amount.lte(0)) throw new FinanceError("VALIDATION_ERROR", "Expense amount must be greater than zero.");
  const date = parseDateOnly(input.date);

  return prisma.$transaction(async (tx) => {
    const stamp = datePart(date);
    const prefix = `EXP-${stamp}`;
    const latest = await tx.expense.findFirst({
      where: { expenseNumber: { startsWith: prefix } },
      orderBy: { expenseNumber: "desc" },
      select: { expenseNumber: true },
    });
    const expenseNumber = await nextDailyNumber(prefix, latest?.expenseNumber);

    const expense = await tx.expense.create({
      data: {
        expenseNumber,
        date,
        category: input.category,
        description: input.description?.trim() || null,
        amount,
        paymentMethod: input.paymentMethod,
        reference: input.reference?.trim() || null,
        notes: input.notes?.trim() || null,
        createdById: actor.id,
      },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "expense.created",
        entityType: "EXPENSE",
        entityId: expense.id,
        afterData: {
          expenseNumber,
          date: expense.date.toISOString().slice(0, 10),
          category: expense.category,
          amount: expense.amount.toFixed(2),
          paymentMethod: expense.paymentMethod,
          reference: expense.reference,
        },
      },
      tx,
    );

    return expense;
  });
}

export async function updateExpense(id: string, input: UpdateExpenseInput, actor: CurrentUser) {
  assertActorPermission(actor, "expense.update");

  return prisma.$transaction(async (tx) => {
    const current = await tx.expense.findUnique({ where: { id } });
    if (!current) throw new FinanceError("NOT_FOUND", "Expense not found.");
    if (current.deletedAt) throw new FinanceError("CONFLICT", "Deleted expenses cannot be updated.");

    const nextAmount = input.amount == null || input.amount === "" ? current.amount : decimal(input.amount, "amount");
    if (nextAmount.lte(0)) throw new FinanceError("VALIDATION_ERROR", "Expense amount must be greater than zero.");

    const nextDate = input.date ? parseDateOnly(input.date) : current.date;

    const expense = await tx.expense.update({
      where: { id },
      data: {
        date: nextDate,
        category: input.category ?? current.category,
        description: input.description === undefined ? current.description : input.description?.trim() || null,
        amount: nextAmount,
        paymentMethod: input.paymentMethod ?? current.paymentMethod,
        reference: input.reference === undefined ? current.reference : input.reference?.trim() || null,
        notes: input.notes === undefined ? current.notes : input.notes?.trim() || null,
      },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "expense.updated",
        entityType: "EXPENSE",
        entityId: expense.id,
        beforeData: {
          date: current.date.toISOString().slice(0, 10),
          category: current.category,
          amount: current.amount.toFixed(2),
          paymentMethod: current.paymentMethod,
        },
        afterData: {
          date: expense.date.toISOString().slice(0, 10),
          category: expense.category,
          amount: expense.amount.toFixed(2),
          paymentMethod: expense.paymentMethod,
        },
      },
      tx,
    );

    return expense;
  });
}

export async function deleteExpense(id: string, actor: CurrentUser) {
  assertActorPermission(actor, "expense.delete");

  return prisma.$transaction(async (tx) => {
    const current = await tx.expense.findUnique({ where: { id } });
    if (!current) throw new FinanceError("NOT_FOUND", "Expense not found.");
    if (current.deletedAt) throw new FinanceError("CONFLICT", "Expense is already deleted.");

    const deletedAt = new Date();
    const expense = await tx.expense.update({
      where: { id },
      data: { deletedAt },
    });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "expense.deleted",
        entityType: "EXPENSE",
        entityId: expense.id,
        beforeData: {
          expenseNumber: current.expenseNumber,
          amount: current.amount.toFixed(2),
          paymentMethod: current.paymentMethod,
        },
        afterData: { deletedAt: deletedAt.toISOString() },
      },
      tx,
    );

    return expense;
  });
}

export { EXPENSE_CATEGORIES };
