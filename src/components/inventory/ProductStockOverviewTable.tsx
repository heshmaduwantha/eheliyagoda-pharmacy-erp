"use client";

import { useEffect, useState } from "react";
import type { InventoryProductSummaryRecord } from "@/modules/inventory/inventory.types";
import { formatInventoryQty } from "@/modules/inventory/inventory.utils";
import { TablePagination } from "@/components/common/TablePagination";

function batchLabel(count: number) {
  return `${count} ${count === 1 ? "batch" : "batches"}`;
}

export function ProductStockOverviewTable({ rows }: { rows: InventoryProductSummaryRecord[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-brand-pale text-xs uppercase tracking-wider font-extrabold text-brand-hover border-b border-brand-default/15">
            <tr>
              {["Product", "Active stock", "Removed / unavailable"].map((heading) => (
                <th className="px-5 py-3.5 font-extrabold" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedRows.map((product) => (
              <tr className="hover:bg-brand-pale/30" key={product.id}>
                <td className="px-5 py-4">
                  <strong className="block text-neutral-text">{product.productName}</strong>
                  <span className="mt-1 block text-xs text-neutral-muted">
                    {product.primaryBarcode ? `Barcode: ${product.primaryBarcode}` : product.baseUnit}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <strong className="text-base text-status-success-text">
                    {formatInventoryQty(product.activeQuantity)} {product.baseUnit}
                  </strong>
                  <span className="ml-2 text-xs font-semibold text-neutral-muted">
                    Active · {batchLabel(product.activeBatchCount)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {product.unavailableStock.length ? (
                    <div className="grid gap-1.5">
                      {product.unavailableStock.map((stock) => (
                        <span className="text-sm text-neutral-text" key={stock.reason}>
                          <strong className="text-status-danger-text">
                            {formatInventoryQty(stock.quantity)} {product.baseUnit}
                          </strong>
                          <span className="ml-2 text-xs font-semibold text-neutral-muted">
                            {stock.reason} · {batchLabel(stock.batchCount)}
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-neutral-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            {totalRows === 0 && (
              <tr>
                <td className="px-5 py-16 text-center text-neutral-muted" colSpan={3}>
                  No stock history found.
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
