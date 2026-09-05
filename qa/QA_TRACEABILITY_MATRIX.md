# QA Traceability Matrix

| Business requirement | Scenario/test | Backend/API | DB tables | Result | Defect |
|---|---|---|---|---|---|
| Purchase UOM converts to base | UOM-PUR-001 | `createGrnDraft`, `confirmGrn` | Grn, GrnLine, Batch, StockMovement, SupplierInvoice | PASS | — |
| POS displays correct UOM price | UOM-POS-001 | `searchProductsForPos`, `/api/pos/search` | ProductUnit, Batch, GrnLine | FAIL | QA-DEF-001 |
| Alternate-UOM sale reconciles | UOM-SALE-001 | `completeSale` | Sale, SaleLine, SalePayment, Batch, StockMovement | FAIL | QA-DEF-001 |
| Inventory value uses base cost | UOM-REP-001 | `getStockValuationReport` | Batch, GrnLine, ProductUnit | FAIL | QA-DEF-002 |
| Profit uses historical COGS | Existing gross-profit test + UOM review | `getGrossProfitReport` | SaleLine | Conditional | QA-DEF-002 |
| UOM factor is positive | DB-UOM-001 | Product action + Prisma | ProductUnit | FAIL | QA-DEF-004 |
| No concurrent oversell | CONC-SALE-001 | `completeSale` | Batch, Sale, StockMovement | PASS | — |
| Sale retry is idempotent | Existing repeated-request test | `completeSale` | Sale.clientRequestId | PASS | — |
| Failed sale is atomic | Existing payment mismatch test | `completeSale` | Sale, Batch, StockMovement | PASS | — |
| FEFO across batches | Existing FEFO/split tests | `completeSale` | Batch, SaleLine | PASS | — |
| Expired stock cannot sell | Existing expired allocation test | `completeSale` | Batch | PASS | — |
| Expired stock cannot be received | GRN-EXP-001 | `confirmGrn` | Grn, Batch, SupplierInvoice | FAIL | QA-DEF-005 |
| Inactive supplier cannot receive | GRN-SUP-001 | `confirmGrn` | Supplier, Grn | PASS | — |
| Inactive product cannot receive | GRN-PROD-001 | `confirmGrn` | Product, GrnLine, Batch | FAIL | QA-DEF-006 |
| Supplier payment reconciles | Existing finance tests | `recordSupplierPayment` | SupplierPayment, SupplierInvoice, AuditLog | PASS | — |
| Return credit stays with supplier | RET-SUP-001 | `processSupplierReturnSettlement` | SupplierReturn, SupplierInvoice | FAIL | QA-DEF-003 |
| Return quantity hits ledger/batch | RET-QTY-001 | `createSupplierReturn` | SupplierReturn, StockMovement, Batch | PASS | — |
| Controlled sale is authorized | Existing controlled sale tests | `completeSale` | Prescription, Patient, PrescriptionSaleLine | PASS | — |
| Anonymous API is rejected | UI/API QA | GET `/api/pos/search` | User/session read | PASS (401) | — |
| UI renders critical routes | UI QA | `/dashboard`, `/products`, `/pos` | Read models | PASS | — |
| UI console/resources healthy | UI QA | Login asset | none | FAIL (LOW) | QA-DEF-007 |
| Partial sale return | Scope inspection | none | no model | NOT IMPLEMENTED | — |
| PO partial receipt | Scope inspection | none | no model | NOT IMPLEMENTED | — |
| Branch transfer | Scope inspection | none | no model | NOT IMPLEMENTED | — |
| Double-entry accounting | Scope inspection | none | no model | NOT IMPLEMENTED | — |
