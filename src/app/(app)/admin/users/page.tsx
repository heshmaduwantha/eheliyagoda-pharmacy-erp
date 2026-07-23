import Link from "next/link";
import { Plus, Search, ShieldCheck } from "lucide-react";
import { requirePermission } from "@/modules/auth/permissions";
import { toggleUserActiveSubmitAction } from "@/modules/admin/rbac.actions";
import { listAdminUsers } from "@/modules/admin/rbac.service";
import { Pagination } from "@/components/ui/pagination";

type Params = { search?: string; status?: string; page?: string };

async function toggleUserActiveFormAction(formData: FormData) {
  "use server";

  await toggleUserActiveSubmitAction(formData);
}

function normalizeStatus(value?: string) {
  if (value === "active" || value === "inactive" || value === "all") return value;
  return "all";
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requirePermission("admin.users.manage");
  const params = await searchParams;
  const status = normalizeStatus(params.status);
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  
  const { data: users, total } = await listAdminUsers({ search: params.search, status, page: currentPage });
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-text sm:text-4xl">
            Users
          </h1>
        </div>
        <Link className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700" href="/admin/users/new">
          <Plus className="size-4" />
          New user
        </Link>
      </div>

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[1fr_220px_auto]">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
          <Search className="size-4 text-slate-400" />
          <input className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" defaultValue={params.search} name="search" placeholder="Search name, username, or role…" />
        </label>
        <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500" defaultValue={status} name="status">
          <option value="all">All users</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-900" type="submit">
          Filter
        </button>
      </form>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Name</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Username</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Roles</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Status</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Created</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold">Updated</th>
                <th className="border-b border-slate-200 px-5 py-4 font-bold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td className="px-5 py-16 text-center text-slate-400" colSpan={7}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr className="align-top hover:bg-slate-50/50" key={user.id}>
                    <td className="px-5 py-4">
                      <strong className="block text-slate-800">{user.name}</strong>
                      <span className="text-xs text-slate-400">Primary: {user.primaryRoleName}</span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">{user.username}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.roleNames.map((roleName) => (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700" key={`${user.id}-${roleName}`}>
                            {roleName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{user.isActive ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{user.createdAt.slice(0, 10)}</td>
                    <td className="px-5 py-4 text-slate-500">{user.updatedAt.slice(0, 10)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href={`/admin/users/${user.id}`}>
                          Edit
                        </Link>
                        <form action={toggleUserActiveFormAction}>
                          <input name="userId" type="hidden" value={user.id} />
                          <input name="nextActive" type="hidden" value={user.isActive ? "false" : "true"} />
                          <button className={`rounded-lg px-3 py-2 text-sm font-semibold ${user.isActive ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`} type="submit">
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {users.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/admin/users" queryParams={{ search: params.search, status: params.status }} />
        )}
      </section>
    </div>
  );
}
