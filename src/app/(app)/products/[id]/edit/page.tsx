import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/modules/auth/permissions";
import { ProductSettingsForm } from "@/modules/catalog/product-settings-form";
import { SetBreadcrumb } from "@/components/layout/breadcrumbs";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("product.manage");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      strength: true,
      baseUnitName: true,
      reorderLevel: true,
      isControlled: true,
      prescriptionRule: true,
      barcodes: { where: { isPrimary: true }, select: { barcode: true } },
    },
  });

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-2">
      <SetBreadcrumb segment={id} label={product.name} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-text sm:text-3xl">Edit Product</h1>
          <p className="mt-1 text-sm font-semibold text-neutral-muted">{product.name}</p>
        </div>
        <div className="shrink-0">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-border bg-neutral-surface px-4 py-2.5 text-xs font-bold text-neutral-text shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
          >
            <ArrowLeft className="size-3.5 text-brand-default" />
            Back to products
          </Link>
        </div>
      </div>

      <ProductSettingsForm
        product={{
          id: product.id,
          name: product.name,
          strength: product.strength ?? "",
          baseUnitName: product.baseUnitName,
          primaryBarcode: product.barcodes[0]?.barcode ?? "",
          reorderLevel: product.reorderLevel.toString(),
          isControlled: product.isControlled,
          prescriptionRule: product.prescriptionRule,
        }}
      />
    </div>
  );
}
