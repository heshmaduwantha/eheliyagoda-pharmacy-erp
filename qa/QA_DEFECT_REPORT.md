# QA Defect Report

## Remediation outcome — 2026-09-05

All seven listed defects are **FIXED / RETEST PASS** on the Medisquare remote database. The focused regression suite completed **14 passed, 0 failed** using `QA_FIX_…` synthetic records, followed by exact-record cleanup verification. Full evidence and reconciliation are in `qa/QA_FIX_RETEST_REPORT.md`.

## QA-DEF-001 — CRITICAL — Alternate-UOM price is normalized twice

**Business impact:** A box received at Rs.2,000 and normalized to Rs.20/tablet is later shown and sold as Rs.20/box, a 100× understatement. Correctly priced sales are blocked as `SALE_PRICE_CHANGED`; accepting the shown price causes severe revenue loss.

**Precondition:** Product base TABLET; STRIP=10; BOX=100. Confirm 10 BOX with selling price Rs.2,000/BOX.

**Steps:** Search product in POS; inspect all unit prices; attempt 2 STRIP sale quoted at Rs.200/STRIP.

**Expected:** Rs.20/tablet, Rs.200/strip, Rs.2,000/box; two-strip total Rs.400 and -20 tablets.

**Actual:** Rs.0.20/tablet, Rs.2/strip, Rs.20/box. Correct sale rejected because server recalculates Rs.2/strip.

**DB evidence:** `Batch.sellingPrice = 20.00` is already per base unit. **Code paths:** `src/modules/sales/pos.service.ts::batchPriceForUnit` and `src/modules/sales/sale.service.ts::batchPriceForUnit` divide it again by the GRN unit factor. **Test:** `UOM-POS-001`, `UOM-SALE-001`.

**Recommended fix:** Define and enforce one storage contract: confirmed `Batch.sellingPrice/mrp/costPrice` are per base unit. Multiply those values only by the requested sale-unit factor downstream. Add a migration comment or renamed fields plus regression tests covering GRN-linked alternate units.

## QA-DEF-002 — CRITICAL — Inventory valuation and COGS normalize base cost twice

**Business impact:** Stock and gross profit reports materially overstate profit and understate inventory value. A Rs.15,000 batch was reported as Rs.150.

**Expected:** Base cost Rs.15; 1,000-tablet valuation Rs.15,000.

**Actual:** Report base cost Rs.0.15; valuation Rs.150. Sale allocation similarly derives `costPriceAtSale` by dividing the already-normalized `Batch.costPrice` again.

**Code paths:** `src/modules/reports/inventory-report.service.ts` in all three `getBaseCost` functions; `src/modules/sales/sale.service.ts` cost allocation. **Test:** `UOM-REP-001`.

**Recommended fix:** Use `Batch.costPrice` directly as base-unit cost everywhere after GRN confirmation. Add cross-report assertions for valuation, COGS and gross profit.

## QA-DEF-003 — HIGH — Supplier return can reduce a different supplier's invoice

**Business impact:** Staff can apply Supplier A's credit to Supplier B, corrupting both payable balances with no reliable relational link to the settled invoice.

**Expected:** Reject when `SupplierReturn.supplierId !== SupplierInvoice.supplierId`.

**Actual:** Settlement completed and reduced Supplier B's invoice. **Code path:** `processSupplierReturnSettlement`; it loads the invoice but never compares supplier IDs. **Test:** `RET-SUP-001`.

**Recommended fix:** Lock the return and invoice, enforce matching supplier, and persist `settledInvoiceId` as a foreign key for audit/report traceability.

## QA-DEF-004 — HIGH — Database accepts zero/negative UOM factors

**Business impact:** Direct service use, future API changes, imports or admin scripts can create units that cause zero stock deductions or invalid division. The UI action checks positive values, but the database is the final integrity boundary.

**Expected:** PostgreSQL check constraint `factorToBase > 0`.

**Actual:** Direct Prisma insert with factor zero succeeded. **Test:** `DB-UOM-001`.

**Recommended fix:** Add a migration check constraint and validate in the service as well as the action.

## QA-DEF-005 — HIGH — Already-expired medicine can be received

**Business impact:** A confirmed GRN creates stock and supplier liability for unsellable medicine. POS later refuses the stock, leaving paid/owed inventory that cannot generate sales.

**Expected:** Confirmation rejects an expiry date earlier than the accepted receipt boundary.

**Actual:** 2020-01-01 medicine GRN confirmed in 2026. **Code path:** `confirmGrn` checks presence but not date. **Test:** `GRN-EXP-001`.

**Recommended fix:** Define whether same-day expiry is permitted, enforce the rule in action and transaction, and report the rejected line clearly.

## QA-DEF-006 — HIGH — Inactive product can be received

**Business impact:** Purchasing can add stock and payables for a product intentionally removed from sale/search availability.

**Expected:** Draft/confirmation rejects inactive products.

**Actual:** Inactive product GRN confirmed. **Code path:** product lookup selects IDs without `isActive`; confirmation selects only `productType`. **Test:** `GRN-PROD-001`.

**Recommended fix:** Validate active state inside the confirmation transaction. Decide whether existing drafts may be confirmed after deactivation and document that policy.

## QA-DEF-007 — LOW — Login depends on a failing external texture

**Business impact:** Two unnecessary 404 requests add noise and an external availability/privacy dependency to login rendering.

**Actual:** `https://grainy-gradients.vercel.app/noise.svg` returned 404 twice. **Code path:** `src/app/(public)/login/page.tsx`.

**Recommended fix:** Store the small decorative asset locally or remove it.

## Confirmed architectural gaps, not defects against claimed scope

Branch transfer, PO/partial receipt, partial sales return, customer credit/receivables, cash register, accounting journals, tax configuration and stock adjustment workflows are absent. They must be implemented and separately qualified before claiming full pharmacy ERP coverage.
