import Link from "next/link";
import { Edit, Plus, Search, ToggleLeft, ToggleRight } from "lucide-react";
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
        <Link className="inline-flex items-center gap-2 rounded-lg bg-brand-default px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-default" href="/admin/users/new">
          <Plus className="size-4" />
          New user
        </Link>
      </div>

      <form className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
           <select className="rounded-full border border-neutral-border bg-neutral-surface px-4 py-1.5 text-sm font-semibold outline-none focus:border-brand-default" defaultValue={status} name="status">
             <option value="all">All users</option>
             <option value="active">Active</option>
             <option value="inactive">Inactive</option>
           </select>
        </div>
        <div className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-3 py-2 shadow-sm">
          <Search className="size-4 shrink-0 text-neutral-muted" />
          <input className="w-full bg-transparent text-sm outline-none" defaultValue={params.search} name="search" placeholder="Search name, username, or role…" />
        </div>
        <AutoSubmit />
      </form>

      <section className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm text-neutral-muted">
            <thead className="bg-brand-pale text-xs uppercase tracking-wider font-extrabold text-brand-hover border-b border-brand-default/15">
              <tr>
                <th className="px-5 py-3.5 font-extrabold">Name</th>
                <th className="px-5 py-3.5 font-extrabold">Username</th>
                <th className="px-5 py-3.5 font-extrabold">Roles</th>
                <th className="px-5 py-3.5 font-extrabold">Status</th>
                <th className="px-5 py-3.5 font-extrabold">Created</th>
                <th className="px-5 py-3.5 font-extrabold">Updated</th>
                <th className="px-5 py-3.5" />
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
                  <tr className="transition hover:bg-neutral-bg bg-neutral-surface" key={user.id}>
                    <td className="px-5 py-3.5">
                      <strong className="block text-neutral-text font-bold">{user.name}</strong>
                      <span className="text-xs text-neutral-muted">Primary: {user.primaryRoleName}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-neutral-muted">{user.username}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-2">
                        {user.roleNames.map((roleName) => (
                          <span className="rounded-full bg-brand-pale px-2 py-0.5 text-xs font-semibold text-brand-default" key={`${user.id}-${roleName}`}>
                            {roleName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${user.isActive ? "bg-status-success-bg text-status-success-text" : "bg-status-danger-bg text-status-danger-text"}`}>{user.isActive ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-muted">{user.createdAt.slice(0, 10)}</td>
                    <td className="px-5 py-3.5 text-neutral-muted">{user.updatedAt.slice(0, 10)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          aria-label="Edit user"
                          className="grid size-8 place-items-center rounded-lg border border-neutral-border bg-neutral-surface text-neutral-muted transition hover:bg-neutral-bg hover:text-neutral-text hover:border-brand-default"
                          href={`/admin/users/${user.id}`}
                          title="Edit user"
                        >
                          <Edit className="size-4" />
                        </Link>
                        <form action={toggleUserActiveFormAction}>
                          <input name="userId" type="hidden" value={user.id} />
                          <input name="nextActive" type="hidden" value={user.isActive ? "false" : "true"} />
                          <button
                            aria-label={user.isActive ? "Deactivate user" : "Activate user"}
                            className={`grid size-8 place-items-center rounded-lg border transition shadow-xs ${
                              user.isActive
                                ? "border-red-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                            title={user.isActive ? "Deactivate user" : "Activate user"}
                            type="submit"
                          >
                            {user.isActive ? <ToggleRight className="size-5 text-rose-600" /> : <ToggleLeft className="size-5 text-emerald-600" />}
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
