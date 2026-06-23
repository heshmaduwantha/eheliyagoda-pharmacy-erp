# Milestone 11A — Sale Void / Refund

## 1. Purpose

Milestone 11A adds a safe full-sale void flow for completed sales.

The goal is to reverse a completed sale without deleting the original sale history. This milestone keeps the original `Sale`, `SaleLine`, `SalePayment`, and stock movement rows immutable and adds a dedicated void record for auditability.

This is operational reversal logic only. It is not a full partial refund system, not a payment gateway integration, and not a stock write-off/adjustment flow.

## 2. Why full void only

We intentionally support full voids only in this milestone.

Partial refunds add extra complexity around per-line return handling, split payment apportioning, and refund ledger semantics. For a single-pharmacy MVP, full void is the safer and easier rule to verify.

## 3. Data model

Added in Prisma:

- `SaleVoid`
- `SaleVoidStockPolicy`

Important fields:

- `SaleVoid.saleId` unique relation to the original sale
- `SaleVoid.reason`
- `SaleVoid.refundAmount`
- `SaleVoid.refundMethod`
- `SaleVoid.refundReference`
- `SaleVoid.stockPolicy`
- `SaleVoid.voidedById`
- `SaleVoid.voidedAt`
- `Sale.voidRecord`
- `User.saleVoids`

## 4. Stock policies

### `NO_STOCK_RETURN`

Default policy.

Use this when the product already left the counter, the package is not guaranteed to be sellable again, or the void is only about reversing the accounting side of the sale.

Behavior:

- sale status becomes `VOIDED`
- original stock-out movements remain untouched
- no `RETURN_IN` movement is created
- batch quantities do not change

### `RETURN_TO_ACTIVE`

This is permission-gated and should only be used for immediate cashier mistakes where the item never left the pharmacy.

Behavior:

- create a `RETURN_IN` movement per sale line
- restore batch quantity
- reactivate a depleted batch only when it is still safe
- do not reactivate expired batches
- do not reactivate quarantined batches

Returned medicines should not automatically go back to sellable stock. That policy stays intentionally strict.

## 5. Transaction flow

The void operation runs inside one PostgreSQL transaction.

Flow:

1. Validate `sale.void` permission.
2. Lock the sale row.
3. Load the sale with lines, payments, and any existing void record.
4. Reject non-completed sales.
5. Reject already voided sales.
6. Validate the full refund amount.
7. Create `SaleVoid`.
8. Update `Sale.status` to `VOIDED` and set `voidedAt`.
9. If policy is `RETURN_TO_ACTIVE`, lock each batch and create `RETURN_IN` movements.
10. Write audit logs in the same transaction.
11. Commit.

## 6. Audit actions

Added or used:

- `sale.voided`
- `stock.return_in`

The audit rows are written inside the same transaction as the data changes.

## 7. Report behavior

Reports continue to count only `COMPLETED` sales.

That means voided sales are excluded from:

- daily sales
- cash/card totals
- product-wise sales
- gross profit
- dashboard revenue widgets
- controlled-drug register totals that are based on completed sales

## 8. UI

Added:

- `/sales`

Behavior:

- lists recent sales
- supports status, date, and sale-number search filters
- shows sale lines and payments
- shows void metadata for already voided sales
- exposes a void button only for completed sales
- shows the void button only when the user has `sale.void`
- opens a modal that requires a reason
- defaults the refund amount to the full sale total

## 9. Tests

Added coverage for:

- completed sale can be voided
- voided sale cannot be voided again
- held sale cannot be voided
- no-stock-return keeps stock unchanged
- return-to-active restores batch quantity
- return-to-active creates `RETURN_IN`
- unauthorized user cannot void
- daily sales excludes voided sale
- gross profit excludes voided sale

## 10. Limitations

- No partial refund workflow yet
- No customer return intake workflow yet
- No quarantine return quantity model yet
- No sale refund payment gateway integration yet
- No write-off or manual stock adjustment flow yet
- Concurrent double-submit should still be checked once manually in staging or UAT

Manual concurrency checklist:

- Open the same completed sale in two browser sessions
- Trigger void in both sessions at nearly the same time
- Confirm one request succeeds
- Confirm the second request is rejected with a conflict
- Confirm only one `SaleVoid` row exists
- Confirm only one set of reversal movements exists when `RETURN_TO_ACTIVE` is used

## 11. Next milestone

Recommended next step:

- M11B Expired Write-off / Manual Stock Adjustment
