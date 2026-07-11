# RBAC and Admin Analysis Report

Scope: repository analysis only. No behavior changes were made while preparing this report.

## 1. Current authentication model

- The app uses a custom username/password login flow in [src/modules/auth/actions.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/modules/auth/actions.ts).
- `loginAction` validates `username` and `password`, looks up `User` by `username`, compares `passwordHash` with `bcryptjs`, then creates a session cookie and redirects to `/dashboard`.
- The session is a signed JWT stored in the `medisquare_session` cookie in [src/modules/auth/session.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/modules/auth/session.ts).
- The JWT only carries `sub = userId`; it does not store role or permission claims.
- Cookie settings are `httpOnly`, `sameSite=lax`, `path=/`, `maxAge=7 days`, and `secure` is derived from `new URL(env.APP_URL).protocol === "https:"`.
- `getCurrentUser()` verifies the JWT, loads the user from PostgreSQL, checks `isActive`, then expands `role.code` and the role's permissions from `RolePermission`.
- There is no session table, refresh token table, account table, or external auth library such as NextAuth/Auth.js, Lucia, or Clerk in the inspected repo.
- The main App Router protection is server-side, not middleware-based:
  - [src/app/(app)/layout.tsx](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/app/(app)/layout.tsx) calls `requireAuth()`.
  - [src/modules/auth/permissions.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/modules/auth/permissions.ts) provides `requireAuth`, `requirePermission`, and `requireRole`.
  - [src/app/(public)/login/page.tsx](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/app/(public)/login/page.tsx) redirects already-authenticated users away from `/login`.
  - I did not find a `middleware.ts` file in the repository.
- The current admin or role-related UI is minimal and mostly placeholder-driven:
  - [src/app/(app)/admin/users/page.tsx](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/app/(app)/admin/users/page.tsx) is a permission-gated placeholder.
  - [src/app/(app)/admin/settings/page.tsx](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/app/(app)/admin/settings/page.tsx) is also a placeholder.
  - [src/app/(app)/admin/audit/page.tsx](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/app/(app)/admin/audit/page.tsx) is a real read-only viewer gated by `audit.view`.
  - [src/components/layout/sidebar-nav.tsx](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/components/layout/sidebar-nav.tsx) hides nav items client-side based on permissions, but that is only UX filtering.
- Current role-related code that matters:
  - [prisma/seed.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/prisma/seed.ts) seeds two roles: `OWNER_DOCTOR` and `PHARMACIST_CASHIER`.
  - [src/components/layout/app-shell.tsx](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/components/layout/app-shell.tsx) hardcodes role display text for only those two cases.
  - `requireRole()` exists in [src/modules/auth/permissions.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/modules/auth/permissions.ts) but is not currently used anywhere in the repo.

## 2. Current database impact

- The RBAC tables already present in [prisma/schema.prisma](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/prisma/schema.prisma) are:
  - `User`
  - `Role`
  - `Permission`
  - `RolePermission`
  - `AuditLog`
- `User` currently has a required single-role foreign key:
  - `User.roleId` is non-nullable.
  - The relation is `User.role -> Role` with `onDelete: Restrict`.
  - This means the current model is one user = one role, not many-to-many.
- Existing constraints and indexes are:
  - `User.username` unique.
  - `Role.code` unique.
  - `Permission.code` unique.
  - `RolePermission` composite primary key on `(roleId, permissionId)`.
  - `User.roleId` index.
  - `AuditLog.actorUserId` index.
  - `AuditLog(entityType, entityId)` index.
  - `AuditLog.actorUserId` foreign key uses `onDelete: SetNull`.
  - `RolePermission` uses cascading deletes on both sides.
- The current `User` model is also the business actor for several operational tables:
  - `Sale.cashier`
  - `SaleVoid.voidedBy`
  - `Expense.createdBy`
  - `SupplierPayment.createdBy`
  - `Prescription.capturedBy`
  - `AuditLog.actor`
- There is no `Session`, `Account`, `Employee`, or separate staff identity table in the schema.
- `AuditLog` already exists and is intended for transaction-scoped writes, but the schema itself does not force a mutation to write an audit row.
- Potential schema conflicts if RBAC is expanded:
  - `User.roleId` conflicts with a future many-to-many `UserRole` table.
  - The current app shell and role display logic assume only owner/pharmacist semantics.
  - The current login model uses `username` only, so a future admin form that wants both `email` and `username` would need a new `email` column or a clear decision that username is the only login identifier.
  - `Permission.code` length is sufficient for dotted permission codes, but the current flat registry will need a canonical migration path.

## 3. Recommended RBAC standard for this project

Use a simple code-backed RBAC model with these tables:

- `User`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`

Recommended operational shape:

- Keep `Permission` as the authoritative lookup table for permission codes.
- Keep a central code registry in source control as the source of truth.
- Seed permissions from that registry in migrations or a deterministic seed step.
- Do not allow permission creation from arbitrary free text in the UI.
- The admin UI may assign existing permissions to roles, but the UI should not invent new permission codes unless the code already exists in the registry.
- Server-side guard helpers should read from the current database state, but only against codes that exist in the registry.
- If the project moves to `UserRole`, use it as the effective authorization source and treat `User.roleId` as a temporary compatibility bridge only.

Practical note:

- The current repo already behaves like code-backed RBAC in spirit because permissions are seeded in [prisma/seed.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/prisma/seed.ts) and enforced in server code.
- The missing piece is a stable canonical registry file and a more flexible user-to-role assignment model.

## 4. Proposed permission naming convention

Use `module.resource.action`.

Recommended examples for this ERP:

- `pos.sale.create`
- `pos.sale.void`
- `pos.discount.override`
- `inventory.batch.read`
- `inventory.stock.writeoff`
- `procurement.po.create`
- `procurement.grn.confirm`
- `suppliers.payables.read`
- `reports.gross_profit.read`
- `controlled_drugs.register.read`
- `prescriptions.image.read`
- `admin.users.manage`
- `admin.roles.manage`
- `admin.permissions.read`
- `audit.read`

Current repo permission codes are flatter and mixed in style, for example:

- `dashboard.view`
- `pos.access`
- `sale.create`
- `sale.void`
- `stock.access`
- `expense.view`
- `expense.create`
- `supplier_payment.view`
- `user.manage`
- `audit.view`
- `settings.manage`
- `controlled_drug.sell`

That means the naming convention change is a real migration, not just a UI rename.

## 5. Recommended default roles

Recommended role set:

| Role | Intended scope |
|---|---|
| Owner | Full access to all permissions, including admin and audit rights |
| Pharmacist | Clinical and pharmacy operations, controlled-drug workflows, selected inventory and reporting reads |
| Cashier | POS and sale capture, with minimal operational reach |
| Inventory Manager | Inventory, batches, procurement, GRN, and stock control workflows |
| Read Only / Auditor | Read-only visibility into reports, audit, and inventory state |

Rules:

- Owner must have all permissions.
- The system must prevent deleting or deactivating the last active Owner.
- The system must prevent removing `admin.roles.manage` or `admin.users.manage` from the last effective Owner user or Owner role.
- Role display text should come from `Role.name`, not from hardcoded role-code branching in the shell.
- If the project keeps the current one-user-one-role structure for a while, the default roles still work, but only one role may be assigned per user until the schema changes.

## 6. Administration module proposal

Recommended pages:

- `/admin/users`
- `/admin/users/new`
- `/admin/users/[id]`
- `/admin/roles`
- `/admin/roles/new`
- `/admin/roles/[id]`
- `/admin/permissions`
- `/admin/audit-log` if the audit viewer stays in the admin area

Recommended UI structure:

- Reuse the existing ERP visual system, spacing, and teal-based shell already used by the app.
- Keep admin pages server-rendered and permission-gated, matching the current App Router pattern.
- Use the existing table, form, badge, card, and placeholder components where possible.
- Build role-permission assignment as a grouped matrix by module, not as one long flat checkbox list.
- Keep the permissions registry page read-only unless the project already has a safe, fully server-side permission management pattern.
- The user creation form should support name, username, active status, role assignment, and either:
  - a server-side set-password flow, or
  - a temporary password/reset-password flow.
- Because the current auth model is username/password only, adding `email` should be treated as a schema decision, not an assumption.

Recommended page responsibilities:

- `/admin/users`: list users, search, activate/deactivate, assign roles, reset credentials.
- `/admin/users/new`: create a user with a temporary password or reset flow.
- `/admin/users/[id]`: edit user state, role membership, credential status, and view related audit history.
- `/admin/roles`: list roles, show permission counts, highlight locked system roles.
- `/admin/roles/new`: create a role from registry-backed permissions.
- `/admin/roles/[id]`: edit role metadata and permission matrix, with lockout checks.
- `/admin/permissions`: read-only registry of all known codes and descriptions.
- `/admin/audit-log`: the existing audit viewer, if you want it grouped under admin navigation.

## 7. Business rules

1. Owner bootstrap: allow bootstrap only from a trusted server-side seed or setup path, and only when no active Owner exists.
2. Creating users: validate name, username, active status, and role assignment server-side; hash passwords only on the server; write an audit row in the same transaction if `audit_log` already exists.
3. Deactivating users: block deactivation if it would remove the last active Owner; after deactivation, existing JWT cookies should fail on the next request because `getCurrentUser()` checks `isActive`.
4. Creating roles: allow only server-side creation; role codes must be unique and should be constrained to known naming rules.
5. Assigning permissions to roles: accept only codes from the central registry; reject unknown or free-text permissions.
6. Assigning roles to users: in the current schema this is one role per user; in the target RBAC model it should be `UserRole` with effective permissions derived from the union of assigned roles.
7. Preventing privilege lockout: never allow the system to reach zero active Owners, and never allow the last effective Owner to lose `admin.users.manage` or `admin.roles.manage`.
8. Server-side permission checks: every sensitive mutation must be guarded in a server action, route handler, or service function; UI hiding is only a convenience layer.
9. Audit logging: every user, role, and permission mutation should write an `audit_log` row in the same transaction as the mutation.
10. Sensitive read-audit: reading controlled-drug registers and prescription images should also be audit logged, because those are sensitive data access events, not just business operations.

Current code already follows parts of these rules:

- `controlled_drug_report.viewed` is written when the controlled-drug register is loaded in [src/modules/reports/controlled-drug-report.service.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/modules/reports/controlled-drug-report.service.ts).
- `grn.draft_created`, `grn.confirmed`, `expense.created`, `expense.updated`, `expense.deleted`, `sale.voided`, and other business events are already audited in transaction-scoped service code.

## 8. Implementation plan

1. Add a canonical permission registry file in source control and make it the only place where permission codes are defined.
2. Update Prisma schema to introduce `UserRole` while preserving a safe migration path from the current `User.roleId` model.
3. Backfill existing users into `UserRole` from their current single role assignment.
4. Update session hydration so `getCurrentUser()` loads effective permissions from the new join model.
5. Update guard helpers to support `hasPermission`, `requirePermission`, and any needed `requireAnyPermission` or `requireAllPermissions` variants.
6. Refactor admin UI to add users, roles, and permission registry pages, with grouped module-based permission matrices.
7. Add explicit owner-lockout checks for create, update, deactivate, role assignment, and permission removal operations.
8. Make audit logging mandatory for all user, role, and permission mutations, with transaction-scoped writes.
9. Add read-audit events for controlled-drug register access and future prescription image access.
10. Add tests for login, role assignment, lockout prevention, permission enforcement, audit writes, and sensitive read logging.

Suggested migration strategy:

- Phase 1: add new tables and registry, keep the old model working.
- Phase 2: read permissions from the new model, but continue writing the old single-role field where needed for compatibility.
- Phase 3: remove the deprecated single-role field only after the app and seed flow are fully moved.

## 9. Risks and blockers

- Decision required: keep the current single-role model temporarily, or move to `UserRole` fully in one migration.
- Decision required: keep current role codes such as `OWNER_DOCTOR` and `PHARMACIST_CASHIER`, or normalize role codes to a simpler canonical set like `owner`, `pharmacist`, `cashier`, `inventory_manager`, and `auditor`.
- Decision required: keep username-only login, or add an email column and reset-password flow.
- Decision required: whether the Owner role should be a reserved system role with an immutable flag.
- Decision required: whether prescription image access exists in this MVP or only in a later phase; that affects the read-audit scope.
- Security limitation: the current JWT cookie model is stateless, so there is no server-side session table for forced revocation or device-by-device logout.
- Security limitation: the current app shell hardcodes role display for only owner and pharmacist, so new roles will need explicit UI updates.
- Operational limitation: the current permission codes are not yet in the `module.resource.action` form, so the registry change will require a coordinated code and seed migration.

## 10. Implementation Notes

- Changed files:
  - [prisma/schema.prisma](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/prisma/schema.prisma)
  - [prisma/seed.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/prisma/seed.ts)
  - [prisma/migrations/20260709090000_rbac_user_roles/migration.sql](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/prisma/migrations/20260709090000_rbac_user_roles/migration.sql)
  - [src/modules/auth/permission-registry.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/modules/auth/permission-registry.ts)
  - [src/modules/auth/session.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/modules/auth/session.ts)
  - [src/modules/auth/permissions.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/modules/auth/permissions.ts)
  - [src/modules/admin/rbac.service.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/modules/admin/rbac.service.ts)
  - [src/modules/admin/rbac.actions.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/modules/admin/rbac.actions.ts)
  - [src/modules/admin/user-form.tsx](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/modules/admin/user-form.tsx)
  - [src/modules/admin/role-form.tsx](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/modules/admin/role-form.tsx)
  - [src/app/(app)/admin/users/page.tsx](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/app/(app)/admin/users/page.tsx)
  - [src/app/(app)/admin/roles/page.tsx](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/app/(app)/admin/roles/page.tsx)
  - [src/app/(app)/admin/permissions/page.tsx](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/app/(app)/admin/permissions/page.tsx)
  - [src/components/layout/app-shell.tsx](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/components/layout/app-shell.tsx)
  - [src/modules/auth/permission-registry.test.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/modules/auth/permission-registry.test.ts)
  - [docs/rbac-admin-test-checklist.md](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/docs/rbac-admin-test-checklist.md)
- Migration name:
  - `20260709090000_rbac_user_roles`
- Seed strategy:
  - Use `pnpm prisma:seed` after `pnpm prisma:migrate` or `pnpm prisma:migrate:deploy`.
  - The seed now calls `seedAllPermissionsAndRoles(prisma)` to seed the canonical registry and default roles before seeding sample users and inventory data.
- Compatibility decisions:
  - Existing legacy permission codes are preserved at the application boundary through a compatibility map in `src/modules/auth/permission-registry.ts`.
  - Existing guard checks were only refactored where straightforward; older permission strings remain in some legacy routes and tests, but they resolve through canonicalization.
  - The login flow remains username/password only in this phase.
  - `User.roleId` remains in place as a compatibility bridge while `UserRole` becomes the preferred effective authorization source.
- Remaining TODOs:
  - Add a real password reset workflow if the product needs admin-driven resets instead of manual temporary passwords.
  - Add explicit server-side tests for the admin create/update/deactivate paths once the local dependency install is stable.
  - Add prescription-image read flow and read-audit only when that feature is introduced.
  - Review whether any remaining legacy permission strings should be refactored to canonical names in later cleanup passes.
- Old permission codes:
  - They were not removed from all call sites in this implementation.
  - Instead, they are mapped to canonical registry codes so the current app and older tests keep working during the phased migration.

## Key references

- [prisma/schema.prisma](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/prisma/schema.prisma)
- [prisma/seed.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/prisma/seed.ts)
- [src/modules/auth/session.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/modules/auth/session.ts)
- [src/modules/auth/actions.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/modules/auth/actions.ts)
- [src/modules/auth/permissions.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/modules/auth/permissions.ts)
- [src/app/(app)/layout.tsx](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/app/(app)/layout.tsx)
- [src/components/layout/app-shell.tsx](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/components/layout/app-shell.tsx)
- [src/components/layout/sidebar-nav.tsx](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/components/layout/sidebar-nav.tsx)
- [src/app/(app)/admin/audit/page.tsx](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/app/(app)/admin/audit/page.tsx)
- [src/modules/reports/controlled-drug-report.service.ts](/Users/heshanmaduwantha/Documents/Pharmacy%20ERP/src/modules/reports/controlled-drug-report.service.ts)
