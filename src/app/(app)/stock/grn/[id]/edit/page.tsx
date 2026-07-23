import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/form";
import { requirePermission } from "@/modules/auth/permissions";
import { getGrn } from "@/modules/procurement/grn.service";
import { listActiveSuppliers } from "@/modules/procurement/supplier.service";
import { searchProducts } from "@/modules/catalog/catalog.service";
import { GrnForm, type GrnFormInitialData } from "@/modules/procurement/grn-form";

export default async function EditGrnDraftPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("grn.manage");
  const { id } = await params;
  const grn = await getGrn(id);

  if (!grn) notFound();
  if (grn.status !== "DRAFT") {
    redirect(`/stock/grn/${grn.id}`);
  }

  const [suppliers, { data: products }] = await Promise.all([
    listActiveSuppliers(),
    searchProducts({ pageSize: 500 }),
  ]);

  const initialData: GrnFormInitialData = {
    id: grn.id,
    supplierId: grn.supplierId,
    notes: grn.notes ?? "",
    lines: grn.lines.map((line) => ({
      productId: line.productId,
      unitId: line.unitId,
      qtyInUnit: line.qtyInUnit.toString(),
      batchNo: line.batchNo ?? "",
      supplierBatchNo: line.supplierBatchNo ?? "",
      expiryDate: line.expiryDate ? line.expiryDate.toISOString().slice(0, 10) : "",
      mrp: line.mrp ? line.mrp.toString() : "",
      costPrice: line.costPrice.toString(),
      sellingPrice: line.sellingPrice.toString(),
    })),
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        action={
          <Link className="inline-flex items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-4 py-2 text-sm font-semibold text-neutral-muted" href={`/stock/grn/${grn.id}`}>
            <ArrowLeft className="size-4" /> Cancel
          </Link>
        }
        description="Update your saved draft before confirming."
        title={`Edit ${grn.grnNo}`}
      />
      <div className="mt-8">
        <GrnForm 
          initialData={initialData} 
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            productType: p.productType,
            units: p.units.map((u) => ({ id: u.id, unitName: u.unitName, isPurchaseDefault: u.isPurchaseDefault })),
          }))}
          suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
        />
      </div>
    </div>
  );
}
