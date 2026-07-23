import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

async function main() {
  if (env.APP_ENV !== "uat" || env.UAT_MODE !== "true") throw new Error("APP_ENV=uat and UAT_MODE=true are required.");
  const client = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL ?? env.DATABASE_URL });
  try {
    const [negative, invalidMedicinePrice, inconsistentBatches] = await Promise.all([
      client.batch.count({ where: { qtyOnHandBase: { lt: 0 } } }),
      client.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "Batch" b INNER JOIN "Product" p ON p.id = b."productId" WHERE p."productType" = 'MEDICINE' AND b.mrp IS NOT NULL AND b."sellingPrice" > b.mrp`.then((rows) => Number(rows[0]?.count ?? 0)),
      client.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "Batch" b LEFT JOIN (SELECT "batchId", COALESCE(SUM("qtyBase"), 0) AS ledger_qty FROM "StockMovement" GROUP BY "batchId") m ON m."batchId" = b.id WHERE b."qtyOnHandBase" <> COALESCE(m.ledger_qty, 0)`.then((rows) => Number(rows[0]?.count ?? 0)),
    ]);
    const result = { status: negative || invalidMedicinePrice || inconsistentBatches ? "failed" : "ok", negativeStockBatches: negative, medicinePricesAboveMrp: invalidMedicinePrice, ledgerQuantityMismatches: inconsistentBatches };
    console.log(JSON.stringify(result));
    if (result.status !== "ok") process.exitCode = 1;
  } finally {
    await client.$disconnect();
  }
}

void main();
