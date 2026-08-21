import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function check() {
  console.log('=== DATABASE CONNECTIVITY ===');
  try {
    await prisma.$connect();
    console.log('Connection: SUCCESS');
  } catch (e: any) {
    console.log('Connection: FAILED -', e.message);
    return;
  }

  console.log('');
  console.log('=== TABLE ROW COUNTS ===');
  console.log('  users:', await prisma.user.count());
  console.log('  employees:', await prisma.employee.count());
  console.log('  departments:', await prisma.department.count());
  console.log('  teams:', await prisma.team.count());
  console.log('  designations:', await prisma.designation.count());
  console.log('  attendanceRecords:', await prisma.attendanceRecord.count());
  console.log('  leaveTypes:', await prisma.leaveType.count());
  console.log('  leaveBalances:', await prisma.leaveBalance.count());
  console.log('  leaveRequests:', await prisma.leaveRequest.count());
  console.log('  salaryStructures:', await prisma.salaryStructure.count());
  console.log('  payrollCycles:', await prisma.payrollCycle.count());
  console.log('  manualPayroll:', await prisma.manualPayrollRecord.count());
  console.log('  assets:', await prisma.asset.count());
  console.log('  notifications:', await prisma.notification.count());
  console.log('  auditLogs:', await prisma.auditLog.count());
  console.log('  retentionCases:', await prisma.retentionCase.count());
  console.log('  resignationTracker:', await prisma.resignationTracker.count());
  console.log('  abscondTracker:', await prisma.abscondTracker.count());
  console.log('  exitClearance:', await prisma.exitClearance.count());
  console.log('  fnfTracker:', await prisma.fnFTracker.count());
  console.log('  complaints:', await prisma.employeeComplaint.count());
  console.log('  employeePerformance:', await prisma.employeePerformance.count());
  console.log('  employeeIssues:', await prisma.employeeIssue.count());
  console.log('  disciplineCases:', await prisma.disciplineCase.count());
  console.log('  recruitmentTracker:', await prisma.recruitmentTracker.count());
  console.log('  onboardingTracker:', await prisma.onboardingTracker.count());
  console.log('  dropoutRecords:', await prisma.dropoutRecord.count());
  console.log('  dailyReports:', await prisma.dailyReport.count());
  console.log('  overallReports:', await prisma.overallReport.count());

  console.log('');
  console.log('=== INTEGRITY CHECKS ===');

  // Users without employee profile
  const allUserIds = (await prisma.user.findMany({ select: { id: true } })).map(u => u.id);
  const allEmpUserIds = (await prisma.employee.findMany({ select: { userId: true } })).map(e => e.userId);
  const usersWithoutEmp = allUserIds.filter(uid => !allEmpUserIds.includes(uid));
  console.log('  Users without Employee profile:', usersWithoutEmp.length);

  // Attendance records with orphan employee references
  const allEmpIds = new Set((await prisma.employee.findMany({ select: { id: true } })).map(e => e.id));
  const attEmpIds = await prisma.attendanceRecord.findMany({ select: { employeeId: true }, distinct: ['employeeId'] });
  const orphanAtt = attEmpIds.filter(a => !allEmpIds.has(a.employeeId));
  console.log('  Attendance orphan employeeIds:', orphanAtt.length);

  // Leave balances without valid leave type
  const ltIds = new Set((await prisma.leaveType.findMany({ select: { id: true } })).map(l => l.id));
  const lbTypeIds = await prisma.leaveBalance.findMany({ select: { leaveTypeId: true }, distinct: ['leaveTypeId'] });
  const orphanLb = lbTypeIds.filter(lb => !ltIds.has(lb.leaveTypeId));
  console.log('  LeaveBalance orphan leaveTypeIds:', orphanLb.length);

  // Employees with null departmentId
  const noDept = await prisma.employee.count({ where: { departmentId: null } });
  console.log('  Employees without department:', noDept);

  // Employees with null designationId
  const noDesig = await prisma.employee.count({ where: { designationId: null } });
  console.log('  Employees without designation:', noDesig);

  // Check for salary structures referencing nonexistent employees
  const salEmps = await prisma.salaryStructure.findMany({ select: { employeeId: true } });
  const orphanSal = salEmps.filter(s => !allEmpIds.has(s.employeeId));
  console.log('  SalaryStructure orphan employeeIds:', orphanSal.length);

  await prisma.$disconnect();
  console.log('\n=== CHECK COMPLETE ===');
}

check().catch(e => {
  console.error('Script error:', e.message);
  process.exit(1);
});
