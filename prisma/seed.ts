import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Every permission key that exists in the app today, module by module —
// add a module's keys here as it gets its own permission-gated actions.
// This is what "Administrator" grants; it is not a hardcoded role tier,
// just the bundle admins start with. Other roles are created with
// whatever subset of these keys they need (see PRD/ARCHITECTURE for the
// granular-RBAC decision).
const ALL_PERMISSIONS = [
  'announcements:view',
  'announcements:create',
  'announcements:edit',
  'announcements:delete',
  'announcements:pin',
  // Everything else is a placeholder page today — just a view key each,
  // until the module is actually built and needs finer-grained actions.
  'hse:view',
  'warehouse:view',
  'projects:view',
  'planner:view',
  'dashboards:view',
  'knowledge-base:view',
  'handover:view',
  'links:view',
  'admin:view',
];

async function main() {
  const admin = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: { name: 'Administrator' },
  });

  for (const key of ALL_PERMISSIONS) {
    await prisma.rolePermission.upsert({
      where: { roleId_key: { roleId: admin.id, key } },
      update: {},
      create: { roleId: admin.id, key },
    });
  }

  // Stand-in for the signed-in user until real Azure AD auth lands —
  // CurrentUserService always resolves this one for now.
  await prisma.user.upsert({
    where: { email: 'dev@warehouse-ops.local' },
    update: { roleId: admin.id },
    create: { email: 'dev@warehouse-ops.local', name: 'Dev User', roleId: admin.id },
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
