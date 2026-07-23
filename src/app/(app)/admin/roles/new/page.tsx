import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RoleForm } from "@/modules/admin/role-form";
import { requirePermission } from "@/modules/auth/permissions";

export default async function AdminRolesNewPage() {
  await requirePermission("admin.roles.manage");

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.18em] text-teal-700">Administration</p>
          <h1 className="text-3xl font-black tracking-tight text-neutral-text">Create role</h1>
        </div>
        <Link className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm" href="/admin/roles">
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_50px_rgba(15,51,58,.06)] sm:p-8">
        <RoleForm />
      </section>
    </div>
  );
}
