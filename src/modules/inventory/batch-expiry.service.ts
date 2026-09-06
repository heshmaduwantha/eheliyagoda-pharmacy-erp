import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serverOnly } from "@/lib/server-only";

serverOnly();

const PAGE_SIZE = 25;

export async function getBatchExpiryList(search: string, requestedPage: number) {
  const query = search.trim();
  const where: Prisma.BatchWhereInput = {
    qtyOnHandBase: { gt: 0 },
    ...(query ? {
      OR: [
        { batchNo: { contains: query, mode: "insensitive" } },
        { product: { name: { contains: query, mode: "insensitive" } } },
        { product: { barcodes: { some: { barcode: { contains: query, mode: "insensitive" } } } } },
      ],
    } : {}),
  };
  const total = await prisma.batch.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number.isSafeInteger(requestedPage) ? requestedPage : 1), totalPages);
  const rows = await prisma.batch.findMany({
    where,
    select: { id: true, batchNo: true, expiryDate: true, product: { select: { name: true } } },
    orderBy: [{ expiryDate: { sort: "asc", nulls: "last" } }, { id: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
  return { rows, total, page, totalPages };
}
