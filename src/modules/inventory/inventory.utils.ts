export function formatInventoryMoney(value: string | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(Number(value));
}

export function formatInventoryQty(value: string) {
  return new Intl.NumberFormat("en-LK", { maximumFractionDigits: 3 }).format(Number(value));
}

export function formatInventoryDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-LK", { dateStyle: "medium" }).format(new Date(value));
}

export function formatMovementDate(value: string) {
  return new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
