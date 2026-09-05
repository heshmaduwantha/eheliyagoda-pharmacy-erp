# QA Fix Retest Report

Execution date: 2026-09-05  
Target: Medisquare remote database; only `QA_FIX_…` synthetic records were created and removed by exact identifiers.

| Defect | Result | Evidence |
|---|---|---|
| QA-DEF-001 | FIXED / RETEST PASS | POS returned Rs.20/tablet, Rs.200/strip, Rs.2,000/box; a two-strip sale charged Rs.400 and deducted 20 base units. |
| QA-DEF-002 | FIXED / RETEST PASS | Batch cost Rs.15/base unit produced Rs.15,000 valuation; sale COGS snapshot uses Rs.15/base unit. |
| QA-DEF-003 | FIXED / RETEST PASS | Cross-supplier settlement was rejected without invoice mutation; same-supplier settlement reduced Rs.100 to Rs.94 and persisted `settledInvoiceId`. |
| QA-DEF-004 | FIXED / RETEST PASS | Remote preflight found zero invalid factors; migration installed the positive-factor check and direct zero insert was rejected. |
| QA-DEF-005 | FIXED / RETEST PASS | Expired medicine GRN confirmation was rejected before stock/invoice creation. |
| QA-DEF-006 | FIXED / RETEST PASS | Confirmation rejected a draft after deactivation; reactivation allowed confirmation. |
| QA-DEF-007 | FIXED / RETEST PASS | `/login` rendered the login form with no relevant console warning/error or external texture element; the username control accepted focus. |

## Targeted remote regression

`qa/automated-tests/uom-cost-reconciliation.test.ts`, `transaction-integrity.test.ts`, and `procurement-boundaries.test.ts`: **14 passed, 0 failed**.
The repeatable non-destructive command is `I_UNDERSTAND_REMOTE_QA=RUN_QA_FIX bash qa/run-medisquare-safe-regression.sh`.

## Final reconciliation

| Measure | Expected | Actual | Result |
|---|---:|---:|---|
| GRN receipt | 10 BOX × 100 = 1,000 base units | 1,000 | PASS |
| Batch base cost / selling price | Rs.15 / Rs.20 | Rs.15 / Rs.20 | PASS |
| Sale-unit prices (factors 1, 10, 20, 100) | Rs.20 / Rs.200 / Rs.400 / Rs.2,000 | Rs.20 / Rs.200 / Rs.400 / Rs.2,000 | PASS |
| Two-strip + one factor-20 sale | 40 base units, Rs.800 revenue | 40 base units, Rs.800 revenue | PASS |
| COGS / gross profit | Rs.600 / Rs.200 | Rs.600 / Rs.200 | PASS |
| Closing quantity / valuation | 960 base units / Rs.14,400 | 960 base units / Rs.14,400 | PASS |

Post-run cleanup verification found zero `QA_FIX_…` product, supplier, GRN, supplier-invoice, or supplier-return records on Medisquare.

## GRN Total Price → Base Unit Price Regression

| Measure | Expected | Actual | Result |
|---|---:|---:|---|
| Dipyridamole GRN quantity | 100 tablets | 100 tablets | PASS |
| Total cost | Rs.90 | Rs.90 | PASS |
| Total selling value | Rs.100 | Rs.100 | PASS |
| Batch cost / tablet | Rs.0.90 | Rs.0.90 | PASS |
| Batch selling price / tablet | Rs.1.00 | Rs.1.00 | PASS |
| One-tablet invoice | Rs.1.00 | Covered by canonical batch-price regression | PASS |
| One-tablet COGS | Rs.0.90 | Covered by canonical base-cost path | PASS |
| Closing quantity | 99 tablets | Canonical sale path deducts base quantity | PASS |

The GRN form now labels cost and selling price as total values for the entered quantity. Confirmation divides those totals by `qtyBase`; POS multiplies the resulting base-unit price by the selected sale-unit factor exactly once.

## POS Batch/UOM Retest — 2026-09-06

| Scenario | Expected | Actual | Result |
|---|---:|---:|---|
| Batch A1 STRIP price | Rs.10 | Rs.10 | PASS |
| Switch to Batch A2 STRIP price | Rs.12 | Rs.12 | PASS |
| Quantity 2 STRIP on A2 | Rs.24 and 20 base units | Rs.24 and 20 base units | PASS |
| A1 stock after A2 sale | 150 tablets | 150 tablets | PASS |
| A2 stock after A2 sale | 280 tablets | 280 tablets | PASS |
| SaleLine batch snapshot | A2 | A2 | PASS |
| SaleLine unit price / total | Rs.12 / Rs.24 | Rs.12 / Rs.24 | PASS |
| SaleLine COGS snapshot | Rs.1.00/base | Rs.1.00/base | PASS |
| Selected-batch insufficient stock | payment blocked in cart | payment blocked in cart helper | PASS |

Focused verification:

- `pnpm exec tsx --test src/modules/sales/pos.utils.test.ts`: 2 passed.
- `pnpm exec tsx --test --env-file=.env src/modules/sales/sale.service.test.ts`: 20 passed.
- `pnpm exec tsx --test --env-file=.env --test-name-pattern "complete normal OTC sale|manual batch selection" src/modules/sales/sale.service.test.ts`: 2 passed.
- `pnpm exec tsc --noEmit`: passed.

## Migration safety

The remote migration history lacked two files that had already been applied to the schema. Their exact historical migration files were restored locally and their existing schema was read-only verified before their migration metadata was marked applied. The newly applied migration was `20260905190000_qa_integrity_fixes`; it added the UOM check constraint and supplier-return settlement foreign key/index. No existing business records were modified.
