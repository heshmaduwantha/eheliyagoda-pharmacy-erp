import { ShieldCheck, Sparkles } from "lucide-react";
import { requirePermission } from "@/modules/auth/permissions";
import { listAdminPermissions } from "@/modules/admin/rbac.service";

export default async function AdminPermissionsPage() {
  await requirePermission("admin.permissions.read");
  const permissions = await listAdminPermissions();
  const grouped = permissions.reduce<Record<string, typeof permissions>>((acc, permission) => {
    acc[permission.module] ??= [];
    acc[permission.module].push(permission);
    return acc;
  }, {});

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-teal-700">
            <ShieldCheck className="size-4" />
            Administration
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Permissions</h1>
          <p className="mt-2 text-slate-500">Read-only registry backed by the seeded permission catalog.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
          <Sparkles className="size-4 text-teal-600" />
          {permissions.length} permissions
        </div>
      </div>

      <div className="grid gap-4">
        {Object.entries(grouped)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([module, rows]) => (
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,51,58,.05)]" key={module}>
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                <h2 className="text-sm font-black uppercase tracking-[.18em] text-teal-700">{module}</h2>
                <p className="mt-1 text-xs text-slate-500">{rows.length} seeded permissions</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="border-b border-slate-200 px-5 py-4 font-bold">Code</th>
                      <th className="border-b border-slate-200 px-5 py-4 font-bold">Resource</th>
                      <th className="border-b border-slate-200 px-5 py-4 font-bold">Action</th>
                      <th className="border-b border-slate-200 px-5 py-4 font-bold">Description</th>
                      <th className="border-b border-slate-200 px-5 py-4 font-bold">Sensitive</th>
                      <th className="border-b border-slate-200 px-5 py-4 font-bold">Roles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((permission) => (
                      <tr className="align-top hover:bg-teal-50/30" key={permission.id}>
                        <td className="px-5 py-4 font-mono text-xs text-slate-600">{permission.code}</td>
                        <td className="px-5 py-4 text-slate-600">{permission.resource}</td>
                        <td className="px-5 py-4 text-slate-600">{permission.action}</td>
                        <td className="px-5 py-4 text-slate-600">{permission.description}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${permission.isSensitive ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
                            {permission.isSensitive ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{permission.roleCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
