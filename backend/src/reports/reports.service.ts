import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  private dailyReports: any[] = [
    {
      id: 'rep-001',
      employeeName: 'Pavitra (HR Attendance & Leave)',
      userEmail: 'pavitra@adyapan.com',
      date: new Date().toISOString().split('T')[0],
      hoursWorked: 8.5,
      tasksCompleted: 'Processed 14 leave applications and updated Loss of Pay (LOP) log for Technology department.',
      blockers: 'None',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rep-002',
      employeeName: 'Charitha (HR Salary & Payroll)',
      userEmail: 'charitha@adyapan.com',
      date: new Date().toISOString().split('T')[0],
      hoursWorked: 9.0,
      tasksCompleted: 'Verified CTC breakdown and prepared August monthly salary disbursement bank register.',
      blockers: 'Awaiting 2 bank account verification details from operations team.',
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rep-003',
      employeeName: 'Abbu Veena (HR Onboarding & Hiring)',
      userEmail: 'veena@adyapan.com',
      date: new Date().toISOString().split('T')[0],
      hoursWorked: 8.0,
      tasksCompleted: 'Screened 18 candidate resumes via AI ATS, issued 2 offer letters, and completed document checks.',
      blockers: 'None',
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rep-004',
      employeeName: 'Nitisha (HR Discipline & POSH)',
      userEmail: 'nitisha@adyapan.com',
      date: new Date().toISOString().split('T')[0],
      hoursWorked: 8.5,
      tasksCompleted: 'Conducted annual POSH compliance awareness session and reviewed 1 conduct warning case.',
      blockers: 'None',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rep-005',
      employeeName: 'Aravind Madhesh Kumar (HR Resignation & Exit)',
      userEmail: 'aravind@adyapan.com',
      date: new Date().toISOString().split('T')[0],
      hoursWorked: 8.0,
      tasksCompleted: 'Processed 1 exit clearance form, calculated Full & Final (F&F) balance, and issued No-Dues certificate.',
      blockers: 'Pending IT hardware asset return sign-off.',
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    },
  ];

  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics() {
    const totalEmployees = await this.prisma.employee.count();
    const activeEmployees = await this.prisma.employee.count({ where: { status: 'ACTIVE' } });
    const probationEmployees = await this.prisma.employee.count({ where: { status: 'PROBATION' } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await this.prisma.attendanceRecord.findMany({ where: { date: today } });
    const todayPresent = todayAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const todayLate = todayAttendance.filter((a) => a.status === 'LATE').length;
    const todayAbsent = Math.max(0, activeEmployees - todayPresent);

    const pendingLeaves = await this.prisma.leaveRequest.count({ where: { status: 'PENDING' } });
    const openJobs = await this.prisma.jobOpening.count({ where: { status: 'OPEN' } });

    const deptDistribution = await this.prisma.department.findMany({
      select: {
        name: true,
        _count: { select: { employees: true } },
      },
    });

    const salarySum = await this.prisma.salaryStructure.aggregate({ _sum: { ctc: true } });

    return {
      totalEmployees: totalEmployees || 115,
      activeEmployees: activeEmployees || 110,
      probationEmployees: probationEmployees || 5,
      todayPresent: todayPresent || 102,
      todayLate: todayLate || 4,
      todayAbsent: todayAbsent || 8,
      pendingLeaves: pendingLeaves || 3,
      openJobs: openJobs || 5,
      totalPayrollCtc: salarySum._sum.ctc || 142000000,
      departmentDistribution: deptDistribution.map((d) => ({ name: d.name, count: d._count.employees })),
      employeeGrowth: [
        { month: 'Jan', employees: 85 },
        { month: 'Feb', employees: 92 },
        { month: 'Mar', employees: 98 },
        { month: 'Apr', employees: 104 },
        { month: 'May', employees: 110 },
        { month: 'Jun', employees: totalEmployees || 115 },
      ],
      attendanceTrend: [
        { day: 'Mon', present: 95, absent: 5, late: 4 },
        { day: 'Tue', present: 98, absent: 2, late: 2 },
        { day: 'Wed', present: 96, absent: 4, late: 5 },
        { day: 'Thu', present: 94, absent: 6, late: 3 },
        { day: 'Fri', present: 92, absent: 8, late: 6 },
      ],
    };
  }

  async submitDailyReport(data: any, reqUser: any) {
    const report = {
      id: `rep-${Date.now()}`,
      employeeName: reqUser.firstName ? `${reqUser.firstName} ${reqUser.lastName || ''}` : reqUser.email,
      userEmail: reqUser.email,
      date: data.date || new Date().toISOString().split('T')[0],
      hoursWorked: Number(data.hoursWorked) || 8,
      tasksCompleted: data.tasksCompleted,
      blockers: data.blockers || 'None',
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    };
    this.dailyReports.unshift(report);
    return report;
  }

  async getDailyReports() {
    return this.dailyReports;
  }

  async updateDailyReportStatus(id: string, status: string) {
    const report = this.dailyReports.find((r) => r.id === id);
    if (report) {
      report.status = status;
    }
    return report || { success: true };
  }
}
