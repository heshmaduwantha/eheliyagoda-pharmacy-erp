# Eheliyagoda Pharmacy ERP/POS Performance Audit

Status: implementation in progress. This document preserves the pre-optimization evidence and will be updated with final after-measurements.

Audit date: 2026-07-10  
Stack: Next.js 15 App Router, React 19, TypeScript, Prisma 6, PostgreSQL, Redis, Node.js 22 target  
Environment measured: local Next.js development server with a remote PostgreSQL database

## 1. Executive summary

### Main causes of slowness

1. **Remote database round trips dominate request time.** A warm `SELECT 1` median was approximately 141 ms, while a cold first connection was approximately 1.37 seconds. `EXPLAIN (ANALYZE, BUFFERS)` showed the actual PostgreSQL execution for representative reads was 0.03-1.43 ms. The delay is therefore connection/network/round-trip dominated rather than CPU or table-scan dominated at the current data volume.
2. **Authentication expands one Prisma call into eight SQL statements.** `getCurrentUser()` and `getUserPermissions()` load the primary role, assigned roles, role permissions, and permission records through nested Prisma relations. A query-event diagnostic counted eight SQL statements for one permission resolution. The authenticated layout and most pages both call an auth guard, so the same graph can be resolved twice during one navigation.
3. **POS relation loading is serialized by Prisma.** One logical product search loads products, units, barcodes, and batches as four SQL statements. The baseline POS read took 1.16-1.19 seconds even though the product-search SQL itself executed in approximately 0.22 ms.
4. **Dashboard data is over-fragmented.** The page calls five summary services in parallel and then loads expenses serially. The services issue at least nine logical Prisma operations and additional relation statements. Some services load detailed rows and aggregate in Node.js even though the dashboard only needs totals.
5. **Important transactions perform row-by-row writes.** Sale completion performs repeated stock movement, batch update, and audit inserts per allocation. GRN confirmation creates each batch and stock movement serially. On a remote database, every statement extends transaction duration and lock holding time.
6. **Password hashing occurs inside RBAC transactions.** User creation and password reset run bcrypt cost 12 after the interactive transaction has started, extending transaction lifetime without protecting any database invariant.
7. **Broad relation payloads cross the Server/Client Component boundary.** POS initially loads up to 100 products and serializes units, barcode information, and stock summaries into a large client component. The current tiny dataset produced a 4.2 KB JSON payload; this grows directly with catalog size.
8. **Route loading boundaries are absent.** No `loading.tsx` or route error boundary exists under the application route group, so navigation can appear unresponsive while auth and remote reads complete.
9. **Sale idempotency is incomplete at the client retry boundary.** The database has a unique `Sale.clientRequestId`, but the client creates a fresh UUID inside each submit call. A rapid duplicate invocation can therefore use two different keys.

### Highest-impact fixes selected

- Request-scoped auth deduplication with React `cache()` and a compact one-round-trip authorization query.
- Narrow, parallel POS relation reads with a smaller initial result cap.
- A database-aggregated dashboard read model instead of detailed-row loading.
- Bcrypt preparation before interactive RBAC transactions.
- Set-based writes for safe independent rows while retaining final validation, locks, stock changes, money changes, and audit rows in the transaction.
- Stable sale idempotency keys and duplicate-submit protection.
- Route-level loading UI and local pending feedback for critical mutations.
- Evidence-backed foreign-key indexes; no speculative trigram or summary-cache rollout at the current four-product data volume.

### Risks

- The database is remote and currently has variable latency. Application changes cannot guarantee 300-700 ms reads if one network round trip itself degrades beyond that range.
- Stock and finance transaction batching requires focused integrity tests before acceptance.
- The configured database is not confirmed to be an isolated test database. Destructive or synthetic sale/GRN benchmarks are therefore not run solely for timing.
- Redis is configured but currently used only for a health check. Adding authorization or dashboard caching would introduce invalidation and outage behavior that needs separate operational approval.

### Remaining limitations at baseline

- Product update is not implemented; only product creation exists.
- There is no automated GRN confirmation integrity test.
- The current integration tests target the configured remote database and failed during baseline execution; pure business-rule tests passed.
- PostgreSQL does not have `pg_stat_statements` or `pg_trgm` enabled in the measured database.

## 2. Repository architecture and request-flow audit

### Application structure

| Area | Current implementation |
| --- | --- |
| Route groups | `src/app/(public)` for login/setup; `src/app/(app)` for authenticated ERP screens |
| Root layout | `src/app/layout.tsx`; global CSS and metadata only |
| Authenticated layout | `src/app/(app)/layout.tsx`; resolves current user and renders `AppShell` |
| Server Components | All route pages are Server Components unless they import a narrow client form/workspace |
| Client Components | POS workspace/modals, forms, sidebar pathname state, GRN confirmation, sale void controls |
| Route handlers | None found |
| Server Actions | Auth, catalog, procurement, POS reads, sale completion/void, finance, and RBAC actions |
| Middleware | None found; protection is implemented in layouts, pages, and Server Actions/services |
| Prisma | Singleton in `src/lib/prisma.ts`; reused through `globalThis` during development |
| Redis | Singleton client in `src/lib/redis.ts`; health-check use only |
| S3 | No active S3 client implementation found; prescription records store an image key |
| State management | Local React state only; no external state library |
| Forms | Native forms plus `useActionState`; Zod boundary validation |
| Tables | Repository-specific server-rendered table components; no virtualization library |
| Audit | `writeAuditLog()` accepts Prisma or transaction client; sensitive mutations generally pass the active transaction |
| RBAC | JWT session cookie, DB-backed active user/roles/permissions, guards inside Server Actions |

### Critical request-flow maps

#### 1. Login

`GET /login` -> Login Server Component -> `getCurrentUser()` -> JWT verification -> no-cookie fast exit -> `getBootstrapState()` -> `User.count` + owner `Role.findUnique` -> render login form.

`POST Server Action` -> Zod parse -> `User.findUnique(username)` -> bcrypt compare cost 12 -> signed JWT cookie -> redirect `/dashboard` -> authenticated layout auth lookup -> dashboard page permission lookup -> dashboard summary queries -> RSC serialization/render.

Duplicated work: authenticated layout and dashboard page both resolve the same user/role/permission graph. The redirect also immediately pays dashboard query cost after bcrypt.

#### 2. Dashboard

Browser navigation -> authenticated layout `requireAuth()` -> page `requirePermission()` -> five summary promises -> expense summary awaited afterward -> card mapping -> Server Component render.

Database work: stock counts plus product/batch projection, supplier invoice details, daily sale rows, payment rows, sale-line rows, and expense group-by. Detailed rows are loaded for values that can be calculated by aggregate SQL.

#### 3. POS opening

Browser navigation -> layout auth -> page permission auth -> `searchProductsForPos("")` -> product query -> Prisma relation queries for units, barcodes, and active batches -> serialization into `PosWorkspace` -> client hydration of workspace and all statically imported modals.

Duplicated work: auth graph in layout/page; initial catalog payload includes up to 100 products.

#### 4. Product search

Input state -> deferred value -> 250 ms timer -> Server Action -> permission resolution -> product query -> units/barcodes/batches relation queries -> serialize -> replace client result list.

The client ignores stale responses, but the stale server work cannot be cancelled. Each search repeats authorization and relation loading.

#### 5. Inventory batches

Navigation -> layout auth -> page permission -> filter parsing -> `Batch.findMany` with product and primary barcode -> up to 250 rows -> table render.

Search uses leading-wildcard `contains` across batch number, product name/generic name, and barcode. At current volume SQL is sub-millisecond; trigram indexes are not justified yet.

#### 6. Sale completion

Payment/prescription UI -> `completeSaleAction` -> server-side auth -> Zod -> interactive transaction -> deterministic product/unit locks -> product/unit validation -> prescription rules -> candidate batch locks per product -> FEFO allocation -> sale -> sale lines -> repeated stock movement/update/audit per allocation -> payments -> prescription persistence -> payment audits -> sale audit -> commit -> broad path revalidation -> receipt UI.

Correctness retained at baseline: transaction-time stock check, batch lock, FEFO, expiry/quarantine exclusion, MRP recheck, numeric arithmetic, append-only movement, cached quantity update, actor attribution, and same-transaction audit.

Performance/correctness issue: repeated allocations against one batch calculate each update from the originally loaded quantity. Allocations must be aggregated per batch before the single cached-quantity update.

#### 7. Product creation/update

Form -> Server Action auth -> Zod -> transaction -> product plus units -> barcode inserts in a loop -> audit -> path revalidation.

Only creation exists. No product-update service/action was found, so update timing cannot be measured or optimized without adding business behavior outside this task.

#### 8. GRN confirmation

Confirmation UI -> Server Action auth -> transaction -> lock GRN -> load supplier/lines/products -> validate DRAFT, supplier, medicine batch/expiry/MRP -> serial batch + `GRN_IN` movement per line -> supplier invoice -> mark confirmed -> audit -> commit -> two path invalidations.

No HTTP, Redis, or S3 call occurs inside the transaction. Stock moves only on confirmation.

#### 9. Major-module navigation

Next `<Link>` -> RSC request -> authenticated layout auth -> target page permission auth -> target data reads -> RSC merge. There is no middleware database access, but there is also no route-level loading boundary. The browser receives no useful intermediate state while remote reads run.

## 3. Instrumentation

Development-only instrumentation was added before optimization:

- Correlation ID per measured operation.
- Route/operation and method.
- Actor ID when auth resolves.
- Total, auth, permission, database, Redis, and external-storage durations.
- Prisma operation count and slowest logical Prisma operation.
- Read-only benchmark payload bytes.
- Production default is disabled; `PERF_LOGGING=1` enables and `PERF_LOGGING=0` disables.

The logs intentionally exclude SQL parameters, request bodies, credentials, session tokens, patient data, controlled-drug details, and signed image URLs.

Important measurement note: Prisma `$extends` observes one logical Prisma operation. A nested relation operation may generate several SQL statements. A separate Prisma query-event diagnostic counted actual statements for selected baseline flows: permission resolution 8, POS product read 4, catalog product read 3.

## 4. Before measurements

### Infrastructure baseline

| Measurement | Result |
| --- | ---: |
| First process/database connection | 1,365.6 ms |
| Warm `SELECT 1` samples | 137.4-146.7 ms |
| Warm median round trip | 141.1 ms |
| Product rows before failed integration fixtures | 4 |
| Batch rows | 5 |
| Stock movement rows | 6 |
| Sale rows | 2 |
| Audit rows | 20 |

### User-flow baseline

These are same-process, query-shape-warmed read measurements. The database remained remote. `DB time` is the sum of overlapping logical Prisma durations, so it can exceed total wall time.

| Flow | Total time | DB time | Query count | Payload size | Client render notes |
| ---- | ---------: | ------: | ----------: | -----------: | ------------------- |
| Login page GET | 1,151 ms browser cold navigation | not correlated | 0 auth + 2 bootstrap SQL | HTML/RSC not exposed by browser API | Meaningful login form rendered; no console errors |
| Login preflight, warm | 312.7 ms | 620.6 ms summed | 2 logical / 2 SQL | 37 B JSON | No client hydration needed for preflight |
| Permission resolution, warm | 2,002.7 ms | 2,000.8 ms | 1 logical / 8 SQL | 750 B JSON | Repeated by layout/page at baseline |
| Dashboard summaries, warm benchmark | 931.8 ms | 3,530.3 ms summed | 9 logical / at least 11 SQL | 1,567 B JSON | Actual page also awaits expenses serially and has no loading boundary |
| POS load, warm | 1,187.0 ms | 1,185.5 ms | 1 logical / 4 SQL | 4,234 B JSON | Entire POS workspace and modal set hydrates |
| Product search, warm | 1,191.8 ms | 1,190.1 ms | 1 logical / 4 SQL | 2,358 B JSON | 250 ms debounce occurs before this server time |
| Product update | Not measurable | N/A | N/A | N/A | Product update is not implemented |
| Sale completion | Not safely measured live | N/A | code-path audit only | response is full receipt | Configured DB is remote; baseline integration run failed and may have left fixtures |
| GRN confirmation | Not safely measured live | N/A | code-path audit only | small mutation result | No automated integrity test and configured DB is remote |

Cold-process read runs were substantially slower: login preflight 1.29-1.45 s, permission resolution 1.82-2.00 s, dashboard 1.93 s, POS 1.16-1.19 s, and catalog 0.72-0.74 s.

## 5. Bottleneck findings

| Severity | Location | Current behavior and evidence | Root cause | Proposed fix | Correctness/security impact |
| --- | --- | --- | --- | --- | --- |
| P0 | `src/modules/auth/session.ts:68`, `src/app/(app)/layout.tsx:5`, route pages | One auth graph produces 8 SQL statements and takes about 2.0 s warm; layout/page can repeat it | Nested relation loading plus no request memoization | One-round-trip auth projection and React `cache()` | Retains active-user/active-role checks and server guards |
| P0 | `src/components/pos/PosWorkspace.tsx:163` | New UUID is generated inside each submit invocation | UI double invocation defeats DB idempotency key | Stable per-attempt key, in-flight guard, server replay handling | Strengthens duplicate-sale protection |
| P0 | `src/modules/sales/sale.service.ts:585` | Multiple allocations for the same batch each derive quantity from the same original row | Allocation writes are not grouped by batch | Aggregate by batch, validate once, update once under existing lock | Fixes cached projection while preserving ledger rows |
| P1 | `src/modules/sales/pos.service.ts:102` | 1.16-1.19 s for four tiny products; 4 SQL statements | Nested to-many relation loading over remote DB | Narrow base query plus parallel relation queries; cap initial rows | Advisory data only; transaction remains authoritative |
| P1 | `src/app/(app)/dashboard/page.tsx:35` | At least 11 SQL statements and an extra serial expense wait | Detailed rows and fragmented summary services | Aggregate dashboard read model | Read-only; no stock/finance source-of-truth change |
| P1 | `src/modules/admin/rbac.service.ts:667`, `:759` | bcrypt runs after interactive transaction begins | CPU work inside transaction | Hash before opening transaction | Same bcrypt cost/security, shorter transaction |
| P1 | `src/modules/admin/rbac.service.ts:139` | Permission registry upserts one row at a time | Serial seed loop | Set-based registry upsert | Registry remains code-backed |
| P1 | `src/modules/procurement/grn.service.ts:139` | Two writes per GRN line are awaited serially | Row-by-row inserts | Pre-generate batch IDs and use set-based inserts | Same transaction and audit; no PO stock movement |
| P1 | `src/modules/sales/sale.actions.ts:67` | Many paths are revalidated after POS completion | Broad invalidation can refresh unrelated RSC trees | Remove current POS refresh and update advisory UI locally; keep targeted invalidation | Final stock remains server-authoritative |
| P1 | `src/app/(app)` | No `loading.tsx` | Navigation appears frozen | Missing Suspense/loading boundary | UX only |
| P2 | list services | Fixed caps of 100-250 without user pagination | Future payload/table growth | Server-side/keyset pagination per module | Read behavior only |
| P2 | report services | Detailed sale/payment/line rows aggregated in Node | Network and heap growth with history | SQL aggregate/grouping or bounded report generation | Preserve completed-sale and historical cost filters |

## 6. Database findings

### Query plans

| Query | Frequency | Plan summary | Existing index | Proposed index/change | Expected benefit | Write trade-off |
| --- | --- | --- | --- | --- | --- | --- |
| POS name/generic/barcode search | Every debounced POS search | 0.219 ms execution; bitmap product scan and barcode seq scan at tiny volume | Product name btree; barcode unique | Do not add trigram yet; reduce round trips and cap results | Removes current dominant latency without premature indexes | None |
| FEFO batch candidates | Cart preview and sale completion | 1.427 ms; uses `Batch_productId_status_expiryDate_idx`, then incremental sort by created time | `(productId,status,expiryDate)` | Keep existing index | Already efficient at SQL layer | None |
| Recent audit log | Admin audit page | 0.046 ms; seq scan + sort over 20 rows | No created-at index | Re-evaluate at meaningful volume; keyset pagination later | Avoid speculative index now | Additional audit-write index cost if added |
| Recent stock movements | Inventory history | 0.032 ms; seq scan + sort over 6 rows | Product/date and batch indexes | Re-evaluate at meaningful volume | Avoid speculative index now | Additional ledger-write index cost if added |

### Missing foreign-key indexes

Database metadata identified these unindexed foreign-key columns:

- `GrnLine.productId`
- `GrnLine.unitId`
- `ProductBarcode.unitId`
- `SaleLine.unitId`
- `SupplierPayment.createdById`

These indexes are low-risk candidates because the columns are used for joins and FK validation/cascade checks. Their write cost is one additional btree update per affected insert/update.

### Connection management

- The application correctly reuses one Prisma client per process/hot-reload context.
- No new client is created per request.
- The connection URL does not expose a reviewed application connection limit in repository configuration.
- PgBouncer/pooler presence cannot be confirmed from the repository.
- Before production, approve and document direct versus pooled connection endpoints, Prisma `connection_limit`, `pool_timeout`, transaction timeout, and statement timeout for the actual VPS topology.

## 7. Frontend findings

| Category | Finding |
| --- | --- |
| Client bundle | POS statically imports all modal components. They are individually small; bundle output must be checked before introducing dynamic imports. |
| Rerender | `PosWorkspace` owns the whole POS state, so search, cart, modal, and notice changes rerender the workspace. Current dataset is small; profiling evidence does not justify broad memoization. |
| Fetch duplication | Auth is duplicated across layout/page. Search responses are ignored when stale, but stale server work still runs. |
| Navigation | No route-level loading UI exists. |
| Loading state | Search, sale completion, and GRN confirmation have local feedback. Other server-rendered navigations do not. |
| Payload | Initial POS result cap is 100 and relation fields are serialized into a client component. |
| Refresh | Sale completion invalidates POS plus eight other paths even though the client already has the committed receipt. |

## 8. Changes implemented

| File | Reason |
| --- | --- |
| `src/lib/performance.ts` | Development-only correlated timing context with sensitive-data-safe structured summaries |
| `src/lib/prisma.ts` | Records logical Prisma operation duration/count inside an active trace while preserving the singleton |
| `scripts/performance-read-baseline.ts` | Repeatable, read-only warm-path benchmark and payload measurement |
| `package.json` | Adds `performance:baseline` command |
| `.env.example` | Documents the performance-log switch without changing local secrets |
| `src/modules/auth/session.ts` | Replaced nested permission graph loading with one compact SQL projection and request-scoped `cache()` deduplication |
| `src/modules/auth/permissions.ts` | Reused the cached authorization context for server-side guards and performance timing |
| `src/modules/sales/pos.service.ts` | Narrowed POS reads, parallelized independent relation reads, and capped the initial result set |
| `src/modules/dashboard/dashboard.service.ts` | Replaced fragmented dashboard reads with one read-only aggregate query |
| `src/modules/sales/sale.service.ts` | Added stable idempotent replay handling, deterministic batch locking, grouped batch projection updates, and batched audit/movement writes |
| `src/components/pos/PosWorkspace.tsx` | Added in-flight duplicate-submit protection and stable client request IDs |
| `src/modules/procurement/grn.service.ts` | Batched GRN batch and ledger inserts while keeping validation, transaction, and audit behavior unchanged |
| `src/modules/admin/rbac.service.ts` | Moved bcrypt and permission-registry work outside interactive RBAC transactions |
| `src/app/(app)/loading.tsx` | Added route-level loading feedback for authenticated navigation |
| `prisma/migrations/20260710120000_performance_fk_indexes/migration.sql` | Added five FK indexes supported by the audit; applied with `prisma migrate deploy` |

## 9. Verification

| Check | Baseline result |
| --- | --- |
| TypeScript | Pass: `./node_modules/.bin/tsc --noEmit --pretty false` |
| ESLint | Pass: `./node_modules/.bin/eslint .` |
| Production build | Pass: `./node_modules/.bin/next build`; 29 routes generated, 102 KB shared first-load JS |
| Diff validation | Pass: `git diff --check` |
| Migration status | Pass after applying `20260710120000_performance_fk_indexes` with `prisma migrate deploy` |
| Read benchmark | Pass: direct `tsx` invocation completed successfully |
| Remote DB integration tests | Partial: pure rules and several finance tests passed, but the full remote-DB process did not exit cleanly; rerun against an isolated test DB before release |
| Browser login page | Pass page identity, meaningful DOM, no framework overlay, no console warnings/errors |
| Browser login interaction | Invalid-login state rendered correctly; configured seed password no longer matches the current remote user, so authenticated browser flows remain unverified at baseline |

## 10. After measurements

Same-process warm-path benchmark against the configured remote PostgreSQL database after the changes:

| Flow | Total time | DB time | Query count | Payload size | Client render notes |
| ---- | ---------: | ------: | ----------: | -----------: | ------------------- |
| Login preflight | 309.4 ms | 455.7 ms summed | 2 | 37 B | Server-rendered form; no client ERP bundle |
| Permission resolution | 307.6 ms | 307.0 ms | 1 logical query | 750 B | One compact authorization projection |
| Dashboard | 308.2 ms | 307.7 ms | 1 logical query | 319 B | One aggregate read; route loading boundary available |
| POS load | 608.3 ms | 1,186.1 ms summed | 4 | 4,234 B | Relation reads overlap; initial result remains capped |
| Product search | 462.5 ms | 1,055.2 ms summed | 4 | 2,358 B | Debounced client search and stale-result protection remain enabled |
| Product update | Not measurable | N/A | N/A | N/A | Product update is not implemented in the repository |
| Sale completion | Not safely benchmarked live | N/A | N/A | N/A | Critical mutation requires isolated fixture DB; idempotency and transaction tests remain required |
| GRN confirmation | Not safely benchmarked live | N/A | N/A | N/A | Critical mutation requires isolated fixture DB; batched inserts preserve transaction/audit semantics |

The previous warm baseline was approximately 2,002.7 ms for permission resolution, 1,187.0 ms for POS load, and 1,191.8 ms for product search. The current read benchmark therefore shows about 84.6% lower authorization latency, 48.7% lower POS wall time, and 61.2% lower product-search wall time. Results are remote-network dependent and should be repeated in staging with p95 samples.

## 11. Remaining recommendations

### Required before production

1. Confirm whether the production app connects through a local/direct PostgreSQL endpoint or a transaction pooler, and set explicit connection/pool timeouts.
2. Run mutation integration tests against an isolated test database, never the live pharmacy database.
3. Add GRN confirmation integrity coverage and retain sale stock/MRP/expiry/quarantine tests.
4. Establish a real production-like dataset and rerun `EXPLAIN (ANALYZE, BUFFERS)` before adding trigram or report indexes.
5. Monitor p95/p99 request and transaction time, lock waits, deadlocks, and connection saturation.

### Nice to have

1. Short-TTL Redis cache for non-critical dashboard summaries after mutation invalidation is designed and tested.
2. Keyset pagination for audit, stock movements, sales, and large catalogs.
3. Deferred report panels and downloadable report jobs if report volume becomes material.
4. Bundle analyzer in CI or release builds.

### Not recommended for this project

1. Redis as stock, MRP, payable, or transaction-validation source of truth.
2. Removing row locks, transaction-time validation, audit rows, or permission guards for speed.
3. Microservices, event sourcing replacement, or a new client state framework for the current single-pharmacy modular monolith.
4. Blanket memoization or virtualization without profiler evidence.
5. Trigram indexes on every searchable text column at the current data volume.
