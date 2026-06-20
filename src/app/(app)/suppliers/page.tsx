import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { requirePermission } from "@/modules/auth/permissions";

export default async function SuppliersPage() { await requirePermission("supplier.manage"); return <PagePlaceholder title="Suppliers" description="Supplier management workflows will be added in a later phase." />; }
