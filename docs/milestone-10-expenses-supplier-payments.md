# Milestone 10 — Expenses + Supplier Payments Operational Finance

## Scope

මෙම milestone එකෙන් pharmacy එකේ operational finance layer එක real PostgreSQL data එකට connect කළා.

මෙහිදී:

- manual expenses record කිරීම
- supplier invoice payments record කිරීම
- payables summary සහ expense summary reports
- dashboard finance widgets
- RBAC permission checks
- audit logging

එවැනි read/write flows add කළා.

Sale completion, stock mutation, GRN flow, FEFO allocation, සහ payment gateway logic මේ milestone එකට අයත් නැහැ.

## What was added

### Database / Prisma

`prisma/schema.prisma` තුළ:

- `ExpenseCategory` enum
- `Expense` model
- `SupplierPayment` model
- `SupplierInvoice.dueDate`
- `User` ↔ `Expense` / `SupplierPayment` relations
- `Supplier` ↔ `SupplierPayment` relation
- `SupplierInvoice` ↔ `SupplierPayment` relation

### Migrations / Seed

- `prisma/migrations/20260623180000_milestone10_expenses_supplier_payments/migration.sql`
- `prisma/seed.ts` permission updates
- seeded supplier invoices now include due dates

### Finance module

- `src/modules/finance/expense.types.ts`
- `src/modules/finance/expense.service.ts`
- `src/modules/finance/supplier-payment.types.ts`
- `src/modules/finance/supplier-payment.service.ts`
- `src/modules/finance/finance.actions.ts`

### UI

- `src/components/finance/FinanceSummaryCards.tsx`
- `src/components/finance/ExpenseForm.tsx`
- `src/components/finance/ExpenseTable.tsx`
- `src/components/finance/SupplierPaymentForm.tsx`
- `src/components/finance/SupplierPaymentTable.tsx`
- `src/app/(app)/expenses/page.tsx`
- `src/app/(app)/suppliers/payments/page.tsx`
- `src/app/(app)/suppliers/page.tsx`
- `src/components/layout/sidebar-nav.tsx`

### Reports / Dashboard

- `src/modules/reports/payables-report.service.ts`
- `src/modules/reports/report.service.ts`
- `src/modules/reports/report.types.ts`
- `src/components/reports/ReportFilter.tsx`
- `src/app/(app)/reports/page.tsx`
- `src/app/(app)/dashboard/page.tsx`

### Tests

- `src/modules/finance/finance.service.test.ts`
- `package.json` test script includes finance tests

## Business rules enforced

- Expense create/update/delete needs `expense.*` permissions
- Supplier payment create needs `supplier_payment.create`
- Supplier payment is recorded against a supplier invoice
- Supplier invoice paid amount and status update in the same transaction
- Overpayment is rejected
- Deleted expenses are excluded from reports
- Supplier payments are not treated as expenses
- Audit logs are written for create/update/delete/payment events

## Report behavior

### Expenses

Expense reports now come from real `Expense` rows.

They support:

- category grouping
- payment method grouping
- soft-delete exclusion
- summary totals

### Supplier payables

Supplier payables now come from real `SupplierInvoice` balances.

They show:

- invoice total
- paid amount
- outstanding amount
- due date
- latest payment timestamp
- overdue count

### Supplier payments

Supplier payment reports now come from real `SupplierPayment` rows.

They show:

- payment number
- supplier
- invoice number
- amount
- method
- reference
- paid time
- created by

## Verification

Validated successfully:

```bash
node node_modules/prisma/build/index.js generate
node node_modules/prisma/build/index.js migrate deploy
corepack pnpm prisma:seed
corepack pnpm test
corepack pnpm lint
corepack pnpm build
```

Final result:

- Prisma generate ✅
- Migration deploy ✅
- Seed ✅
- Tests ✅
- Lint ✅
- Build ✅

## Notes

- Existing sale completion logic was not changed.
- No stock mutation was added in this milestone.
- No payment gateway integration was added.
- Reports remain read-only.

## Recommended next milestone

After this, the clean next work is:

1. Sale void / refund + write-off / adjustment
2. Day-end / Z-report + receipt printing hardening
3. Production hardening / UAT cleanup

