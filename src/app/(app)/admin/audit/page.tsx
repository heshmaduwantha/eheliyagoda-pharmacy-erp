import { ScrollText, Search } from "lucide-react";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import { requirePermission } from "@/modules/auth/permissions";
import { listAuditLogs } from "@/modules/audit/audit-query.service";
import { Pagination } from "@/components/ui/pagination";

type Params = { search?: string; action?: string; entityType?: string; page?: string };

export default async function AuditPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requirePermission("audit.read");
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const result = await listAuditLogs({
    search: params.search,
    action: params.action,
    entityType: params.entityType,
    page: currentPage,
  });

  return <div><div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><h1 className="text-3xl font-black tracking-tight text-neutral-text sm:text-4xl">Audit Log</h1></div></div><form className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_220px_auto]"><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3"><Search className="size-4 text-slate-400" /><input className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" defaultValue={params.search} name="search" placeholder="Search actor, action, entity…" /></label><input className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500" defaultValue={params.action} name="action" placeholder="Action contains" /><input className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500" defaultValue={params.entityType} name="entityType" placeholder="Entity type" /><button className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white" type="submit">Apply</button></form><div className="mt-4"><AuditLogTable rows={result.rows} /></div><div className="mt-4 flex items-center justify-between text-sm text-slate-500"><span>{result.totalItems} log entries · Page {result.page} of {result.totalPages}</span><div className="flex gap-2"><Pagination currentPage={result.page} totalPages={result.totalPages} baseUrl="/admin/audit" queryParams={{ search: params.search, action: params.action, entityType: params.entityType }} /></div></div></div>;
}
