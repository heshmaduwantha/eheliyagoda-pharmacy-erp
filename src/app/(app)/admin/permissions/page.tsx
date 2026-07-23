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
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-text sm:text-4xl">Permissions</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-4 py-3 text-sm font-bold text-neutral-text shadow-[0_8px_30px_rgba(15,51,58,.04)]">
          <Sparkles className="size-4 text-brand-default" />
          {permissions.length} permissions
        </div>
      </div>

      <div className="grid gap-4">
        {Object.entries(grouped)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([module, rows]) => (
            <section className="overflow-hidden rounded-3xl border border-neutral-border bg-neutral-surface shadow-[0_8px_30px_rgba(15,51,58,.05)]" key={module}>
              <div className="border-b border-neutral-border bg-neutral-bg px-5 py-4">
                <h2 className="text-sm font-black uppercase tracking-[.18em] text-brand-default">{module}</h2>
                <p className="mt-1 text-xs text-neutral-muted">{rows.length} seeded permissions</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-neutral-muted">
                    <tr>
                      <th className="border-b border-neutral-border px-5 py-4 font-bold">Code</th>
                      <th className="border-b border-neutral-border px-5 py-4 font-bold">Resource</th>
                      <th className="border-b border-neutral-border px-5 py-4 font-bold">Action</th>
                      <th className="border-b border-neutral-border px-5 py-4 font-bold">Description</th>
                      <th className="border-b border-neutral-border px-5 py-4 font-bold">Sensitive</th>
                      <th className="border-b border-neutral-border px-5 py-4 font-bold">Roles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((permission) => (
                      <tr className="align-top hover:bg-brand-pale/30" key={permission.id}>
                        <td className="px-5 py-4 font-mono text-xs text-neutral-muted">{permission.code}</td>
                        <td className="px-5 py-4 text-neutral-muted">{permission.resource}</td>
                        <td className="px-5 py-4 text-neutral-muted">{permission.action}</td>
                        <td className="px-5 py-4 text-neutral-muted">{permission.description}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${permission.isSensitive ? "bg-status-danger-bg text-status-danger-text" : "bg-slate-100 text-neutral-muted"}`}>
                            {permission.isSensitive ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-neutral-muted">{permission.roleCount}</td>
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
