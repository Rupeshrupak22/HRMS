import { PrismaClient, RoleName, EmploymentType, EmployeeStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Adyapan HRMS database...');

  // 1. Organization Settings
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

  // 2. Departments
  const deptsData = [
    { name: 'Technology', code: 'TECH', description: 'Software Engineering & Infrastructure' },
    { name: 'Sales', code: 'SALES', description: 'Business Development & Course Sales' },
    { name: 'Marketing', code: 'MKT', description: 'Digital Marketing & Growth' },
    { name: 'HR', code: 'HR', description: 'Human Resources & Talent Acquisition' },
    { name: 'Finance', code: 'FIN', description: 'Payroll, Accounting & Audit' },
    { name: 'Operations', code: 'OPS', description: 'Student Support & Content Delivery' },
    { name: 'Academic', code: 'ACAD', description: 'Curriculum & Faculty' },
    { name: 'Customer Support', code: 'CS', description: 'Learner Success & Support' },
  ];

  const depts: Record<string, any> = {};
  for (const d of deptsData) {
    depts[d.code] = await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    });
  }

  // 3. Designations
  const desigData = [
    { title: 'Chief Technology Officer', code: 'CTO', level: 5 },
    { title: 'HR Manager', code: 'HRM', level: 5 },
    { title: 'HR Director', code: 'HRD', level: 5 },
    { title: 'HR Executive', code: 'HRE', level: 2 },
    { title: 'HR Specialist', code: 'HRS', level: 3 },
    { title: 'Senior Software Engineer', code: 'SSE', level: 3 },
    { title: 'Tech Lead', code: 'TL', level: 4 },
    { title: 'Finance Manager', code: 'FM', level: 4 },
  ];

  const desigs: Record<string, any> = {};
  for (const d of desigData) {
    desigs[d.code] = await prisma.designation.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    });
  }

  // 4. Leave Types
  const leaveTypesData = [
    { name: 'Casual Leave', code: 'CL', annualDays: 12, isEncashable: false },
    { name: 'Sick Leave', code: 'SL', annualDays: 12, isEncashable: false },
    { name: 'Earned Leave', code: 'EL', annualDays: 18, isEncashable: true },
    { name: 'Maternity Leave', code: 'ML', annualDays: 180, isEncashable: false },
    { name: 'Comp Off', code: 'CO', annualDays: 6, isEncashable: false },
  ];

  for (const l of leaveTypesData) {
    await prisma.leaveType.upsert({
      where: { code: l.code },
      update: {},
      create: l,
    });
  }

  // 5. Attendance Policy
  await prisma.attendancePolicy.upsert({
    where: { id: 'default-policy' },
    update: {},
    create: {
      id: 'default-policy',
      name: 'Adyapan Standard Shift',
      officeStartTime: '09:30',
      officeEndTime: '18:30',
      gracePeriodMins: 15,
      lateThresholdMins: 30,
      halfDayThresholdHours: 4.0,
      overtimeMinMins: 60,
      weeklyOffs: 'Saturday,Sunday',
    },
  });

  // 6. Users & Employees (Including specialized HR team members)
  const defaultPassword = await bcrypt.hash('Password123!', 10);

  const usersConfig = [
    {
      email: 'superadmin@adyapan.com',
      role: RoleName.SUPER_ADMIN,
      firstName: 'Vikram',
      lastName: 'Sharma',
      code: 'EMP-001',
      deptCode: 'TECH',
      desigCode: 'CTO',
      salary: 2400000,
    },
    {
      email: 'nandini@adyapan.com',
      role: RoleName.HR_ADMIN,
      firstName: 'Biradar',
      lastName: 'Nandini',
      code: 'EMP-010',
      deptCode: 'HR',
      desigCode: 'HRM',
      salary: 1900000,
    },
    {
      email: 'charitha@adyapan.com',
      role: RoleName.HR_EXECUTIVE,
      firstName: 'Charitha',
      lastName: '(Payroll & Salary)',
      code: 'EMP-011',
      deptCode: 'HR',
      desigCode: 'HRS',
      salary: 1100000,
    },
    {
      email: 'aravind@adyapan.com',
      role: RoleName.HR_EXECUTIVE,
      firstName: 'Aravind',
      lastName: 'Madhesh Kumar (Resignation & Exit)',
      code: 'EMP-012',
      deptCode: 'HR',
      desigCode: 'HRS',
      salary: 1050000,
    },
    {
      email: 'veena@adyapan.com',
      role: RoleName.HR_EXECUTIVE,
      firstName: 'Abbu',
      lastName: 'Veena (Onboarding & Hiring)',
      code: 'EMP-013',
      deptCode: 'HR',
      desigCode: 'HRE',
      salary: 950000,
    },
    {
      email: 'nitisha@adyapan.com',
      role: RoleName.HR_EXECUTIVE,
      firstName: 'Nitisha',
      lastName: '(Discipline & POSH)',
      code: 'EMP-014',
      deptCode: 'HR',
      desigCode: 'HRE',
      salary: 900000,
    },
    {
      email: 'pavitra@adyapan.com',
      role: RoleName.HR_EXECUTIVE,
      firstName: 'Pavitra',
      lastName: '(Attendance & Leave)',
      code: 'EMP-015',
      deptCode: 'HR',
      desigCode: 'HRE',
      salary: 900000,
    },
    {
      email: 'finance@adyapan.com',
      role: RoleName.FINANCE,
      firstName: 'Rajesh',
      lastName: 'Gupta',
      code: 'EMP-004',
      deptCode: 'FIN',
      desigCode: 'FM',
      salary: 1500000,
    },
  ];

  for (const u of usersConfig) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash: defaultPassword,
        role: u.role,
        isEmailVerified: true,
      },
    });

    await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        employeeCode: u.code,
        userId: user.id,
        firstName: u.firstName,
        lastName: u.lastName,
        departmentId: depts[u.deptCode].id,
        designationId: desigs[u.desigCode].id,
        employmentType: EmploymentType.FULL_TIME,
        status: EmployeeStatus.ACTIVE,
        bankAccountNo: '918237465012',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        accountHolder: `${u.firstName} ${u.lastName}`,
        mobileNumber: '+91 98765 43210',
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
