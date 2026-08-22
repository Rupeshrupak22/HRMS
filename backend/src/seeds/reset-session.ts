import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'admin@adyapan.com';
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`User ${email} not found`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedAttempts: 0,
      isLocked: false,
      refreshToken: null,
    },
  });

  console.log(`Done. ${email} session reset and unlocked.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
