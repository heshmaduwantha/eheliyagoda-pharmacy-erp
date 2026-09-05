# QA Progress Checkpoint

Last updated: 2026-09-06, Asia/Colombo

## Completed — do not repeat

- Full repository file inventory, Prisma schema and primary business services inspected.
- Architecture and module implementation status documented.
- Safety boundary established: remote `.env` database was not mutated.
- Dedicated local PostgreSQL database `pharmacy_erp_qa` created with all 13 migrations.
- Deterministic synthetic owner/pharmacist and baseline catalog seeded locally.
- Original automated suite run against QA DB: **52 passed, 0 failed**.
- Added and executed 12 independent business-reconciliation tests: **5 passed, 7 failed**.
- Concurrency test proved simultaneous demand above stock cannot create negative quantity.
- UI/API QA executed at `http://localhost:3100` using local Chrome/Playwright against QA DB.
- Architecture, dataset, master plan, scenario matrix, defect report, safe runner and invariant SQL created.

## Remediation status

1. **QA-DEF-001 — FIXED / RETEST PASS.** Confirmed batch monetary fields are consumed as base-unit values and multiplied only by the requested sale factor.
2. **QA-DEF-002 — FIXED / RETEST PASS.** Valuation, sale COGS and supplier-return cost now use canonical base-unit batch cost.
3. **QA-DEF-003 — FIXED / RETEST PASS.** Return and invoice rows are locked; settlement requires the same supplier, cannot over-credit an invoice, and persists the settled invoice link.
4. **QA-DEF-004 — FIXED / RETEST PASS.** Service validation and remote PostgreSQL `factorToBase > 0` constraint are active.
5. **QA-DEF-005 — FIXED / RETEST PASS.** Confirming a medicine GRN rejects an expiry date before today atomically.
6. **QA-DEF-006 — FIXED / RETEST PASS.** Draft creation rejects inactive products and confirmation rechecks the current active state.
7. **QA-DEF-007 — FIXED / RETEST PASS.** The failing external login texture was removed; `/login` renders with no relevant console warnings/errors or external texture element.

## Remediation execution totals

- Final consolidated remote regression (current `QA_FIX_…` synthetic records): **14 passed, 0 failed**.
- Remote migration preflight: **0** invalid `ProductUnit.factorToBase` records found.
- Remote migration deployed: `20260905190000_qa_integrity_fixes`.
- UI/API retest for QA-DEF-007: **PASS** (login form rendered, username interaction worked, no texture reference or console error).

## Completion state

- Execution, reconciliation and traceability reports completed.
- TypeScript, diff and production build validation passed.
- Failing business tests preserved as regression specifications.
- Temporary QA web server stopped after evidence collection.
- All seven remediation defects are fixed and retested. Synthetic remote records were cleaned by exact identifiers.

## GRN Total Price → Base Unit Price Regression

- Dipyridamole 100 mg Tablet: 100 tablets, total cost Rs.90, total selling value Rs.100.
- Expected and actual after fix: cost Rs.0.90/tablet, selling Rs.1.00/tablet, batch stock 100.
- Targeted GRN regression passed; the batch now stores canonical per-base-unit values and no longer treats Rs.100 as the price of one tablet.
- GRN monetary fields are labeled and handled as total values for the entered line quantity.

## POS Deep Batch/UOM Regression

- Last updated: 2026-09-06, Asia/Colombo.
- Dedicated report created: `qa/POS_DEEP_QA_REPORT.md`.
- POS cart batch switching now recomputes `unitPrice` and `lineTotal` from the selected batch after every quantity preview refresh.
- Invalid zero/negative cart quantities are blocked with a warning instead of silently changing cart state.
- Payment is disabled when any current selected batch cannot fulfil the requested base quantity.
- Backend manual batch selection was retested: 2 STRIP from later batch A2 consumed 20 base units, charged Rs.24, persisted A2 on `SaleLine`, left A1 unchanged, reduced A2 from 300 to 280, and captured Rs.1.00/base COGS.
- Targeted POS regressions passed:
  - `pnpm exec tsx --test src/modules/sales/pos.utils.test.ts`: 2 passed.
  - `pnpm exec tsx --test --env-file=.env src/modules/sales/sale.service.test.ts`: 20 passed.
  - `pnpm exec tsx --test --env-file=.env --test-name-pattern "complete normal OTC sale|manual batch selection" src/modules/sales/sale.service.test.ts`: 2 passed.
  - `pnpm exec tsc --noEmit`: passed.

## Deferred coverage requiring product scope or policy

- Repeating-decimal inventory costing policy.
- Real barcode hardware behavior.
- Branch transfers, PO partial receipt, partial sales returns, customer credit, cash-register closing, tax engine and GL accounting are not implemented.
