import { Prisma } from "@prisma/client";

const lkr = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  minimumFractionDigits: 2,
});

type DecimalLike = Prisma.Decimal | number | string;

/** Formats a money value as LKR. Money is always stored as NUMERIC, never float. */
export function formatMoney(value: DecimalLike) {
  return lkr.format(Number(value));
}

/** Formats a stock quantity, trimming trailing zeros from the NUMERIC(14,3). */
export function formatQty(value: DecimalLike) {
  const num = Number(value);
  return Number.isInteger(num) ? num.toString() : num.toString();
}
