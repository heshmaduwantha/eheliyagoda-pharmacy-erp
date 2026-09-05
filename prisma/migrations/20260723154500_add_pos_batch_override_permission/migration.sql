INSERT INTO "Permission" ("id", "code", "module", "resource", "action", "description", "isSensitive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'pos.batch.override', 'pos', 'batch', 'override', 'Select a non-FEFO sale batch with a recorded reason', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId", "createdAt")
SELECT role.id, permission.id, CURRENT_TIMESTAMP
FROM "Role" role
INNER JOIN "Permission" permission ON permission.code = 'pos.batch.override'
WHERE role.code = 'owner'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
