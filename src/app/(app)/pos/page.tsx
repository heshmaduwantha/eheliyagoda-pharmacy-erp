import type { Metadata } from "next";
import { PosWorkspace } from "@/components/pos/PosWorkspace";
import { withPerformanceTrace } from "@/lib/performance";
import { requirePermission } from "@/modules/auth/permissions";
import { searchProductsForPos } from "@/modules/sales/pos.service";

export const metadata: Metadata = { title: "Point of Sale" };

export default async function PosPage() {
  return withPerformanceTrace({ route: "/pos", method: "RSC" }, async () => {
    await requirePermission("pos.access");
    const initialProducts = await searchProductsForPos("");
    return <PosWorkspace initialProducts={initialProducts} />;
  });
}
