# Medisquare Pharmacy ERP User Guide

## What this system is for

Medisquare is a pharmacy and clinic ERP/POS built for day-to-day counter sales, stock receiving, inventory visibility, supplier management, expenses, supplier payments, reporting, and audit tracking.

The system is organized around a few core truths:

- stock is tracked by batch
- completed sales are the source of sales truth
- supplier payments are separate from expenses
- most screens are permission-gated
- sensitive actions are audited on the server

## Who uses it

- Owner / doctor
- Pharmacist / cashier
- Admin user with elevated permissions

The exact menus you see depend on your role.

## Getting started

### 1. Sign in

1. Open the login page.
2. Enter your staff username and password.
3. After sign-in, you will land on the dashboard.

If the credentials are wrong, the system shows a safe generic error message.

### 2. Understand the main navigation

The left navigation is the main way to move through the app:

- Dashboard
- Point of Sale
- Stock
- Sales
- Goods Received
- Products
- Suppliers
- Expenses
- Supplier Payments
- Reports
- Users & Roles
- Audit Logs
- Settings

Some items only appear if your role has permission to access them.

## Daily workflow

For most pharmacy operations, the usual flow is:

1. Receive stock through a GRN
2. Confirm the GRN so batches and payables are created
3. Add or maintain products and suppliers
4. Sell items through POS
5. Record expenses and supplier payments
6. Review reports and audit logs

## Dashboard

The dashboard gives a quick operations snapshot.

You can expect cards for:

- today’s sales
- cash vs card
- gross profit
- low stock
- near-expiry batches
- supplier payables
- expenses this month
- overdue payables

Notes:

- dashboard numbers are read from PostgreSQL
- supplier payments reduce payables, but they are not counted as expenses
- if there are no completed sales or no expenses yet, the dashboard shows honest empty states instead of fake zero-filled data

## Point of Sale

Use POS for live counter sales.

### What POS supports

- text search for products
- barcode lookup
- multi-unit selling
- cart quantity changes
- cash, card, or split payments
- prescription prompts for medicines that require a decision
- mandatory controlled-drug patient and prescriber details
- authoritative sale completion with receipt preview

### How to complete a sale

1. Go to `Point of Sale`.
2. Search for a product or scan a barcode.
3. Add the item to the cart.
4. Change quantity or unit if needed.
5. Review the summary panel.
6. Click the payment action.
7. Enter cash, card, or split payment amounts.
8. If prompted, provide prescription details or a skip reason.
9. Confirm the sale.
10. Review the receipt modal after completion.

### Important POS rules

- stock is only deducted when the sale is completed
- payment total must match the sale total
- controlled medicines require patient and prescriber details
- medicines with a prescription prompt require a valid decision
- expiry and stock checks are enforced server-side
- the receipt is based on the authoritative completed sale

### Barcode and search behavior

- barcode lookup uses exact barcode matching
- manual search is available as a fallback
- if a product has no configured sale unit, it cannot be sold

## Sales history and voids

The `Sales` page shows completed, voided, and held sales.

You can:

- filter by status
- search by sale number, cashier, or product
- filter by date
- view sale lines and payment breakdowns
- void a completed sale if you have permission

### Voiding a sale

Only completed sales can be voided, and only users with the `sale.void` permission can do it.

When voiding a sale:

- enter a reason
- choose the refund method if relevant
- choose the stock policy

Stock policy meaning:

- `NO_STOCK_RETURN`: default and safest option
- `RETURN_TO_ACTIVE`: only for immediate mistakes where the item never really left the counter and is still safe to sell

Voiding keeps the original sale record intact and adds a dedicated void record.

## Products

The `Products` screen is where the item catalogue is maintained.

Each product can have:

- a product type
- a base unit
- multiple sale/purchase units
- barcodes
- a default selling price
- a reorder level
- a prescription rule
- a controlled-drug flag

### When to use Products

Use this screen to:

- add new medicines or general items
- search the catalogue
- verify units and barcodes
- check whether an item is controlled or requires prescription handling

## Suppliers

The `Suppliers` screen stores supplier master data.

You can track:

- supplier name
- contact person
- phone
- email
- address
- credit terms
- active/inactive status

Use this page before creating GRNs or recording supplier payments.

## Goods Received Notes

GRNs are the stock-in path.

### What happens when a GRN is confirmed

- batches are created
- stock movements are written
- supplier payable records are created
- the GRN status changes from draft to confirmed

### How to create a GRN

1. Go to `Goods Received`.
2. Click `New GRN`.
3. Choose a supplier.
4. Add the received products and quantities.
5. Enter batch details where required.
6. Save the draft.
7. Open the draft GRN.
8. Confirm it.

### GRN rules

- a draft GRN does not move stock
- confirming a GRN is the point where stock actually enters inventory
- medicines require correct batch and pricing details
- once confirmed, the GRN is treated as final

## Stock

The `Stock` area is read-only.

It includes:

- inventory summary
- batch register
- stock movements
- expiry alerts

### What each stock view is for

- `Stock`: quick summary and recent batches
- `Batch register`: batch-level pricing, quantity, expiry, and status
- `Stock movements`: append-only ledger of GRN in, sale out, return in, write-off, and adjustment movements
- `Expiry alerts`: expired, quarantined, and near-expiry batches

### Important stock rule

This section does not let you mutate inventory directly. Adjustments, write-offs, and similar operational actions are not exposed as regular stock edits.

## Expenses

Use `Expenses` for operating costs that are not supplier invoice payments.

Examples:

- rent
- electricity
- water
- salaries
- transport
- internet
- stationery
- bank charges
- maintenance
- other operational costs

### How to record an expense

1. Open `Expenses`.
2. Fill in the form.
3. Choose the category.
4. Enter the date and amount.
5. Select the payment method.
6. Add any reference or notes.
7. Save the entry.

### Expense rules

- amount must be positive
- category is required
- deleted expenses are excluded from the reports
- supplier payments never appear here

## Supplier Payments

Use `Supplier Payments` to record payments against supplier invoices.

### How to record a supplier payment

1. Open `Supplier Payments`.
2. Select an invoice with an outstanding balance.
3. Enter the payment amount.
4. Choose cash or card.
5. Add any reference if needed.
6. Save the payment.

### Supplier payment rules

- a payment must be tied to an invoice
- it reduces supplier payables
- it never counts as an expense
- overpayment is rejected
- invoice balances stay in sync with the payment record

## Reports

The reports area is read-only and permission-gated.

Available report groups include:

- daily sales
- cash vs card
- product-wise sales
- gross profit
- stock valuation
- low stock
- near expiry
- expired or quarantined
- supplier payables
- supplier payments
- expenses
- controlled drug register

### How to use reports

1. Open `Reports`.
2. Choose a report type.
3. Adjust the date range if the report supports it.
4. Review the summary cards and table.

### Important reporting notes

- reports are based on authoritative database records
- some report types may show unavailable states if the source data does not exist yet
- supplier payments are separated from expenses
- controlled drug reporting is access-controlled and audited

## Audit logs

The audit log shows read-only history of important actions.

Use it to review:

- who did what
- what entity changed
- when the change happened

The audit viewer supports:

- search
- action filtering
- entity filtering
- pagination

## Users, roles, and settings

These pages are reserved for administration.

- `Users & Roles` is for user administration
- `Settings` is for future settings management

Depending on the current phase of the project, these screens may still be placeholders or partially implemented.

## Permission model

Access is enforced on the server, not just in the UI.

Typical permissions include:

- `dashboard.view`
- `pos.access`
- `sale.create`
- `sale.void`
- `stock.access`
- `product.manage`
- `supplier.manage`
- `grn.manage`
- `expense.view`
- `expense.create`
- `supplier_payment.view`
- `supplier_payment.create`
- `report.view`
- `user.manage`
- `audit.view`
- `settings.manage`
- `controlled_drug.sell`

If you try to open a screen without permission, you will be redirected to the forbidden page.

## Good operational habits

- confirm GRNs only after reviewing quantities and batch details
- keep product units and barcodes accurate before using POS
- use the correct prescription rule for medicines
- record expenses and supplier payments separately
- treat stock and sales screens as the source of truth, not screenshots or manually typed totals
- review audit logs for sensitive operations

## Common issues

### A product does not appear in POS

Check that:

- the product is active
- at least one sale unit is configured
- the barcode matches exactly, if using barcode search

### A sale cannot be completed

Possible causes:

- the payment total does not match
- the item is a controlled drug and details are missing
- a prescription prompt was not answered
- stock is insufficient
- the product has no valid sellable batch

### A GRN cannot be confirmed

Check that:

- the supplier exists and is active
- line items are complete
- medicine batches have the required details

### A supplier payment does not save

Possible causes:

- the invoice is already fully paid
- the amount is larger than the outstanding balance
- the invoice has not been selected correctly

## What is not in this release

Some screens and flows are intentionally limited or not yet built:

- full settings management
- user management workflows beyond the admin shell
- direct stock edit screens
- stock write-off and manual adjustment UI
- thermal print integration for receipts
- full day-end / Z-report style closing
- advanced supplier reminders

## Short glossary

- `Batch`: a specific stock lot with expiry, cost, and sellable quantity
- `GRN`: goods received note, the stock-in document
- `Sale`: completed customer transaction
- `Sale Void`: reversal record for a completed sale
- `Supplier Payable`: amount still owed to a supplier invoice
- `Expense`: operating cost that is not a supplier invoice payment
- `Audit Log`: read-only history of important actions

