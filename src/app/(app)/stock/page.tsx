import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { requirePermission } from "@/modules/auth/permissions";

export default async function StockPage() { await requirePermission("stock.access"); return <PagePlaceholder title="Stock" description="Inventory and stock workflows are intentionally not implemented in this phase." />; }
