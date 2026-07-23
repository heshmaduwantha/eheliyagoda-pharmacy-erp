import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requirePermission } from "@/modules/auth/permissions";
import { toggleUserActiveSubmitAction } from "@/modules/admin/rbac.actions";
import { listAdminUsers } from "@/modules/admin/rbac.service";
import { Pagination } from "@/components/ui/pagination";
import { AutoSubmit } from "@/components/ui/auto-submit";

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
        <Link className="inline-flex items-center gap-2 rounded-lg bg-brand-default px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-default" href="/admin/users/new">
          <Plus className="size-4" />
          New user
        </Link>
      </div>

      <form className="grid gap-3 rounded-xl border border-neutral-border bg-neutral-surface p-3 shadow-sm md:grid-cols-[1fr_220px_auto]">
        <label className="flex items-center gap-2 rounded-lg border border-neutral-border bg-neutral-bg px-3">
          <Search className="size-4 text-neutral-muted" />
          <input className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" defaultValue={params.search} name="search" placeholder="Search name, username, or role…" />
        </label>
        <select className="rounded-lg border border-neutral-border px-3 py-2 text-sm outline-none focus:border-brand-default" defaultValue={status} name="status">
          <option value="all">All users</option>
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
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Name</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Username</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Roles</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Status</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Created</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold">Updated</th>
                <th className="border-b border-neutral-border px-5 py-4 font-bold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td className="px-5 py-16 text-center text-neutral-muted" colSpan={7}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr className="align-top hover:bg-neutral-bg/50" key={user.id}>
                    <td className="px-5 py-4">
                      <strong className="block text-neutral-text">{user.name}</strong>
                      <span className="text-xs text-neutral-muted">Primary: {user.primaryRoleName}</span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-neutral-muted">{user.username}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.roleNames.map((roleName) => (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-neutral-text" key={`${user.id}-${roleName}`}>
                            {roleName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${user.isActive ? "bg-status-success-bg text-status-success-text" : "bg-status-danger-bg text-status-danger-text"}`}>{user.isActive ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="px-5 py-4 text-neutral-muted">{user.createdAt.slice(0, 10)}</td>
                    <td className="px-5 py-4 text-neutral-muted">{user.updatedAt.slice(0, 10)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link className="rounded-lg border border-neutral-border bg-neutral-surface px-3 py-2 text-sm font-semibold text-neutral-text hover:bg-neutral-bg" href={`/admin/users/${user.id}`}>
                          Edit
                        </Link>
                        <form action={toggleUserActiveFormAction}>
                          <input name="userId" type="hidden" value={user.id} />
                          <input name="nextActive" type="hidden" value={user.isActive ? "false" : "true"} />
                          <button className={`rounded-lg px-3 py-2 text-sm font-semibold ${user.isActive ? "border border-status-danger-bg bg-status-danger-bg text-status-danger-text hover:bg-status-danger-bg" : "border border-status-success-bg bg-status-success-bg text-status-success-text hover:bg-status-success-bg"}`} type="submit">
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
