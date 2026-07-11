import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { RoleForm } from "@/modules/admin/role-form";
import { getAdminRole } from "@/modules/admin/rbac.service";
import { requirePermission } from "@/modules/auth/permissions";

export default async function AdminRoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("admin.roles.manage");
  const { id } = await params;
  const role = await getAdminRole(id);
  if (!role) notFound();

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-teal-700">
            <ShieldCheck className="size-4" />
            Role profile
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">{role.name}</h1>
          <p className="mt-2 text-slate-500">{role.code} · {role.userCount} users</p>
        </div>
        <Link className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm" href="/admin/roles">
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_50px_rgba(15,51,58,.06)] sm:p-8">
        <RoleForm role={role} />
      </section>
    </div>
  );
}
