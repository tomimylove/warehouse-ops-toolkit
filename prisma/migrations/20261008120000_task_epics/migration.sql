CREATE TYPE "TaskType" AS ENUM ('TASK', 'EPIC');

ALTER TABLE "Tasks" ADD COLUMN "type" "TaskType" NOT NULL DEFAULT 'TASK';
ALTER TABLE "Tasks" ADD COLUMN "epicId" TEXT;
ALTER TABLE "Tasks" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Tasks" ADD COLUMN "sourceUrl" TEXT;

ALTER TABLE "Tasks" ADD CONSTRAINT "Tasks_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES "Tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Tasks" ADD CONSTRAINT "Tasks_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Owner-scoped epic permissions: Administrator gets all four, the default
-- role gets everything except deleting an epic.
INSERT INTO "RolePermissions" ("id", "roleId", "key")
SELECT gen_random_uuid()::text, r."id", k.key
FROM "Roles" r
JOIN (VALUES
  ('tasks:epic-owner.close-tasks'),
  ('tasks:epic-owner.edit-tasks'),
  ('tasks:epic-owner.reassign')
) AS k(key) ON TRUE
WHERE r."name" IN ('Administrator', 'Default')
ON CONFLICT ("roleId", "key") DO NOTHING;

INSERT INTO "RolePermissions" ("id", "roleId", "key")
SELECT gen_random_uuid()::text, r."id", 'tasks:epic-owner.delete-epic'
FROM "Roles" r
WHERE r."name" = 'Administrator'
ON CONFLICT ("roleId", "key") DO NOTHING;
