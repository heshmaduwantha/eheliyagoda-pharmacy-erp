import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/modules/auth/permissions";
import { searchProducts } from "@/modules/catalog/catalog.service";
import { listActiveSuppliers } from "@/modules/procurement/supplier.service";
import { GrnForm } from "@/modules/procurement/grn-form";

export default async function NewGrnPage() {
  await requirePermission("grn.manage");
  const [suppliers, { data: products }] = await Promise.all([listActiveSuppliers(), searchProducts({ pageSize: 500 })]);

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-text">Record a delivery</h1>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-4 py-2.5 text-sm font-semibold text-neutral-muted transition hover:border-neutral-border"
          href="/stock/grn"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
      </div>

      <section className="rounded-2xl border border-neutral-border bg-neutral-surface p-5 shadow-sm sm:p-6">
        {suppliers.length === 0 || products.length === 0 ? (
          <p className="rounded-xl border border-status-warning-bg bg-status-warning-bg px-4 py-3 text-sm font-semibold text-status-warning-text">
            You need at least one supplier and one product before recording a delivery.
          </p>
        ) : (
          <GrnForm
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              productType: p.productType,
              baseUnitName: p.baseUnitName,
              defaultSellingPrice: p.defaultSellingPrice != null ? Number(p.defaultSellingPrice) : null,
              units: p.units.map((u) => ({
                id: u.id,
                unitName: u.unitName,
                factorToBase: Number(u.factorToBase) || 1,
                isPurchaseDefault: u.isPurchaseDefault,
              })),
            }))}
            suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
          />
        )}
      </section>
    </div>
  );
}
