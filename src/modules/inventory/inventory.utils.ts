export function formatInventoryMoney(value: number) {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(value);
}

export function formatInventoryDate(value: string) {
  return new Intl.DateTimeFormat("en-LK", { dateStyle: "medium" }).format(new Date(value));
}

export function formatMovementDate(value: string) {
  return new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
