# Medisquare Pharmacy + Clinic Mini ERP/POS

A clean, modular Next.js foundation for a private clinic-attached pharmacy and shop.

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- pnpm

## Local setup

```bash
corepack pnpm install
cp .env.example .env
corepack pnpm dev
```

### PostgreSQL and Prisma

PostgreSQL is required for later Phase 1 tasks. Set the `PG_DB_*` fields in your local `.env` file and let the app and Prisma wrapper derive `DATABASE_URL` from them:

```bash
PG_DB_HOST="localhost"
PG_DB_PORT="5432"
PG_DB_NAME="medisquare"
PG_DB_USER="USER"
PG_DB_PASSWORD="PASSWORD"
```

Useful commands:

```bash
corepack pnpm prisma:generate
corepack pnpm exec prisma migrate dev --name <migration_name>
corepack pnpm prisma:studio
```

Never commit `.env`; use `.env.example` as the template.

### Required environment variables

Create `.env` from `.env.example` and provide these server-only values:

- `PG_DB_HOST`: PostgreSQL host
- `PG_DB_PORT`: PostgreSQL port
- `PG_DB_NAME`: PostgreSQL database name
- `PG_DB_USER`: PostgreSQL username
- `PG_DB_PASSWORD`: PostgreSQL password
- `REDIS_URL`: Redis connection URL
- `AUTH_SECRET`: at least 32 random characters; for example, generate one with `openssl rand -base64 48`
- `APP_URL`: local application URL, usually `http://localhost:3000`

Do not commit `.env` or expose these values to client components.

### Redis

Redis is optional supporting infrastructure for future cache, session, and rate-limit features. It is never used as the source of truth for ERP data.

```bash
REDIS_URL="redis://localhost:6379"
```

### Initial Auth/RBAC seed

Set the following values in your local `.env` file before seeding. Use strong, unique passwords; the values in `.env.example` are placeholders only.

```bash
SEED_OWNER_USERNAME="owner"
SEED_OWNER_PASSWORD="use-a-strong-owner-password"
SEED_PHARMACIST_USERNAME="pharmacist"
SEED_PHARMACIST_PASSWORD="use-a-strong-pharmacist-password"
```

Run the idempotent seed with:

```bash
corepack pnpm prisma:seed
```

The seed creates `OWNER_DOCTOR` and `PHARMACIST_CASHIER` roles. The owner receives all default permissions; the pharmacist receives operational permissions excluding user, audit, and settings management.

### Test authentication locally

1. Run `corepack pnpm prisma:seed` and `corepack pnpm dev`.
2. Visit `http://localhost:3000/login`.
3. Sign in with either pair of seed credentials from your local `.env`.
4. Confirm successful login redirects to `/dashboard` and app pages remain available after refresh.
5. Use **Log out** and confirm the session is cleared and `/login` is displayed.

Invalid credentials and inactive users receive the same safe message: `Invalid username or password`.

### Test permissions locally

1. Log in as the seeded owner and confirm `/admin/users` and `/admin/settings` load.
2. Log out, then log in as the seeded pharmacist.
3. Confirm operational placeholders such as `/dashboard` and `/pos` load.
4. Confirm `/admin/users` and `/admin/settings` redirect to `/forbidden`.

All access checks run on the server. Placeholder pages do not contain ERP business logic.

## Phase note

Phase 1 — Foundation + Auth/RBAC

## Current status

This README still contains the original foundation-era setup notes.

For current day-to-day usage, see [User guide](./docs/user-guide.md).

## Documentation

- [User guide](./docs/user-guide.md)
