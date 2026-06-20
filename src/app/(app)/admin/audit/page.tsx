import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { requirePermission } from "@/modules/auth/permissions";

export default async function AuditPage() { await requirePermission("audit.view"); return <PagePlaceholder title="Audit Log" description="Audit-log browsing will be added after the audit foundation is available." />; }
