import Link from "next/link";
import { ScrollText, Search } from "lucide-react";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import { requirePermission } from "@/modules/auth/permissions";
import { listAuditLogs } from "@/modules/audit/audit-query.service";

type Params = { search?: string; action?: string; entityType?: string; page?: string };

function pageHref(params: Params, page: number) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.action) query.set("action", params.action);
  if (params.entityType) query.set("entityType", params.entityType);
  query.set("page", String(page));
  return `/admin/audit?${query.toString()}`;
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requirePermission("audit.read");
  const params = await searchParams;
  const result = await listAuditLogs({
    search: params.search,
    action: params.action,
    entityType: params.entityType,
    page: Number(params.page) || 1,
  });

  return <div><div><p className="flex items-center gap-2 text-sm font-bold text-teal-700"><ScrollText className="size-4" />Read-only history</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Audit Log</h1><p className="mt-2 text-slate-500">Review important activity and changes.</p></div><form className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_220px_auto]"><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3"><Search className="size-4 text-slate-400" /><input className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" defaultValue={params.search} name="search" placeholder="Search actor, action, entity…" /></label><input className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500" defaultValue={params.action} name="action" placeholder="Action contains" /><input className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500" defaultValue={params.entityType} name="entityType" placeholder="Entity type" /><button className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white" type="submit">Apply</button></form><div className="mt-4"><AuditLogTable rows={result.rows} /></div><div className="mt-4 flex items-center justify-between text-sm text-slate-500"><span>{result.totalItems} log entries · Page {result.page} of {result.totalPages}</span><div className="flex gap-2">{result.page > 1 ? <Link className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700" href={pageHref(params, result.page - 1)}>Previous</Link> : null}{result.page < result.totalPages ? <Link className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700" href={pageHref(params, result.page + 1)}>Next</Link> : null}</div></div></div>;
}
