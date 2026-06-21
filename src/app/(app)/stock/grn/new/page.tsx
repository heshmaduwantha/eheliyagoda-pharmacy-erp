import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/form";
import { requirePermission } from "@/modules/auth/permissions";
import { searchProducts } from "@/modules/catalog/catalog.service";
import { listActiveSuppliers } from "@/modules/procurement/supplier.service";
import { GrnForm } from "@/modules/procurement/grn-form";

export default async function NewGrnPage() {
  await requirePermission("grn.manage");
  const [suppliers, products] = await Promise.all([listActiveSuppliers(), searchProducts()]);

  return (
    <div className="grid gap-7">
      <PageHeader
        action={
          <Link className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600" href="/stock/grn">
            <ArrowLeft className="size-4" /> Back
          </Link>
        }
        description="Saving creates a DRAFT GRN. A draft never moves stock — you confirm it on the next screen."
        title="New Direct GRN"
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {suppliers.length === 0 || products.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Add at least one supplier and one product before creating a GRN.
          </p>
        ) : (
          <GrnForm
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              productType: p.productType,
              units: p.units.map((u) => ({ id: u.id, unitName: u.unitName, isPurchaseDefault: u.isPurchaseDefault })),
            }))}
            suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
          />
        )}
      </section>
    </div>
  );
}
