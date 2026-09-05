# QA Master Test Plan

## Architecture observed

```text
Next.js App Router pages and client components
  -> Server Actions and route handlers
  -> module services with Zod/action validation and permission guards
  -> Prisma transactions / PostgreSQL row locks
  -> batch cached quantity + append-only StockMovement rows
  -> operational supplier invoices/payments and sales/payment records
  -> server-rendered aggregate reports
```

Authentication is a signed HTTP-only JWT session. Authorization is enforced by server-side `requirePermission` guards and repeated in sensitive services through actor checks. Prisma is the ORM. PostgreSQL constraints provide foreign keys, unique identifiers and non-negative batch quantity/cost/price. No database triggers, stored procedures or accounting journal functions were found.

The inventory design uses the smallest unit as `Product.baseUnitName`. Every `ProductUnit.factorToBase` is a direct factor to that base; it is not a parent/child conversion graph. GRN draft calculates `qtyBase = qtyInUnit × factorToBase`. GRN confirmation stores batch cost, selling price and MRP per base unit. Sales lock products, units and eligible batches, allocate FEFO, insert sale/lines/payments/movements and update batches in one transaction.

Finance is operational, not double-entry accounting. Supplier invoices, supplier payments, sale payments and expenses exist. There is no journal, chart of accounts, cash register closing, bank ledger, customer receivable or tax configuration model.

## Module inventory

| Module | State | Observed scope |
|---|---|---|
| Users, roles, permissions | Implemented | Multi-role RBAC, active state, permission registry, audit |
| Product master | Partial | Create/list/search, units, barcodes, active field; no product edit/delete workflow, SKU or product code |
| Category/brand/generic masters | Not implemented | Category and generic are product text fields; brand absent |
| UOM conversion | Implemented with defects | Direct factor-to-base units; no hierarchy/circular graph |
| Suppliers | Implemented | Create/edit/activate/deactivate |
| Purchase order/partial receipt | Not implemented | Procurement begins at GRN |
| GRN | Implemented with boundary defects | Draft/update/confirm/void; creates batch, movement and payable |
| Batch/expiry | Implemented with defects | Batch quantities, FEFO, quarantine/write-off, expiry reports |
| Inventory ledger | Implemented | `StockMovement`; cached batch quantity |
| Stock adjustment | Not implemented | Enum value exists; no adjustment business workflow |
| Stock transfer/branches | Not implemented | No branch/store or transfer entities |
| POS/sales | Implemented with critical UOM defect | Cash/card, split payment, fixed invoice discount/tax input, FEFO |
| Sales return | Partial | Full sale void only; optional full stock restoration; no partial return |
| Purchase return | Partial | Supplier return in base quantity, refund/adjust status; defects in settlement isolation and finance evidence |
| Prescription/patient | Implemented | Synthetic patient capture, prompt-skippable and controlled rules |
| Customers/credit sales | Not implemented | No customer/customer ledger/receivable; payments must equal total |
| Supplier payments/payables | Implemented | Partial/full payment, balance and reports |
| Expenses | Implemented | Cash/card expense CRUD with soft delete and audit |
| Cash register | Not implemented | No till session/open/close/reconciliation |
| Accounting/GL | Not implemented | No journals, accounts, debit/credit postings |
| Tax engine | Not implemented | Sale accepts a non-negative tax amount; no rate/category/formula |
| Discounts | Partial | One fixed invoice discount; no percentage/line-entry workflow |
| Reports | Implemented with critical costing defect | Sales, cash/card, product, profit, valuation, stock, expiry, payables, payments, expenses, controlled drugs |
| Audit log | Implemented | Sensitive actions generally log actor/before/after; some service audit failures are swallowed |
| Training | Implemented | Static training catalog and per-user progress |

## Existing business rules discovered

1. Stock is stored as `NUMERIC(14,3)` base quantity; money is `NUMERIC(12,2)`.
2. Medicine GRNs require a generated batch number and an expiry date. Selling price must not exceed MRP.
3. Confirming a GRN is atomic and creates one batch and one positive `GRN_IN` movement per line plus an open supplier invoice.
4. A confirmed GRN cannot be voided after any supplier payment or after its received stock has been consumed.
5. Sale quantities multiply by `factorToBase`; eligible medicine batches are active, positive and expiry `>= CURRENT_DATE`.
6. Sales allocate by product, expiry ascending, creation time, then batch ID. Product/unit/batch rows are locked.
7. Payment sum must equal server-calculated invoice total. Negative discounts/tax and discounts greater than subtotal are rejected.
8. `clientRequestId` is unique and replay returns the already committed sale.
9. A full void preserves the sale, changes status to `VOIDED`, records the refund description and can restore exact original batch quantities when safe.
10. Reports count revenue only for `COMPLETED` sales and use stored `costPriceAtSale` for historical profit.
11. Supplier payments lock the invoice, prevent overpayment and update open/partial/paid status.
12. Controlled medicine sales require patient/prescriber data and a dedicated permission.

## Existing automated coverage

The repository supplied 52 passing tests on the isolated QA DB. They cover permission aliases, expense CRUD/reporting, supplier payments, prescription rules, GRN atomic confirmation and normalization, sale payment validation, stock deduction, idempotency, shared-batch aggregation, insufficient stock, expired/quarantined exclusion, FEFO, MRP, controlled medicines, profit history, full sale void and training routes.

Major pre-existing gaps were end-to-end alternate-UOM purchase-to-sale reconciliation, inventory valuation after GRN normalization, database-level UOM constraints, concurrent oversell, supplier-return settlement isolation, expired/inactive receiving and UI-to-DB reconciliation. The added QA tests target these gaps.

## Risk ranking

1. **Critical:** price and cost are normalized twice after alternate-UOM GRNs, affecting POS, sale acceptance, COGS and valuation.
2. **High:** supplier return can reduce an invoice belonging to a different supplier.
3. **High:** expired medicine and inactive product receipts are accepted.
4. **High:** no database constraint guarantees a positive conversion factor.
5. **High:** operational refund records have no cash/bank ledger posting model.
6. **Medium:** report services aggregate some complete datasets in memory and supplier payment report totals only the displayed page.
7. **Medium:** daily document numbers are derived by reading the latest value; concurrent drafts/payments can collide at unique indexes.
8. **Low:** login loads an external decorative texture that currently returns HTTP 404.

## Execution phases

Repository discovery, module classification, risk analysis, isolated data setup, existing suite, UOM/GRN/cost tests, inventory/sale/return tests, concurrency and authorization checks, report reconciliation, UI checks and final traceability were executed in that order. Missing modules are recorded as not implemented rather than failed.
