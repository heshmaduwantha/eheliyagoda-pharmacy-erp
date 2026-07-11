import Link from "next/link";
import { Plus, Search, ShieldCheck } from "lucide-react";
import { requirePermission } from "@/modules/auth/permissions";
import { listAdminRoles } from "@/modules/admin/rbac.service";

type Params = { search?: string; status?: string };

function normalizeStatus(value?: string) {
  if (value === "active" || value === "inactive" || value === "all") return value;
  return "all";
}

export default async function AdminRolesPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requirePermission("admin.roles.manage");
  const params = await searchParams;
  const status = normalizeStatus(params.status);
  const roles = await listAdminRoles({ search: params.search, status });

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-teal-700">
            <ShieldCheck className="size-4" />
            Administration
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Roles</h1>
          <p className="mt-2 text-slate-500">Create and tune role permission bundles with system-role safeguards.</p>
        </div>
        <Link className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-teal-700/20" href="/admin/roles/new">
          <Plus className="size-4" />
          New role
        </Link>
      </div>

      <form className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_auto]">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
          <Search className="size-4 text-slate-400" />
          <input className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" defaultValue={params.search} name="search" placeholder="Search code, name, or description…" />
        </label>
        <select className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500" defaultValue={status} name="status">
          <option value="all">All roles</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white" type="submit">
          Filter
        </button>
      </form>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,51,58,.05)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Role</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Code</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Description</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Users</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Permissions</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Status</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roles.length === 0 ? (
                <tr>
                  <td className="px-5 py-16 text-center text-slate-400" colSpan={7}>
                    No roles found.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr className="align-top hover:bg-teal-50/30" key={role.id}>
                    <td className="px-5 py-4">
                      <strong className="block text-slate-800">{role.name}</strong>
                      {role.isSystem ? <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-amber-700">System</span> : null}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">{role.code}</td>
                    <td className="px-5 py-4 text-slate-600">{role.description ?? "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{role.userCount}</td>
                    <td className="px-5 py-4 text-slate-600">{role.permissionCount}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${role.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{role.isActive ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" href={`/admin/roles/${role.id}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
