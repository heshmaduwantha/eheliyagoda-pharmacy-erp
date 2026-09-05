import { formatDateOnly, formatDateTime } from "@/lib/date-format";

export function formatInventoryMoney(value: string | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(Number(value));
}

export function formatInventoryQty(value: string) {
  return new Intl.NumberFormat("en-LK", { maximumFractionDigits: 3 }).format(Number(value));
}

export function formatInventoryDate(value: string | null) {
  return formatDateOnly(value);
}

export function formatMovementDate(value: string) {
  return formatDateTime(value);
}
