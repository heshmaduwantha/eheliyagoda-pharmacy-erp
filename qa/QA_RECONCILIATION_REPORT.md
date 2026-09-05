# QA Reconciliation Report

## Alternate-UOM purchase

| Record | Independent expectation | Database actual | Result |
|---|---:|---:|---|
| GRN quantity | 10 BOX | 10.000 BOX | PASS |
| Base quantity | 10 × 100 = 1,000 TABLET | 1,000.000 | PASS |
| Stock movement | +1,000 TABLET | +1,000.000 | PASS |
| Batch cached quantity | 1,000 TABLET | 1,000.000 | PASS |
| Supplier invoice | 10 × Rs.1,500 = Rs.15,000 | Rs.15,000 | PASS |
| Stored base cost | Rs.1,500 / 100 = Rs.15 | Rs.15.00 | PASS |
| Stored base selling price | Rs.2,000 / 100 = Rs.20 | Rs.20.00 | PASS |
| Valuation report base cost | Rs.15 | Rs.0.15 | FAIL |
| Valuation report value | 1,000 × Rs.15 = Rs.15,000 | Rs.150 | FAIL |

The database purchase records reconcile. Downstream reads corrupt the already-normalized price/cost by applying the source unit factor a second time.

## Intended two-strip sale

```text
Opening stock       1,000 TABLET
Sale                2 STRIP × 10 = 20 TABLET
Expected closing      980 TABLET
Expected subtotal   2 × Rs.200 = Rs.400
Expected payment    Rs.400 cash
Expected COGS       20 × Rs.15 = Rs.300
Expected profit     Rs.400 - Rs.300 = Rs.100
```

The transaction did not commit: checkout recalculated the strip price as Rs.2 and rejected the correct Rs.200 quote. Atomicity held—there was no orphan sale or stock movement—but the core alternate-unit sale was unavailable.

## Concurrency reconciliation

| Item | Expected | Actual | Result |
|---|---|---|---|
| Opening | 10 | 10 | PASS |
| Simultaneous demand | 8 + 5 = 13 | 13 requested | — |
| Committed sales | Exactly one | Exactly one | PASS |
| Rejected sales | Exactly one | Exactly one | PASS |
| Closing | 2 or 5 | 2 or 5 depending lock winner | PASS |
| Negative stock | Never | None | PASS |
| Orphan sale lines | None | None | PASS |

## Supplier return isolation

| Transaction | Supplier A | Supplier B | Expected | Actual |
|---|---:|---:|---|---|
| Return credit | Rs.6 | — | Remains with A until matched | Created for A |
| Invoice before | — | Rs.100 | Rs.100 | Rs.100 |
| Apply A credit to B | -Rs.6 | -Rs.6 attempted | Reject | Accepted |
| Invoice after | — | Rs.100 expected | Rs.94 | FAIL |

The schema does not persist a `settledInvoiceId`, so later reconciliation depends on free-text notes and cannot reliably prove which invoice received the credit.

## Ledger equations supported by current model

For isolated products with complete history:

```text
SUM(StockMovement.qtyBase) = SUM(Batch.qtyOnHandBase)
```

This covers GRN in, sale out, full-void return in, write-off and supplier return. Transfer and general adjustment equations cannot be run because those workflows do not exist.

For completed sales:

```text
Sale.total = Sale.subtotal - Sale.discountAmount + Sale.taxAmount
Sale.total = SUM(SalePayment.amount)
Sale.subtotal = SUM(SaleLine.lineTotal)
Gross profit = SUM(lineTotal - allocated discount - qtyBase × costPriceAtSale)
```

The header/payment equations are transactionally enforced and existing tests pass. The cost term is wrong for GRN-linked alternate-UOM batches due to QA-DEF-002.

For supplier payables:

```text
Outstanding = totalAmount - paidAmount
```

Payments enforce positive amount, row locking and no overpayment. Supplier return deductions change invoice `totalAmount`, but supplier matching and paid-over-total handling are incomplete.

## Final cross-module table

| Transaction | Inventory | Batch | Revenue | COGS | Cash/Card record | Payable | Report |
|---|---:|---:|---:|---:|---:|---:|---|
| 10 BOX purchase | +1,000 | +1,000 | 0 | 0 | 0 | +15,000 | Valuation FAIL |
| Correct 2 STRIP sale | 0 committed | unchanged | 0 | 0 | 0 | 0 | Blocked by price defect |
| Base-unit concurrent sale | -8 or -5 | reconciled | +80 or +50 | +48 or +30 | equal to total | 0 | Core transaction PASS |
| Supplier return 1 base unit | -1 | -1 | 0 | 0 | refund not ledgered | credit Rs.6 | Supplier matching FAIL |
| Full sale void | restored when policy chosen | exact original batch | excluded from completed revenue | excluded | void record only | 0 | Existing test PASS |

## Business conclusion

The stock ledger and transaction locking are sound in tested base-unit cases. Alternate-UOM cost/price handling breaks the same transaction across POS, checkout, COGS and valuation, so the end-to-end business equation is not safe.
