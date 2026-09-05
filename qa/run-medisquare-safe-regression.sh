#!/usr/bin/env bash
set -euo pipefail

if [[ "${I_UNDERSTAND_REMOTE_QA:-}" != "RUN_QA_FIX" ]]; then
  echo "Refusing remote QA run. Set I_UNDERSTAND_REMOTE_QA=RUN_QA_FIX."
  exit 2
fi

# This runner never resets, truncates, seeds, or deletes database records.
# Each test creates QA_FIX-prefixed records and removes only the IDs it created.
pnpm exec tsx --env-file=.env --test --test-concurrency=1 \
  qa/automated-tests/uom-cost-reconciliation.test.ts \
  qa/automated-tests/transaction-integrity.test.ts \
  qa/automated-tests/procurement-boundaries.test.ts
