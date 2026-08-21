import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'demo@adyapan.com' } });
  if (!user) {
    console.log('User not found');
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedAttempts: 0,
      isLocked: false,
      lockedAt: null,
      forceLogout: false,
      lastActivityAt: null,
      activeDeviceId: null,
      refreshToken: null,
    },
  });

  console.log('Done. demo@adyapan.com fully reset.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
