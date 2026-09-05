import { Prisma } from "@prisma/client";

/** Confirmed batch monetary fields are always stored per base inventory unit. */
export function baseUnitPriceForSaleUnit(
  baseUnitPrice: Prisma.Decimal,
  saleUnitFactor: Prisma.Decimal,
) {
  if (!saleUnitFactor.isFinite() || saleUnitFactor.lte(0)) {
    throw new Error("Sale unit conversion factor must be greater than zero.");
  }
  return baseUnitPrice.mul(saleUnitFactor);
}
