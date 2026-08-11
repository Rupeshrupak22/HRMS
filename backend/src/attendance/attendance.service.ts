import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus } from '../prisma/enums';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(employeeId: string, notes?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let record = await this.prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (record && record.checkInTime) {
      throw new BadRequestException('Already checked in for today');
    }

    const policy = (await this.prisma.attendancePolicy.findFirst()) || {
      officeStartTime: '09:30',
      gracePeriodMins: 15,
    };

    const now = new Date();
    const [startH, startM] = policy.officeStartTime.split(':').map(Number);
    const expectedTime = new Date();
    expectedTime.setHours(startH, startM + policy.gracePeriodMins, 0, 0);

    let lateMinutes = 0;
    let status: AttendanceStatus = AttendanceStatus.PRESENT;

    if (now > expectedTime) {
      lateMinutes = Math.floor((now.getTime() - expectedTime.getTime()) / (1000 * 60));
      status = AttendanceStatus.LATE;
    }

    if (record) {
      return this.prisma.attendanceRecord.update({
        where: { id: record.id },
        data: { checkInTime: now, lateMinutes, status, notes },
      });
    }

    return this.prisma.attendanceRecord.create({
      data: {
        employeeId,
        date: today,
        checkInTime: now,
        lateMinutes,
        status,
        notes,
      },
    });
  }

  async checkOut(employeeId: string, notes?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await this.prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (!record || !record.checkInTime) {
      throw new BadRequestException('Must check in before checking out');
    }

    const now = new Date();
    const durationMs = now.getTime() - record.checkInTime.getTime();
    const workHours = parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2));

    return this.prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        checkOutTime: now,
        workHours,
        notes: notes ? `${record.notes || ''} ${notes}`.trim() : record.notes,
      },
    });
  }

  async getMyLogs(employeeId: string) {
    return this.prisma.attendanceRecord.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
      take: 60,
    });
  }

  async getDailySummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalEmployees = await this.prisma.employee.count({ where: { status: 'ACTIVE' } });
    const records = await this.prisma.attendanceRecord.findMany({ where: { date: today } });

    const present = records.filter((r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE).length;
    const late = records.filter((r) => r.status === AttendanceStatus.LATE).length;
    const absent = Math.max(0, totalEmployees - present);

    return {
      date: today,
      totalEmployees,
      present,
      late,
      absent,
      records,
    };
  }
}
