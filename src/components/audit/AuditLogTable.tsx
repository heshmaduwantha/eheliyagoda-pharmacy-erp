"use client";

import { useEffect, useState } from "react";
import type { AuditLogReadRow } from "@/modules/audit/audit-query.service";
import { formatDateTime } from "@/lib/date-format";
import { TablePagination } from "@/components/common/TablePagination";

export function AuditLogTable({ rows }: { rows: AuditLogReadRow[] }) {
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
  const displayedLogs = rows.slice(startIndex, endIndex);

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-border bg-neutral-surface shadow-[0_8px_30px_rgba(15,51,58,.05)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
          <thead className="bg-brand-pale text-xs uppercase tracking-wider font-extrabold text-brand-hover border-b border-brand-default/15">
            <tr>
              {["Date", "Actor", "Action", "Entity", "Entity ID", "IP address", "User agent"].map((heading) => (
                <th className="px-5 py-3.5 font-extrabold" key={heading}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedLogs.map((log) => (
              <tr className="align-top hover:bg-brand-pale/30" key={log.id}>
                <td className="whitespace-nowrap px-5 py-4 text-neutral-muted">{formatDateTime(log.createdAt)}</td>
                <td className="px-5 py-4">
                  <strong className="block text-neutral-text">{log.actorName ?? "System"}</strong>
                  {log.actorUsername ? <span className="text-xs text-neutral-muted">{log.actorUsername}</span> : null}
                </td>
                <td className="px-5 py-4 font-semibold text-brand-default">{log.action}</td>
                <td className="px-5 py-4 text-neutral-muted">{log.entityType}</td>
                <td className="max-w-52 truncate px-5 py-4 font-mono text-xs text-neutral-muted" title={log.entityId ?? undefined}>
                  {log.entityId ?? "—"}
                </td>
                <td className="px-5 py-4 text-neutral-muted">{log.ipAddress ?? "—"}</td>
                <td className="max-w-72 truncate px-5 py-4 text-xs text-neutral-muted" title={log.userAgent ?? undefined}>
                  {log.userAgent ?? "—"}
                </td>
              </tr>
            ))}
            {totalRows === 0 && (
              <tr>
                <td className="px-5 py-16 text-center text-neutral-muted" colSpan={7}>
                  No audit logs yet
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
