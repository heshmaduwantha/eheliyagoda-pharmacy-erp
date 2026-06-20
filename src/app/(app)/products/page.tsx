import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { requirePermission } from "@/modules/auth/permissions";

export default async function ProductsPage() { await requirePermission("product.manage"); return <PagePlaceholder title="Products" description="Product catalogue workflows are intentionally not implemented in this phase." />; }
