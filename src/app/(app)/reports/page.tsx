import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { requirePermission } from "@/modules/auth/permissions";

export default async function ReportsPage() { await requirePermission("report.view"); return <PagePlaceholder title="Reports" description="Reporting workflows are intentionally not implemented in this phase." />; }
