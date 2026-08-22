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
    { name: 'IT', code: 'IT', description: 'Information Technology' },
  ];

  for (const dept of departments) {
    try {
      await prisma.department.upsert({
        where: { code: dept.code },
        update: { description: dept.description },
        create: dept,
      });
    } catch (e: any) {
      // Skip if name conflict exists
      if (e.code === 'P2002') {
        console.log(`  ⚠️ Department "${dept.name}" already exists, skipping`);
      } else throw e;
    }
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
    { title: 'Staff', code: 'STF', level: 1 },
    { title: 'Intern', code: 'INT', level: 0 },
    { title: 'Senior Team Leader', code: 'STL', level: 3 },
    { title: 'Trainee', code: 'TRN', level: 0 },
  ];

  for (const d of designations) {
    try {
      await prisma.designation.upsert({
        where: { code: d.code },
        update: {},
        create: d,
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`  ⚠️ Designation "${d.title}" already exists, skipping`);
      } else throw e;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // USERS: Super Admin + HR Manager (Nandini) + 5 Specialists
  // ─────────────────────────────────────────────────────────────────────────

  const adminPassword = await bcrypt.hash('Admin@Ady2026!', 10);
  const nandiniPassword = await bcrypt.hash('Nandini@Hr2026!', 10);
  const pavitraPassword = await bcrypt.hash('Pavitra@Att2026!', 10);
  const charithaPassword = await bcrypt.hash('Charitha@Pay2026!', 10);
  const veenaPassword = await bcrypt.hash('Veena@Hire2026!', 10);
  const nitishaPassword = await bcrypt.hash('Nitisha@Disc2026!', 10);
  const aravindPassword = await bcrypt.hash('Aravind@Exit2026!', 10);

  const hrDept = await prisma.department.findUnique({ where: { code: 'HR' } });
  const hrDesig = await prisma.designation.findUnique({ where: { code: 'HRE' } });
  const hrmDesig = await prisma.designation.findUnique({ where: { code: 'HRM' } });

  // 1. Super Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@adyapan.com' },
    update: { role: 'SUPER_ADMIN', isEmailVerified: true, passwordHash: adminPassword },
    create: {
      email: 'admin@adyapan.com',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
    },
  });
  console.log('  ✅ Super Admin: admin@adyapan.com / Admin@Ady2026!');

  // 2. Nandini — HR Manager (HR_ADMIN, sees everything)
  const nandiniUser = await prisma.user.upsert({
    where: { email: 'nandini@adyapan.com' },
    update: { role: 'HR_ADMIN', isEmailVerified: true, passwordHash: nandiniPassword },
    create: {
      email: 'nandini@adyapan.com',
      passwordHash: nandiniPassword,
      role: 'HR_ADMIN',
      isEmailVerified: true,
    },
  });
  await prisma.employee.upsert({
    where: { employeeCode: 'EMP-NANDINI' },
    update: { firstName: 'Nandini', lastName: 'HR Manager', status: 'ACTIVE' },
    create: {
      userId: nandiniUser.id,
      employeeCode: 'EMP-NANDINI',
      firstName: 'Nandini',
      lastName: '(HR Manager)',
      departmentId: hrDept?.id,
      designationId: hrmDesig?.id,
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
    },
  });
  console.log('  ✅ HR Manager: nandini@adyapan.com / Nandini@Hr2026!');

  // 3. Pavitra — Attendance & Leave Specialist
  const pavitraUser = await prisma.user.upsert({
    where: { email: 'pavitra@adyapan.com' },
    update: { role: 'HR_EXECUTIVE', isEmailVerified: true, passwordHash: pavitraPassword },
    create: {
      email: 'pavitra@adyapan.com',
      passwordHash: pavitraPassword,
      role: 'HR_EXECUTIVE',
      isEmailVerified: true,
    },
  });
  await prisma.employee.upsert({
    where: { employeeCode: 'EMP-PAVITRA' },
    update: { firstName: 'Pavitra', lastName: 'Attendance', status: 'ACTIVE' },
    create: {
      userId: pavitraUser.id,
      employeeCode: 'EMP-PAVITRA',
      firstName: 'Pavitra',
      lastName: '(Attendance & Leave)',
      departmentId: hrDept?.id,
      designationId: hrDesig?.id,
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
    },
  });
  console.log('  ✅ Specialist: pavitra@adyapan.com / Pavitra@Att2026! (Attendance & Leave)');

  // 4. Charitha — Salary & Payroll Specialist
  const charithaUser = await prisma.user.upsert({
    where: { email: 'charitha@adyapan.com' },
    update: { role: 'HR_EXECUTIVE', isEmailVerified: true, passwordHash: charithaPassword },
    create: {
      email: 'charitha@adyapan.com',
      passwordHash: charithaPassword,
      role: 'HR_EXECUTIVE',
      isEmailVerified: true,
    },
  });
  await prisma.employee.upsert({
    where: { employeeCode: 'EMP-CHARITHA' },
    update: { firstName: 'Charitha', lastName: 'Payroll', status: 'ACTIVE' },
    create: {
      userId: charithaUser.id,
      employeeCode: 'EMP-CHARITHA',
      firstName: 'Charitha',
      lastName: '(Salary & Payroll)',
      departmentId: hrDept?.id,
      designationId: hrDesig?.id,
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
    },
  });
  console.log('  ✅ Specialist: charitha@adyapan.com / Charitha@Pay2026! (Salary & Payroll)');

  // 5. Veena — Onboarding & Hiring Specialist
  const veenaUser = await prisma.user.upsert({
    where: { email: 'veena@adyapan.com' },
    update: { role: 'HR_EXECUTIVE', isEmailVerified: true, passwordHash: veenaPassword },
    create: {
      email: 'veena@adyapan.com',
      passwordHash: veenaPassword,
      role: 'HR_EXECUTIVE',
      isEmailVerified: true,
    },
  });
  await prisma.employee.upsert({
    where: { employeeCode: 'EMP-VEENA' },
    update: { firstName: 'Veena', lastName: 'Onboarding', status: 'ACTIVE' },
    create: {
      userId: veenaUser.id,
      employeeCode: 'EMP-VEENA',
      firstName: 'Abbu Veena',
      lastName: '(Onboarding & Hiring)',
      departmentId: hrDept?.id,
      designationId: hrDesig?.id,
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
    },
  });
  console.log('  ✅ Specialist: veena@adyapan.com / Veena@Hire2026! (Onboarding & Hiring)');

  // 6. Nitisha — Discipline & POSH Specialist
  const nitishaUser = await prisma.user.upsert({
    where: { email: 'nitisha@adyapan.com' },
    update: { role: 'HR_EXECUTIVE', isEmailVerified: true, passwordHash: nitishaPassword },
    create: {
      email: 'nitisha@adyapan.com',
      passwordHash: nitishaPassword,
      role: 'HR_EXECUTIVE',
      isEmailVerified: true,
    },
  });
  await prisma.employee.upsert({
    where: { employeeCode: 'EMP-NITISHA' },
    update: { firstName: 'Nitisha', lastName: 'Discipline', status: 'ACTIVE' },
    create: {
      userId: nitishaUser.id,
      employeeCode: 'EMP-NITISHA',
      firstName: 'Nitisha',
      lastName: '(Discipline & POSH)',
      departmentId: hrDept?.id,
      designationId: hrDesig?.id,
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
    },
  });
  console.log('  ✅ Specialist: nitisha@adyapan.com / Nitisha@Disc2026! (Discipline & POSH)');

  // 7. Aravind — Resignation & Exit Specialist
  const aravindUser = await prisma.user.upsert({
    where: { email: 'aravind@adyapan.com' },
    update: { role: 'HR_EXECUTIVE', isEmailVerified: true, passwordHash: aravindPassword },
    create: {
      email: 'aravind@adyapan.com',
      passwordHash: aravindPassword,
      role: 'HR_EXECUTIVE',
      isEmailVerified: true,
    },
  });
  await prisma.employee.upsert({
    where: { employeeCode: 'EMP-ARAVIND' },
    update: { firstName: 'Aravind', lastName: 'Exit', status: 'ACTIVE' },
    create: {
      userId: aravindUser.id,
      employeeCode: 'EMP-ARAVIND',
      firstName: 'Aravind',
      lastName: '(Resignation & Exit)',
      departmentId: hrDept?.id,
      designationId: hrDesig?.id,
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
    },
  });
  console.log('  ✅ Specialist: aravind@adyapan.com / Aravind@Exit2026! (Resignation & Exit)');

  // 8. Synchronize all employees from Attendance Records into Employee table
  console.log('\n👥 Synchronizing employees from attendance records...');
  const attRecords = await prisma.attendanceRecord.findMany({
    select: { employeeId: true, notes: true },
  });

  const empMap = new Map<string, any>();
  for (const r of attRecords) {
    let meta: any = {};
    if (r.notes && typeof r.notes === 'string' && r.notes.trim().startsWith('{')) {
      try {
        meta = JSON.parse(r.notes);
      } catch {}
    }
    const code = String(meta.empId || meta.employeeCode || r.employeeId || '').trim();
    if (code && !empMap.has(code)) {
      const rawName = String(meta.empName || meta.employeeName || code).trim();
      const parts = rawName.split(' ');
      const firstName = parts[0] || code;
      const lastName = parts.slice(1).join(' ') || '';

      empMap.set(code, {
        code,
        firstName,
        lastName,
        departmentName: meta.department || 'Sales',
        designationTitle: meta.designation || 'Intern',
        role: meta.role || 'Community Development Intern role',
      });
    }
  }

  const allDepts = await prisma.department.findMany();
  const allDesigs = await prisma.designation.findMany();
  const defaultSalesDept = allDepts.find(d => d.code === 'SAL') || allDepts[0];
  const defaultInternDesig = allDesigs.find(d => d.code === 'INT') || allDesigs[0];

  let syncedCount = 0;
  for (const [code, empData] of empMap.entries()) {
    try {
      // Find matching department & designation
      const matchedDept = allDepts.find(d =>
        d.name.toLowerCase().includes(empData.departmentName.toLowerCase()) ||
        empData.departmentName.toLowerCase().includes(d.name.toLowerCase())
      ) || defaultSalesDept;

      const matchedDesig = allDesigs.find(d =>
        d.title.toLowerCase().includes(empData.designationTitle.toLowerCase()) ||
        empData.designationTitle.toLowerCase().includes(d.title.toLowerCase())
      ) || defaultInternDesig;

      // Find or create User for this employee
      const email = `${code.toLowerCase().replace(/[^a-z0-9]/g, '')}@adyapan.com`;
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        const empPassword = await bcrypt.hash('Employee@2026!', 10);
        user = await prisma.user.create({
          data: {
            email,
            passwordHash: empPassword,
            role: empData.role || 'EMPLOYEE',
            isEmailVerified: true,
          },
        });
      }

      await prisma.employee.upsert({
        where: { employeeCode: code },
        update: {
          firstName: empData.firstName,
          lastName: empData.lastName,
          departmentId: matchedDept?.id,
          designationId: matchedDesig?.id,
          status: 'ACTIVE',
        },
        create: {
          userId: user.id,
          employeeCode: code,
          firstName: empData.firstName,
          lastName: empData.lastName,
          departmentId: matchedDept?.id,
          designationId: matchedDesig?.id,
          employmentType: 'FULL_TIME',
          status: 'ACTIVE',
        },
      });
      syncedCount++;
    } catch (e: any) {
      console.warn(`  ⚠️ Could not sync employee ${code}:`, e?.message);
    }
  }
  console.log(`  ✅ Synced ${syncedCount} employees from attendance records into database.`);

  console.log('\n✅ Seed completed successfully');
  console.log('\n📋 All Logins:');
  console.log('   Super Admin:  admin@adyapan.com / Admin@Ady2026!');
  console.log('   HR Manager:   nandini@adyapan.com / Nandini@Hr2026!');
  console.log('   Pavitra:      pavitra@adyapan.com / Pavitra@Att2026!');
  console.log('   Charitha:     charitha@adyapan.com / Charitha@Pay2026!');
  console.log('   Veena:        veena@adyapan.com / Veena@Hire2026!');
  console.log('   Nitisha:      nitisha@adyapan.com / Nitisha@Disc2026!');
  console.log('   Aravind:      aravind@adyapan.com / Aravind@Exit2026!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
