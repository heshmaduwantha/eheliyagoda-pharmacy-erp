import { randomUUID } from "node:crypto";
import { BatchStatus, PaymentMethod, Prisma, ProductType, SaleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLogs } from "@/modules/audit/audit.service";
import { hasPermission } from "@/modules/auth/permissions";
import { validateAndPersistPrescriptionForCompletedSale } from "@/modules/prescriptions/prescription.service";
import { validatePrescriptionForSale } from "./prescription-rule.service";
import type { CurrentUser } from "@/modules/auth/session";
import type {
  SaleCompletionInput,
  SaleCompletionResult,
  SaleReceipt,
  SaleReceiptLine,
} from "./sale.types";
import { SaleCompletionError } from "./sale.types";
import { serverOnly } from "@/lib/server-only";

serverOnly();

type ProductRow = Prisma.ProductGetPayload<{
  include: {
    units: true;
  };
}>;

type LockedBatchRow = {
  id: string;
  productId: string;
  batchNo: string | null;
  expiryDate: Date | null;
  mrp: Prisma.Decimal | null;
  costPrice: Prisma.Decimal;
  sellingPrice: Prisma.Decimal;
  qtyOnHandBase: Prisma.Decimal;
  status: BatchStatus;
  createdAt: Date;
  sourceUnitFactor: Prisma.Decimal | null;
};

type PreparedLine = {
  input: SaleCompletionInput["lines"][number];
  product: ProductRow;
  unit: ProductRow["units"][number];
  requestedQty: Prisma.Decimal;
  requestedQtyBase: Prisma.Decimal;
  quotedUnitPrice: Prisma.Decimal;
};

type PreparedProductGroup = {
  product: ProductRow;
  lines: PreparedLine[];
  batches: LockedBatchRow[];
};

type PlannedAllocation = {
  saleLineId: string;
  clientLineId: string;
  productId: string;
  productName: string;
  unitId: string;
  unitName: string;
  batchId: string;
  batchNumber: string | null;
  expiryDate: Date | null;
  qty: Prisma.Decimal;
  qtyBase: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
  costPriceAtSale: Prisma.Decimal;
  mrpAtSale: Prisma.Decimal | null;
  barcodeUsed: string | null;
  lineGrossDiscount: Prisma.Decimal;
};

function decimal(value: string | number | Prisma.Decimal | undefined, field: string) {
  try {
    if (value == null) throw new Error("missing");
    const parsed = value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
    if (!parsed.isFinite()) throw new Error("invalid");
    return parsed;
  } catch {
    throw new SaleCompletionError("VALIDATION_ERROR", `${field} is invalid.`);
  }
}

function decimalOrZero(value: string | number | Prisma.Decimal | undefined, field: string) {
  if (value == null || value === "") return new Prisma.Decimal(0);
  return decimal(value, field);
}

function moneyEquals(left: Prisma.Decimal, right: Prisma.Decimal) {
  return left.comparedTo(right) === 0;
}

function toDateOnly(value: Date | null) {
  if (!value) return null;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toIso(value: Date) {
  return value.toISOString();
}

function buildSaleNumber(saleId: string, completedAt: Date) {
  const stamp = `${completedAt.getFullYear()}${String(completedAt.getMonth() + 1).padStart(2, "0")}${String(completedAt.getDate()).padStart(2, "0")}`;
  return `SALE-${stamp}-${saleId.slice(0, 8).toUpperCase()}`;
}

function isMedicine(product: ProductRow) {
  return product.productType === ProductType.MEDICINE;
}

function groupLinesByProduct(input: SaleCompletionInput) {
  const grouped = new Map<string, SaleCompletionInput["lines"]>();
  for (const line of input.lines) {
    const bucket = grouped.get(line.productId);
    if (bucket) bucket.push(line);
    else grouped.set(line.productId, [line]);
  }
  return [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right));
}

async function lockRows(tx: Prisma.TransactionClient, ids: string[], table: "Product" | "ProductUnit") {
  if (ids.length === 0) return;
  const uniqueIds = [...new Set(ids)].sort((left, right) => left.localeCompare(right));
  const sql = table === "Product"
    ? Prisma.sql`SELECT id FROM "Product" WHERE id IN (${Prisma.join(uniqueIds.map((id) => Prisma.sql`${id}::uuid`))}) ORDER BY id FOR UPDATE`
    : Prisma.sql`SELECT id FROM "ProductUnit" WHERE id IN (${Prisma.join(uniqueIds.map((id) => Prisma.sql`${id}::uuid`))}) ORDER BY id FOR UPDATE`;
  await tx.$queryRaw(sql);
}

async function lockCandidateBatches(tx: Prisma.TransactionClient, products: ProductRow[]) {
  const productIds = products.map((product) => product.id).sort((left, right) => left.localeCompare(right));
  if (productIds.length === 0) return [];
  return tx.$queryRaw<LockedBatchRow[]>(Prisma.sql`
    SELECT
      b.id,
      b."productId",
      b."batchNo",
      b."expiryDate",
      b.mrp,
      b."costPrice",
      b."sellingPrice",
      b."qtyOnHandBase",
      b.status,
      b."createdAt",
      source_unit."factorToBase" AS "sourceUnitFactor"
    FROM "Batch" b
    INNER JOIN "Product" p ON p.id = b."productId"
    LEFT JOIN "GrnLine" source_line ON source_line.id = b."grnLineId"
    LEFT JOIN "ProductUnit" source_unit ON source_unit.id = source_line."unitId"
    WHERE b."productId" IN (${Prisma.join(productIds.map((id) => Prisma.sql`${id}::uuid`))})
      AND p."isActive" = TRUE
      AND b.status = 'ACTIVE'
      AND b."qtyOnHandBase" > 0
      AND (
        p."productType" <> 'MEDICINE'
        OR (b."expiryDate" IS NOT NULL AND b."expiryDate" >= CURRENT_DATE)
      )
    ORDER BY b."productId" ASC, b."expiryDate" ASC NULLS LAST, b."createdAt" ASC, b.id ASC
    FOR UPDATE OF b
  `);
}

function currentBatchPriceLimit(product: ProductRow, unit: ProductRow["units"][number], batch: LockedBatchRow) {
  if (!isMedicine(product) || batch.mrp == null) return null;
  return batchPriceForUnit(batch, unit, batch.mrp);
}

function batchPriceForUnit(
  batch: LockedBatchRow,
  unit: ProductRow["units"][number],
  price: Prisma.Decimal,
) {
  return batch.sourceUnitFactor?.gt(0)
    ? price.div(batch.sourceUnitFactor).mul(unit.factorToBase)
    : price;
}

function allocateProductGroup(group: PreparedProductGroup) {
  const remainingByBatch = new Map(group.batches.map((batch) => [batch.id, batch.qtyOnHandBase]));
  const allocations: PlannedAllocation[] = [];

  for (const line of group.lines) {
    let remainingLineQtyBase = line.requestedQtyBase;
    const usableBatches = line.input.batchId 
      ? group.batches.filter(b => b.id === line.input.batchId)
      : group.batches;

    const availableQtyBase = usableBatches.reduce(
      (sum, batch) => sum.add(remainingByBatch.get(batch.id) ?? new Prisma.Decimal(0)),
      new Prisma.Decimal(0),
    );

    if (availableQtyBase.lte(0)) {
      throw new SaleCompletionError(
        "INVENTORY_NO_ACTIVE_STOCK",
        `${line.product.name} has no active stock available for sale${line.input.batchId ? " in the selected batch" : ""}.`,
        { productId: line.product.id, productName: line.product.name },
      );
    }
    if (availableQtyBase.lt(remainingLineQtyBase)) {
      throw new SaleCompletionError(
        "INVENTORY_INSUFFICIENT_STOCK",
        `Not enough stock is available for ${line.product.name}${line.input.batchId ? " in the selected batch" : ""}.`,
        {
          productId: line.product.id,
          productName: line.product.name,
          requestedQtyBase: line.requestedQtyBase.toFixed(3),
          availableQtyBase: availableQtyBase.toFixed(3),
        },
      );
    }

    for (const batch of usableBatches) {
      if (line.input.batchId && batch.id !== line.input.batchId) continue;
      if (remainingLineQtyBase.lte(0)) break;
      const batchRemaining = remainingByBatch.get(batch.id) ?? new Prisma.Decimal(0);
      if (batchRemaining.lte(0)) continue;

      const allocBase = batchRemaining.lt(remainingLineQtyBase) ? batchRemaining : remainingLineQtyBase;
      const allocQty = allocBase.div(line.unit.factorToBase);
      const unitPrice = batchPriceForUnit(batch, line.unit, batch.sellingPrice);
      const lineTotal = allocQty.mul(unitPrice);
      if (remainingLineQtyBase.equals(line.requestedQtyBase) && !moneyEquals(unitPrice, line.quotedUnitPrice)) {
        throw new SaleCompletionError(
          "SALE_PRICE_CHANGED",
          `${line.product.name} now uses a different FEFO batch price. Please refresh the cart and try again.`,
          {
            productId: line.product.id,
            productName: line.product.name,
            batchId: batch.id,
            batchNumber: batch.batchNo,
            quotedUnitPrice: line.quotedUnitPrice.toFixed(2),
            currentUnitPrice: unitPrice.toFixed(2),
          },
        );
      }
      const mrpLimit = currentBatchPriceLimit(line.product, line.unit, batch);
      if (mrpLimit != null && unitPrice.gt(mrpLimit)) {
        throw new SaleCompletionError(
          "SALE_PRICE_EXCEEDS_MRP",
          `${line.product.name} is priced above the selected batch MRP.`,
          {
            productId: line.product.id,
            productName: line.product.name,
            batchId: batch.id,
            batchNumber: batch.batchNo,
            quotedUnitPrice: unitPrice.toFixed(2),
            batchMrp: mrpLimit.toFixed(2),
          },
        );
      }

      const costPriceAtSale = batch.sourceUnitFactor?.gt(0)
        ? batch.costPrice.div(batch.sourceUnitFactor)
        : batch.costPrice;

      const saleLineId = randomUUID();
      allocations.push({
        saleLineId,
        clientLineId: line.input.clientLineId,
        productId: line.product.id,
        productName: line.product.name,
        unitId: line.unit.id,
        unitName: line.unit.unitName,
        batchId: batch.id,
        batchNumber: batch.batchNo,
        expiryDate: batch.expiryDate,
        qty: allocQty,
        qtyBase: allocBase,
        unitPrice,
        lineTotal,
        costPriceAtSale,
        mrpAtSale: batch.mrp != null ? batchPriceForUnit(batch, line.unit, batch.mrp) : null,
        barcodeUsed: line.input.barcodeUsed?.trim() || null,
        lineGrossDiscount: new Prisma.Decimal(0),
      });

      remainingByBatch.set(batch.id, batchRemaining.sub(allocBase));
      remainingLineQtyBase = remainingLineQtyBase.sub(allocBase);
    }
  }

  return allocations;
}

function buildReceipt(input: {
  saleId: string;
  saleNumber: string;
  status: SaleStatus;
  completedAt: Date;
  subtotal: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  total: Prisma.Decimal;
  allocations: PlannedAllocation[];
  payments: Array<{ method: PaymentMethod; amount: Prisma.Decimal; cardReference: string | null }>;
}): SaleReceipt {
  const lineGroups = new Map<string, SaleReceiptLine>();
  for (const allocation of input.allocations) {
    const existing = lineGroups.get(allocation.clientLineId);
    if (existing) {
      existing.quantity = new Prisma.Decimal(existing.quantity).add(allocation.qty).toFixed(3);
      existing.qtyBase = new Prisma.Decimal(existing.qtyBase).add(allocation.qtyBase).toFixed(3);
      existing.lineTotal = new Prisma.Decimal(existing.lineTotal).add(allocation.lineTotal).toFixed(2);
      existing.batchAllocations.push({
        saleLineId: allocation.saleLineId,
        clientLineId: allocation.clientLineId,
        productId: allocation.productId,
        productName: allocation.productName,
        unitId: allocation.unitId,
        unitName: allocation.unitName,
        batchId: allocation.batchId,
        batchNumber: allocation.batchNumber,
        expiryDate: toDateOnly(allocation.expiryDate),
        qty: allocation.qty.toFixed(3),
        qtyBase: allocation.qtyBase.toFixed(3),
        unitPrice: allocation.unitPrice.toFixed(2),
        lineTotal: allocation.lineTotal.toFixed(2),
        costPriceAtSale: allocation.costPriceAtSale.toFixed(2),
        mrpAtSale: allocation.mrpAtSale?.toFixed(2) ?? null,
      });
      continue;
    }

    lineGroups.set(allocation.clientLineId, {
      clientLineId: allocation.clientLineId,
      productId: allocation.productId,
      productName: allocation.productName,
      unitId: allocation.unitId,
      unitName: allocation.unitName,
      quantity: allocation.qty.toFixed(3),
      qtyBase: allocation.qtyBase.toFixed(3),
      unitPrice: allocation.unitPrice.toFixed(2),
      lineTotal: allocation.lineTotal.toFixed(2),
      batchAllocations: [
        {
          saleLineId: allocation.saleLineId,
          clientLineId: allocation.clientLineId,
          productId: allocation.productId,
          productName: allocation.productName,
          unitId: allocation.unitId,
          unitName: allocation.unitName,
          batchId: allocation.batchId,
          batchNumber: allocation.batchNumber,
          expiryDate: toDateOnly(allocation.expiryDate),
          qty: allocation.qty.toFixed(3),
          qtyBase: allocation.qtyBase.toFixed(3),
          unitPrice: allocation.unitPrice.toFixed(2),
          lineTotal: allocation.lineTotal.toFixed(2),
          costPriceAtSale: allocation.costPriceAtSale.toFixed(2),
          mrpAtSale: allocation.mrpAtSale?.toFixed(2) ?? null,
        },
      ],
    });
  }

  const receiptLines = [...lineGroups.values()];
  return {
    saleId: input.saleId,
    saleNumber: input.saleNumber,
    status: input.status,
    completedAt: toIso(input.completedAt),
    subtotal: input.subtotal.toFixed(2),
    discountAmount: input.discountAmount.toFixed(2),
    taxAmount: input.taxAmount.toFixed(2),
    total: input.total.toFixed(2),
    lines: receiptLines,
    payments: input.payments.map((payment) => ({
      method: payment.method === PaymentMethod.CASH ? "CASH" : "CARD",
      amount: payment.amount.toFixed(2),
      cardReference: payment.cardReference,
    })),
    allocations: input.allocations.map((allocation) => ({
      saleLineId: allocation.saleLineId,
      clientLineId: allocation.clientLineId,
      productId: allocation.productId,
      productName: allocation.productName,
      unitId: allocation.unitId,
      unitName: allocation.unitName,
      batchId: allocation.batchId,
      batchNumber: allocation.batchNumber,
      expiryDate: toDateOnly(allocation.expiryDate),
      qty: allocation.qty.toFixed(3),
      qtyBase: allocation.qtyBase.toFixed(3),
      unitPrice: allocation.unitPrice.toFixed(2),
      lineTotal: allocation.lineTotal.toFixed(2),
      costPriceAtSale: allocation.costPriceAtSale.toFixed(2),
      mrpAtSale: allocation.mrpAtSale?.toFixed(2) ?? null,
    })),
  };
}

async function getCommittedSaleByRequestId(
  clientRequestId: string,
  actorUserId: string,
): Promise<SaleCompletionResult | null> {
  const sale = await prisma.sale.findUnique({
    where: { clientRequestId },
    select: {
      id: true,
      cashierId: true,
      saleNumber: true,
      status: true,
      subtotal: true,
      discountAmount: true,
      taxAmount: true,
      total: true,
      completedAt: true,
      lines: {
        select: {
          id: true,
          clientLineId: true,
          productId: true,
          productNameSnapshot: true,
          unitId: true,
          unit: { select: { unitName: true } },
          batchId: true,
          batchNoSnapshot: true,
          expiryDateSnapshot: true,
          qty: true,
          qtyBase: true,
          unitPrice: true,
          lineTotal: true,
          discountAmount: true,
          costPriceAtSale: true,
          mrpAtSale: true,
          barcodeUsed: true,
        },
        orderBy: { createdAt: "asc" },
      },
      payments: {
        select: { method: true, amount: true, cardReference: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!sale || sale.status !== SaleStatus.COMPLETED || !sale.completedAt) return null;
  if (sale.cashierId !== actorUserId) {
    throw new SaleCompletionError("CONFLICT", "This sale request identifier is already in use.");
  }

  const allocations: PlannedAllocation[] = sale.lines.map((line) => ({
    saleLineId: line.id,
    clientLineId: line.clientLineId ?? line.id,
    productId: line.productId,
    productName: line.productNameSnapshot,
    unitId: line.unitId,
    unitName: line.unit.unitName,
    batchId: line.batchId,
    batchNumber: line.batchNoSnapshot,
    expiryDate: line.expiryDateSnapshot,
    qty: line.qty,
    qtyBase: line.qtyBase,
    unitPrice: line.unitPrice,
    lineTotal: line.lineTotal,
    costPriceAtSale: line.costPriceAtSale,
    mrpAtSale: line.mrpAtSale,
    barcodeUsed: line.barcodeUsed,
    lineGrossDiscount: line.discountAmount,
  }));

  const receipt = buildReceipt({
    saleId: sale.id,
    saleNumber: sale.saleNumber,
    status: SaleStatus.COMPLETED,
    completedAt: sale.completedAt,
    subtotal: sale.subtotal,
    discountAmount: sale.discountAmount,
    taxAmount: sale.taxAmount,
    total: sale.total,
    allocations,
    payments: sale.payments,
  });

  return {
    saleId: sale.id,
    saleNumber: sale.saleNumber,
    status: SaleStatus.COMPLETED,
    subtotal: sale.subtotal.toFixed(2),
    discountAmount: sale.discountAmount.toFixed(2),
    taxAmount: sale.taxAmount.toFixed(2),
    total: sale.total.toFixed(2),
    allocations: receipt.allocations,
    completedAt: sale.completedAt.toISOString(),
    receipt,
  };
}

export async function getSaleReceiptById(saleId: string): Promise<SaleReceipt | null> {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    select: {
      id: true,
      saleNumber: true,
      status: true,
      subtotal: true,
      discountAmount: true,
      taxAmount: true,
      total: true,
      completedAt: true,
      lines: {
        select: {
          id: true,
          clientLineId: true,
          productId: true,
          productNameSnapshot: true,
          unitId: true,
          unit: { select: { unitName: true } },
          batchId: true,
          batchNoSnapshot: true,
          expiryDateSnapshot: true,
          qty: true,
          qtyBase: true,
          unitPrice: true,
          lineTotal: true,
          discountAmount: true,
          costPriceAtSale: true,
          mrpAtSale: true,
          barcodeUsed: true,
        },
        orderBy: { createdAt: "asc" },
      },
      payments: {
        select: { method: true, amount: true, cardReference: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!sale || sale.status !== SaleStatus.COMPLETED || !sale.completedAt) return null;

  const allocations: PlannedAllocation[] = sale.lines.map((line) => ({
    saleLineId: line.id,
    clientLineId: line.clientLineId ?? line.id,
    productId: line.productId,
    productName: line.productNameSnapshot,
    unitId: line.unitId,
    unitName: line.unit.unitName,
    batchId: line.batchId,
    batchNumber: line.batchNoSnapshot,
    expiryDate: line.expiryDateSnapshot,
    qty: line.qty,
    qtyBase: line.qtyBase,
    unitPrice: line.unitPrice,
    lineTotal: line.lineTotal,
    costPriceAtSale: line.costPriceAtSale,
    mrpAtSale: line.mrpAtSale,
    barcodeUsed: line.barcodeUsed,
    lineGrossDiscount: line.discountAmount,
  }));

  return buildReceipt({
    saleId: sale.id,
    saleNumber: sale.saleNumber,
    status: SaleStatus.COMPLETED,
    completedAt: sale.completedAt,
    subtotal: sale.subtotal,
    discountAmount: sale.discountAmount,
    taxAmount: sale.taxAmount,
    total: sale.total,
    allocations,
    payments: sale.payments,
  });
}

function validateActor(actor: CurrentUser) {
  if (!actor?.id) throw new SaleCompletionError("UNAUTHORIZED", "You must sign in to complete a sale.");
  if (!hasPermission(actor, "pos.sale.create")) {
    throw new SaleCompletionError("FORBIDDEN", "You do not have permission to complete sales.");
  }
}

function normalizePrescriptionDecision(input: SaleCompletionInput) {
  if (input.prescription) return input.prescription;
  if (input.patient || input.prescriber) {
    return {
      mode: "CAPTURED" as const,
      patient: input.patient,
      prescriber: input.prescriber,
    };
  }
  return undefined;
}

/**
 * Authoritatively completes a sale in a single PostgreSQL transaction.
 * No frontend batch allocation, totals, or payment sums are trusted.
 */
export async function completeSale(input: SaleCompletionInput, actor: CurrentUser) {
  validateActor(actor);

  if (input.requestedStatus !== "COMPLETED") {
    throw new SaleCompletionError("VALIDATION_ERROR", "Held sales are not implemented yet.");
  }
  if (input.lines.length === 0) {
    throw new SaleCompletionError("VALIDATION_ERROR", "Add at least one line before completing the sale.");
  }
  if (input.payments.length === 0) {
    throw new SaleCompletionError("VALIDATION_ERROR", "Add at least one payment before completing the sale.");
  }

  const existingSale = await getCommittedSaleByRequestId(input.clientRequestId, actor.id);
  if (existingSale) return existingSale;

  const discountAmount = decimalOrZero(input.discountAmount, "discountAmount");
  const taxAmount = decimalOrZero(input.taxAmount, "taxAmount");
  if (discountAmount.lt(0)) throw new SaleCompletionError("VALIDATION_ERROR", "Discount cannot be negative.");
  if (taxAmount.lt(0)) throw new SaleCompletionError("VALIDATION_ERROR", "Tax cannot be negative.");

  const productIds = [...new Set(input.lines.map((line) => line.productId))];
  const unitIds = [...new Set(input.lines.map((line) => line.unitId))];

  try {
    return await prisma.$transaction(async (tx) => {
    await lockRows(tx, productIds, "Product");
    await lockRows(tx, unitIds, "ProductUnit");

    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { units: { orderBy: { factorToBase: "asc" } } },
    });
    if (products.length !== productIds.length) {
      throw new SaleCompletionError("CATALOG_PRODUCT_NOT_FOUND", "One or more products are unavailable.");
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const preparedLines: PreparedLine[] = [];

    for (const line of input.lines) {
      const product = productMap.get(line.productId);
      if (!product) {
        throw new SaleCompletionError("CATALOG_PRODUCT_NOT_FOUND", "One or more products are unavailable.");
      }
      const unit = product.units.find((item) => item.id === line.unitId);
      if (!unit || unit.factorToBase.lte(0)) {
        throw new SaleCompletionError("CATALOG_UNIT_INVALID", `The selected unit is not valid for ${product.name}.`);
      }

      const requestedQty = decimal(line.quantity, "quantity");
      if (requestedQty.lte(0)) {
        throw new SaleCompletionError("VALIDATION_ERROR", "Quantity must be greater than zero.");
      }
      const quotedUnitPrice = decimal(line.quotedUnitPrice, "quotedUnitPrice");
      if (quotedUnitPrice.lt(0)) {
        throw new SaleCompletionError("VALIDATION_ERROR", "Quoted unit price cannot be negative.");
      }

      preparedLines.push({
        input: line,
        product,
        unit,
        requestedQty,
        requestedQtyBase: requestedQty.mul(unit.factorToBase),
        quotedUnitPrice,
      });
    }

    const prescriptionDecision = normalizePrescriptionDecision(input);
    const prescriptionValidation = await validatePrescriptionForSale(
      {
        lines: preparedLines.map((line) => ({ productId: line.product.id })),
        prescription: prescriptionDecision,
      },
      tx,
    );
    if (prescriptionValidation.requirement.requiresControlledDetails && !hasPermission(actor, "controlled_drugs.sale.create")) {
      throw new SaleCompletionError("FORBIDDEN", "You do not have permission to sell controlled medicines.");
    }

    const groupedLines = groupLinesByProduct(input);
    const lockedBatches = await lockCandidateBatches(tx, products);
    const lockedBatchesByProduct = new Map<string, LockedBatchRow[]>();
    for (const batch of lockedBatches) {
      const bucket = lockedBatchesByProduct.get(batch.productId);
      if (bucket) bucket.push(batch);
      else lockedBatchesByProduct.set(batch.productId, [batch]);
    }
    const preparedGroups: PreparedProductGroup[] = groupedLines.map(([productId]) => {
      const product = productMap.get(productId);
      if (!product) {
        throw new SaleCompletionError("CATALOG_PRODUCT_NOT_FOUND", "One or more products are unavailable.");
      }
      return {
        product,
        lines: preparedLines.filter((line) => line.product.id === productId),
        batches: lockedBatchesByProduct.get(productId) ?? [],
      };
    });

    const allocations: PlannedAllocation[] = [];
    for (const group of preparedGroups) {
      allocations.push(...allocateProductGroup(group));
    }
    const batchMap = groupBatchesById(preparedGroups);
    const subtotal = allocations.reduce((sum, allocation) => sum.add(allocation.lineTotal), new Prisma.Decimal(0));
    if (discountAmount.gt(subtotal)) {
      throw new SaleCompletionError("VALIDATION_ERROR", "Discount cannot exceed the subtotal.");
    }
    const total = subtotal.sub(discountAmount).add(taxAmount);
    const expectedTotal = decimal(input.expectedTotal, "expectedTotal");
    if (!moneyEquals(expectedTotal, total)) {
      throw new SaleCompletionError(
        "SALE_PRICE_CHANGED",
        "The server recalculated the cart total from the allocated batch prices. Please refresh the cart and try again.",
        { expectedTotal: expectedTotal.toFixed(2), total: total.toFixed(2) },
      );
    }

    const paymentTotal = input.payments.reduce(
      (sum, payment) => sum.add(decimal(payment.amount, "payment.amount")),
      new Prisma.Decimal(0),
    );
    if (!moneyEquals(paymentTotal, total)) {
      throw new SaleCompletionError(
        "SALE_PAYMENT_TOTAL_MISMATCH",
        "Payment total must equal the invoice total.",
        { paymentTotal: paymentTotal.toFixed(2), total: total.toFixed(2) },
      );
    }

    const saleId = randomUUID();
    const completedAt = new Date();
    const saleNumber = buildSaleNumber(saleId, completedAt);

    const sale = await tx.sale.create({
      data: {
        id: saleId,
        saleNumber,
        clientRequestId: input.clientRequestId,
        status: SaleStatus.COMPLETED,
        cashierId: actor.id,
        subtotal,
        discountAmount,
        taxAmount,
        total,
        notes: input.notes?.trim() || null,
        completedAt,
      },
    });

    const saleLineInputs = allocations.map((allocation) => {
      const allocatedLineDiscount = subtotal.gt(0)
        ? discountAmount.mul(allocation.lineTotal).div(subtotal)
        : new Prisma.Decimal(0);
      allocation.lineGrossDiscount = allocatedLineDiscount;
      return {
        id: allocation.saleLineId,
        saleId: sale.id,
        clientLineId: allocation.clientLineId,
        productId: allocation.productId,
        batchId: allocation.batchId,
        unitId: allocation.unitId,
        qty: allocation.qty,
        qtyBase: allocation.qtyBase,
        unitPrice: allocation.unitPrice,
        lineTotal: allocation.lineTotal,
        discountAmount: allocatedLineDiscount,
        costPriceAtSale: allocation.costPriceAtSale,
        mrpAtSale: allocation.mrpAtSale,
        barcodeUsed: allocation.barcodeUsed,
        productNameSnapshot: allocation.productName,
        batchNoSnapshot: allocation.batchNumber,
        expiryDateSnapshot: allocation.expiryDate,
      };
    });
    await tx.saleLine.createMany({ data: saleLineInputs });

    const qtyByBatch = new Map<string, Prisma.Decimal>();
    for (const allocation of allocations) {
      const currentQty = qtyByBatch.get(allocation.batchId) ?? new Prisma.Decimal(0);
      qtyByBatch.set(allocation.batchId, currentQty.add(allocation.qtyBase));
    }

    const batchUpdates = [...qtyByBatch.entries()].map(([batchId, allocatedQty]) => {
      const batch = batchMap.get(batchId);
      if (!batch) {
        throw new SaleCompletionError("INTERNAL_ERROR", "Unable to resolve a locked batch.");
      }
      const updatedQty = batch.qtyOnHandBase.sub(allocatedQty);
      if (updatedQty.lt(0)) {
        throw new SaleCompletionError(
          "INVENTORY_INSUFFICIENT_STOCK",
          "A concurrent checkout exhausted stock before completion.",
          {
            productId: batch.productId,
            batchId,
            availableQtyBase: batch.qtyOnHandBase.toFixed(3),
            requestedQtyBase: allocatedQty.toFixed(3),
          },
        );
      }
      return { batchId, updatedQty };
    });

    await tx.stockMovement.createMany({
      data: allocations.map((allocation) => ({
        id: randomUUID(),
        productId: allocation.productId,
        batchId: allocation.batchId,
        movementType: "SALE_OUT",
        qtyBase: allocation.qtyBase.neg(),
        refType: "SALE",
        refId: sale.id,
        note: `Sale ${sale.saleNumber}`,
        createdById: actor.id,
      })),
    });

    for (const update of batchUpdates) {
      await tx.batch.update({
        where: { id: update.batchId },
        data: {
          qtyOnHandBase: update.updatedQty,
          status: update.updatedQty.lte(0) ? BatchStatus.DEPLETED : BatchStatus.ACTIVE,
        },
      });
    }

    const createdPayments = input.payments.map((payment) => ({
      id: randomUUID(),
      saleId: sale.id,
      method: payment.method === "CARD" ? PaymentMethod.CARD : PaymentMethod.CASH,
      amount: decimal(payment.amount, "payment.amount"),
      cardReference: payment.cardReference?.trim() || null,
    }));
    await tx.salePayment.createMany({ data: createdPayments });

    const saleLinePersistence = allocations.map((allocation) => ({
      saleLineId: allocation.saleLineId,
      productId: allocation.productId,
      batchId: allocation.batchId,
      qtyBase: allocation.qtyBase.toFixed(3),
    }));

    if (prescriptionValidation.shouldPersist) {
      const decision = prescriptionDecision ?? {
        mode: "CAPTURED" as const,
      };
      await validateAndPersistPrescriptionForCompletedSale(
        {
          saleId: sale.id,
          actorUserId: actor.id,
          decision,
          lines: saleLinePersistence,
        },
        tx,
      );
    }

    await writeAuditLogs([
      ...allocations.map((allocation) => ({
        actorUserId: actor.id,
        action: "stock.sale_out",
        entityType: "SALE",
        entityId: sale.id,
        afterData: {
          saleLineId: allocation.saleLineId,
          productId: allocation.productId,
          batchId: allocation.batchId,
          qtyBase: allocation.qtyBase.toFixed(3),
        },
      })),
      ...createdPayments.map((payment) => ({
          actorUserId: actor.id,
          action: "payment.recorded",
          entityType: "SALE",
          entityId: sale.id,
          afterData: {
            salePaymentId: payment.id,
            method: payment.method,
            amount: payment.amount.toFixed(2),
            cardReference: payment.cardReference,
          },
      })),
      {
        actorUserId: actor.id,
        action: "sale.completed",
        entityType: "SALE",
        entityId: sale.id,
        afterData: {
          saleNumber,
          status: SaleStatus.COMPLETED,
          subtotal: subtotal.toFixed(2),
          discountAmount: discountAmount.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          total: total.toFixed(2),
          lineCount: allocations.length,
          paymentCount: createdPayments.length,
        },
      },
    ], tx);

    const receipt = buildReceipt({
      saleId: sale.id,
      saleNumber,
      status: SaleStatus.COMPLETED,
      completedAt,
      subtotal,
      discountAmount,
      taxAmount,
      total,
      allocations,
      payments: createdPayments,
    });

    return {
      saleId: sale.id,
      saleNumber,
      status: SaleStatus.COMPLETED,
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      allocations: receipt.allocations,
      completedAt: completedAt.toISOString(),
      receipt,
      } satisfies SaleCompletionResult;
    }, { maxWait: 15_000, timeout: 30_000 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const committedSale = await getCommittedSaleByRequestId(input.clientRequestId, actor.id);
      if (committedSale) return committedSale;
    }
    throw error;
  }
}

function groupBatchesById(groups: PreparedProductGroup[]) {
  const batches = new Map<string, LockedBatchRow>();
  for (const group of groups) {
    for (const batch of group.batches) {
      batches.set(batch.id, batch);
    }
  }
  return batches;
}
