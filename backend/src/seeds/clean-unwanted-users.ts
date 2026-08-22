import prisma from '../lib/prisma';

const ALLOWED_EMAILS = [
  'admin@adyapan.com',
  'superadmin@adyapan.com',
  'demo@adyapan.com',
  'pavitra@adyapan.com',
  'charitha@adyapan.com',
  'veena@adyapan.com',
  'nitisha@adyapan.com',
  'aravind@adyapan.com',
  'nandini@adyapan.com',
  'nandani@adyapan.com',
];

async function main() {
  console.log('🧹 Starting cleanup of unwanted user login accounts...');

  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
  });
  console.log(`Total users currently in DB: ${allUsers.length}`);

  const toRemove = allUsers.filter((u) => !ALLOWED_EMAILS.includes(u.email.toLowerCase().trim()));
  console.log(`Users to remove (regular employees without specialist/admin roles): ${toRemove.length}`);

  if (toRemove.length > 0) {
    const userIdsToRemove = toRemove.map((u) => u.id);

    // 1. Unlink employees from these user IDs first
    await prisma.employee.updateMany({
      where: { userId: { in: userIdsToRemove } },
      data: { userId: null as any },
    });
    console.log('✅ Unlinked Employee records safely (all employee data preserved).');

    // 2. Delete Audit logs referencing these user IDs
    await prisma.auditLog.deleteMany({
      where: { userId: { in: userIdsToRemove } },
    }).catch(() => {});

    // 3. Delete the unwanted User accounts
    const delResult = await prisma.user.deleteMany({
      where: { id: { in: userIdsToRemove } },
    });
    console.log(`🎉 Deleted ${delResult.count} unwanted user accounts.`);
  }

  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
  });
  console.log('\n✅ Remaining Active System Users:');
  remainingUsers.forEach((u) => console.log(` - ${u.email} (${u.role})`));
}

main()
  .catch((e) => console.error('❌ Error during cleanup:', e))
  .finally(() => prisma.$disconnect());
