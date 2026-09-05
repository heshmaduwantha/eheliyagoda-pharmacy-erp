# NMRA Product Master Import Report

Source: National Medicines Regulatory Authority Sri Lanka, *Maximum retail price of Medicines*, 17 November 2025.

Run mode: APPLIED

## Import policy

This import extracts medicine identity/formulation only. Source MRP was retained only in the raw extraction evidence and was never selected, mapped, or written to Product, ProductUnit, Batch, POS, or reports.
Brand, manufacturer, barcode, regulatory number, route, commercial pack size, purchase price, selling price, and MRP were left unset unless represented by the existing identity fields. No Product model fields were overwritten.

## Counts

- Source rows extracted: 350
- Successfully parsed identity rows: 336
- Unique formulations: 279
- Existing exact/normalized matches before first apply: 0
- Newly created products on first apply: 279
- Existing exact/normalized matches on idempotency rerun: 279
- Newly created products on idempotency rerun: 0
- New safe products pending (dry run): 0
- Ambiguous matches: 0
- Incomplete/manual review: 14
- MRP fields selected for import: 0

## Representative created products

| Product | Generic | Strength | Dosage form | Base UOM | Price |
|---|---|---|---|---|---|
| Aspirin 75 mg Tablet (delayed Release) | Aspirin | 75 mg | Tablet (delayed Release) | Tablet | Not set |
| Paclitaxel(protein Bound Particles) 100 mg/Vial Suspension For Injection | Paclitaxel (protein bound particles) | 100 mg/Vial | Suspension For Injection | Piece | Not set |
| Acetylcysteine 200 mg/mL Infusion | Acetylcysteine | 200 mg/mL | Infusion | Piece | Not set |
| Azithromycin 500 mg Tablet | Azithromycin | 500 mg | Tablet | Tablet | Not set |
| Adalimumab 40 mg Injection | Adalimumab | 40 mg | Injection | Piece | Not set |
| Adapalene 2 % Cream | Adapalene | 2 % | Cream | Piece | Not set |
| Apixaban 5 mg Tablet | Apixaban | 5 mg | Tablet | Tablet | Not set |
| Amiodarone 100 mg Tablet | Amiodarone | 100 mg | Tablet | Tablet | Not set |
| Amikacin 250 mg/mL Injection | Amikacin | 250 mg/mL | Injection | Piece | Not set |
| Amikacin 250 mg/1 mL Injection | Amikacin | 250 mg/1 mL | Injection | Piece | Not set |

## Review and limitations

Commercial SKU identity is not asserted: repeated generic/formulation rows with different brands or pack presentations collapse to one formulation key. Rows lacking a reliable generic, dosage form, or strength remain in nmra_medicines_manual_review.csv. Base UOM is neutral Piece when the dosage form does not establish a safe stock unit; no strip/box/pack hierarchy was fabricated.
The November 2025 price list is not a current registration or pricing master. Current commercial prices must enter through the normal GRN/batch workflow.

The read-only post-import verification found 279 imported products, 279 base units, zero product prices, zero unit prices, zero invalid unit factors, and zero imported barcodes. The second apply completed with zero inserts, confirming idempotency.
