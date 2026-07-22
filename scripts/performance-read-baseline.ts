import { performance } from "node:perf_hooks";
import { prisma } from "@/lib/prisma";
import { withPerformanceTrace } from "@/lib/performance";
import { getBootstrapState } from "@/modules/admin/rbac.service";
import { getUserPermissions } from "@/modules/auth/session";
import { searchProducts } from "@/modules/catalog/catalog.service";
import { getDashboardMetrics } from "@/modules/dashboard/dashboard.service";
import { searchProductsForPos } from "@/modules/sales/pos.service";

type BenchmarkResult = {
  flow: string;
  totalMs: number;
  payloadBytes: number;
};

async function benchmark<T>(flow: string, operation: () => Promise<T>): Promise<BenchmarkResult> {
  const startedAt = performance.now();
  const result = await withPerformanceTrace({ route: `benchmark:${flow}`, method: "READ" }, operation);
  return {
    flow,
    totalMs: Math.round((performance.now() - startedAt) * 10) / 10,
    payloadBytes: Buffer.byteLength(JSON.stringify(result)),
  };
}

async function run() {
  const activeUser = await prisma.user.findFirst({ where: { isActive: true }, select: { id: true } });
  const firstProduct = await prisma.product.findFirst({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { name: true },
  });
  const productQuery = firstProduct?.name.slice(0, 3) ?? "";

  const loadDashboard = getDashboardMetrics;

  // Warm every measured query shape so the results represent a long-running app,
  // not Prisma engine startup or the first remote connection in a fresh process.
  await getBootstrapState();
  if (activeUser) await getUserPermissions(activeUser.id);
  await loadDashboard();
  await searchProductsForPos("");
  await searchProductsForPos(productQuery);
  await searchProducts({ query: productQuery });

  const results: BenchmarkResult[] = [];
  results.push(await benchmark("login-preflight", getBootstrapState));
  if (activeUser) {
    results.push(await benchmark("permission-resolution", () => getUserPermissions(activeUser.id)));
  }
  results.push(await benchmark("dashboard", loadDashboard));
  results.push(await benchmark("pos-load", () => searchProductsForPos("")));
  results.push(await benchmark("product-search", () => searchProductsForPos(productQuery)));
  results.push(await benchmark("catalog-list", () => searchProducts({ query: productQuery })));

  console.info(`[performance.baseline] ${JSON.stringify(results)}`);
}

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Performance baseline failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
