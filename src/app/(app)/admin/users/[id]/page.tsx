import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { UserForm } from "@/modules/admin/user-form";
import { getAdminUser, listAdminRoles } from "@/modules/admin/rbac.service";
import { requirePermission } from "@/modules/auth/permissions";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("admin.users.manage");
  const { id } = await params;
  const [user, { data: roles }] = await Promise.all([getAdminUser(id), listAdminRoles({ status: "active" })]);
  if (!user) notFound();

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-text">{user.name}</h1>
        </div>
        <Link className="inline-flex items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-4 py-3 text-sm font-bold text-neutral-text shadow-sm" href="/admin/users">
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </div>

      <section className="rounded-3xl border border-neutral-border bg-neutral-surface p-6 shadow-[0_14px_50px_rgba(15,51,58,.06)] sm:p-8">
        <UserForm roles={roles} user={user} />
      </section>
    </div>
  );
}
