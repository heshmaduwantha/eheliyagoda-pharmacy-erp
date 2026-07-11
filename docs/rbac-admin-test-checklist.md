# RBAC Admin Test Checklist

Use this checklist after the RBAC migration is applied and the app is seeded with the canonical permission registry.

## Bootstrap and login

- [ ] Existing user can still log in after migration with the same username/password.
- [ ] Existing Owner can still access `/dashboard` and the admin section.
- [ ] New first-time install shows `/setup` when there are no users.
- [ ] Bootstrap owner flow creates the first Owner account only when no users exist.

## User administration

- [ ] `/admin/users` is accessible only to users with `admin.users.manage`.
- [ ] Non-admin users cannot open `/admin/users`.
- [ ] Non-admin users cannot call the user server actions directly.
- [ ] `/admin/users/new` creates a user with name, username, password, active status, and role assignments.
- [ ] Creating a user writes an `audit_log` row in the same transaction.
- [ ] User create/update never returns a password hash to the client.
- [ ] User edit preserves or updates assigned roles as expected.
- [ ] Deactivating a user prevents sign-in on the next request.
- [ ] The system blocks deactivating the last active Owner.
- [ ] The system blocks removing the Owner role from the last active Owner path.

## Role administration

- [ ] `/admin/roles` is accessible only to users with `admin.roles.manage`.
- [ ] `/admin/roles/new` creates a role with a code, name, description, active status, and permission matrix.
- [ ] `/admin/roles/[id]` edits role metadata and permission assignments.
- [ ] Permission assignments are grouped by module in the UI.
- [ ] Creating/updating/deleting role permissions writes `audit_log` rows.
- [ ] The system blocks removing `admin.users.manage` or `admin.roles.manage` from the last effective Owner path.
- [ ] Owner/system roles cannot be deleted or deactivated.
- [ ] Role code validation rejects invalid or reserved system codes.

## Permission registry

- [ ] `/admin/permissions` is read-only.
- [ ] Permission groups are shown by module.
- [ ] Permission rows display code, module, resource, action, description, and sensitive flag.
- [ ] Arbitrary free-text permission creation is not available in the UI.

## Effective permissions

- [ ] Role assignment changes the user’s effective permissions.
- [ ] Role permission assignment changes the role’s effective permissions.
- [ ] `UserRole` permissions are used first, with legacy `roleId` fallback only when no `UserRole` rows exist.
- [ ] Legacy permission codes still resolve through compatibility mapping where needed.

## Sensitive reads and audit

- [ ] `/admin/audit` is accessible only to users with `audit.read`.
- [ ] Controlled-drug register reads remain audited.
- [ ] Prescription image reads, if implemented later, require `prescriptions.image.read` and are audited.

## Data integrity

- [ ] Existing `OWNER_DOCTOR` / `PHARMACIST_CASHIER` data is mapped safely to the canonical roles during migration.
- [ ] Existing users still have at least one role after backfill into `UserRole`.
- [ ] `audit_log` entries are created inside the same transaction as user/role/permission changes where practical.

## Suggested validation commands

- `pnpm prisma:generate`
- `pnpm lint`
- `pnpm test`
- `pnpm prisma:migrate`
- `pnpm prisma:seed`
