import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExitStatus } from '../prisma/enums';

@Injectable()
export class ExitService {
  constructor(private prisma: PrismaService) {}

  async submitResignation(employeeId: string, data: { lastWorkingDay: string; reason: string }) {
    return this.prisma.resignation.upsert({
      where: { employeeId },
      update: {
        lastWorkingDay: new Date(data.lastWorkingDay),
        reason: data.reason,
        status: ExitStatus.SUBMITTED,
      },
      create: {
        employeeId,
        lastWorkingDay: new Date(data.lastWorkingDay),
        reason: data.reason,
        status: ExitStatus.SUBMITTED,
      },
    });
  }

  async getAllResignations() {
    return this.prisma.resignation.findMany({
      include: {
        employee: {
          include: { department: true, designation: true, fnfSettlement: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateResignationStatus(id: string, status: ExitStatus, managerApproval?: boolean, hrApproval?: boolean) {
    return this.prisma.resignation.update({
      where: { id },
      data: {
        status,
        managerApproval: managerApproval !== undefined ? managerApproval : undefined,
        hrApproval: hrApproval !== undefined ? hrApproval : undefined,
      },
    });
  }

  async calculateFnF(employeeId: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { salaryStructure: true, leaveBalances: true },
    });

    if (!emp || !emp.salaryStructure) {
      throw new NotFoundException('Employee salary structure not found');
    }

    const monthlyGross = emp.salaryStructure.ctc / 12;
    const pendingSalary = parseFloat((monthlyGross * 0.5).toFixed(2));
    const totalUnusedLeave = emp.leaveBalances.reduce((sum, lb) => sum + (lb.totalDays - lb.usedDays), 0);
    const perDaySalary = monthlyGross / 30;
    const leaveEncashment = parseFloat((totalUnusedLeave * perDaySalary).toFixed(2));
    const deductions = 5000; // Sample recovery/deduction
    const netSettlement = pendingSalary + leaveEncashment - deductions;

    return this.prisma.fnFSettlement.upsert({
      where: { employeeId },
      update: {
        pendingSalary,
        leaveEncashment,
        deductions,
        netSettlement,
        isSettled: false,
      },
      create: {
        employeeId,
        pendingSalary,
        leaveEncashment,
        deductions,
        netSettlement,
        isSettled: false,
      },
    });
  }
}
