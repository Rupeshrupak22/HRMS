import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayrollStatus } from '@prisma/client';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async getSalaryStructures() {
    return this.prisma.salaryStructure.findMany({
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true, department: true } } },
    });
  }

  async getCycles() {
    return this.prisma.payrollCycle.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { _count: { select: { records: true } } },
    });
  }

  async getCycleById(id: string) {
    const cycle = await this.prisma.payrollCycle.findUnique({
      where: { id },
      include: {
        records: {
          include: {
            employee: {
              include: { department: true, designation: true, salaryStructure: true },
            },
          },
        },
      },
    });
    if (!cycle) throw new NotFoundException('Payroll cycle not found');
    return cycle;
  }

  async generateCycle(month: number, year: number) {
    let cycle = await this.prisma.payrollCycle.findUnique({
      where: { month_year: { month, year } },
    });

    if (!cycle) {
      cycle = await this.prisma.payrollCycle.create({
        data: { month, year, status: PayrollStatus.DRAFT },
      });
    }

    const employees = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: { salaryStructure: true },
    });

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const emp of employees) {
      if (!emp.salaryStructure) continue;

      const monthlyGross = emp.salaryStructure.ctc / 12;
      const deductions = emp.salaryStructure.pfDeduction + emp.salaryStructure.ptDeduction + emp.salaryStructure.tdsDeduction;
      const netSalary = Math.max(0, monthlyGross - deductions);

      totalGross += monthlyGross;
      totalDeductions += deductions;
      totalNet += netSalary;

      await this.prisma.payrollRecord.upsert({
        where: {
          payrollCycleId_employeeId: {
            payrollCycleId: cycle.id,
            employeeId: emp.id,
          },
        },
        update: {
          grossSalary: monthlyGross,
          totalDeductions: deductions,
          netSalary,
        },
        create: {
          payrollCycleId: cycle.id,
          employeeId: emp.id,
          workingDays: 30,
          presentDays: 30,
          lopDays: 0,
          grossSalary: monthlyGross,
          totalDeductions: deductions,
          netSalary,
        },
      });
    }

    return this.prisma.payrollCycle.update({
      where: { id: cycle.id },
      data: {
        totalGross,
        totalDeductions,
        totalNet,
        status: PayrollStatus.SALARY_CALCULATED,
      },
      include: { records: true },
    });
  }

  async updateCycleStatus(id: string, status: PayrollStatus) {
    return this.prisma.payrollCycle.update({
      where: { id },
      data: { status, processedAt: status === PayrollStatus.PROCESSED ? new Date() : undefined },
    });
  }

  async getMyPayslips(employeeId: string) {
    return this.prisma.payrollRecord.findMany({
      where: { employeeId },
      include: {
        payrollCycle: true,
        employee: { include: { department: true, designation: true, salaryStructure: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
