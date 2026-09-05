# Pharmacy ERP Business QA

This area contains the reproducible business-level QA performed on 2026-09-05. It deliberately separates business expectations from the current implementation. Failing tests describe confirmed defects and are not changed to match incorrect behavior.

## Safety boundary

The repository `.env` points to a remote PostgreSQL database. No QA mutation was executed there. All mutation and concurrency tests ran against the dedicated local PostgreSQL database `pharmacy_erp_qa` on `127.0.0.1`.

The runner refuses to reset a database unless its host is local and its name ends in `_qa`.

```bash
export QA_DATABASE_URL='postgresql://YOUR_LOCAL_USER@127.0.0.1:5432/pharmacy_erp_qa?schema=public&connection_limit=10'
pnpm qa:business
```

The intentionally failing business tests currently make this command exit non-zero. That is the correct result until the confirmed defects are fixed.

## Documents

- `QA_MASTER_TEST_PLAN.md` — architecture, module inventory, business rules, risk and execution strategy.
- `QA_DATASET.md` — realistic synthetic data and independent calculations.
- `QA_SCENARIO_MATRIX.md` — implemented, blocked and absent scenarios.
- `QA_EXECUTION_REPORT.md` — actual 2026-09-05 results.
- `QA_DEFECT_REPORT.md` — reproducible defects sorted by severity.
- `QA_RECONCILIATION_REPORT.md` — inventory, batch, finance and report equations.
- `QA_TRACEABILITY_MATRIX.md` — requirement-to-code/API/DB/test coverage.
- `automated-tests/` — business-correct integration tests.
- `sql/verification.sql` — read-only database invariants.

## Environment evidence

- Next.js 15.5 / React 19 / TypeScript 5.8.
- PostgreSQL 14.17 QA instance.
- Prisma 6.19.3 with 13 applied migrations.
- UI checks used local Chrome through Playwright because the Browser plugin was unavailable.
- Synthetic identities use `example.test` addresses and non-real contact details.
