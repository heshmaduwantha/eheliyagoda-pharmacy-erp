import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { requirePermission } from "@/modules/auth/permissions";

export default async function ExpensesPage() { await requirePermission("expense.manage"); return <PagePlaceholder title="Expenses" description="Expense workflows will be added in a later phase." />; }
