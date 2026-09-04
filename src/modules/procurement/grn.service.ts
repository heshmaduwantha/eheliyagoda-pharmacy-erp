import { randomUUID } from "node:crypto";
import { BatchStatus, GrnStatus, Prisma, ProductType, StockMovementType, SupplierInvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/modules/audit/audit.service";
import { serverOnly } from "@/lib/server-only";

serverOnly();

export type GrnLineInput = {
  productId: string;
  unitId: string;
  qtyInUnit: number;
  supplierBatchNo?: string;
  expiryDate?: string;
  mrp?: number;
  costPrice: number;
  sellingPrice: number;
};

export type CreateGrnInput = {
  supplierId: string;
  notes?: string;
  lines: GrnLineInput[];
};

function datePart(date = new Date()) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

const GRN_TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 30_000 } as const;

function systemBatchNumber(grnNo: string, lineNumber: number) {
  return `BATCH-${grnNo}-${String(lineNumber).padStart(2, "0")}`;
}

/**
 * Builds the next number for a daily-sequenced reference, e.g. INV-20260621-0001.
 * The sequence resets each day and is derived from the latest existing number
 * with the same prefix, read inside the caller's transaction.
 */
async function nextDailyNumber(
  prefix: string,
  latest: string | null | undefined,
) {
  let seq = 1;
  if (latest) {
    const parsed = Number(latest.slice(prefix.length + 1));
    if (Number.isFinite(parsed)) seq = parsed + 1;
  }
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export async function listGrns(options: { page?: number; pageSize?: number; search?: string } = {}) {
  const { page = 1, pageSize = 10, search } = options;
  const trimmed = search?.trim();

  const where: Prisma.GrnWhereInput = trimmed
    ? {
        OR: [
          { grnNo: { contains: trimmed, mode: "insensitive" } },
          { supplierInvoiceNo: { contains: trimmed, mode: "insensitive" } },
          { supplier: { name: { contains: trimmed, mode: "insensitive" } } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.grn.findMany({
      where,
      include: { supplier: { select: { name: true } }, _count: { select: { lines: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.grn.count({ where }),
  ]);

  return { data, total };
}

export async function getGrn(id: string) {
  const grn = await prisma.grn.findUnique({
    where: { id },
    include: {
      supplier: true,
      lines: { include: { product: { select: { name: true, genericName: true, productType: true } }, unit: true, batch: { select: { id: true } } } },
      invoice: true,
    },
  });

  if (!grn) return null;

  let receivedByUser: { name: string } | null = null;
  if (grn.receivedById) {
    receivedByUser = await prisma.user.findUnique({
      where: { id: grn.receivedById },
      select: { name: true },
    });
  }

  return {
    ...grn,
    receivedBy: receivedByUser,
  };
}

/**
 * Creates a DRAFT GRN with its lines. A draft never moves stock; quantities are
 * converted to base units now so confirmation is a pure ledger operation.
 */
export async function createGrnDraft(input: CreateGrnInput, actorUserId: string) {
  const unitIds = [...new Set(input.lines.map((l) => l.unitId))];
  const productIds = [...new Set(input.lines.map((l) => l.productId))];
  const units = await prisma.productUnit.findMany({ where: { id: { in: unitIds } } });
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } });
  const unitById = new Map(units.map((u) => [u.id, u]));
  const productIdsFound = new Set(products.map((product) => product.id));

  // Invoice total is calculated from the lines (quantity x cost), never typed in.
  const invoiceTotal = input.lines.reduce(
    (sum, line) => sum.add(new Prisma.Decimal(line.qtyInUnit).mul(line.costPrice)),
    new Prisma.Decimal(0),
  );

  return prisma.$transaction(async (tx) => {
    const stamp = datePart();
    const grnPrefix = `GRN-${stamp}`;
    const invPrefix = `INV-${stamp}`;
    const [lastGrn, lastInvoice] = await Promise.all([
      tx.grn.findFirst({ where: { grnNo: { startsWith: grnPrefix } }, orderBy: { grnNo: "desc" }, select: { grnNo: true } }),
      tx.grn.findFirst({ where: { supplierInvoiceNo: { startsWith: invPrefix } }, orderBy: { supplierInvoiceNo: "desc" }, select: { supplierInvoiceNo: true } }),
    ]);
    const grnNo = await nextDailyNumber(grnPrefix, lastGrn?.grnNo);
    const invoiceNo = await nextDailyNumber(invPrefix, lastInvoice?.supplierInvoiceNo);

    const grn = await tx.grn.create({
      data: {
        grnNo,
        supplierId: input.supplierId,
        supplierInvoiceNo: invoiceNo,
        invoiceTotal,
        notes: input.notes || null,
        status: GrnStatus.DRAFT,
        receivedById: actorUserId,
        lines: {
          create: input.lines.map((line, index) => {
            const unit = unitById.get(line.unitId);
            if (!unit || unit.productId !== line.productId || !productIdsFound.has(line.productId)) {
              throw new Error("Selected unit does not belong to the product.");
            }
            const qtyBase = new Prisma.Decimal(line.qtyInUnit).mul(unit.factorToBase);
            return {
              productId: line.productId,
              unitId: line.unitId,
              qtyInUnit: new Prisma.Decimal(line.qtyInUnit),
              qtyBase,
              batchNo: systemBatchNumber(grnNo, index + 1),
              supplierBatchNo: line.supplierBatchNo?.trim() || null,
              expiryDate: line.expiryDate ? new Date(line.expiryDate) : null,
              mrp: line.mrp != null ? new Prisma.Decimal(line.mrp) : null,
              costPrice: new Prisma.Decimal(line.costPrice),
              sellingPrice: new Prisma.Decimal(line.sellingPrice),
            };
          }),
        },
      },
    });

    await writeAuditLog(
      {
        actorUserId,
        action: "grn.draft_created",
        entityType: "GRN",
        entityId: grn.id,
        afterData: { grnNo: grn.grnNo, supplierId: grn.supplierId, lineCount: input.lines.length },
      },
      tx,
    );

    return grn;
  }, GRN_TRANSACTION_OPTIONS);
}

/**
 * Updates an existing DRAFT GRN with new lines and supplier details.
 */
export async function updateGrnDraft(grnId: string, input: CreateGrnInput, actorUserId: string) {
  const unitIds = [...new Set(input.lines.map((l) => l.unitId))];
  const productIds = [...new Set(input.lines.map((l) => l.productId))];
  const units = await prisma.productUnit.findMany({ where: { id: { in: unitIds } } });
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } });
  const unitById = new Map(units.map((u) => [u.id, u]));
  const productIdsFound = new Set(products.map((product) => product.id));

  const invoiceTotal = input.lines.reduce(
    (sum, line) => sum.add(new Prisma.Decimal(line.qtyInUnit).mul(line.costPrice)),
    new Prisma.Decimal(0),
  );

  return prisma.$transaction(async (tx) => {
    const existing = await tx.grn.findUnique({ where: { id: grnId }, select: { status: true, grnNo: true } });
    if (!existing) throw new Error("GRN not found.");
    if (existing.status !== GrnStatus.DRAFT) throw new Error("Only a DRAFT GRN can be updated.");

    // Delete existing lines
    await tx.grnLine.deleteMany({ where: { grnId } });

    // Update GRN header and insert new lines
    const grn = await tx.grn.update({
      where: { id: grnId },
      data: {
        supplierId: input.supplierId,
        notes: input.notes || null,
        invoiceTotal,
        lines: {
          create: input.lines.map((line, index) => {
            const unit = unitById.get(line.unitId);
            if (!unit || unit.productId !== line.productId || !productIdsFound.has(line.productId)) {
              throw new Error("Selected unit does not belong to the product.");
            }
            const qtyBase = new Prisma.Decimal(line.qtyInUnit).mul(unit.factorToBase);
            return {
              productId: line.productId,
              unitId: line.unitId,
              qtyInUnit: new Prisma.Decimal(line.qtyInUnit),
              qtyBase,
              batchNo: systemBatchNumber(existing.grnNo, index + 1),
              supplierBatchNo: line.supplierBatchNo?.trim() || null,
              expiryDate: line.expiryDate ? new Date(line.expiryDate) : null,
              mrp: line.mrp != null ? new Prisma.Decimal(line.mrp) : null,
              costPrice: new Prisma.Decimal(line.costPrice),
              sellingPrice: new Prisma.Decimal(line.sellingPrice),
            };
          }),
        },
      },
    });

    await writeAuditLog(
      {
        actorUserId,
        action: "grn.draft_updated",
        entityType: "GRN",
        entityId: grn.id,
        afterData: { supplierId: grn.supplierId, lineCount: input.lines.length },
      },
      tx,
    );

    return grn;
  }, GRN_TRANSACTION_OPTIONS);
}


/**
 * Confirms a GRN: validates the draft, creates a batch + GRN_IN ledger row per
 * line, increments the cached batch quantity, raises a supplier payable when an
 * invoice total exists, marks the GRN CONFIRMED, and audits — all in one
 * transaction. This is the only stock-in path.
 */
export async function confirmGrn(grnId: string, actorUserId: string) {
  return prisma.$transaction(async (tx) => {
    // Lock the GRN row to prevent a concurrent double-confirm.
    await tx.$queryRaw`SELECT id FROM "Grn" WHERE id = ${grnId}::uuid FOR UPDATE`;

    const grn = await tx.grn.findUnique({
      where: { id: grnId },
      include: {
        supplier: true,
        lines: { include: { product: { select: { productType: true } } } },
      },
    });

    if (!grn) throw new Error("GRN not found.");
    if (grn.status !== GrnStatus.DRAFT) throw new Error("Only a DRAFT GRN can be confirmed.");
    if (!grn.supplier.isActive) throw new Error("Supplier is inactive.");
    if (grn.lines.length === 0) throw new Error("GRN has no lines.");

    for (const line of grn.lines) {
      const isMedicine = line.product.productType === ProductType.MEDICINE;
      if (line.qtyBase.lte(0)) throw new Error("Each line must have a positive quantity.");

      if (isMedicine) {
        if (!line.batchNo) throw new Error("Medicine lines require a batch number.");
        if (!line.expiryDate) throw new Error("Medicine lines require an expiry date.");
        if (line.mrp != null && line.sellingPrice.gt(line.mrp)) {
          throw new Error("Selling price cannot exceed the batch MRP for a medicine.");
        }
      }

    }

    const batches = grn.lines.map((line) => ({
      id: randomUUID(),
      productId: line.productId,
      grnLineId: line.id,
      batchNo: line.batchNo,
      supplierBatchNo: line.supplierBatchNo,
      expiryDate: line.expiryDate,
      mrp: line.mrp,
      costPrice: line.costPrice,
      sellingPrice: line.sellingPrice,
      qtyOnHandBase: line.qtyBase,
    }));
    await tx.batch.createMany({ data: batches });
    await tx.stockMovement.createMany({
      data: batches.map((batch, index) => ({
        id: randomUUID(),
        productId: batch.productId,
        batchId: batch.id,
        movementType: StockMovementType.GRN_IN,
        qtyBase: grn.lines[index].qtyBase,
        refType: "GRN",
        refId: grn.id,
        note: `GRN ${grn.grnNo}`,
        createdById: actorUserId,
      })),
    });

    if (grn.invoiceTotal.gt(0)) {
      await tx.supplierInvoice.create({
        data: {
          supplierId: grn.supplierId,
          grnId: grn.id,
          invoiceNo: grn.supplierInvoiceNo,
          totalAmount: grn.invoiceTotal,
          status: SupplierInvoiceStatus.OPEN,
          dueDate: addDays(grn.receivedAt ?? new Date(), grn.supplier.creditTermDays),
        },
      });
    }

    const confirmed = await tx.grn.update({
      where: { id: grn.id },
      data: { status: GrnStatus.CONFIRMED, receivedAt: new Date() },
    });

    await writeAuditLog(
      {
        actorUserId,
        action: "grn.confirmed",
        entityType: "GRN",
        entityId: grn.id,
        beforeData: { status: GrnStatus.DRAFT },
        afterData: { status: GrnStatus.CONFIRMED, batchesCreated: grn.lines.length },
      },
      tx,
    );

    return confirmed;
  }, GRN_TRANSACTION_OPTIONS);
}

export async function voidGrn(grnId: string, actorUserId: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Grn" WHERE id = ${grnId}::uuid FOR UPDATE`;

    const grn = await tx.grn.findUnique({
      where: { id: grnId },
      include: {
        supplier: true,
        lines: {
          include: {
            batch: true,
          },
        },
        invoice: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!grn) throw new Error("GRN not found.");
    if (grn.status === GrnStatus.CANCELLED) throw new Error("This GRN is already voided.");

    if (grn.status === GrnStatus.DRAFT) {
      const updated = await tx.grn.update({
        where: { id: grnId },
        data: { status: GrnStatus.CANCELLED },
      });

      await writeAuditLog(
        {
          actorUserId,
          action: "grn.voided",
          entityType: "GRN",
          entityId: grnId,
          beforeData: { status: GrnStatus.DRAFT },
          afterData: { status: GrnStatus.CANCELLED, reason: reason || "Voided draft GRN" },
        },
        tx,
      );

      return updated;
    }

    if (grn.status === GrnStatus.CONFIRMED) {
      if (grn.invoice) {
        if (grn.invoice.payments && grn.invoice.payments.length > 0) {
          throw new Error("Cannot void GRN because payments have already been recorded for its supplier invoice.");
        }
        if (grn.invoice.status === SupplierInvoiceStatus.PAID) {
          throw new Error("Cannot void GRN with a paid invoice.");
        }
      }

      const batchIds: string[] = [];
      for (const line of grn.lines) {
        if (line.batch) {
          if (line.batch.qtyOnHandBase.lt(line.qtyBase)) {
            throw new Error(`Cannot void GRN because stock from batch ${line.batch.batchNo ?? "item"} has already been sold or transferred.`);
          }
          batchIds.push(line.batch.id);
        }
      }

      if (batchIds.length > 0) {
        await tx.stockMovement.createMany({
          data: grn.lines
            .filter((line) => line.batch)
            .map((line) => ({
              id: randomUUID(),
              productId: line.productId,
              batchId: line.batch!.id,
              movementType: StockMovementType.SUPPLIER_RETURN,
              qtyBase: line.qtyBase.negated(),
              refType: "GRN_VOID",
              refId: grn.id,
              note: `Void GRN ${grn.grnNo}${reason ? `: ${reason}` : ""}`,
              createdById: actorUserId,
            })),
        });

        for (const line of grn.lines) {
          if (line.batch) {
            const nextQty = Prisma.Decimal.max(0, line.batch.qtyOnHandBase.sub(line.qtyBase));
            await tx.batch.update({
              where: { id: line.batch.id },
              data: {
                qtyOnHandBase: nextQty,
                status: nextQty.eq(0) ? BatchStatus.DEPLETED : line.batch.status,
              },
            });
          }
        }
      }

      if (grn.invoice) {
        await tx.supplierInvoice.update({
          where: { id: grn.invoice.id },
          data: { status: SupplierInvoiceStatus.CANCELLED },
        });
      }

      const updated = await tx.grn.update({
        where: { id: grnId },
        data: { status: GrnStatus.CANCELLED },
      });

      await writeAuditLog(
        {
          actorUserId,
          action: "grn.voided",
          entityType: "GRN",
          entityId: grnId,
          beforeData: { status: GrnStatus.CONFIRMED },
          afterData: { status: GrnStatus.CANCELLED, reason: reason || "Voided confirmed GRN" },
        },
        tx,
      );

      return updated;
    }

    throw new Error("Invalid GRN status for void operation.");
  }, GRN_TRANSACTION_OPTIONS);
}
