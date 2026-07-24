import type { PosCartLine, PosPaymentInput, PosProductSearchResult, PosReceiptPreview, PosUnitOption } from "./pos.types";

export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function formatLkr(value: number) {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(value);
}

export function calculateLineTotal(quantity: number, unitPrice: number) {
  return roundMoney(Math.max(1, quantity) * unitPrice);
}

export function createCartLine(product: PosProductSearchResult): PosCartLine {
  const unit = product.units.find((item) => item.id === product.defaultSaleUnitId) ?? product.units[0];
  if (!unit) throw new Error("This product has no sale unit configured.");
  const unitPrice = Number(unit.sellingPrice ?? 0);
  return {
    id: `${product.id}-${unit.id}`,
    productId: product.id,
    productName: product.name,
    prescriptionRule: product.prescriptionRule,
    primaryBarcode: product.primaryBarcode,
    quantity: 1,
    unitId: unit.id,
    unitLabel: unit.unitName,
    unitPrice,
    lineTotal: unitPrice,
    availableUnits: product.units,
  };
}

export function updateCartLineQuantity(line: PosCartLine, quantity: number): PosCartLine {
  const safeQuantity = Math.max(1, Math.floor(Number.isFinite(quantity) ? quantity : 1));
  return { ...line, quantity: safeQuantity, lineTotal: calculateLineTotal(safeQuantity, line.unitPrice) };
}

export function updateCartLineUnit(line: PosCartLine, unit: PosUnitOption): PosCartLine {
  const unitPrice = Number(unit.sellingPrice ?? 0);
  return { ...line, id: `${line.productId}-${unit.id}`, unitId: unit.id, unitLabel: unit.unitName, unitPrice, lineTotal: calculateLineTotal(line.quantity, unitPrice), batchPreview: undefined, selectedBatchId: undefined };
}

export function updateCartLineBatch(line: PosCartLine, batchId: string): PosCartLine {
  const batch = line.batchPreview?.candidates.find((b) => b.id === batchId);
  if (!batch) return { ...line, selectedBatchId: batchId };
  const unitPrice = Number(batch.sellingPrice ?? 0);
  return { ...line, selectedBatchId: batchId, unitPrice, lineTotal: calculateLineTotal(line.quantity, unitPrice) };
}

export function calculatePosTotals(lines: PosCartLine[], discount = 0, tax = 0) {
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const safeDiscount = Math.min(Math.max(0, discount), subtotal);
  const safeTax = Math.max(0, tax);
  const total = roundMoney(subtotal - safeDiscount + safeTax);
  return { subtotal, discount: safeDiscount, tax: safeTax, total };
}

export function calculateRemaining(total: number, payments: PosPaymentInput[]) {
  const paid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  return roundMoney(total - paid);
}

export function isPaymentExact(total: number, payments: PosPaymentInput[]) {
  const paid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  return Math.round(total * 100) === Math.round(paid * 100);
}

export function createReceiptPreview(lines: PosCartLine[], payments: PosPaymentInput[]): PosReceiptPreview {
  const totals = calculatePosTotals(lines);
  return {
    receiptNumber: `PREVIEW-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
    lines,
    ...totals,
    payments,
  };
}
