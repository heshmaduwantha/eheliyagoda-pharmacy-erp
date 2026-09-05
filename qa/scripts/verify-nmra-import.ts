import { prisma } from "@/lib/prisma";

async function main() {
  const auditRows = await prisma.auditLog.findMany({ where: { action: "product.nmra_imported", entityType: "PRODUCT" }, select: { entityId: true } });
  const productIds = [...new Set(auditRows.map((row) => row.entityId).filter((id): id is string => Boolean(id)))];
  const [imported, pricedProducts, units, pricedUnits, invalidFactors, barcodes, duplicateKeys] = await Promise.all([
    prisma.product.count({ where: { id: { in: productIds } } }),
    prisma.product.count({ where: { id: { in: productIds }, defaultSellingPrice: { not: null } } }),
    prisma.productUnit.count({ where: { productId: { in: productIds } } }),
    prisma.productUnit.count({ where: { productId: { in: productIds }, sellingPrice: { not: null } } }),
    prisma.productUnit.count({ where: { productId: { in: productIds }, factorToBase: { lte: 0 } } }),
    prisma.productBarcode.count({ where: { productId: { in: productIds } } }),
    prisma.$queryRaw<Array<{ duplicate_count: bigint }>>`
      SELECT COUNT(*)::bigint AS duplicate_count FROM (
        SELECT lower(regexp_replace(concat_ws('|', "genericName", "strength", "form"), '[^a-zA-Z0-9]+', '', 'g')) AS identity_key
        FROM "Product"
        WHERE "genericName" IS NOT NULL AND "strength" IS NOT NULL AND "form" IS NOT NULL
        GROUP BY lower(regexp_replace(concat_ws('|', "genericName", "strength", "form"), '[^a-zA-Z0-9]+', '', 'g'))
        HAVING COUNT(*) > 1
      ) duplicates
    `,
  ]);
  console.log(JSON.stringify({ imported, pricedProducts, units, pricedUnits, invalidFactors, barcodes, duplicateFormulationKeys: Number(duplicateKeys[0]?.duplicate_count ?? 0) }));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
