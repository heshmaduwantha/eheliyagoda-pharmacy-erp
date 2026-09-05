#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${QA_DATABASE_URL:-}" ]]; then
  echo "Set QA_DATABASE_URL to a dedicated local database whose name ends in _qa."
  exit 2
fi

QA_DATABASE_URL="$QA_DATABASE_URL" node <<'NODE'
const value = process.env.QA_DATABASE_URL;
const url = new URL(value);
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const database = url.pathname.slice(1);
if (!localHosts.has(url.hostname) || !database.endsWith("_qa")) {
  console.error("Refusing destructive QA reset: host must be local and database name must end in _qa.");
  process.exit(2);
}
NODE

export DATABASE_URL="$QA_DATABASE_URL"
export PERF_LOGGING=0

pnpm exec prisma migrate deploy
UAT_RESET=CONFIRM_TRUNCATE_ALL \
SEED_OWNER_USERNAME=qa_owner \
SEED_OWNER_PASSWORD='QA-Owner-Only-2026!' \
SEED_PHARMACIST_USERNAME=qa_pharmacist \
SEED_PHARMACIST_PASSWORD='QA-Pharmacist-Only-2026!' \
pnpm exec tsx --env-file=.env prisma/seed.ts

pnpm exec tsx --env-file=.env --test --test-concurrency=1 \
  src/modules/auth/*.test.ts \
  src/modules/finance/*.test.ts \
  src/modules/prescriptions/*.test.ts \
  src/modules/procurement/*.test.ts \
  src/modules/reports/*.test.ts \
  src/modules/sales/*.test.ts \
  src/modules/training/*.test.ts

pnpm exec tsx --env-file=.env --test --test-concurrency=1 \
  qa/automated-tests/*.test.ts
