import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/modules/audit/audit.service";
import { serverOnly } from "@/lib/server-only";

serverOnly();

export type CreateSupplierInput = {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditTermDays?: number;
};

/** Lists suppliers (active first) for procurement screens. */
export async function listSuppliers(options: { page?: number; pageSize?: number; search?: string } = {}) {
  const { page = 1, pageSize = 10, search } = options;
  const trimmed = search?.trim();

  const where: import("@prisma/client").Prisma.SupplierWhereInput = trimmed
    ? {
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { contactPerson: { contains: trimmed, mode: "insensitive" } },
          { phone: { contains: trimmed, mode: "insensitive" } },
          { email: { contains: trimmed, mode: "insensitive" } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.supplier.count({ where }),
  ]);

  return { data, total };
}

/** Active suppliers only — used to populate the GRN supplier selector. */
export function listActiveSuppliers() {
  return prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
}

export async function createSupplier(input: CreateSupplierInput, actorUserId: string) {
  return prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.create({
      data: {
        name: input.name,
        contactPerson: input.contactPerson || null,
        phone: input.phone || null,
        email: input.email || null,
        address: input.address || null,
        creditTermDays: input.creditTermDays ?? 0,
      },
    });

    await writeAuditLog(
      {
        actorUserId,
        action: "supplier.created",
        entityType: "SUPPLIER",
        entityId: supplier.id,
        afterData: { name: supplier.name },
      },
      tx,
    );

    return supplier;
  });
}
