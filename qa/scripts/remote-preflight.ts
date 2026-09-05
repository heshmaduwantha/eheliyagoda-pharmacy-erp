import { prisma } from "@/lib/prisma";

async function main() {
  const invalidFactors = await prisma.$queryRaw<Array<{
    id: string;
    productId: string;
    productName: string;
    unitName: string;
    factorToBase: string;
  }>>`
    SELECT u.id, u."productId", p.name AS "productName", u."unitName", u."factorToBase"::text AS "factorToBase"
    FROM "ProductUnit" u
    INNER JOIN "Product" p ON p.id = u."productId"
    WHERE u."factorToBase" <= 0
    ORDER BY p.name, u."unitName", u.id
  `;

  console.log(JSON.stringify({
    check: "ProductUnit.factorToBase > 0",
    invalidCount: invalidFactors.length,
    invalidFactors,
  }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
