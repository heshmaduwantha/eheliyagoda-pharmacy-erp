import { GrnStatus, Prisma, ProductType, StockMovementType, SupplierInvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/modules/audit/audit.service";
import { serverOnly } from "@/lib/server-only";

serverOnly();

export type GrnLineInput = {
  productId: string;
  unitId: string;
  qtyInUnit: number;
  batchNo?: string;
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

export function listGrns() {
  return prisma.grn.findMany({
    include: { supplier: { select: { name: true } }, _count: { select: { lines: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export function getGrn(id: string) {
  return prisma.grn.findUnique({
    where: { id },
    include: {
      supplier: true,
      lines: { include: { product: { select: { name: true, productType: true } }, unit: true } },
      invoice: true,
    },
  });
}

/**
 * Creates a DRAFT GRN with its lines. A draft never moves stock; quantities are
 * converted to base units now so confirmation is a pure ledger operation.
 */
export async function createGrnDraft(input: CreateGrnInput, actorUserId: string) {
  const unitIds = [...new Set(input.lines.map((l) => l.unitId))];
  const units = await prisma.productUnit.findMany({ where: { id: { in: unitIds } } });
  const unitById = new Map(units.map((u) => [u.id, u]));

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
          create: input.lines.map((line) => {
            const unit = unitById.get(line.unitId);
            if (!unit) throw new Error("Selected unit does not belong to the product.");
            const qtyBase = new Prisma.Decimal(line.qtyInUnit).mul(unit.factorToBase);
            return {
              productId: line.productId,
              unitId: line.unitId,
              qtyInUnit: new Prisma.Decimal(line.qtyInUnit),
              qtyBase,
              batchNo: line.batchNo || null,
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
  });
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
        if (line.mrp == null) throw new Error("Medicine lines require an MRP.");
        if (line.sellingPrice.gt(line.mrp)) {
          throw new Error("Selling price cannot exceed the batch MRP for a medicine.");
        }
      }

      const batch = await tx.batch.create({
        data: {
          productId: line.productId,
          grnLineId: line.id,
          batchNo: line.batchNo,
          expiryDate: line.expiryDate,
          mrp: line.mrp,
          costPrice: line.costPrice,
          sellingPrice: line.sellingPrice,
          qtyOnHandBase: line.qtyBase,
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: line.productId,
          batchId: batch.id,
          movementType: StockMovementType.GRN_IN,
          qtyBase: line.qtyBase,
          refType: "GRN",
          refId: grn.id,
          note: `GRN ${grn.grnNo}`,
          createdById: actorUserId,
        },
      });
    }

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
  });
}
