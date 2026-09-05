# POS Deep QA Remediation Report

Execution date: 2026-09-06  
Target: Medisquare Pharmacy ERP POS module  
Scope: continuation from the already-passed POS QA remediation session; no repository restart or full rescan was performed.

## Fixed POS issues

| Area | Issue | Fix | Status |
|---|---|---|---|
| Batch switching | Cart could keep stale selected-batch price after a quantity preview refresh. | `applyCartLineBatchPreview` now reapplies the selected batch candidate price and recalculates `lineTotal` whenever preview data refreshes. | FIXED / RETEST PASS |
| Selected-batch stock | Payment could remain enabled while a manually selected batch did not have enough base stock for the current quantity. | `canCartLineFulfilSelectedBatch` validates requested base quantity against the selected candidate, and `PosSummaryPanel` disables payment when any line cannot fulfil. | FIXED / RETEST PASS |
| Invalid quantity UX | Zero or negative quantity silently removed the line. | POS now warns that quantity must be greater than zero and leaves cart state intact. Backend validation already rejects invalid quantities. | FIXED / RETEST PASS |
| Test contract drift | A legacy sale test stored `Batch.sellingPrice` as a sale-unit price. | Test fixture now follows the confirmed production rule: batch monetary fields are per base unit. | FIXED / RETEST PASS |

## Business-rule confirmation

Batch monetary fields remain canonical per base inventory unit:

- `Batch.costPrice`: cost per base unit.
- `Batch.sellingPrice`: selling price per base unit.
- `Batch.mrp`: MRP per base unit.
- POS selected UOM price: `Batch.sellingPrice * selectedUom.factorToBase`.
- Requested stock quantity: `enteredQty * selectedUom.factorToBase`.

Manual batch selection is supported. If the cashier selects a later batch, checkout uses that exact batch under row locks instead of FEFO auto-allocation. If no batch is selected, backend allocation uses FEFO.

## Retest evidence

| Scenario | Expected | Actual | Result |
|---|---:|---:|---|
| A1 STRIP price | Rs.10 | Rs.10 | PASS |
| Switch to A2 STRIP price | Rs.12 | Rs.12 | PASS |
| 2 STRIP from A2 | Rs.24 revenue, 20 base units | Rs.24 revenue, 20 base units | PASS |
| A1 stock after A2 sale | 150 tablets | 150 tablets | PASS |
| A2 stock after A2 sale | 280 tablets | 280 tablets | PASS |
| SaleLine batch | A2 | A2 | PASS |
| SaleLine unit price / total | Rs.12 / Rs.24 | Rs.12 / Rs.24 | PASS |
| SaleLine COGS | Rs.1.00 per base unit | Rs.1.00 per base unit | PASS |
| StockMovement | A2, -20 base units | A2, -20 base units | PASS |
| Selected-batch insufficient stock | payment blocked | payment blocked by cart helper | PASS |

## Tests already passed

- `pnpm exec tsx --test src/modules/sales/pos.utils.test.ts`: 2 passed.
- `pnpm exec tsx --test --env-file=.env src/modules/sales/sale.service.test.ts`: 20 passed.
- `pnpm exec tsx --test --env-file=.env --test-name-pattern "complete normal OTC sale|manual batch selection" src/modules/sales/sale.service.test.ts`: 2 passed.
- `pnpm exec tsc --noEmit`: passed.

The 20-test POS sale service run covered sale completion, duplicate request id idempotency, shared-batch aggregation, insufficient stock rejection, expired batch exclusion, quarantined batch exclusion, FEFO split allocation, manual batch selection, MRP enforcement, controlled medicine validation, reports, payments, void without stock return, void with stock return, held-sale void rejection, and void permission rejection.

## Database reconciliation

The manual selected-batch scenario reconciled against database state:

- Input: Product A style batch setup, STRIP factor 10, quantity 2, selected Batch A2.
- Expected base deduction: `2 * 10 = 20`.
- Expected invoice total: `2 * Rs.12 = Rs.24`.
- Expected A1 stock: unchanged at 150.
- Expected A2 stock: 300 - 20 = 280.
- Expected COGS snapshot: Rs.1.00 per base unit.
- Actual database state matched every expected value.

Existing sale service cleanup removed synthetic sales and dependent stock/audit/payment rows through the test cleanup path. The previous remote QA fix report also records zero remaining `QA_FIX_...` product, supplier, GRN, supplier-invoice, or supplier-return records after cleanup.

## Files changed

- `src/components/pos/PosWorkspace.tsx`
- `src/components/pos/PosSummaryPanel.tsx`
- `src/modules/sales/pos.utils.ts`
- `src/modules/sales/pos.utils.test.ts`
- `src/modules/sales/sale.service.test.ts`
- `qa/QA_PROGRESS.md`
- `qa/QA_FIX_RETEST_REPORT.md`
- `qa/POS_DEEP_QA_REPORT.md`

## Readiness recommendation

POS is ready for controlled user acceptance testing on the verified paths: product selection, batch switching, UOM pricing, selected-batch stock checks, sale completion, SaleLine persistence, StockMovement, COGS, reports, payments, duplicate submission, and void handling.

Remaining product-scope items are unchanged: real barcode hardware behavior, branch transfers, partial sales returns, customer credit, cash-register closing, tax engine, and GL accounting are outside the implemented POS scope.
