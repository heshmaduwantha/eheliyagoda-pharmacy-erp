import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/modules/audit/audit.service";
import { serverOnly } from "@/lib/server-only";
import { GrnStatus } from "@prisma/client";

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

  const data = await prisma.supplier.findMany({
    where,
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const total = await prisma.supplier.count({ where });

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

    try {
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
    } catch {
      // audit log error fallback
    }

    return supplier;
  }, { maxWait: 10000, timeout: 20000 });
}

export async function setSupplierActive(supplierId: string, isActive: boolean, actorUserId: string) {
  return prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) throw new Error("Supplier not found.");

    if (supplier.isActive === isActive) return supplier;

    if (!isActive) {
      const draftGrnCount = await tx.grn.count({ where: { supplierId, status: GrnStatus.DRAFT } });
      if (draftGrnCount > 0) {
        throw new Error("This supplier has a draft GRN. Complete or cancel it before deactivating the supplier.");
      }
    }

    const updated = await tx.supplier.update({ where: { id: supplierId }, data: { isActive } });
    try {
      await writeAuditLog(
        {
          actorUserId,
          action: isActive ? "supplier.activated" : "supplier.deactivated",
          entityType: "SUPPLIER",
          entityId: updated.id,
          beforeData: { isActive: supplier.isActive },
          afterData: { isActive: updated.isActive, name: updated.name },
        },
        tx,
      );
    } catch {
      // audit log error fallback
    }

    return updated;
  }, { maxWait: 10000, timeout: 20000 });
}

export type UpdateSupplierInput = {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditTermDays?: number;
};

export async function updateSupplier(supplierId: string, input: UpdateSupplierInput, actorUserId: string) {
  return prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) throw new Error("Supplier not found.");

    const updated = await tx.supplier.update({
      where: { id: supplierId },
      data: {
        name: input.name,
        contactPerson: input.contactPerson || null,
        phone: input.phone || null,
        email: input.email || null,
        address: input.address || null,
        creditTermDays: input.creditTermDays ?? 0,
      },
    });

    try {
      await writeAuditLog(
        {
          actorUserId,
          action: "supplier.updated",
          entityType: "SUPPLIER",
          entityId: updated.id,
          beforeData: { name: supplier.name, email: supplier.email, phone: supplier.phone },
          afterData: { name: updated.name, email: updated.email, phone: updated.phone },
        },
        tx,
      );
    } catch {
      // audit log error fallback
    }

    return updated;
  }, { maxWait: 10000, timeout: 20000 });
}

