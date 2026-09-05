# Synthetic QA Dataset

All names and contacts are synthetic. The executable tests add a unique suffix so repeated runs cannot collide.

## Identities and suppliers

| Type | Value |
|---|---|
| QA owner | `qa_owner` (local QA database only) |
| QA pharmacist | `qa_pharmacist` (local QA database only) |
| Supplier A | QA HealthCare Distributors / QA Supplier A |
| Supplier B | QA MedSupply Lanka / QA Supplier B |
| Contact data | `example.test`, synthetic phone/address |

## Product matrix

| Product | Base | Alternate units | Intended purchase/sale use |
|---|---:|---|---|
| Paracetamol 500mg | TABLET | STRIP=10, BOX=100 | Deep executable UOM lifecycle |
| Amoxicillin 500mg | CAPSULE | STRIP=10, BOX=20 | Defined coverage; executable generic factor tests already cover factors |
| Vitamin C | TABLET | BOTTLE=100 | Defined coverage |
| Cough Syrup 100ml | BOTTLE | none | Defined coverage for base-only product |
| Insulin | VIAL | PACK=5 | Defined coverage |

The current product model represents every unit directly against the base. Thus BOX=100 is stored directly; STRIP→BOX is mathematically checked as `100 / 10 = 10`, not stored as a separate relationship.

## Executed Paracetamol lifecycle

```text
Purchase: 10 BOX × 100 TABLET = 1,000 TABLET
Invoice: 10 × Rs.1,500 = Rs.15,000
Expected base cost: Rs.1,500 / 100 = Rs.15/tablet
Expected selling prices: Rs.20/tablet, Rs.200/strip, Rs.2,000/box
Expected stock value: 1,000 × Rs.15 = Rs.15,000
Expected 2-strip sale: 2 × 10 = 20 tablets; charge Rs.400; closing 980
```

## Concurrency dataset

```text
Opening batch: 10 tablets @ Rs.10 sale price, Rs.6 cost
Checkout A: 8 tablets
Checkout B: 5 tablets, simultaneously
Required invariant: one commits, one rejects; closing is 2 or 5; never negative
```

## Supplier isolation dataset

```text
Supplier A return: 1 tablet @ Rs.6
Supplier B invoice: Rs.100
Expected: settlement rejected because supplier IDs differ
Actual: Supplier B invoice was reduced, proving the isolation defect
```

## Boundary dataset

- Already-expired medicine: expiry 2020-01-01.
- Inactive medicine: future expiry 2028-12-31.
- Inactive supplier: future-dated valid medicine receipt.
- Invalid UOM: direct database insert with `factorToBase = 0`.

## Rounding data retained for follow-up

The database supports three decimal quantity places and two decimal currency places. The proposed repeating-cost case is 30 capsules for Rs.1,000 (`33.333…` per capsule). The present GRN confirmation divides into a `NUMERIC(12,2)` batch cost, so it stores Rs.33.33 and loses the residual Rs.0.10 per box. This needs an accepted costing/rounding policy before a definitive pass criterion can be set.
