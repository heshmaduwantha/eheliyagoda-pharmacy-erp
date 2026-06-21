import "server-only";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/modules/audit/audit.service";

export type CreateSupplierInput = {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditTermDays?: number;
};

/** Lists suppliers (active first) for procurement screens. */
export function listSuppliers() {
  return prisma.supplier.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    take: 200,
  });
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
