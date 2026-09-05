import Link from "next/link";
import { Search } from "lucide-react";
import { requirePermission } from "@/modules/auth/permissions";
import { getSupplierReturnLogs } from "@/modules/inventory/inventory.service";
import { Pagination } from "@/components/ui/pagination";
import { AutoSubmit } from "@/components/ui/auto-submit";
import { SupplierReturnsTable } from "@/components/suppliers/SupplierReturnsTable";

export default async function SupplierReturnsLogPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requirePermission("supplier.manage");
  const { q, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const { data: logs, total } = await getSupplierReturnLogs({ search: q, page: currentPage });
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="flex flex-col gap-6 min-w-0">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-text sm:text-3xl">Supplier Returns Log</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-3 py-2 shadow-sm">
          <Search className="size-4 text-neutral-muted" />
          <input
            className="bg-transparent text-sm outline-none w-full"
            defaultValue={q}
            name="q"
            placeholder="Search return log..."
          />
          <AutoSubmit />
        </form>
        <Link
          className="inline-flex items-center gap-2 rounded-lg border border-brand-default/20 bg-brand-pale px-4 py-2 text-sm font-semibold text-brand-default shadow-sm transition hover:bg-brand-default hover:text-white"
          href="/stock/expiry"
        >
          View Expiry Stock →
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface shadow-sm">
        <SupplierReturnsTable logs={logs} />
        {logs.length > 0 && (
          <div className="p-4 border-t border-neutral-border">
            <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/suppliers/returns" queryParams={{ q }} />
          </div>
        )}
      </section>
    </div>
  );
}
