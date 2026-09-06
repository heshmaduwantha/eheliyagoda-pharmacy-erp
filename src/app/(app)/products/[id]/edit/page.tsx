import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/modules/auth/permissions";
import { ProductSettingsForm } from "@/modules/catalog/product-settings-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("product.manage");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const product = await prisma.product.findUnique({ where: { id }, select: {
    id: true, name: true, baseUnitName: true, reorderLevel: true, isControlled: true, prescriptionRule: true,
    barcodes: { where: { isPrimary: true }, select: { barcode: true } },
  } });
  if (!product) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/products" className="text-sm font-bold text-brand-default">← Back to products</Link>
      <div><h1 className="text-2xl font-black text-neutral-text">Edit product settings</h1><p className="mt-2 text-neutral-muted">{product.name}</p></div>
      <ProductSettingsForm product={{ id: product.id, baseUnitName: product.baseUnitName, primaryBarcode: product.barcodes[0]?.barcode ?? "", reorderLevel: product.reorderLevel.toString(), isControlled: product.isControlled, prescriptionRule: product.prescriptionRule }} />
    </div>
  );
}
