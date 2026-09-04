import type { ReactNode } from "react";

export function ReportTable({ headers, rows, emptyMessage }: { headers: string[]; rows: ReactNode[][]; emptyMessage: string }) {
  return <section className="overflow-hidden rounded-2xl border border-neutral-border bg-neutral-surface shadow-[0_8px_30px_rgba(15,51,58,.05)]"><div className="overflow-x-auto"><table className="w-full min-w-[860px] border-collapse text-left text-sm"><thead className="bg-neutral-bg text-xs uppercase tracking-wider text-neutral-muted"><tr>{headers.map((heading) => <th className="border-b border-neutral-border px-5 py-4 font-bold" key={heading}>{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row, rowIndex) => <tr className="hover:bg-brand-pale/30" key={rowIndex}>{row.map((value, columnIndex) => <td className={`px-5 py-4 ${columnIndex === 0 ? "font-semibold text-neutral-text" : "text-neutral-muted"}`} key={columnIndex}>{value}</td>)}</tr>)}{rows.length === 0 ? <tr><td className="px-5 py-16 text-center text-neutral-muted" colSpan={headers.length}>{emptyMessage}</td></tr> : null}</tbody></table></div></section>;
}

