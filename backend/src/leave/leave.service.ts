import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaveStatus } from '../prisma/enums';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  async getTypes() {
    return this.prisma.leaveType.findMany();
  }

  async getMyBalances(employeeId: string) {
    return this.prisma.leaveBalance.findMany({
      where: { employeeId },
      include: { leaveType: true },
    });
  }

  async apply(employeeId: string, data: { leaveTypeId: string; startDate: string; endDate: string; reason: string }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const balance = await this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId,
          leaveTypeId: data.leaveTypeId,
          year: start.getFullYear(),
        },
      },
    });

    if (!balance || balance.totalDays - balance.usedDays < totalDays) {
      throw new BadRequestException('Insufficient leave balance');
    }

    return this.prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays,
        reason: data.reason,
        status: LeaveStatus.PENDING,
      },
      include: { leaveType: true },
    });
  }

  async getPendingRequests() {
    return this.prisma.leaveRequest.findMany({
      where: { status: LeaveStatus.PENDING },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true, department: true },
        },
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, approvedById: string) {
    const request = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Leave request not found');

    // Deduct balance
    const balance = await this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: request.startDate.getFullYear(),
        },
      },
    });

    if (balance) {
      await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { usedDays: balance.usedDays + request.totalDays },
      });
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.APPROVED, approvedById },
    });
  }

  async reject(id: string, rejectionReason: string) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.REJECTED, rejectionReason },
    });
  }

  async getHolidays() {
    return this.prisma.holiday.findMany({ orderBy: { date: 'asc' } });
  }
}
