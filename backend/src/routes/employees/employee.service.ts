import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../../lib/prisma';
import { BadRequestError, NotFoundError } from '../../lib/errors';
import { CreateEmployeeDto, UpdateEmployeeDto } from './employee.schema';

function generateSecurePassword(): string {
  return crypto.randomBytes(12).toString('base64url') + '!A1';
}

export async function findAll(params: { search?: string; departmentId?: string; status?: string; userEmail?: string; userRole?: string; specialization?: string }) {
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

  // Data isolation: Regular HR_EXECUTIVE sees only employees they created
  // Specialist HR_EXECUTIVES (Pavitra, Veena, Nitisha, Aravind, Charitha, Nandini), HR_ADMIN, and SUPER_ADMIN see all
  const isSpecialist = Boolean(params.specialization) || ['pavitra@adyapan.com', 'veena@adyapan.com', 'nitisha@adyapan.com', 'aravind@adyapan.com', 'charitha@adyapan.com', 'nandini@adyapan.com', 'nandani@adyapan.com'].includes((params.userEmail || '').toLowerCase());

  if (params.userRole === 'HR_EXECUTIVE' && params.userEmail && !isSpecialist) {
    where.createdByEmail = params.userEmail;
  }

  return prisma.employee.findMany({
    where,
    include: {
      user: { select: { email: true, role: true } },
      department: true,
      designation: true,
      team: true,
      manager: { select: { firstName: true, lastName: true, employeeCode: true } },
    },
    orderBy: { createdAt: 'desc' },
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

export async function create(dto: CreateEmployeeDto, createdByEmail?: string) {
  const existing = await prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
  if (existing) throw new BadRequestError('Email already exists');

  // Handle password - require a strong password or generate a secure random one
  const password = (dto as any).password || generateSecurePassword();
  if (password.length < 8) {
    throw new BadRequestError('Password must be at least 8 characters');
  }
  const hashedPassword = await bcrypt.hash(password, 12);

  // Handle fullName split into firstName/lastName
  let firstName = dto.firstName || '';
  let lastName = dto.lastName || '';
  if ((dto as any).fullName && !firstName) {
    const parts = (dto as any).fullName.trim().split(' ');
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }

  const employeeCode = dto.employeeCode || `ADP${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

  const user = await prisma.user.create({
    data: {
      email: dto.email.toLowerCase(),
      passwordHash: hashedPassword,
      role: dto.role || 'EMPLOYEE',
      isEmailVerified: true,
    },
  });

  const mobileNumber = dto.mobileNumber || (dto as any).mobile || null;
  const bankAccountNo = dto.bankAccountNo || (dto as any).accountNumber || null;
  const ifscCode = dto.ifscCode || (dto as any).ifsc || null;
  const baseSalary = (dto as any).baseSalary || dto.ctc || 0;

  const emp = await prisma.employee.create({
    data: {
      userId: user.id,
      employeeCode,
      firstName,
      lastName,
      departmentId: dto.departmentId || undefined,
      designationId: dto.designationId || undefined,
      teamId: (dto as any).teamId || undefined,
      employmentType: dto.employmentType || 'FULL_TIME',
      joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
      mobileNumber,
      bankAccountNo,
      ifscCode,
      bankName: dto.bankName || null,
      dateOfBirth: (dto as any).dateOfBirth ? new Date((dto as any).dateOfBirth) : undefined,
      gender: (dto as any).gender || undefined,
      emergencyContactName: (dto as any).emergencyContact || undefined,
      emergencyPhone: (dto as any).emergencyPhone || undefined,
      address: (dto as any).address || undefined,
      createdByEmail: createdByEmail || undefined,
    } as any,
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

  // Create salary structure if salary/CTC provided
  if (baseSalary > 0) {
    const ctc = baseSalary * 12;
    const basic = ctc * 0.5;
    const hra = basic * 0.4;
    const special = Math.max(0, ctc - basic - hra - 24000);
    await prisma.salaryStructure.create({
      data: {
        employeeId: emp.id,
        ctc,
        basicSalary: basic,
        hra,
        conveyance: 24000,
        specialAllowance: special,
        pfDeduction: 21600,
        ptDeduction: 2400,
        tdsDeduction: ctc * 0.1,
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
