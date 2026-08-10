import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleName, EmploymentType, EmployeeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, departmentId?: string, status?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeCode: { contains: search } },
        { user: { email: { contains: search } } },
      ];
    }
    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (status) {
      where.status = status as EmployeeStatus;
    }

    return this.prisma.employee.findMany({
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

  async findOne(id: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, role: true, isEmailVerified: true, isMfaEnabled: true, lastLoginAt: true } },
        department: true,
        designation: true,
        team: true,
        manager: true,
        subordinates: true,
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

    if (!emp) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    return emp;
  }

  async create(data: {
    email: string;
    role?: RoleName;
    firstName: string;
    lastName: string;
    employeeCode: string;
    departmentId?: string;
    designationId?: string;
    employmentType?: EmploymentType;
    joiningDate?: Date;
    ctc?: number;
    mobileNumber?: string;
    bankAccountNo?: string;
    ifscCode?: string;
    bankName?: string;
  }) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const defaultPassword = await bcrypt.hash('Password123!', 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: defaultPassword,
        role: data.role || RoleName.EMPLOYEE,
        isEmailVerified: true,
      },
    });

    const emp = await this.prisma.employee.create({
      data: {
        userId: user.id,
        employeeCode: data.employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        departmentId: data.departmentId,
        designationId: data.designationId,
        employmentType: data.employmentType || EmploymentType.FULL_TIME,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
        mobileNumber: data.mobileNumber,
        bankAccountNo: data.bankAccountNo,
        ifscCode: data.ifscCode,
        bankName: data.bankName,
      },
    });

    // Create default leave balances
    const leaveTypes = await this.prisma.leaveType.findMany();
    for (const lt of leaveTypes) {
      await this.prisma.leaveBalance.create({
        data: {
          employeeId: emp.id,
          leaveTypeId: lt.id,
          totalDays: lt.annualDays,
          usedDays: 0,
          year: new Date().getFullYear(),
        },
      });
    }

    // Create default salary structure if CTC provided
    if (data.ctc) {
      const basic = data.ctc * 0.5;
      const hra = basic * 0.4;
      const special = Math.max(0, data.ctc - basic - hra - 24000);
      await this.prisma.salaryStructure.create({
        data: {
          employeeId: emp.id,
          ctc: data.ctc,
          basicSalary: basic,
          hra: hra,
          conveyance: 24000,
          specialAllowance: special,
          pfDeduction: 21600,
          ptDeduction: 2400,
          tdsDeduction: data.ctc * 0.1,
        },
      });
    }

    return this.findOne(emp.id);
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.employee.update({
      where: { id },
      data,
    });
  }
}
