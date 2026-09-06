"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/money";
import type { ExpenseListRow } from "@/modules/finance/expense.types";
import { TablePagination } from "@/components/common/TablePagination";

function categoryLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ExpenseTable({ expenses }: { expenses: ExpenseListRow[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [expenses]);

  const totalRows = expenses.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const validPage = Math.min(currentPage, totalPages);

  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const displayedExpenses = expenses.slice(startIndex, endIndex);

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-border bg-neutral-surface shadow-[0_8px_30px_rgba(15,51,58,.05)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-brand-pale text-xs uppercase tracking-wider font-extrabold text-brand-hover border-b border-brand-default/15">
            <tr>
              <th className="px-5 py-3.5 font-extrabold">Date</th>
              <th className="px-5 py-3.5 font-extrabold">Expense no.</th>
              <th className="px-5 py-3.5 font-extrabold">Category</th>
              <th className="px-5 py-3.5 font-extrabold">Description</th>
              <th className="px-5 py-3.5 font-extrabold">Amount</th>
              <th className="px-5 py-3.5 font-extrabold">Payment method</th>
              <th className="px-5 py-3.5 font-extrabold">Reference</th>
              <th className="px-5 py-3.5 font-extrabold">Created by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {totalRows === 0 ? (
              <tr>
                <td className="px-5 py-16 text-center text-neutral-muted" colSpan={8}>
                  No expenses recorded yet.
                </td>
              </tr>
            ) : (
              displayedExpenses.map((expense) => (
                <tr className={expense.deletedAt ? "bg-neutral-bg/70 text-neutral-muted" : "hover:bg-brand-pale/30"} key={expense.id}>
                  <td className="px-5 py-4 font-semibold text-neutral-text">{expense.date}</td>
                  <td className="px-5 py-4 text-neutral-muted">{expense.expenseNumber}</td>
                  <td className="px-5 py-4 text-neutral-muted">{categoryLabel(expense.category)}</td>
                  <td className="px-5 py-4 text-neutral-muted">{expense.description ?? "—"}</td>
                  <td className="px-5 py-4 font-semibold text-neutral-text">{formatMoney(expense.amount)}</td>
                  <td className="px-5 py-4 text-neutral-muted">{expense.paymentMethod}</td>
                  <td className="px-5 py-4 text-neutral-muted">{expense.reference ?? "—"}</td>
                  <td className="px-5 py-4 text-neutral-muted">{expense.createdBy ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={validPage}
        totalItems={totalRows}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />
    </section>
  );
}
