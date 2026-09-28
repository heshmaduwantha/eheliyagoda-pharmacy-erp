import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/modules/auth/permissions";
import { serverOnly } from "@/lib/server-only";

serverOnly();

export async function GET(request: Request) {
  try {
    await requirePermission("grn.manage", { onDenied: "throw" });
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";

    const where: import("@prisma/client").Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (query) {
      where.OR = [
        { name: { startsWith: query, mode: "insensitive" } },
        { genericName: { startsWith: query, mode: "insensitive" } },
        { strength: { startsWith: query, mode: "insensitive" } },
        { barcodes: { some: { barcode: { startsWith: query } } } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        units: { orderBy: { factorToBase: "asc" } },
        barcodes: true,
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    return NextResponse.json(
      products.map((p) => ({
        id: p.id,
        name: p.name,
        genericName: p.genericName,
        strength: p.strength,
        productType: p.productType,
        baseUnitName: p.baseUnitName,
        defaultSellingPrice: p.defaultSellingPrice != null ? Number(p.defaultSellingPrice) : null,
        barcodes: p.barcodes.map((b) => b.barcode),
        units: p.units.map((u) => ({
          id: u.id,
          unitName: u.unitName,
          factorToBase: Number(u.factorToBase) || 1,
          isPurchaseDefault: u.isPurchaseDefault,
        })),
      }))
    );
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    return NextResponse.json(
      { error: error?.message ?? "Failed to search products" },
      { status: error?.status ?? 500 }
    );
  }
}
