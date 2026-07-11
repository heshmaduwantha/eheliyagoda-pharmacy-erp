import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { requirePermission } from "@/modules/auth/permissions";

export default async function AdminSettingsPage() {
  await requirePermission("admin.settings.manage");
  return <PagePlaceholder title="Settings" description="Settings management will be implemented in a later phase." />;
}
