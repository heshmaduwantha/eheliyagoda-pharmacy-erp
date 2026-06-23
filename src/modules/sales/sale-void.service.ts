import { BatchStatus, Prisma, SaleStatus, StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/modules/audit/audit.service";
import { serverOnly } from "@/lib/server-only";
import type { CurrentUser } from "@/modules/auth/session";
import type {
  SaleVoidListFilters,
  SaleVoidListItem,
  SaleVoidResult,
  SaleVoidStockPolicy,
  VoidSaleInput,
} from "./sale-void.types";
import { SaleVoidError } from "./sale-void.types";
import { toDateWindow } from "@/modules/reports/report.service";

serverOnly();

type SaleRow = Prisma.SaleGetPayload<{
  include: {
    cashier: {
      select: {
        name: true;
        username: true;
      };
    };
    lines: {
      select: {
        id: true;
        productNameSnapshot: true;
        batchNoSnapshot: true;
        expiryDateSnapshot: true;
        qty: true;
        qtyBase: true;
        unitPrice: true;
        lineTotal: true;
        unit: {
          select: {
            unitName: true;
          };
        };
      };
      orderBy: {
        createdAt: "asc";
      };
    };
    payments: {
      select: {
        id: true;
        method: true;
        amount: true;
        cardReference: true;
      };
      orderBy: {
        createdAt: "asc";
      };
    };
    voidRecord: {
      select: {
        id: true;
        reason: true;
        refundAmount: true;
        refundMethod: true;
        refundReference: true;
        stockPolicy: true;
        voidedAt: true;
        voidedBy: {
          select: {
            name: true;
            username: true;
          };
        };
      };
    };
  };
}>;

function decimal(value: string | number | Prisma.Decimal | undefined, field: string) {
  try {
    if (value == null) throw new Error("missing");
    const parsed = value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
    if (!parsed.isFinite()) throw new Error("invalid");
    return parsed;
  } catch {
    throw new SaleVoidError("VALIDATION_ERROR", `${field} is invalid.`);
  }
}

function moneyEquals(left: Prisma.Decimal, right: Prisma.Decimal) {
  return left.comparedTo(right) === 0;
}

function normalizeDateOnly(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : value;
}

function toIso(value: Date) {
  return value.toISOString();
}

function activityAt(sale: SaleRow) {
  return sale.voidRecord?.voidedAt ?? sale.completedAt ?? sale.createdAt;
}

function validateActor(actor: CurrentUser) {
  if (!actor?.id) throw new SaleVoidError("UNAUTHORIZED", "You must sign in to void a sale.");
  if (!actor.permissions.includes("sale.void")) {
    throw new SaleVoidError("FORBIDDEN", "You do not have permission to void sales.");
  }
}

async function lockSaleRow(tx: Prisma.TransactionClient, saleId: string) {
  await tx.$queryRaw`SELECT id FROM "Sale" WHERE id = ${saleId}::uuid FOR UPDATE`;
}

async function lockBatchRow(tx: Prisma.TransactionClient, batchId: string) {
  await tx.$queryRaw`SELECT id FROM "Batch" WHERE id = ${batchId}::uuid FOR UPDATE`;
}

function toSaleListItem(sale: SaleRow): SaleVoidListItem {
  const activity = activityAt(sale);
  return {
    saleId: sale.id,
    saleNumber: sale.saleNumber,
    status: sale.status,
    createdAt: toIso(sale.createdAt),
    completedAt: sale.completedAt ? toIso(sale.completedAt) : null,
    voidedAt: sale.voidRecord?.voidedAt ? toIso(sale.voidRecord.voidedAt) : sale.voidedAt ? toIso(sale.voidedAt) : null,
    activityAt: toIso(activity),
    cashierName: sale.cashier.name,
    cashierUsername: sale.cashier.username,
    subtotal: sale.subtotal.toFixed(2),
    discountAmount: sale.discountAmount.toFixed(2),
    taxAmount: sale.taxAmount.toFixed(2),
    total: sale.total.toFixed(2),
    lineCount: sale.lines.length,
    paymentCount: sale.payments.length,
    lines: sale.lines.map((line) => ({
      saleLineId: line.id,
      productName: line.productNameSnapshot,
      batchNumber: line.batchNoSnapshot,
      expiryDate: line.expiryDateSnapshot ? toIso(line.expiryDateSnapshot).slice(0, 10) : null,
      quantity: line.qty.toFixed(3),
      unitName: line.unit.unitName,
      unitPrice: line.unitPrice.toFixed(2),
      lineTotal: line.lineTotal.toFixed(2),
      qtyBase: line.qtyBase.toFixed(3),
    })),
    payments: sale.payments.map((payment) => ({
      salePaymentId: payment.id,
      method: payment.method,
      amount: payment.amount.toFixed(2),
      cardReference: payment.cardReference,
    })),
    voidRecord: sale.voidRecord
      ? {
          saleVoidId: sale.voidRecord.id,
          reason: sale.voidRecord.reason,
          refundAmount: sale.voidRecord.refundAmount.toFixed(2),
          refundMethod: sale.voidRecord.refundMethod,
          refundReference: sale.voidRecord.refundReference,
          stockPolicy: sale.voidRecord.stockPolicy as SaleVoidStockPolicy,
          voidedAt: toIso(sale.voidRecord.voidedAt),
          voidedByName: sale.voidRecord.voidedBy?.name ?? null,
        }
      : null,
  };
}

export async function listSalesForVoidPage(filters: SaleVoidListFilters = {}): Promise<SaleVoidListItem[]> {
  const limit = Math.min(Math.max(filters.limit ?? 40, 1), 100);
  const normalizedStatus = filters.status && filters.status !== "ALL" ? filters.status : undefined;
  const query = filters.search?.trim().toLowerCase();
  const normalizedFrom = normalizeDateOnly(filters.from);
  const normalizedTo = normalizeDateOnly(filters.to);
  const hasDateRange = Boolean(normalizedFrom && normalizedTo);
  const dateWindow = hasDateRange ? toDateWindow({ from: normalizedFrom as string, to: normalizedTo as string }) : null;
  const where: Prisma.SaleWhereInput = {
    AND: [
      normalizedStatus ? { status: normalizedStatus } : {},
      dateWindow
        ? normalizedStatus === "COMPLETED"
          ? { completedAt: { gte: dateWindow.start, lt: dateWindow.endExclusive } }
          : normalizedStatus === "VOIDED"
            ? { voidedAt: { gte: dateWindow.start, lt: dateWindow.endExclusive } }
            : normalizedStatus === "HELD"
              ? { createdAt: { gte: dateWindow.start, lt: dateWindow.endExclusive } }
              : {
                  OR: [
                    { createdAt: { gte: dateWindow.start, lt: dateWindow.endExclusive } },
                    { completedAt: { gte: dateWindow.start, lt: dateWindow.endExclusive } },
                    { voidedAt: { gte: dateWindow.start, lt: dateWindow.endExclusive } },
                  ],
                }
        : {},
      query
        ? {
            OR: [
              { saleNumber: { contains: query, mode: "insensitive" } },
              { cashier: { name: { contains: query, mode: "insensitive" } } },
              { cashier: { username: { contains: query, mode: "insensitive" } } },
              { lines: { some: { productNameSnapshot: { contains: query, mode: "insensitive" } } } },
              { voidRecord: { reason: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {},
    ],
  };

  const rows = await prisma.sale.findMany({
    where,
    include: {
      cashier: {
        select: {
          name: true,
          username: true,
        },
      },
      lines: {
        select: {
          id: true,
          productNameSnapshot: true,
          batchNoSnapshot: true,
          expiryDateSnapshot: true,
          qty: true,
          qtyBase: true,
          unitPrice: true,
          lineTotal: true,
          unit: {
            select: {
              unitName: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      payments: {
        select: {
          id: true,
          method: true,
          amount: true,
          cardReference: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      voidRecord: {
        select: {
          id: true,
          reason: true,
          refundAmount: true,
          refundMethod: true,
          refundReference: true,
          stockPolicy: true,
          voidedAt: true,
          voidedBy: {
            select: {
              name: true,
              username: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map(toSaleListItem);
}

export async function voidSale(input: VoidSaleInput, actor: CurrentUser): Promise<SaleVoidResult> {
  validateActor(actor);

  const reason = input.reason.trim();
  if (!reason) {
    throw new SaleVoidError("VALIDATION_ERROR", "Void reason is required.");
  }
  if (reason.length > 500) {
    throw new SaleVoidError("VALIDATION_ERROR", "Void reason is too long.");
  }

  const stockPolicy: SaleVoidStockPolicy = input.stockPolicy ?? "NO_STOCK_RETURN";
  const refundReference = input.refundReference?.trim() || null;
  const refundMethod = input.refundMethod ?? null;
  const refundedAmountInput = input.refundAmount == null || input.refundAmount === ""
    ? null
    : decimal(input.refundAmount, "refundAmount");

  return prisma.$transaction(async (tx) => {
    await lockSaleRow(tx, input.saleId);

    const sale = await tx.sale.findUnique({
      where: { id: input.saleId },
      include: {
        lines: {
          select: {
            id: true,
            productId: true,
            batchId: true,
            qtyBase: true,
            productNameSnapshot: true,
            batchNoSnapshot: true,
            expiryDateSnapshot: true,
          },
          orderBy: { createdAt: "asc" },
        },
        payments: true,
        voidRecord: true,
      },
    });

    if (!sale) {
      throw new SaleVoidError("NOT_FOUND", "Sale not found.");
    }
    if (sale.status !== SaleStatus.COMPLETED) {
      throw new SaleVoidError("CONFLICT", "Only completed sales can be voided.");
    }
    if (sale.voidRecord) {
      throw new SaleVoidError("CONFLICT", "This sale has already been voided.");
    }

    const refundAmount = refundedAmountInput ?? sale.total;
    if (refundAmount.lt(0)) {
      throw new SaleVoidError("VALIDATION_ERROR", "Refund amount cannot be negative.");
    }
    if (!moneyEquals(refundAmount, sale.total)) {
      throw new SaleVoidError("VALIDATION_ERROR", "Full voids must refund the sale total.");
    }

    const saleVoid = await tx.saleVoid.create({
      data: {
        saleId: sale.id,
        reason,
        refundAmount,
        refundMethod,
        refundReference,
        stockPolicy,
        voidedById: actor.id,
      },
    });

    await tx.sale.update({
      where: { id: sale.id },
      data: {
        status: SaleStatus.VOIDED,
        voidedAt: new Date(),
      },
    });

    const returnedStockMovements: SaleVoidResult["returnedStockMovements"] = [];

    if (stockPolicy === "RETURN_TO_ACTIVE") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const line of sale.lines) {
        await lockBatchRow(tx, line.batchId);

        const batch = await tx.batch.findUnique({
          where: { id: line.batchId },
          select: {
            id: true,
            productId: true,
            expiryDate: true,
            qtyOnHandBase: true,
            status: true,
          },
        });

        if (!batch) {
          throw new SaleVoidError("INTERNAL_ERROR", "Unable to resolve the original batch for return.");
        }
        if (batch.status === BatchStatus.QUARANTINED) {
          throw new SaleVoidError("CONFLICT", "Quarantined batches cannot be returned to active stock.");
        }
        if (batch.expiryDate) {
          const expiry = new Date(batch.expiryDate);
          expiry.setHours(0, 0, 0, 0);
          if (expiry < today) {
            throw new SaleVoidError("CONFLICT", "Expired batches cannot be returned to active stock.");
          }
        }

        const nextQty = batch.qtyOnHandBase.add(line.qtyBase);
        const movement = await tx.stockMovement.create({
          data: {
            productId: batch.productId,
            batchId: batch.id,
            movementType: StockMovementType.RETURN_IN,
            qtyBase: line.qtyBase,
            refType: "SALE_VOID",
            refId: saleVoid.id,
            note: `Sale void ${sale.saleNumber}`,
            createdById: actor.id,
          },
        });

        await tx.batch.update({
          where: { id: batch.id },
          data: {
            qtyOnHandBase: nextQty,
            status: batch.status === BatchStatus.DEPLETED ? BatchStatus.ACTIVE : batch.status,
          },
        });

        returnedStockMovements.push({
          stockMovementId: movement.id,
          saleLineId: line.id,
          productId: batch.productId,
          batchId: batch.id,
          qtyBase: line.qtyBase.toFixed(3),
        });

        await writeAuditLog(
          {
            actorUserId: actor.id,
            action: "stock.return_in",
            entityType: "SALE",
            entityId: sale.id,
            afterData: {
              saleVoidId: saleVoid.id,
              saleLineId: line.id,
              stockMovementId: movement.id,
              productId: batch.productId,
              batchId: batch.id,
              qtyBase: line.qtyBase.toFixed(3),
            },
          },
          tx,
        );
      }
    }

    await writeAuditLog(
      {
        actorUserId: actor.id,
        action: "sale.voided",
        entityType: "SALE",
        entityId: sale.id,
        afterData: {
          saleVoidId: saleVoid.id,
          saleNumber: sale.saleNumber,
          status: SaleStatus.VOIDED,
          reason,
          refundAmount: refundAmount.toFixed(2),
          refundMethod,
          refundReference,
          stockPolicy,
          returnedStockMovementCount: returnedStockMovements.length,
        },
      },
      tx,
    );

    return {
      saleVoidId: saleVoid.id,
      saleId: sale.id,
      saleNumber: sale.saleNumber,
      status: "VOIDED",
      voidedAt: toIso(saleVoid.voidedAt),
      refundAmount: refundAmount.toFixed(2),
      stockPolicy,
      returnedStockMovements,
      auditStatus: "written",
    };
  });
}
