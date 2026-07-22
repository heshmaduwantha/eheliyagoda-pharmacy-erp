export type PermissionDefinition = {
  code: string;
  module: string;
  resource: string;
  action: string;
  description: string;
  isSensitive?: boolean;
};

export type PermissionModuleGroup = {
  module: string;
  permissions: PermissionDefinition[];
};

export const permissionRegistry: PermissionDefinition[] = [
  // POS
  { code: "pos.sale.read", module: "pos", resource: "sale", action: "read", description: "View POS sales and workspace access" },
  { code: "pos.sale.create", module: "pos", resource: "sale", action: "create", description: "Create and complete sales" },
  { code: "pos.sale.void", module: "pos", resource: "sale", action: "void", description: "Void completed sales" },
  { code: "pos.discount.override", module: "pos", resource: "discount", action: "override", description: "Override discount limits" },
  { code: "pos.cash_session.manage", module: "pos", resource: "cash_session", action: "manage", description: "Open and manage a POS cash session" },

  // Inventory
  { code: "inventory.stock.read", module: "inventory", resource: "stock", action: "read", description: "Read stock overview and movement data" },
  { code: "inventory.product.read", module: "inventory", resource: "product", action: "read", description: "View products" },
  { code: "inventory.product.manage", module: "inventory", resource: "product", action: "manage", description: "Create and update products" },
  { code: "inventory.batch.read", module: "inventory", resource: "batch", action: "read", description: "View stock batches" },
  { code: "inventory.batch.adjust", module: "inventory", resource: "batch", action: "adjust", description: "Adjust batch quantities" },
  { code: "inventory.stock.writeoff", module: "inventory", resource: "stock", action: "writeoff", description: "Write off expired stock", isSensitive: true },
  { code: "inventory.expiry_quarantine.manage", module: "inventory", resource: "expiry_quarantine", action: "manage", description: "Move stock in and out of quarantine" },

  // Procurement
  { code: "procurement.po.read", module: "procurement", resource: "po", action: "read", description: "View purchase orders" },
  { code: "procurement.po.create", module: "procurement", resource: "po", action: "create", description: "Create purchase orders" },
  { code: "procurement.po.approve", module: "procurement", resource: "po", action: "approve", description: "Approve purchase orders" },
  { code: "procurement.grn.read", module: "procurement", resource: "grn", action: "read", description: "View GRNs" },
  { code: "procurement.grn.confirm", module: "procurement", resource: "grn", action: "confirm", description: "Confirm GRNs and receive stock" },
  { code: "procurement.grn.manage", module: "procurement", resource: "grn", action: "manage", description: "Create and confirm GRNs" },

  // Suppliers / AP
  { code: "suppliers.read", module: "suppliers", resource: "suppliers", action: "read", description: "View suppliers" },
  { code: "suppliers.manage", module: "suppliers", resource: "suppliers", action: "manage", description: "Create and update suppliers" },
  { code: "suppliers.payables.read", module: "suppliers", resource: "payables", action: "read", description: "View supplier payables" },
  { code: "suppliers.payments.read", module: "suppliers", resource: "payments", action: "read", description: "View supplier payments" },
  { code: "suppliers.payments.create", module: "suppliers", resource: "payments", action: "create", description: "Record supplier payments" },

  // Prescriptions / controlled drugs
  { code: "prescriptions.read", module: "prescriptions", resource: "prescription", action: "read", description: "View prescription records" },
  { code: "prescriptions.image.read", module: "prescriptions", resource: "image", action: "read", description: "View prescription images", isSensitive: true },
  { code: "controlled_drugs.sale.create", module: "controlled_drugs", resource: "sale", action: "create", description: "Create controlled-drug sales" },
  { code: "controlled_drugs.register.read", module: "controlled_drugs", resource: "register", action: "read", description: "View the controlled-drug register", isSensitive: true },

  // Reports
  { code: "reports.read", module: "reports", resource: "workspace", action: "read", description: "Open the reports workspace" },
  { code: "reports.dashboard.read", module: "reports", resource: "dashboard", action: "read", description: "View dashboard summaries" },
  { code: "reports.sales.read", module: "reports", resource: "sales", action: "read", description: "View sales reports" },
  { code: "reports.inventory.read", module: "reports", resource: "inventory", action: "read", description: "View inventory reports" },
  { code: "reports.gross_profit.read", module: "reports", resource: "gross_profit", action: "read", description: "View gross profit reports" },
  { code: "reports.controlled_drugs.read", module: "reports", resource: "controlled_drugs", action: "read", description: "View controlled-drug reports", isSensitive: true },
  { code: "reports.expenses.read", module: "reports", resource: "expenses", action: "read", description: "View expense reports" },

  // Expenses
  { code: "expenses.read", module: "expenses", resource: "expense", action: "read", description: "View expenses" },
  { code: "expenses.manage", module: "expenses", resource: "expense", action: "manage", description: "Manage expenses" },
  { code: "expenses.create", module: "expenses", resource: "expense", action: "create", description: "Create expenses" },
  { code: "expenses.update", module: "expenses", resource: "expense", action: "update", description: "Update expenses" },
  { code: "expenses.delete", module: "expenses", resource: "expense", action: "delete", description: "Delete expenses" },

  // Administration
  { code: "admin.users.manage", module: "admin", resource: "users", action: "manage", description: "Manage users" },
  { code: "admin.roles.manage", module: "admin", resource: "roles", action: "manage", description: "Manage roles" },
  { code: "admin.permissions.read", module: "admin", resource: "permissions", action: "read", description: "View permissions" },
  { code: "admin.settings.manage", module: "admin", resource: "settings", action: "manage", description: "Manage settings" },
  { code: "audit.read", module: "audit", resource: "log", action: "read", description: "View audit logs", isSensitive: true },
];

export const permissionRegistryByCode = new Map(permissionRegistry.map((permission) => [permission.code, permission]));

export const legacyPermissionAliases: Record<string, string> = {
  "dashboard.view": "reports.dashboard.read",
  "pos.access": "pos.sale.read",
  "sale.create": "pos.sale.create",
  "sale.void": "pos.sale.void",
  "stock.access": "inventory.stock.read",
  "product.manage": "inventory.product.manage",
  "supplier.manage": "suppliers.manage",
  "grn.manage": "procurement.grn.manage",
  "expense.manage": "expenses.manage",
  "expense.view": "expenses.read",
  "expense.create": "expenses.create",
  "expense.update": "expenses.update",
  "expense.delete": "expenses.delete",
  "supplier_payment.view": "suppliers.payments.read",
  "supplier_payment.create": "suppliers.payments.create",
  "report.view": "reports.read",
  "user.manage": "admin.users.manage",
  "audit.view": "audit.read",
  "settings.manage": "admin.settings.manage",
  "controlled_drug.sell": "controlled_drugs.sale.create",
};

export const canonicalPermissionAliases = Object.entries(legacyPermissionAliases).reduce<Record<string, string[]>>((acc, [legacyCode, canonicalCode]) => {
  acc[canonicalCode] ??= [];
  acc[canonicalCode].push(legacyCode);
  return acc;
}, {});

export function canonicalizePermissionCode(code: string) {
  return legacyPermissionAliases[code] ?? code;
}

export function expandPermissionCodes(codes: Iterable<string>) {
  const expanded = new Set<string>();
  for (const code of codes) {
    const canonical = canonicalizePermissionCode(code);
    expanded.add(code);
    expanded.add(canonical);
    for (const legacy of canonicalPermissionAliases[canonical] ?? []) {
      expanded.add(legacy);
    }
  }
  return [...expanded];
}

export function groupPermissionsByModule(registry: PermissionDefinition[] = permissionRegistry) {
  const groups = new Map<string, PermissionDefinition[]>();
  for (const permission of registry) {
    const list = groups.get(permission.module) ?? [];
    list.push(permission);
    groups.set(permission.module, list);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([module, permissions]) => ({
      module,
      permissions: [...permissions].sort((left, right) =>
        left.resource.localeCompare(right.resource) || left.action.localeCompare(right.action),
      ),
    }));
}
