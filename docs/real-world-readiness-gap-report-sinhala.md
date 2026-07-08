# Real-World Readiness Gap Report — එහෙළියගොඩ ෆාමසි ERP/POS

> **අවසන් යාවත්කාලීනය:** 2026-06-23  
> **ව්‍යාපෘතිය:** MediSquare Pharmacy Clinic ERP  
> **විෂය පථය:** Real pharmacy counter එකේ ඇති වන සැබෑ scenarios vs system capabilities  

---

## A. Counter Sales (විකුණුම් කවුන්ටරය) Scenarios

| # | Scenario | සිංහල විස්තරය | වත්මන් Support | Missing Part | Fix නොකළහොත් Risk | Recommended Milestone |
|---|----------|---------------|---------------|-------------|-------------------|-----------------------|
| 1 | Barcode scan sale | Customer එක් item එකක් ගෙනත් counter එකේ scan කරයි | ✅ `lookupProductByBarcode()` — barcode match → product + unit + batch preview. POS UI `BarcodeInput.tsx` component. | `completeSale()` නැත — scan කළත් sale complete කළ නොහැක. | 🔴 Counter එකේ තනි sale එකක්වත් process කළ නොහැක. | **Milestone 9** |
| 2 | Loose tablet sale (බෙහෙත් පෙත්තක් බැගින්) | Paracetamol 12 tablets ඕනෑ — strip/box එකක් නොවේ | ✅ Multi-unit support: `ProductUnit` with `factorToBase`. Sale default unit = tablet. `PosCartLine` supports per-unit quantity. | Sale completion missing. Cart uses JS `number` for unit price (float risk). | 🟡 Loose sale preview works නමුත් complete කළ නොහැක. Server-side Decimal calculation pending. | **Milestone 9** |
| 3 | Strip/box sale | "Paracetamol strip 2ක් දෙන්න" — unit = strip, qty = 2 | ✅ `UnitSelectorModal.tsx`: unit change → recalculate `lineTotal` via `factorToBase`. | Sale completion missing. Price from `defaultSellingPrice × factorToBase` — batch-level price not yet authoritative in sale. | 🟡 Preview correct, sale cannot complete. | **Milestone 9** |
| 4 | Price changed since cart added | Customer cart එකේ item add කළාට පසු batch price admin විසින් වෙනස් කරයි | ⚠️ Partial: `quotedUnitPrice` in integration contract for mismatch detection. `getPosBatchPreview()` fetches current prices. | `completeSale()` must re-validate current batch prices inside transaction. No stale-price detection in current UI. | 🟡 Customer overcharged/undercharged. MRP ceiling breach possible. | **Milestone 9** |
| 5 | Payment mismatch | Rs. 500 bill එකට Rs. 480 ගෙවීම (Rs. 20 short) | ⚠️ Partial: `isPaymentExact()` in `pos.utils.ts` checks `total * 100 === paid * 100`. `PaymentModal.tsx` shows remaining. | Server-side exact match enforcement in `completeSale()` transaction. Split payment boundary not server-validated yet. | 🟡 Cashier ට receipt ලැබුනත් DB හි payment total ≠ sale total risk. | **Milestone 9** |
| 6 | Card reference missing | CARD payment එකකට card reference enter නොකර complete කිරීමට උත්සාහ කරයි | ⚠️ Partial: `PosPaymentInput.cardReference` optional in type definition. `PaymentModal.tsx` has card reference input field. | Server-side mandatory validation for CARD payments. Policy-level enforcement in `completeSale()`. | 🟡 Card reconciliation impossible — day-end audit failure. | **Milestone 9** |
| 7 | Insufficient stock | 100 tablets ඕනෑ, batch එකේ 50ක් විතරයි | ✅ `getPosBatchPreview()` returns `canFulfil: false`. UI can show warning. | `completeSale()` must reject or partial-fill. Row lock + qty check in transaction. | 🔴 Oversold risk — negative stock. DB constraint violation. | **Milestone 9** |
| 8 | Near-expiry / expired batch | Customer ට expired batch එකක් dispense වීම | ✅ `sellableBatches()` filters: `status === ACTIVE && expiryDate >= today` for medicines. Near-expiry alerts in `inventory.service.ts` (90 days). | Future `completeSale()` must re-check expiry inside transaction (not just preview). | 🔴 Expired medicine dispense — legal liability, patient safety. | **Milestone 9** |
| 9 | Manual batch override | Pharmacist FEFO order override කර specific batch එකක් select කරයි | ⚠️ Partial: `BatchPreviewCard.tsx` shows FEFO-ranked candidates. | No UI for manual batch selection. `completeSale()` should accept optional `batchId` override with audit. | 🟡 Pharmacist cannot use professional judgment for batch selection. | **Milestone 9** (audit) |
| 10 | Held sale | Customer items select කළ නමුත් මුදල් ගෙන්නට යයි — sale hold කළ යුතුයි | ⚠️ Type-only: `SaleStatus = "HELD"` in pos.types.ts. No persistence. | `Sale` model with `HELD` status. `holdSale()` service. Hold list UI. Resume held sale. | 🟡 Cashier re-enter කළ යුතුයි — time waste, line queue. | **Milestone 9** (optional) or **Milestone 12** |
| 11 | Receipt after completion | Sale complete වූ පසු receipt print කිරීම | ⚠️ Partial: `ReceiptModal.tsx` + `createReceiptPreview()` — preview only, not from DB. | Authoritative receipt from `completeSale()` response. Print-ready CSS for thermal printer. | 🟡 No legal receipt. Customer dispute resolution impossible. | **Milestone 9** (data) + **Milestone 12** (print) |

---

## B. Inventory/Procurement Scenarios

| # | Scenario | සිංහල විස්තරය | වත්මන් Support | Missing Part | DB/Service Rule Required | Test Case |
|---|----------|---------------|---------------|-------------|-------------------------|-----------|
| 1 | Supplier invoice + medicines ලැබේ | Supplier lorry එකෙන් invoice + medicines → GRN create | ✅ Full: `createGrnDraft()` → `confirmGrn()` = transactional: batch create, `GRN_IN` movement, supplier payable. | GRN edit/cancel after confirm not possible. | `Grn.status` = CONFIRMED is final. Cancel flow = Milestone 11+ | ✅ Seed GRN verified. Manual test: create draft, confirm, verify batch + movement + invoice. |
| 2 | Wrong batch entered in GRN | Pharmacist batch number error type කරයි | ⚠️ DRAFT state edit possible (UI forms). After CONFIRMED — no edit. | GRN line correction flow. Batch number amendment. | Batch correction via ADJUSTMENT movement type + audit. | Test: confirm GRN with wrong batchNo → attempt to correct → should require ADJUSTMENT + audit. |
| 3 | Same medicine, multiple batches | Supplier Paracetamol 2 batches (PAR-001, PAR-002) එකම GRN එකෙන් දෙයි | ✅ GRN supports multiple lines per product. Each `GrnLine` creates a separate `Batch`. | No UI validation for duplicate product lines with same batchNo. | `GrnLine` allows same productId multiple times — correct. Unique constraint on `Batch.grnLineId` prevents line-level duplication. | Test: GRN with 2 lines same product, different batches → both batches created with separate qty. |
| 4 | Batch expiry near | Batch 30 දිනකින් expire වෙයි | ✅ `getExpiryAlerts()`: 90-day threshold. `getNearExpiryReport()` report. UI expiry alerts. | Configurable threshold (now hardcoded 90). Alert notifications (dashboard badge). | `system_settings.near_expiry_days` — Milestone 13. | Test: batch with 45-day expiry → appears in near-expiry list. |
| 5 | Expired stock write-off | Batch expire වුණා — write-off කළ යුතුයි | ❌ Not implemented. `StockMovementType.WRITE_OFF` enum exists but no service. | `writeOffBatch(batchId, qty, reason, actorUserId)` service function. Batch status → DEPLETED if qty = 0. | Transaction: create `WRITE_OFF` movement, decrement `qtyOnHandBase`, update batch status, audit log. | Test: write-off full batch qty → batch status DEPLETED. Partial write-off → ACTIVE with reduced qty. |
| 6 | Stock adjustment | Physical count mismatch — 100 DB, 95 actual | ❌ Not implemented. `StockMovementType.ADJUSTMENT` enum exists but no service. | `adjustStock(batchId, actualQty, reason, actorUserId)` service. | Transaction: calculate diff, create ADJUSTMENT movement (positive or negative), update `qtyOnHandBase`, audit with before/after. | Test: adjust up/down. Cannot adjust below 0. Audit logs before/after qty. |
| 7 | No negative stock | Sale/write-off/adjustment attempt that would make qty < 0 | ✅ (GRN only) `confirmGrn()` uses `SELECT ... FOR UPDATE`. | `completeSale()` and future write-off/adjustment must also use row locks + qty check. | `WHERE qty_on_hand_base >= deductQty` in `UPDATE ... SET qty_on_hand_base = qty_on_hand_base - ?`. Application-level check + DB constraint. | Test: concurrent deductions that sum > available → one must fail with insufficient stock. |
| 8 | FEFO conflict | Batch A (expires Jan 2027) has 5 left, Batch B (expires Mar 2027) has 100 — customer wants 10 | ✅ (Preview) `sellableBatches()` sorts by expiry ascending. `getPosBatchPreview()` shows FEFO candidates. | `completeSale()` must implement multi-batch FEFO allocation: take 5 from A, 5 from B. | Loop through FEFO-ordered batches, deduct from each until fulfilled. Each batch deduction = separate `SALE_OUT` movement + row lock. | Test: order 10, batch A has 5, batch B has 100 → 2 movements: 5 from A, 5 from B. Batch A → DEPLETED. |
| 9 | Batch qty projection mismatch with ledger | `batches.qty_on_hand_base` ≠ SUM(movements) | ⚠️ No reconciliation tool. Projection updated on GRN confirm only. | Reconciliation script: compare `qtyOnHandBase` vs `SUM(CASE movementType WHEN 'GRN_IN' THEN qty WHEN 'SALE_OUT' THEN -qty ... END)`. | Admin-only reconciliation endpoint. Alert on mismatch. Force-correct with ADJUSTMENT movement + audit. | Test: manually corrupt `qtyOnHandBase` → reconciliation detects difference → admin reviews + corrects. |

---

## C. Controlled/Prescription Scenarios

| # | Scenario | සිංහල විස්තරය | වත්මන් Support | Missing Part | Risk | Recommendation |
|---|----------|---------------|---------------|-------------|------|----------------|
| 1 | Controlled drug without patient | Cashier Diazepam sell කරන්නට උත්සාහ කරයි patient details නැතිව | ✅ `prescription.rules.ts`: `HARD_REQUIRED_CONTROLLED` → `patientName + identifier + prescriberName + prescriberReference` **mandatory**. `PrescriptionValidationError` thrown. `ControlledDrugModal.tsx` enforces UI-side too. | `completeSale()` must re-validate inside transaction — not just preview validation. | 🔴 Legal liability — controlled drug accountability failure. NMRA violation. | Milestone 9 must call `validateAndPersistPrescriptionForCompletedSale()` **inside** the sale transaction. |
| 2 | Controlled drug without prescriber | Prescriber name / registration reference missing | ✅ Same as above: `prescriberName` + `prescriberReference` mandatory in `prescription.rules.ts`. | Same as above — server-side re-validation in sale transaction. | 🔴 Prescription register incomplete. | Milestone 9. |
| 3 | Prescription medicine skipped with reason | Amoxicillin (PROMPT_SKIPPABLE) — pharmacist skips with reason "patient purchased previously" | ✅ `PrescriptionPromptModal.tsx`: skip option with `skipReason` input. `prescription.rules.ts`: skip reason **mandatory** for PROMPT_SKIPPABLE. Audit action: `prescription.skipped`. | Persistence in DB depends on sale completion. | 🟡 Skip reason not persisted until sale completes. | Milestone 9. |
| 4 | Prescription image later | Prescription image upload — Phase 2 | ✅ `imageKey` optional in `Prescription` model. `prescription.rules.ts` comment: *"imageKey is intentionally optional for MVP controlled-drug checkout."* | File storage (S3/local), image access control, `prescription_image.viewed` audit. | 🟢 Low — MVP operates without images. | Phase 2, after Milestone 9 stable. |
| 5 | Controlled drug register view | Owner/pharmacist controlled drug dispensing history බලයි | ⚠️ Partial: `getControlledDrugRegister()` exists, audits view (`controlled_drug_report.viewed`). Returns `"unavailable"` because Sale model missing. | `Sale` model → join `PrescriptionSaleLine` to `COMPLETED` sales. | 🟡 NMRA register incomplete. Cannot prove accountability. | Milestone 9 (available after sale completion works). |
| 6 | Audit on sensitive views | Controlled drug report view → audit log written | ✅ `controlled-drug-report.service.ts`: `writeAuditLog({ action: "controlled_drug_report.viewed" })` called on every view. `"controlled_drug_report.exported"` reserved for future. | `prescription_image.viewed` audit — Phase 2. | 🟢 Current audit coverage adequate for MVP. | Maintain pattern in Milestone 9+. |

---

## D. Finance/Reporting Scenarios

| # | Scenario | සිංහල විස්තරය | වත්මන් Support | Missing Part | Risk | Recommendation |
|---|----------|---------------|---------------|-------------|------|----------------|
| 1 | Daily sales | අද හුලස් — total sales කීයද? | ❌ `getDailySalesReport()` → `"unavailable"`. Honest placeholder. | `Sale` model + query COMPLETED sales grouped by date. | 🔴 Business owner daily decision-making blocked. | **Milestone 9** |
| 2 | Cash vs card | අද cash කීයද, card කීයද? | ❌ `getCashCardReport()` → `"unavailable"`. | `SalePayment` model + group by method. | 🔴 Day-end cash drawer reconciliation impossible. | **Milestone 9** |
| 3 | Gross profit using cost-at-sale | Paracetamol එකේ profit margin කීයද? | ❌ `getGrossProfitReport()` → `"unavailable"`. Warning: *"Current batch cost is not used as a substitute for historical COGS."* | `SaleLine.costPriceAtSale` snapshot. Never use current batch cost for historical COGS. | 🔴 Profit calculation impossible without cost-at-sale snapshots. | **Milestone 9** (`costPriceAtSale` field mandatory). |
| 4 | Stock valuation | Pharmacy එකේ stock value කීයද? | ✅ `getStockValuationReport()`: SUM(batch.qtyOnHandBase × batch.costPrice). | At-cost valuation only. No MRP/selling price valuation option. | 🟢 Adequate for MVP. | Available now. |
| 5 | Supplier payable | Suppliers ට කොපමණ ණය තිබේද? | ✅ `getSupplierPayablesSummary()`: invoice total - paid amount = outstanding. | Due date field missing in `SupplierInvoice`. Payment recording not implemented. | 🟡 Cannot track payment deadlines or partial payments. | **Milestone 10** |
| 6 | Supplier payment | Supplier invoice එකට Rs. 50,000 ගෙවීම record කිරීම | ❌ Not implemented. `SupplierInvoice.paidAmount` exists but no `SupplierPayment` model. | `SupplierPayment` model + `recordSupplierPayment()` service. | 🟡 Supplier relationship tracking impossible. | **Milestone 10** |
| 7 | Operating expenses | Electricity bill, rent, transport cost record කිරීම | ❌ `getExpensesSummary()` → `"unavailable"`. Honest: *"Expense model has not been implemented."* | `Expense` model + CRUD + reporting. | 🟡 Owner cannot track operational costs. | **Milestone 10** |
| 8 | Expense vs supplier payment separation | Supplier payment එක expense ලෙස record නොවිය යුතුයි | ✅ Explicit separation: `payables-report.service.ts` comment: *"Supplier payables are excluded from expenses."* Separate types/tables planned. | Implementation of both as separate models. | 🟡 Without implementation, confusion possible in manual records. | **Milestone 10** |
| 9 | Day-end reconciliation | දවස අවසානයේ cash drawer count vs system total | ❌ No day-end report model or service. | `DayEndReport` model. `generateDayEndReport()`. Reconciliation UI. | 🟡 Cash discrepancies undetected. | **Milestone 12** |

---

## E. Security/Privacy Scenarios

| # | Scenario | සිංහල විස්තරය | වත්මන් Support | Missing Part | Risk | Recommendation |
|---|----------|---------------|---------------|-------------|------|----------------|
| 1 | RBAC bypass attempt | Cashier admin page access කිරීමට URL directly type කරයි | ✅ `requirePermission()` in every server action. `requireAuth()` with redirect/throw options. | No rate limiting on permission checks. No penetration test. | 🟡 Server actions protected; page-level guards may have gaps. | Milestone 13: full security audit. |
| 2 | Cashier trying to view audit | `audit.view` permission නැති user audit page ට යයි | ✅ `audit.view` permission check in audit page. Redirect to `/forbidden`. | Test coverage for all permission-gated pages. | 🟢 Low — mechanism in place. | Verify all routes in UAT. |
| 3 | Controlled report view audit | Controlled drug register බැලීම audit log write වේද? | ✅ `controlled_drug_report.viewed` audit action written on every view. Permission: `report.view` + `controlled_drug.sell`. | Export audit (`controlled_drug_report.exported`) reserved for future. | 🟢 Current coverage adequate. | Maintain in future exports. |
| 4 | Prescription image read audit later | Prescription image access logging | ⚠️ Planned: `prescription_image.viewed` reserved. `imageKey` field exists. | File storage, access control, audit implementation. | 🟢 Phase 2 — no images stored yet. | Phase 2 after Milestone 9. |
| 5 | Sensitive patient data minimization | Patient NIC/phone stored — minimize exposure | ⚠️ Partial: `Patient` model stores `nic`, `phone`, `patientReference`. Audit log `afterData` includes prescription details. | Ensure audit `afterData` never includes NIC/phone. Report views should mask sensitive fields. | 🟡 PDPA compliance risk. Patient data in audit logs. | Milestone 13: data minimization review. |
| 6 | Audit log tamper resistance | Admin DB access කර audit log records delete කරයි | ⚠️ Partial: Append-only by application convention. No DB-level immutability. | DB-level: revoke DELETE on `AuditLog` table for application role. Consider audit log archival. | 🟡 Tamper possible via direct DB access. | Milestone 13: DB role permissions. |
| 7 | Session/user attribution | Sale/GRN/audit action කරන user identify කිරීම | ✅ JWT session → `actorUserId` in audit logs. `Grn.receivedById`, `Prescription.capturedById` track actors. | `ipAddress`/`userAgent` in `AuditLog` schema but not passed from current `writeAuditLog()` call sites. | 🟡 IP/UA attribution missing for forensics. | Milestone 9: pass IP/UA from server actions. |

---

## F. ශ්‍රී ලංකා ෆාමසි යථාර්ථයන් (Sri Lanka Pharmacy Realities)

### 1. NMRA MRP Ceiling — batch-level price ceiling ලෙස
- **Status:** ✅ `Batch.mrp` field exists. `confirmGrn()` enforces `sellingPrice <= mrp` for medicines.
- **Gap:** `completeSale()` must re-verify MRP ceiling at sale time — batch MRP may have been corrected since GRN.
- **Practical note:** Sri Lanka NMRA maximum retail price = batch-level ceiling. System **දැනටමත්** batch-level MRP track කරයි — general product-level MRP mechanism වලට වඩා correct ය.

### 2. Controlled/Special Drug Accountability
- **Status:** ✅ `isControlled`, `isSpecialDrug` flags on `Product`. `HARD_REQUIRED_CONTROLLED` prescription rule. Patient + prescriber mandatory validation. Audit on controlled register views.
- **Gap:** Register not populated until sale completion. Export to CSV/PDF not implemented.
- **Practical note:** Sri Lanka pharmacy controlled drug register book — system must eventually support printable register for NMRA inspection.

### 3. One Pharmacist/Cashier Workflow
- **Status:** ✅ Single `PHARMACIST_CASHIER` role with POS + stock + controlled drug permissions.
- **Gap:** No concurrent session management. No "active POS session" concept.
- **Practical note:** බොහෝ එහෙළියගොඩ ප්‍රදේශයේ pharmacies එකේ pharmacist ම cashier. System single-user POS workflow support කරයි — concurrent POS sessions Milestone 13 consideration.

### 4. Zero/Default Tax — But Configurable
- **Status:** ⚠️ `calculatePosTotals()` accepts `tax = 0` default. `DailySalesSummary.tax` type exists. No tax configuration UI.
- **Gap:** `SystemSetting` for default tax rate not implemented. Sale-level tax calculation not enforced.
- **Practical note:** Sri Lanka pharmacy medicines typically zero-rated. General items may have VAT. System should default to zero but allow configuration.

### 5. සිංහල-Friendly UI Labels
- **Status:** ❌ All UI labels currently in English.
- **Gap:** No i18n framework. Sinhala product names not supported in search.
- **Practical note:** Sinhala labels for buttons, headers, receipts important for pharmacist usability. Product names can remain English (medicine names are English/generic). Receipt headers should support Sinhala.

### 6. Printer/Receipt Needs
- **Status:** ❌ No print functionality implemented. `ReceiptModal.tsx` is screen-preview only.
- **Gap:** Thermal printer CSS. Receipt format (pharmacy name, address, receipt no, date, items, totals). Print API/window.print() integration.
- **Practical note:** 58mm/80mm thermal receipt printers common in Sri Lankan pharmacies. Print-ready CSS with proper line breaks and font sizing critical.

### 7. Unstable Barcode Quality / Manual Search Fallback
- **Status:** ✅ Both barcode scan and text search available. `searchProductsForPos()`: name, generic name, barcode text search. `BarcodeInput.tsx` + `ProductSearchPanel.tsx`.
- **Gap:** Barcode scan hardware integration (USB HID scanner support — usually works out-of-box). Partial barcode match not supported (exact match only).
- **Practical note:** Sri Lankan pharmacy barcodes often low-quality print. Manual search fallback is **essential** and already implemented. Consider partial barcode prefix match.

### 8. Supplier Invoices/Payables — Common Workflow
- **Status:** ✅ `SupplierInvoice` created on GRN confirm. `getSupplierPayablesSummary()` report available.
- **Gap:** Supplier payment recording (`SupplierPayment` model). Due date tracking. Payment schedule/reminder.
- **Practical note:** Sri Lankan pharmacy suppliers typically give 30-60 day credit. System tracks `creditTermDays` on `Supplier` but doesn't calculate due dates. Payment recording is **high priority** for cash flow management.

---

## Summary Matrix — Readiness by Category

| Category | Ready | Partial | Missing | Critical Gaps |
|----------|-------|---------|---------|--------------|
| Counter Sales | 0 | 5 | 6 | `completeSale()` transaction |
| Inventory/Procurement | 4 | 2 | 3 | Write-off, adjustment, reconciliation |
| Controlled/Prescription | 4 | 1 | 1 | Register requires Sale model |
| Finance/Reporting | 2 | 1 | 6 | All sales reports, expenses, day-end |
| Security/Privacy | 4 | 2 | 1 | IP/UA attribution, data minimization |
| SL Pharmacy Realities | 3 | 2 | 3 | Sinhala UI, printer, supplier payments |

> [!IMPORTANT]
> **Milestone 9 (Authoritative Sale Completion)** සම්පූර්ණ කිරීමට පෙර මෙම system real pharmacy counter එකේ භාවිතා කළ **නොහැක**. 
> එය counter sales, reports, controlled drug register, සහ day-end reconciliation යන සියල්ල unlock කරන **critical path milestone** එකයි.
