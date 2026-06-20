import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { requirePermission } from "@/modules/auth/permissions";

export default async function PosPage() { await requirePermission("pos.access"); return <PagePlaceholder title="Point of Sale" description="POS workflows are intentionally not implemented in this phase." />; }
