# Milestone 10 — Expenses + Supplier Payments

## 1. Purpose

Milestone 10 එකෙන් pharmacy එකේ operational finance layer එක ගොඩනැඟුණා.

මෙය operating expenses සහ supplier invoice payments handle කරන phase එකක්. මෙය full double-entry GL එකක් නෙවෙයි.

මෙහි scope එක:

- operating expenses record කිරීම
- supplier invoice payments record කිරීම
- expense/payables/payment reports
- dashboard finance widgets
- RBAC සහ audit logging

මෙහි scope එකට අයිති නැති දේවල්:

- no full double-entry GL
- no stock mutation
- no sale completion changes
- no sale void/refund
- no stock write-off / adjustment
- no day-end / Z-report

## 2. Data model added

Milestone 10 තුළ database layer එකට පහත additions කරලා තියෙනවා:

- `ExpenseCategory`
- `Expense`
- `SupplierPayment`
- `SupplierInvoice.dueDate`
- `User` ↔ `Expense` relation
- `User` ↔ `SupplierPayment` relation
- `Supplier` ↔ `SupplierPayment` relation
- `SupplierInvoice` ↔ `SupplierPayment` relation

මෙම model set එකෙන්:

- expenses operational cost records වෙනවා
- supplier payments liabilities settle කරනවා
- supplier invoice due dates සහ overdue reporting possible වෙනවා

## 3. Expense rules

Expense flow එකට පහත rules apply වෙනවා:

- expense amount positive විය යුතුයි
- category required
- date required
- payment method required
- soft-deleted expenses reports වලින් exclude වෙනවා
- deleted expense records user interface එකේ immutable වගේ treat වෙනවා
- audit actions ලියනවා:
  - `expense.created`
  - `expense.updated`
  - `expense.deleted`

Expense records supplier invoice outstanding balances අඩු කරන්නේ නැහැ.

## 4. Supplier payment rules

Supplier payment flow එකට පහත rules apply වෙනවා:

- `SupplierPayment` එක `SupplierInvoice` එකකට අයිති වෙනවා
- `SupplierPayment` එක කිසිවිටෙක `Expense` එකක් වෙන්නේ නැහැ
- payment amount positive විය යුතුයි
- overpayment reject වෙනවා
- already paid invoice එකකට extra payment දාන්න බැහැ
- `SupplierInvoice.paidAmount` සහ `SupplierInvoice.status` එකම transaction එකේ update වෙනවා
- invoice row lock එකක් double-submit overpayment වලට protection දෙනවා
- audit actions:
  - `supplier_payment.recorded`
  - `supplier_invoice.status_updated`

## 5. Reports unlocked

Milestone 10 නිසා පහත read-only reports real data වලට connect වෙලා තියෙනවා:

- expense summary
- expense category grouping
- expense payment method grouping
- supplier payables summary
- outstanding amount calculation
- due date / overdue count
- supplier payment report
- dashboard finance widgets

Important separation:

- expenses report එක `Expense` rows only භාවිතා කරනවා
- supplier payment records expenses report එකට ඇතුළත් වෙන්නේ නැහැ
- supplier payables summary එක invoice + payment data වලින් generate වෙනවා
- reports are read-only

## 6. Permission matrix

| Permission | OWNER_DOCTOR | PHARMACIST_CASHIER |
|---|---:|---:|
| `expense.view` | Yes | Yes |
| `expense.create` | Yes | Yes |
| `expense.update` | Yes | Yes |
| `expense.delete` | Yes | Yes |
| `supplier_payment.view` | Yes | Yes |
| `supplier_payment.create` | Yes | Yes |

Single-pharmacy workflow එකක් නිසා operational finance actions දෙකටම these roles access දීලා තියෙනවා.

Server-side permission checks අදාල actions/services තුළම enforce වෙනවා. UI visibility පමණක් authorization එක නෙවෙයි.

## 7. Audit actions

Finance changes සඳහා audit trail එක තියෙනවා:

- `expense.created`
- `expense.updated`
- `expense.deleted`
- `supplier_payment.recorded`
- `supplier_invoice.status_updated`

Audit rows තුළ actor id, entity type, entity id සහ useful metadata store වෙනවා.

Money mutation events transaction boundary එක තුළ audit කරනවා.

## 8. Verification

Validated commands:

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

## 9. Remaining risks

මෙම milestone එක complete වුණත්, production readiness සඳහා තව ඉතිරි වන points තියෙනවා:

- manual / conceptual concurrent supplier payment test එක once-run කරන්න ඕන
- production seed / role validation after deploy still recommended
- finance UI browser smoke test still needed
- no day-end report yet
- no sale void/refund yet
- no stock write-off / adjustment yet

## 10. Next milestone

Recommended next work:

1. M11A Sale Void / Refund
2. M11B Expired Write-off / Manual Stock Adjustment
3. M12 Day-end / Z-report + Receipt Printing
4. M13 Production Hardening + UAT
