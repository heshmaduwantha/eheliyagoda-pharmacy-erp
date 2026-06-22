import type { Metadata } from "next";
import { PosWorkspace } from "@/components/pos/PosWorkspace";
import { requirePermission } from "@/modules/auth/permissions";
import { searchProductsForPos } from "@/modules/sales/pos.service";

export const metadata: Metadata = { title: "Point of Sale" };

export default async function PosPage() {
  await requirePermission("pos.access");
  const initialProducts = await searchProductsForPos("");
  return <PosWorkspace initialProducts={initialProducts} />;
}
