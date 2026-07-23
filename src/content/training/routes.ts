const routePermissions: Array<[string, string]> = [
  ["/admin/users", "admin.users.manage"],
  ["/admin/roles", "admin.roles.manage"],
  ["/admin/permissions", "admin.permissions.read"],
  ["/admin/audit", "audit.read"],
  ["/admin/settings", "admin.settings.manage"],
  ["/suppliers/payments", "suppliers.payments.read"],
  ["/stock/grn", "procurement.grn.manage"],
  ["/stock/batches", "inventory.stock.read"],
  ["/stock/movements", "inventory.stock.read"],
  ["/stock/expiry", "inventory.stock.read"],
  ["/dashboard", "reports.dashboard.read"],
  ["/products", "inventory.product.manage"],
  ["/suppliers", "suppliers.manage"],
  ["/reports", "reports.read"],
  ["/sales", "pos.sale.create"],
  ["/pos", "pos.sale.read"],
];

export function permissionForTrainingRoute(route?: string) {
  if (!route || route.startsWith("/training") || route === "/login") return null;
  return routePermissions.find(([prefix]) => route === prefix || route.startsWith(`${prefix}/`))?.[1] ?? null;
}
