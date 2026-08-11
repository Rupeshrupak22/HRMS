import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create organization settings
  await prisma.organizationSetting.upsert({
    where: { id: 'default-org' },
    update: {},
    create: {
      id: 'default-org',
      companyName: 'Adyapan Edutech Pvt. Ltd.',
      supportEmail: 'hr@adyapan.com',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    },
  });

  // Create attendance policy
  await prisma.attendancePolicy.upsert({
    where: { id: 'default-policy' },
    update: {},
    create: {
      id: 'default-policy',
      name: 'Standard Policy',
      officeStartTime: '09:30',
      officeEndTime: '18:30',
      gracePeriodMins: 15,
      lateThresholdMins: 30,
      halfDayThresholdHours: 4.0,
      overtimeMinMins: 60,
      weeklyOffs: 'Saturday,Sunday',
    },
  });

  // Create leave types
  const leaveTypes = [
    { name: 'Casual Leave', code: 'CL', annualDays: 12 },
    { name: 'Sick Leave', code: 'SL', annualDays: 6 },
    { name: 'Earned Leave', code: 'EL', annualDays: 15, isEncashable: true },
    { name: 'Maternity Leave', code: 'ML', annualDays: 182 },
    { name: 'Paternity Leave', code: 'PL', annualDays: 15 },
    { name: 'Compensatory Off', code: 'CO', annualDays: 5 },
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { code: lt.code },
      update: {},
      create: lt,
    });
  }

  // Create departments
  const departments = [
    { name: 'Engineering', code: 'ENG', description: 'Software Development & Engineering' },
    { name: 'Human Resources', code: 'HR', description: 'People Operations & HR' },
    { name: 'Marketing', code: 'MKT', description: 'Marketing & Brand' },
    { name: 'Sales', code: 'SAL', description: 'Sales & Business Development' },
    { name: 'Finance', code: 'FIN', description: 'Finance & Accounts' },
    { name: 'Operations', code: 'OPS', description: 'Operations & Admin' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
  }

  // Create designations
  const designations = [
    { title: 'Software Engineer', code: 'SE', level: 1 },
    { title: 'Senior Software Engineer', code: 'SSE', level: 2 },
    { title: 'Tech Lead', code: 'TL', level: 3 },
    { title: 'Engineering Manager', code: 'EM', level: 4 },
    { title: 'HR Executive', code: 'HRE', level: 1 },
    { title: 'HR Manager', code: 'HRM', level: 3 },
    { title: 'Marketing Executive', code: 'ME', level: 1 },
    { title: 'Sales Manager', code: 'SM', level: 3 },
  ];

  for (const d of designations) {
    await prisma.designation.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    });
  }

  // Create super admin user
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@adyapan.com' },
    update: {},
    create: {
      email: 'admin@adyapan.com',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
    },
  });

  // Create HR Admin user with employee profile
  const hrPassword = await bcrypt.hash('Hr@12345', 10);
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@adyapan.com' },
    update: {},
    create: {
      email: 'hr@adyapan.com',
      passwordHash: hrPassword,
      role: 'HR_ADMIN',
      isEmailVerified: true,
    },
  });

  const hrDept = await prisma.department.findUnique({ where: { code: 'HR' } });
  const hrDesig = await prisma.designation.findUnique({ where: { code: 'HRM' } });

  await prisma.employee.upsert({
    where: { employeeCode: 'ADY001' },
    update: {},
    create: {
      userId: hrUser.id,
      employeeCode: 'ADY001',
      firstName: 'HR',
      lastName: 'Admin',
      departmentId: hrDept?.id,
      designationId: hrDesig?.id,
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Seed completed successfully');
  console.log('   Admin login: admin@adyapan.com / Admin@123');
  console.log('   HR login:    hr@adyapan.com / Hr@12345');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
