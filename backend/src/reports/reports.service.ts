import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
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
      select: { name: true, _count: { select: { employees: true } } },
    });

    const salarySum = await this.prisma.salaryStructure.aggregate({ _sum: { ctc: true } });

    return {
      totalEmployees,
      activeEmployees,
      probationEmployees,
      todayPresent,
      todayLate,
      todayAbsent,
      pendingLeaves,
      openJobs,
      totalPayrollCtc: salarySum._sum.ctc || 0,
      departmentDistribution: deptDistribution.map((d) => ({ name: d.name, count: d._count.employees })),
    };
  }

  async submitDailyReport(data: any, reqUser: any) {
    return this.prisma.dailyReport.create({
      data: {
        employeeName: reqUser.firstName ? `${reqUser.firstName} ${reqUser.lastName || ''}`.trim() : reqUser.email,
        userEmail: reqUser.email,
        date: data.date || new Date().toISOString().split('T')[0],
        role: data.role || '',
        candidateSource: data.candidateSource || '',
        screeningCompleted: data.screeningCompleted || 'NO',
        interviewTakenBy: data.interviewTakenBy || null,
        selectionStatus: data.selectionStatus || 'HOLD',
        offerLetterSent: data.offerLetterSent || 'NO',
        offerLetterAccepted: data.offerLetterAccepted || 'NO',
        joiningConfirmation: data.joiningConfirmation || 'TENTATIVE',
        joinedOnboarded: data.joinedOnboarded || 'NO',
        pendingFollowups: data.pendingFollowups || null,
        keyUpdates: data.keyUpdates || null,
        issue: data.issue || null,
        comment: data.comment || null,
        numScreened: parseInt(data.numScreened) || 0,
        numInterviews: parseInt(data.numInterviews) || 0,
        numOffersSent: parseInt(data.numOffersSent) || 0,
        numJoined: parseInt(data.numJoined) || 0,
        numDropouts: parseInt(data.numDropouts) || 0,
        status: 'SUBMITTED',
        sendStatus: data.sendToAdmin ? 'SENT' : 'NOT_SENT',
      },
    });
  }

  async getDailyReports() {
    return this.prisma.dailyReport.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateDailyReport(id: string, data: any) {
    return this.prisma.dailyReport.update({
      where: { id },
      data: {
        date: data.date,
        role: data.role,
        candidateSource: data.candidateSource,
        screeningCompleted: data.screeningCompleted,
        interviewTakenBy: data.interviewTakenBy,
        selectionStatus: data.selectionStatus,
        offerLetterSent: data.offerLetterSent,
        offerLetterAccepted: data.offerLetterAccepted,
        joiningConfirmation: data.joiningConfirmation,
        joinedOnboarded: data.joinedOnboarded,
        pendingFollowups: data.pendingFollowups,
        keyUpdates: data.keyUpdates,
        issue: data.issue,
        comment: data.comment,
        numScreened: parseInt(data.numScreened) || 0,
        numInterviews: parseInt(data.numInterviews) || 0,
        numOffersSent: parseInt(data.numOffersSent) || 0,
        numJoined: parseInt(data.numJoined) || 0,
        numDropouts: parseInt(data.numDropouts) || 0,
        sendStatus: data.sendStatus || undefined,
      },
    });
  }

  async updateDailyReportStatus(id: string, status: string) {
    return this.prisma.dailyReport.update({
      where: { id },
      data: { status },
    });
  }

  async sendReport(id: string) {
    return this.prisma.dailyReport.update({
      where: { id },
      data: { sendStatus: 'SENT' },
    });
  }

  async deleteDailyReport(id: string) {
    await this.prisma.dailyReport.delete({ where: { id } });
    return { success: true };
  }

  async getVeenaDashboard() {
    const reports = await this.prisma.dailyReport.findMany({
      where: { userEmail: 'veena@adyapan.com' },
      orderBy: { createdAt: 'desc' },
    });

    // Compute stats from actual data
    const totalScreened = reports.reduce((sum, r) => sum + r.numScreened, 0);
    const totalInterviews = reports.reduce((sum, r) => sum + r.numInterviews, 0);
    const totalOffersSent = reports.reduce((sum, r) => sum + r.numOffersSent, 0);
    const totalJoined = reports.reduce((sum, r) => sum + r.numJoined, 0);
    const totalDropouts = reports.reduce((sum, r) => sum + r.numDropouts, 0);

    // Source breakdown from reports
    const sourceCounts: Record<string, number> = {};
    reports.forEach((r) => {
      const src = r.candidateSource || 'Other';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
    const sourceData = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }));

    // Funnel data
    const funnelData = [
      { stage: 'Screened', candidates: totalScreened },
      { stage: 'Interview', candidates: totalInterviews },
      { stage: 'Offered', candidates: totalOffersSent },
      { stage: 'Joined', candidates: totalJoined },
      { stage: 'Dropout', candidates: totalDropouts },
    ];

    // Recent activity from last 10 reports
    const recentActivities = reports.slice(0, 10).map((r) => ({
      time: r.date,
      text: `${r.role} — ${r.keyUpdates || r.selectionStatus}`,
      type: r.joinedOnboarded === 'YES' ? 'onboard' : r.offerLetterSent === 'YES' ? 'offer' : r.numDropouts > 0 ? 'dropout' : 'interview',
    }));

    // Upcoming joiners (those confirmed but not yet onboarded)
    const upcomingJoiners = reports
      .filter((r) => r.joiningConfirmation === 'CONFIRMED' && r.joinedOnboarded !== 'YES')
      .map((r) => ({
        name: r.role,
        role: r.candidateSource,
        date: r.date,
        ctc: '-',
        docStatus: r.screeningCompleted === 'YES' ? 'Verified' : 'Pending',
        assetStatus: r.joinedOnboarded === 'IN_ONBOARDING' ? 'Assigned' : 'Pending',
      }));

    // Open jobs count
    const openJobs = await this.prisma.jobOpening.count({ where: { status: 'OPEN' } });

    return {
      stats: {
        openJobs,
        totalScreened,
        totalInterviews,
        totalOffersSent,
        totalJoined,
        totalDropouts,
        totalReports: reports.length,
      },
      funnelData,
      sourceData,
      recentActivities,
      upcomingJoiners,
    };
  }
}
