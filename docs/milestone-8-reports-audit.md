# Milestone 8 — Reports and Audit

## Scope

Milestone 8 provides read-only PostgreSQL/Prisma report models, a permission-gated reports workspace, a paginated audit viewer, and honest availability states for reports whose authoritative source tables do not yet exist.

Reports never create sales, payments, expenses, stock movements, adjustments, or FEFO allocations. Redis is not used as report truth.

## Report catalogue

| Report | Current source | Status |
|---|---|---|
| Daily sales | Future completed `Sale` rows | Unavailable until Sale exists |
| Cash vs card | Future completed-sale `Payment` rows | Unavailable until Payment exists |
| Product-wise sales | Future `SaleLine` snapshots | Unavailable until SaleLine exists |
| Gross profit | Future `SaleLine.costPriceAtSale` | Unavailable; current batch cost is never substituted |
| Stock valuation | Active `Batch` rows | Available |
| Low stock | Active product batch totals vs `Product.reorderLevel` | Available |
| Near expiry | Active/quarantined batches; default 90 days | Available |
| Expired/quarantined | Batch expiry/status and cost valuation | Available |
| Supplier payables | `SupplierInvoice` | Available; supplier liabilities are not expenses |
| Expenses | Future `Expense` model | Unavailable |
| Controlled drug register | Future completed Sale relation + Prescription models | Empty until completed sales exist |

## Permissions

- Reports workspace: `report.view`
- Controlled drug register: `report.view` and `controlled_drug.sell`
- Audit viewer: `audit.view`

All checks run on the server. UI visibility is not treated as authorization.

## Audit actions

- `controlled_drug_report.viewed` is written when the controlled register page result is loaded.
- `controlled_drug_report.exported` is reserved for a real future export action. The disabled CSV placeholder does not write a misleading export event.
- `prescription_image.viewed` is reserved for future protected image access.

## Known limitations

- There is no Sale, SaleLine, Payment, Expense, SupplierPayment, or SystemSetting model yet.
- Sales/revenue reports therefore show an unavailable state instead of zero or fabricated values.
- Gross profit will remain unavailable until cost-price-at-sale snapshots exist.
- Supplier invoices have no due-date column, so the report displays due date as unavailable.
- Near-expiry configuration defaults to 90 days until `system_settings.near_expiry_days` exists.
- Prescription records are not exposed as completed controlled sales because `Prescription.saleId` has no authoritative Sale relation yet.
- CSV export is intentionally disabled.

## Manual test checklist

After Sale/SaleLine/Payment/Expense models are implemented:

1. Create HELD, VOIDED, and COMPLETED sales in a test database; verify only COMPLETED appears in daily sales.
2. Add CASH and CARD payments to completed sales; verify grouping and totals.
3. Change current batch cost after a completed sale; verify gross profit still uses the sale-line cost snapshot.
4. Record a supplier payment and a normal expense; verify the supplier payment is excluded from expenses.
5. Load the controlled drug register with an authorized user; verify `controlled_drug_report.viewed` is written.
6. Verify a user without `audit.view` is redirected from `/admin/audit`.
7. Verify a user without `controlled_drug.sell` cannot load `type=controlled-drugs`.
8. When CSV export is implemented, verify the export content and `controlled_drug_report.exported` audit entry.
9. When prescription images are implemented, verify protected access and `prescription_image.viewed` without exposing storage keys.

Current-data checks:

1. Verify stock valuation equals the sum of active batch quantity multiplied by batch cost.
2. Verify low-stock results compare total active batch quantity against reorder level.
3. Verify supplier payables equal invoice total minus paid amount and are labelled separately from expenses.
4. Verify no mock report rows or financial totals appear.
