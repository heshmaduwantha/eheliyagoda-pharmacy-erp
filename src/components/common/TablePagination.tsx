"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
};

export function TablePagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: Props) {
  if (totalItems <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-neutral-border bg-neutral-surface px-5 py-3 text-xs text-neutral-muted">
      <div className="flex flex-wrap items-center gap-2">
        <span>
          Showing <strong className="text-neutral-text">{startIndex + 1}</strong> to{" "}
          <strong className="text-neutral-text">{endIndex}</strong> of{" "}
          <strong className="text-neutral-text">{totalItems}</strong> entries
        </span>
        {onPageSizeChange && (
          <>
            <span className="text-neutral-border">|</span>
            <div className="flex items-center gap-1">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="rounded-lg border border-neutral-border bg-white px-2 py-1 text-xs font-semibold text-neutral-text outline-none focus:border-brand-default cursor-pointer"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span>per page</span>
            </div>
          </>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, validPage - 1))}
            disabled={validPage === 1}
            className="inline-flex items-center gap-1 rounded-lg border border-neutral-border px-2.5 py-1.5 font-semibold text-neutral-text transition hover:bg-neutral-subtle hover:border-neutral-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-neutral-border cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="size-3.5" />
            <span>Prev</span>
          </button>

          <div className="flex items-center gap-1 px-2 font-bold text-neutral-text">
            <span>Page {validPage} of {totalPages}</span>
          </div>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, validPage + 1))}
            disabled={validPage === totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-neutral-border px-2.5 py-1.5 font-semibold text-neutral-text transition hover:bg-neutral-subtle hover:border-neutral-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-neutral-border cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
