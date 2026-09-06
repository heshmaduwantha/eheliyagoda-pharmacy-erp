"use client";

import { useEffect, useState, type ReactNode } from "react";
import { TablePagination } from "@/components/common/TablePagination";

export function ReportTable({
  headers,
  rows,
  emptyMessage,
  initialPageSize = 10,
}: {
  headers: string[];
  rows: ReactNode[][];
  emptyMessage: string;
  initialPageSize?: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Reset to page 1 whenever rows array changes (e.g., date range or report tab switch)
  useEffect(() => {
    setCurrentPage(1);
  }, [rows]);

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const validPage = Math.min(currentPage, totalPages);

  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const displayedRows = rows.slice(startIndex, endIndex);

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-border bg-neutral-surface shadow-[0_8px_30px_rgba(15,51,58,.05)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead className="bg-brand-pale text-xs uppercase tracking-wider font-extrabold text-brand-hover border-b border-brand-default/15">
            <tr>
              {headers.map((heading) => (
                <th className="px-5 py-3.5 font-extrabold" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedRows.map((row, rowIndex) => (
              <tr className="hover:bg-brand-pale/30" key={startIndex + rowIndex}>
                {row.map((value, columnIndex) => (
                  <td
                    className={`px-5 py-4 ${
                      columnIndex === 0 ? "font-semibold text-neutral-text" : "text-neutral-muted"
                    }`}
                    key={columnIndex}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
            {totalRows === 0 && (
              <tr>
                <td className="px-5 py-16 text-center text-neutral-muted" colSpan={headers.length}>
                  {emptyMessage}
                </td>
              </tr>
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
