import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // Check the 1 user without employee
  const allUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const empUserIds = new Set((await prisma.employee.findMany({ select: { userId: true } })).map(e => e.userId));
  const orphans = allUsers.filter(u => !empUserIds.has(u.id));
  console.log('Users without employee:', JSON.stringify(orphans.map(u => u.email)));

  // Check employees without designation
  const noDesig = await prisma.employee.findMany({ where: { designationId: null }, select: { employeeCode: true, firstName: true, lastName: true } });
  console.log('Employees without designation:', JSON.stringify(noDesig));

  // Data gaps
  console.log('Teams:', await prisma.team.count(), '(frontend calls /teams but returns 404)');
  console.log('LeaveBalances:', await prisma.leaveBalance.count(), '(all employees have 0 leave balance)');
  console.log('LeaveRequests:', await prisma.leaveRequest.count());
  console.log('SalaryStructures:', await prisma.salaryStructure.count(), '(no payslips can be generated)');
  console.log('PayrollCycles:', await prisma.payrollCycle.count());
  console.log('Assets:', await prisma.asset.count());
  console.log('Holidays:', await prisma.holiday.count());

  await prisma.$disconnect();
}
main().catch(e => console.error(e.message));
