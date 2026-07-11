import { redirect } from "next/navigation";
import { requireAuth } from "@/modules/auth/permissions";

export default async function AdminIndexPage() {
  await requireAuth();
  redirect("/admin/users");
}
