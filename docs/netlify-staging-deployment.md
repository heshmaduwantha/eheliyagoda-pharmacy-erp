# Netlify Staging Deployment — Eheliyagoda Pharmacy ERP/POS

This document covers a staging/UAT deployment setup only. It is not for production.

## Current repo facts

- Framework: Next.js App Router
- Language: TypeScript
- ORM: Prisma
- Package manager: pnpm via Corepack
- Current Node compatibility target: Node 22
- Netlify config: `netlify.toml` is used for the staging build command
- Netlify Next.js adapter/plugin: not explicitly pinned in this repo; let Netlify auto-detect the current Next.js integration

## Required environment variables

The current codebase reads these server-side variables:

- `DATABASE_URL` — staging PostgreSQL connection string
- `REDIS_URL` — staging Redis connection string
- `AUTH_SECRET` — long random server secret
- `APP_URL` — staging app base URL
- `SEED_OWNER_USERNAME` — seed-only admin username
- `SEED_OWNER_PASSWORD` — seed-only admin password
- `SEED_PHARMACIST_USERNAME` — seed-only pharmacist username
- `SEED_PHARMACIST_PASSWORD` — seed-only pharmacist password

Notes:

- Do not use production database or production Redis for the staging branch deploy.
- Server secrets must not use `NEXT_PUBLIC_`.
- The current repo does not require `DIRECT_URL`.
- The current repo does not define any S3/object storage variables yet.
- The current repo does not define any browser-safe `NEXT_PUBLIC_*` runtime variables yet.

## Netlify UI setup steps

1. In Netlify, choose Add new site → Import from Git.
2. Select the GitHub repository.
3. Set the branch to `uat_staging`.
4. Confirm the build command comes from `netlify.toml`.
5. Confirm the publish directory is `.next`.
6. Add the environment variables listed above in the Netlify UI.
7. Point `DATABASE_URL` and `REDIS_URL` at staging services only.
8. Trigger the first deploy.
9. Review deploy logs for Prisma generate and app build output.
10. Run a staging smoke test after deploy.

## Migration strategy

Recommended staging flow:

- Netlify build runs Prisma generate plus the application build only.
- Run `prisma migrate deploy` separately against the staging database.
- Do not run migrations against production from this branch deploy path.

Manual staging migration command:

```bash
DATABASE_URL="staging-db-url" corepack pnpm prisma:migrate:deploy
```

Do not copy a real database URL into the repository.

## Rollback strategy

- Roll back the Netlify deploy from the Netlify UI if the application build or runtime check fails.
- Restore the staging database from backup if a migration or data issue is detected.
- Do not try to roll back by editing migration files.

## GitHub Actions

This repo includes a staging check workflow for the `uat_staging` branch.
It is intended to run checks without exposing secrets in source control.

## Verification commands

Use these commands for local or CI validation:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm prisma:generate
node node_modules/typescript/bin/tsc --noEmit
corepack pnpm lint
corepack pnpm test
corepack pnpm build
```
