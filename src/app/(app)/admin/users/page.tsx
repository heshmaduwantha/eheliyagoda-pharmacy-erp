import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { requirePermission } from "@/modules/auth/permissions";

export default async function AdminUsersPage() { await requirePermission("user.manage"); return <PagePlaceholder title="User Administration" description="User management will be introduced with Auth/RBAC tasks." />; }
