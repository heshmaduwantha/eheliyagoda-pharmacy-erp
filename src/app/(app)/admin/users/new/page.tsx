import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { UserForm } from "@/modules/admin/user-form";
import { listAdminRoles } from "@/modules/admin/rbac.service";
import { requirePermission } from "@/modules/auth/permissions";

export default async function AdminUsersNewPage() {
  await requirePermission("admin.users.manage");
  const { data: roles } = await listAdminRoles({ status: "active" });
  if (roles.length === 0) redirect("/admin/roles/new");

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.18em] text-teal-700">Administration</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Create user</h1>
          <p className="mt-2 text-slate-500">Create a staff account, assign roles, and set an initial password.</p>
        </div>
        <Link className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm" href="/admin/users">
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_50px_rgba(15,51,58,.06)] sm:p-8">
        <UserForm roles={roles} />
      </section>
    </div>
  );
}
