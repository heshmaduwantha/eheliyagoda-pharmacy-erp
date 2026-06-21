import type { PosCartLine, PosPaymentInput, PosProductSearchResult, PosReceiptPreview, PosUnitOption } from "./pos.types";
import { getMockBatchPreview } from "./pos.service";

export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function formatLkr(value: number) {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(value);
}

export function calculateLineTotal(quantity: number, unitPrice: number) {
  return roundMoney(Math.max(1, quantity) * unitPrice);
}

export function createCartLine(product: PosProductSearchResult): PosCartLine {
  const unit = product.units[0];
  return {
    id: `${product.id}-${unit.code}`,
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    quantity: 1,
    unitCode: unit.code,
    unitLabel: unit.label,
    unitPrice: unit.unitPrice,
    lineTotal: unit.unitPrice,
    availableUnits: product.units,
    batchPreview: getMockBatchPreview(product.id),
  };
}

export function updateCartLineQuantity(line: PosCartLine, quantity: number): PosCartLine {
  const safeQuantity = Math.max(1, Math.floor(Number.isFinite(quantity) ? quantity : 1));
  return { ...line, quantity: safeQuantity, lineTotal: calculateLineTotal(safeQuantity, line.unitPrice) };
}

export function updateCartLineUnit(line: PosCartLine, unit: PosUnitOption): PosCartLine {
  return { ...line, unitCode: unit.code, unitLabel: unit.label, unitPrice: unit.unitPrice, lineTotal: calculateLineTotal(line.quantity, unit.unitPrice) };
}

export function calculatePosTotals(lines: PosCartLine[], discount = 0, tax = 0) {
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const safeDiscount = Math.min(Math.max(0, discount), subtotal);
  const safeTax = Math.max(0, tax);
  const total = roundMoney(subtotal - safeDiscount + safeTax);
  return { subtotal, discount: safeDiscount, tax: safeTax, total };
}

export function calculateRemaining(total: number, payment: PosPaymentInput) {
  return roundMoney(total - payment.cashAmount - payment.cardAmount);
}

export function isPaymentExact(total: number, payment: PosPaymentInput) {
  return Math.round(total * 100) === Math.round((payment.cashAmount + payment.cardAmount) * 100);
}

export function createReceiptPreview(lines: PosCartLine[], payment: PosPaymentInput): PosReceiptPreview {
  const totals = calculatePosTotals(lines);
  return {
    receiptNumber: `PREVIEW-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
    lines,
    ...totals,
    payment,
  };
}
