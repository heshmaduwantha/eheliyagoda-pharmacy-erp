# Pharmacy ERP QA Execution Report

Execution date: 2026-09-05  
Environment: isolated local PostgreSQL 14.17, database `pharmacy_erp_qa`; Next.js QA server on `localhost:3100`  
Overall health: **FAIL**  
Recommendation: **NOT READY – CRITICAL BUSINESS LOGIC ISSUES**

## Executive summary

| Measure | Count |
|---|---:|
| Automated scenarios executed | 64 |
| Automated passed | 57 |
| Automated failed | 7 |
| UI/API checks executed | 6 |
| UI/API passed | 5 |
| UI/API failed | 1 (low-severity asset 404) |
| Total executed checks | 70 |
| Total passed | 62 |
| Total failed | 8 |
| Critical defects | 2 |
| High defects | 4 |
| Low defects | 1 |
| Blocked implemented scenarios | 0 |
| Major absent/partial capability groups | 9 |

The base-unit sale transaction has strong atomicity, row locking, FEFO and retry behavior. The system is nevertheless unsafe for real pharmacy operation because alternate-UOM purchases produce prices and costs that downstream services divide twice. This can undercharge sales by the purchase-unit factor and understate valuation/COGS by the same factor.

## Architecture observed

The React/Next.js UI calls Server Actions and one authenticated POS search route. Server modules apply authorization and business validation, then Prisma persists PostgreSQL transactions. Inventory is represented twice: current quantity on each batch and signed `StockMovement` ledger entries. Operational finance consists of sales/payments, supplier invoices/payments and expenses. Reports read these records directly. There is no general ledger, customer receivable, branch transfer or cash-register subsystem.

## Modules tested

| Module | Result | Key conclusion |
|---|---|---|
| Authentication/RBAC | PASS | Session login and anonymous POS API rejection worked; original permission tests passed |
| Product/UOM | FAIL | UI validates positive factors but DB does not; downstream alternate-UOM prices are wrong |
| Supplier | PASS/PARTIAL | Active-state supplier confirmation rule works; cross-supplier credit isolation fails |
| GRN/purchasing | FAIL | Quantity/cost normalization works; expired and inactive products can be confirmed |
| Batch/inventory ledger | PASS for base quantities | GRN, sale, void and supplier-return movement signs reconcile |
| POS/sales | FAIL for alternate UOM | Base-unit sales, FEFO, atomicity, MRP and concurrency pass |
| Sale void | PASS for implemented full void | Exact stock restoration and status/audit tested; partial return absent |
| Supplier return | FAIL | Quantity movement passes; invoice supplier matching fails |
| Supplier payments | PASS | Partial/full, overpayment rejection, audit and reports pass existing tests |
| Expenses | PASS | CRUD, soft delete, summary and permission tests pass |
| Prescription | PASS | Controlled and prompt-skippable rules pass synthetic tests |
| Reports | FAIL | Completed-sale filters pass; valuation and GRN-linked COGS contract is wrong |
| Audit | PASS/PARTIAL | Tested core actions write records; some supplier audit failures are swallowed |
| UI | CONDITIONAL | Critical pages render; login decorative external asset returns 404 |

## Detailed business results

The authoritative scenario list is in `QA_SCENARIO_MATRIX.md`. The most significant actual comparisons were:

| Test | Independent expected | Actual | Status |
|---|---|---|---|
| 10 BOX purchase | 1,000 tablets, Rs.15 base cost, Rs.15,000 payable | Exact match | PASS |
| Stock valuation | Rs.15,000 | Rs.150 | FAIL |
| POS UOM price | 20 / 200 / 2,000 | 0.20 / 2 / 20 | FAIL |
| Two-strip sale | -20 tablets, Rs.400 | Correct quote rejected | FAIL |
| Concurrent 8+5 from 10 | One commit, one reject, non-negative | Exact match | PASS |
| Supplier A credit vs Supplier B invoice | Reject | Accepted and invoice reduced | FAIL |
| Expired medicine receipt | Reject | Confirmed with stock/payable | FAIL |
| Inactive product receipt | Reject | Confirmed with stock/payable | FAIL |

## UOM validation

```text
1 BOX = 100 TABLETS
1 STRIP = 10 TABLETS
1 BOX / 1 STRIP = 10 STRIPS
10 BOX = 1,000 TABLETS
```

The GRN line and batch quantity store this correctly. The defect begins after batch prices are already normalized to the base unit.

## Inventory, costing and finance reconciliation

See `QA_RECONCILIATION_REPORT.md` for equations and transaction rows. Inventory quantity integrity passed in the exercised base-unit and concurrency flows. Inventory value and COGS fail for alternate-UOM GRN-linked batches. Supplier payment balance rules pass, but supplier-return settlement can mutate an unrelated supplier invoice and refund status has no cash/bank ledger record.

## Batch and expiry

FEFO, multi-batch splitting, expired-sale exclusion and quarantined-sale exclusion passed existing integration tests. Receiving an already expired medicine failed the business rule because confirmation checks only whether an expiry exists. Same-day expiry behavior is currently sale-eligible (`>= CURRENT_DATE`); an explicit business policy is still required.

## Security and direct API

Authenticated QA owner login succeeded. An anonymous `GET /api/pos/search` returned 401. Existing service tests verified unauthorized expense/payment/void behavior. A full role-by-route matrix was not replayed through the browser; server guards were inspected and permission registry tests passed.

## UI evidence

The tested flow was login → dashboard → products → POS search. Pages had meaningful content and no framework overlay. Product rows and POS search rendered. The only console failures were two requests for the external login texture `grainy-gradients.vercel.app/noise.svg`, both HTTP 404. Local Chrome was used because the Browser plugin was unavailable.

## Missing coverage and absent scope

Purchase orders/partial receipts, branch transfers, general adjustments, partial sales returns, customer credit/receivables, cash-register closing, tax configuration and double-entry accounting are not implemented. They were not marked as test failures. Real scanner hardware, real payment gateways and clinical correctness were not tested. Repeating-decimal cost allocation needs a declared rounding policy before acceptance criteria can be final.

## Final recommendation

**NOT READY – CRITICAL BUSINESS LOGIC ISSUES.**

Do not use this version for alternate-UOM purchasing or selling. Fix QA-DEF-001 and QA-DEF-002 first, then require all added business tests to pass. Before production, also fix supplier credit isolation, expired/inactive receipt validation and the DB conversion constraint. Re-run the full 70-check baseline plus dedicated rounding and role-matrix tests after those changes.
