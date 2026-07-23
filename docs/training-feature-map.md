# Sinhala training module — implementation feature map

Audited on 2026-07-13 against the App Router pages, sidebar, Prisma schema, server actions, services, tests, and existing `docs/user-guide.md`.

## Operational route map

| Area | Current route | Guard | Current behavior |
| --- | --- | --- | --- |
| Login | `/login` | Public; redirects authenticated users | Username/password session login |
| Dashboard | `/dashboard` | `reports.dashboard.read` | Sales, payments, gross profit, stock alerts, expenses, payables |
| POS | `/pos` | `pos.sale.read`; completion requires `pos.sale.create` | Product/barcode search, converted units, FEFO, payments, prescription decisions |
| Sales | `/sales` | `pos.sale.create` | Sale history and permission-gated full void |
| Products | `/products` | `inventory.product.manage` | Product + unit + barcode creation; no update screen |
| Suppliers | `/suppliers` | `suppliers.manage` | Supplier creation/listing |
| Direct GRN | `/stock/grn`, `/stock/grn/new`, `/stock/grn/[id]` | `procurement.grn.manage` | Draft, review, confirm; no PO prerequisite |
| Inventory | `/stock` | `inventory.stock.read` | Read-only summary |
| Batches | `/stock/batches` | `inventory.stock.read` | Read-only batch register |
| Movements | `/stock/movements` | `inventory.stock.read` | Read-only ledger |
| Expiry | `/stock/expiry` | `inventory.stock.read` | Read-only calculated alerts |
| Expenses | `/expenses` | `expenses.read`; create separately gated | Operating-expense records |
| Supplier payments | `/suppliers/payments` | `suppliers.payments.read`; create separately gated | Partial/full invoice payments |
| Reports | `/reports` | `reports.read`; sensitive report has an additional guard | Sales, inventory, gross profit, AP, payments, expenses, controlled register |
| Users/Roles/Permissions | `/admin/*` | Admin permission per page | RBAC administration |
| Audit | `/admin/audit` | `audit.read` | Sensitive append-only audit review |
| Settings | `/admin/settings` | `admin.settings.manage` | Current settings workspace |

## Transaction truths used by training

- Product stock is stored and sold in base units with `Decimal(14,3)` quantities.
- A DRAFT direct GRN creates no stock movement. CONFIRMED GRN creates batches, `GRN_IN` ledger rows, and a supplier invoice.
- Medicine sale allocation is server-side FEFO across ACTIVE, unexpired batches. Insufficient valid stock blocks completion.
- Medicine quoted/selling price cannot exceed batch MRP.
- A COMPLETED sale creates authoritative lines/payments, captures batch cost/MRP snapshots, writes `SALE_OUT`, and reduces batch projection quantities.
- Controlled products are forced to `HARD_REQUIRED_CONTROLLED`; patient identifier and prescriber registration details are mandatory. Prescription image upload is not implemented in the current modal.
- Completed sales are not edited or deleted. The exposed correction is a full void with reason, refund metadata, and `NO_STOCK_RETURN` or carefully controlled `RETURN_TO_ACTIVE`.
- Supplier payments are separate records, cannot exceed outstanding balance, update invoice status, and do not count as expenses.

## Confirmed product gaps (shown as unavailable in training)

1. Purchase Order pages/services and approval workflow.
2. Dedicated customer full/partial return and partial refund workflow.
3. Supplier purchase return / supplier credit workflow.
4. Operational quarantine, write-off, and stock-adjustment mutation pages/services. The schema/permissions contain concepts, but stock UI explicitly states read-only.
5. Manual POS batch override and its audit workflow.
6. Existing product/batch price update screen.
7. Prescription image upload/storage UI.
8. Dedicated patient/customer and prescriber master-data pages.
9. Held-sale operational completion/resume UI (`Hold` currently reports not implemented).

These gaps are not silently simulated in the training content.

## Training architecture

- `/training`: authenticated dashboard, search, filters, business-cycle map, category progress.
- `/training/scenarios/[slug]`: scenario lessons.
- `/training/modules/[slug]`: component reference lessons.
- `/training/glossary`: Sinhala glossary.
- `/training/troubleshooting`: validation-based problem solving.
- Typed content: `src/content/training`.
- Reusable UI: `src/components/training`.
- Per-user progress: `TrainingProgress`, isolated from operational transaction models.
- Screenshot convention: `/public/training/<module>/<step>.webp`; placeholder remains visible until a maintained capture is supplied.

## Business-rule conflicts

The following requested rules describe the intended target system but are not currently fully enforced/exposed:

- Expired stock is excluded from POS allocation, but automatic transition to `QUARANTINED` was not found.
- Quarantine/write-off/adjustment concepts exist in schema/permissions, but no safe operational service/UI exists.
- “Manual batch override must be audited” cannot be exercised because no override control exists.
- Purchase Order rules cannot be exercised because Purchase Orders are not implemented.

The training guide flags each conflict rather than documenting a fictional action.
