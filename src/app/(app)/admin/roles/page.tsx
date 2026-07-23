import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requirePermission } from "@/modules/auth/permissions";
import { listAdminRoles } from "@/modules/admin/rbac.service";
import { Pagination } from "@/components/ui/pagination";
import { AutoSubmit } from "@/components/ui/auto-submit";

type Params = { search?: string; status?: string; page?: string };

function normalizeStatus(value?: string) {
  if (value === "active" || value === "inactive" || value === "all") return value;
  return "all";
}

export default async function AdminRolesPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requirePermission("admin.roles.manage");
  const params = await searchParams;
  const status = normalizeStatus(params.status);
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  
  const { data: roles, total } = await listAdminRoles({ search: params.search, status, page: currentPage });
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-text sm:text-4xl">Roles</h1>
        </div>
        <Link className="inline-flex items-center gap-2 rounded-lg bg-brand-default px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-default" href="/admin/roles/new">
          <Plus className="size-4" />
          New role
        </Link>
      </div>

      <form className="grid gap-3 rounded-xl border border-neutral-border bg-neutral-surface p-3 shadow-sm md:grid-cols-[1fr_220px]">
        <label className="flex items-center gap-2 rounded-lg border border-neutral-border bg-neutral-bg px-3">
          <Search className="size-4 text-neutral-muted" />
          <input className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" defaultValue={params.search} name="search" placeholder="Search code, name, or description…" />
        </label>
        <select className="rounded-lg border border-neutral-border px-3 py-2 text-sm outline-none focus:border-brand-default" defaultValue={status} name="status">
          <option value="all">All roles</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <AutoSubmit />
      </form>

      <section className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm text-neutral-muted">
            <thead className="bg-neutral-bg text-xs uppercase tracking-wider text-neutral-muted">
              <tr>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Role</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Code</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Description</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Users</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Permissions</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Status</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roles.length === 0 ? (
                <tr>
                  <td className="px-5 py-16 text-center text-neutral-muted" colSpan={7}>
                    No roles found.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr className="align-top hover:bg-neutral-bg/50" key={role.id}>
                    <td className="px-5 py-4">
                      <strong className="block text-neutral-text">{role.name}</strong>
                      {role.isSystem ? <span className="mt-1 inline-flex rounded-full bg-status-warning-bg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-status-warning-text">System</span> : null}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-neutral-muted">{role.code}</td>
                    <td className="px-5 py-4 text-neutral-muted">{role.description ?? "—"}</td>
                    <td className="px-5 py-4 text-neutral-muted">{role.userCount}</td>
                    <td className="px-5 py-4 text-neutral-muted">{role.permissionCount}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${role.isActive ? "bg-status-success-bg text-status-success-text" : "bg-status-danger-bg text-status-danger-text"}`}>{role.isActive ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link className="rounded-lg border border-neutral-border bg-neutral-surface px-3 py-2 text-sm font-semibold text-neutral-text hover:bg-neutral-bg" href={`/admin/roles/${role.id}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {roles.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/admin/roles" queryParams={{ search: params.search, status: params.status }} />
        )}
      </section>
    </div>
  );
}
