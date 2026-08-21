import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Creating demo SUPER_ADMIN account...');

  const password = await bcrypt.hash('Demo@123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@adyapan.com' },
    update: {
      passwordHash: password,
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
      isLocked: false,
      failedAttempts: 0,
    },
    create: {
      email: 'demo@adyapan.com',
      passwordHash: password,
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
    },
  });

  // Create employee profile for the demo user
  const hrDept = await prisma.department.findFirst({ where: { code: 'HR' } });

  await prisma.employee.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      employeeCode: 'DEMO-001',
      firstName: 'Demo',
      lastName: 'Admin',
      departmentId: hrDept?.id || undefined,
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
    },
  });

  console.log('');
  console.log('✅ Demo account created successfully!');
  console.log('─────────────────────────────────────');
  console.log('  Email:    demo@adyapan.com');
  console.log('  Password: Demo@123');
  console.log('  Role:     SUPER_ADMIN (full access)');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
