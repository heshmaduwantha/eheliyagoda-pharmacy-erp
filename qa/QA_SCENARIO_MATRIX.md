# QA Scenario Matrix

Status reflects the system available on 2026-09-05. Missing functionality is not counted as a failed test.

| Test ID / Area | Scenario | Expected business result | Status | Evidence |
|---|---|---|---|---|
| UOM-PUR-001 | Buy 10 boxes, factor 100 | 1,000 base units; Rs.15 base cost; Rs.15,000 payable | PASS | Automated DB assertions |
| UOM-REP-001 | Value purchased box stock | 1,000 × Rs.15 = Rs.15,000 | FAIL | Actual unit cost Rs.0.15; value Rs.150 |
| UOM-POS-001 | Resolve tablet/strip/box prices | Rs.20 / Rs.200 / Rs.2,000 | FAIL | Actual Rs.0.20 / Rs.2 / Rs.20 |
| UOM-SALE-001 | Sell two strips | -20 tablets; Rs.400; closing 980 | FAIL | Correct quote rejected; server claims Rs.2/strip |
| DB-UOM-001 | Insert factor zero | DB rejects invalid conversion | FAIL | PostgreSQL accepted factor 0 |
| CONC-SALE-001 | Simultaneous 8 and 5 from stock 10 | Exactly one commits; no negative stock | PASS | One fulfilled, one rejected; one sale line |
| RET-SUP-001 | Apply Supplier A return to Supplier B invoice | Reject without mutation | FAIL | Settlement succeeded |
| RET-QTY-001 | Return one base unit | Batch -1, ledger -1, cost Rs.6 | PASS | DB records reconciled |
| GRN-EXP-001 | Receive already-expired medicine | Reject before stock/payable creation | FAIL | GRN confirmed |
| GRN-PROD-001 | Receive inactive product | Reject before stock/payable creation | FAIL | GRN confirmed |
| GRN-SUP-001 | Confirm inactive supplier GRN | Reject and create no batch/invoice | PASS | Rejected; zero dependent rows |
| PAY-METHOD-001 | Payment types | Cash/card only | PASS | Prisma enum verified |
| SALE-IDEMP | Repeat same client request ID | One sale and one stock deduction | PASS | Existing integration test |
| SALE-ATOMIC | Payment mismatch | No sale and no stock movement | PASS | Existing integration test |
| SALE-FEFO | Multiple expiry batches | Earliest eligible expiry first | PASS | Existing integration tests |
| SALE-EXP | Expired/quarantined sale stock | Excluded from allocation | PASS | Existing integration tests |
| SALE-MRP | Medicine price above MRP | Reject | PASS | Existing integration test |
| SALE-DISC | Discount greater than subtotal | Reject | Covered by service rule; direct edge suite pending |
| SALE-VOID | Full void with stock restoration | Preserve sale, status voided, exact batch restore | PASS | Existing integration test |
| SALE-RETURN | Partial sale return in alternate UOM | Restore original batch and reverse financials | NOT IMPLEMENTED | Only full void exists |
| PUR-RETURN | Base-unit supplier return | Reduce exact batch and ledger | PASS | RET-QTY-001 |
| PUR-RETURN-UOM | Supplier return entered as box/strip | Convert to base quantity | NOT IMPLEMENTED | UI/service accepts base quantity only |
| SUP-PAY | Partial/full supplier payment | Balance/status and audit reconcile | PASS | Existing finance tests |
| SUP-REFUND | Supplier cash refund | Cash/bank movement recorded | PARTIAL | Return status only; no finance ledger model |
| EXPENSE | Create/update/delete/report | Soft delete, totals and audit reconcile | PASS | Existing finance tests |
| PRESCRIPTION | Controlled sale | Patient/prescriber + permission required | PASS | Existing prescription/sale tests |
| AUTH-DIRECT | Anonymous POS search API | HTTP 401 | PASS | Playwright API request |
| UI-LOGIN | QA owner login | Dashboard renders | PASS | Playwright/Chrome |
| UI-NAV | Products and POS navigation | Meaningful screens, no framework overlay | PASS | Playwright/Chrome |
| UI-CONSOLE | Critical flow console health | No app/resource errors | FAIL (LOW) | Decorative external texture HTTP 404 |
| PO-PARTIAL | 100 boxes, 60 then 40 receipt | Pending quantity and over-receipt control | NOT IMPLEMENTED | No PurchaseOrder model |
| TRANSFER | Transfer between branches | Company total conserved | NOT IMPLEMENTED | No branch/transfer models |
| ADJUST | Positive/negative stock adjustment | Ledger and batch change atomically | NOT IMPLEMENTED | Enum only; no workflow |
| CREDIT-SALE | Partial payment/customer balance | Revenue full, receivable outstanding | NOT IMPLEMENTED | No customer/receivable; payments must equal total |
| TAX | Rate/category/inclusive/exclusive | Configured tax formula reconciles | NOT IMPLEMENTED | Only caller-supplied tax amount exists |
| ACCOUNTING | Debit/credit journal | Balanced journal entries | NOT IMPLEMENTED | No GL models |
| CASH-CLOSE | Register open/close | Till balance reconciles | NOT IMPLEMENTED | No cash-register model |
| PRODUCT-EDIT | Change/deactivate historical product safely | History preserved and rules enforced | PARTIAL | Supplier edit exists; product edit workflow absent |

## Existing suite result

The original 52 tests passed on the isolated database. They provide detailed sub-scenarios behind several PASS rows above. The new business suite added 12 cases: 5 passed and 7 failed.
