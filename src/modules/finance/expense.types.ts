import type { PaymentMethod } from "@prisma/client";

export const EXPENSE_CATEGORIES = [
  "RENT",
  "ELECTRICITY",
  "WATER",
  "SALARY",
  "TRANSPORT",
  "INTERNET",
  "STATIONERY",
  "BANK_CHARGES",
  "MAINTENANCE",
  "OTHER",
] as const;

export type ExpenseCategoryValue = (typeof EXPENSE_CATEGORIES)[number];

export type ExpenseListFilters = {
  from?: string;
  to?: string;
  category?: ExpenseCategoryValue;
  paymentMethod?: PaymentMethod;
  includeDeleted?: boolean;
  limit?: number;
  page?: number;
  pageSize?: number;
};

export type ExpenseListRow = {
  id: string;
  expenseNumber: string;
  date: string;
  category: ExpenseCategoryValue;
  description: string | null;
  amount: string;
  paymentMethod: PaymentMethod;
  reference: string | null;
  notes: string | null;
  createdBy: string | null;
  deletedAt: string | null;
};

export type ExpenseSummaryRow = {
  category: ExpenseCategoryValue;
  paymentMethod: PaymentMethod;
  totalAmount: string;
  expenseCount: number;
};

export type CreateExpenseInput = {
  date: string;
  category: ExpenseCategoryValue;
  description?: string;
  amount: string | number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
};

export type UpdateExpenseInput = Partial<CreateExpenseInput>;

export class FinanceError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "FinanceError";
    this.code = code;
    this.details = details;
  }
}
