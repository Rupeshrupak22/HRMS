import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma';
import { BadRequestError, NotFoundError } from '../../lib/errors';
import { CreateEmployeeDto, UpdateEmployeeDto } from './employee.schema';

export async function findAll(params: { search?: string; departmentId?: string; status?: string }) {
  const where: any = {};

  if (params.search) {
    where.OR = [
      { firstName: { contains: params.search, mode: 'insensitive' } },
      { lastName: { contains: params.search, mode: 'insensitive' } },
      { employeeCode: { contains: params.search, mode: 'insensitive' } },
      { user: { email: { contains: params.search, mode: 'insensitive' } } },
    ];
  }
  if (params.departmentId) where.departmentId = params.departmentId;
  if (params.status) where.status = params.status;

  return prisma.employee.findMany({
    where,
    include: {
      user: { select: { email: true, role: true } },
      department: true,
      designation: true,
      team: true,
      manager: { select: { firstName: true, lastName: true, employeeCode: true } },
    },
    orderBy: { employeeCode: 'asc' },
  });
}

export async function findOne(id: string) {
  const emp = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, role: true, isEmailVerified: true, lastLoginAt: true } },
      department: true,
      designation: true,
      team: true,
      manager: true,
      subordinates: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      salaryStructure: true,
      leaveBalances: { include: { leaveType: true } },
      leaveRequests: { include: { leaveType: true }, take: 10, orderBy: { createdAt: 'desc' } },
      attendances: { take: 30, orderBy: { date: 'desc' } },
      documents: true,
      goals: { orderBy: { dueDate: 'asc' } },
      reviews: { orderBy: { createdAt: 'desc' } },
      assetAssignments: { include: { asset: true } },
      expenseClaims: { take: 10, orderBy: { createdAt: 'desc' } },
      trainings: { include: { course: true } },
      resignation: true,
      fnfSettlement: true,
    },
  });

  if (!emp) throw new NotFoundError(`Employee with ID ${id} not found`);
  return emp;
}

export async function create(dto: CreateEmployeeDto) {
  const existing = await prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
  if (existing) throw new BadRequestError('Email already exists');

  const defaultPassword = await bcrypt.hash('Password123!', 10);

  const user = await prisma.user.create({
    data: {
      email: dto.email.toLowerCase(),
      passwordHash: defaultPassword,
      role: dto.role || 'EMPLOYEE',
      isEmailVerified: true,
    },
  });

  const emp = await prisma.employee.create({
    data: {
      userId: user.id,
      employeeCode: dto.employeeCode,
      firstName: dto.firstName,
      lastName: dto.lastName,
      departmentId: dto.departmentId,
      designationId: dto.designationId,
      employmentType: dto.employmentType || 'FULL_TIME',
      joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
      mobileNumber: dto.mobileNumber,
      bankAccountNo: dto.bankAccountNo,
      ifscCode: dto.ifscCode,
      bankName: dto.bankName,
    },
  });

  // Create default leave balances
  const leaveTypes = await prisma.leaveType.findMany();
  for (const lt of leaveTypes) {
    await prisma.leaveBalance.create({
      data: {
        employeeId: emp.id,
        leaveTypeId: lt.id,
        totalDays: lt.annualDays,
        usedDays: 0,
        year: new Date().getFullYear(),
      },
    });
  }

  // Create salary structure if CTC provided
  if (dto.ctc) {
    const basic = dto.ctc * 0.5;
    const hra = basic * 0.4;
    const special = Math.max(0, dto.ctc - basic - hra - 24000);
    await prisma.salaryStructure.create({
      data: {
        employeeId: emp.id,
        ctc: dto.ctc,
        basicSalary: basic,
        hra,
        conveyance: 24000,
        specialAllowance: special,
        pfDeduction: 21600,
        ptDeduction: 2400,
        tdsDeduction: dto.ctc * 0.1,
      },
    });
  }

  return findOne(emp.id);
}

export async function update(id: string, dto: UpdateEmployeeDto) {
  await findOne(id); // throws if not found
  const data: any = { ...dto };
  if (dto.dateOfBirth) data.dateOfBirth = new Date(dto.dateOfBirth);

  return prisma.employee.update({
    where: { id },
    data,
    include: {
      user: { select: { email: true, role: true } },
      department: true,
      designation: true,
    },
  });
}

export async function remove(id: string) {
  const emp = await findOne(id);
  await prisma.employee.delete({ where: { id } });
  await prisma.user.delete({ where: { id: emp.userId } });
  return { message: 'Employee deleted successfully' };
}
