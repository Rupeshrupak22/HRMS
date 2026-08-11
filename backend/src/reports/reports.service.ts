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

    // Fetch payroll records for Charitha's dashboard
    const payrollRecords = await this.prisma.manualPayrollRecord.findMany();
    let totalPayrollGross = 0;
    let totalPayrollDeductions = 0;
    let totalPayrollNet = 0;
    let totalLopDays = 0;

    payrollRecords.forEach(record => {
      totalPayrollGross += parseFloat(record.newSalary || record.oldSalary || '0') || 0;
      totalPayrollDeductions += parseFloat(record.lopDeduction || '0') || 0;
      totalPayrollNet += parseFloat(record.netPay || '0') || 0;
      totalLopDays += parseFloat(record.lopDays || '0') || 0;
    });

    // Exit Metrics for Aravind
    const activeResignations = await this.prisma.resignation.count({ where: { status: { notIn: ['COMPLETED', 'SETTLED'] } } });
    const completedExitInterviews = await this.prisma.resignation.count({ where: { status: { in: ['COMPLETED', 'SETTLED', 'CLEARANCE_IN_PROGRESS'] } } });
    const fnfBalanceSum = await this.prisma.fnFSettlement.aggregate({ _sum: { netSettlement: true } });
    const recentResignations = await this.prisma.resignation.findMany({ include: { employee: true }, orderBy: { createdAt: 'desc' }, take: 5 });

    // Hiring Metrics for Veena
    const candidatesScreened = await this.prisma.candidate.count({ where: { status: { not: 'APPLIED' } } });
    const candidatesOffered = await this.prisma.candidate.count({ where: { status: { in: ['OFFERED', 'JOINED'] } } });
    const candidatesJoined = await this.prisma.candidate.count({ where: { status: 'JOINED' } });
    const candidatesDropped = await this.prisma.candidate.count({ where: { status: 'REJECTED' } });
    
    // Daily Reports for Manager & general tables
    const recentDailyReports = await this.prisma.dailyReport.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });

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
      payroll: {
        totalRecords: payrollRecords.length,
        totalGross: totalPayrollGross,
        totalDeductions: totalPayrollDeductions,
        totalNet: totalPayrollNet,
        totalLopDays: totalLopDays,
        records: payrollRecords.slice(0, 5) // Send a few for the table preview
      },
      exitMetrics: {
        activeResignations,
        completedExitInterviews,
        pendingSignOffs: activeResignations, // approx
        fnfBalance: fnfBalanceSum._sum.netSettlement || 0,
        recentResignations
      },
      hiringMetrics: {
        openJobs,
        candidatesScreened,
        candidatesOffered,
        candidatesJoined,
        candidatesDropped
      },
      attendanceMetrics: {
        todayPresent,
        todayLate,
        todayAbsent,
        pendingLeaves,
        totalLopDays,
        overtimeHours: 24.5 // hardcoded fallback for now if no DB column exists
      },
      dailyReports: recentDailyReports
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

    // Also fetch recruitment entries and dropouts for accurate counts
    const recruitmentEntries = await this.prisma.recruitmentEntry.findMany({ orderBy: { createdAt: 'desc' } });
    const dropoutRecords = await this.prisma.dropoutRecord.findMany({ orderBy: { createdAt: 'desc' } });

    // Compute stats from actual data
    const totalScreened = reports.reduce((sum, r) => sum + r.numScreened, 0);
    const totalInterviews = reports.reduce((sum, r) => sum + r.numInterviews, 0);
    const totalOffersSent = reports.reduce((sum, r) => sum + r.numOffersSent, 0);
    const totalJoined = reports.reduce((sum, r) => sum + r.numJoined, 0);
    const totalDropouts = dropoutRecords.length || reports.reduce((sum, r) => sum + r.numDropouts, 0);
    const totalCandidates = recruitmentEntries.length;

    // Source breakdown from recruitment entries
    const sourceCounts: Record<string, number> = {};
    recruitmentEntries.forEach((r) => {
      const src = r.source || 'Other';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
    // Fallback to daily reports if no recruitment entries
    if (Object.keys(sourceCounts).length === 0) {
      reports.forEach((r) => {
        const src = r.candidateSource || 'Other';
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
      });
    }
    const sourceData = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }));

    // Funnel data
    const funnelData = [
      { stage: 'Screened', candidates: totalScreened || recruitmentEntries.filter(r => r.currentStage !== 'Application').length },
      { stage: 'Interview', candidates: totalInterviews || recruitmentEntries.filter(r => ['Interview', 'Selection', 'Offer', 'Joining', 'Onboarding', 'Completed'].includes(r.currentStage)).length },
      { stage: 'Offered', candidates: totalOffersSent || recruitmentEntries.filter(r => ['Offer', 'Joining', 'Onboarding', 'Completed'].includes(r.currentStage)).length },
      { stage: 'Joined', candidates: totalJoined || recruitmentEntries.filter(r => ['Joining', 'Onboarding', 'Completed'].includes(r.currentStage)).length },
      { stage: 'Dropout', candidates: totalDropouts },
    ];

    // Recent activity from recruitment entries + reports
    const recentActivities = [
      ...recruitmentEntries.slice(0, 5).map((r) => ({
        time: r.applicationDate,
        text: `${r.employeeName} — ${r.roleApplied} (${r.currentStage})`,
        type: r.currentStage === 'Onboarding' || r.currentStage === 'Completed' ? 'onboard' : r.currentStage === 'Offer' ? 'offer' : 'interview',
      })),
      ...dropoutRecords.slice(0, 3).map((d) => ({
        time: d.dropoutDate,
        text: `Dropout: ${d.candidateName} — ${d.dropoutReason}`,
        type: 'dropout',
      })),
    ].slice(0, 8);

    // Open jobs count
    const openJobs = await this.prisma.jobOpening.count({ where: { status: 'OPEN' } });

    return {
      stats: {
        openJobs,
        totalScreened: totalScreened || recruitmentEntries.length,
        totalInterviews,
        totalOffersSent,
        totalJoined,
        totalDropouts,
        totalReports: reports.length,
        totalCandidates,
      },
      funnelData,
      sourceData,
      recentActivities,
      upcomingJoiners: recruitmentEntries.filter(r => r.currentStage === 'Joining' || r.currentStage === 'Onboarding').map(r => ({
        name: r.employeeName,
        role: r.roleApplied,
        date: r.applicationDate,
        docStatus: r.currentStage === 'Onboarding' ? 'Verified' : 'Pending',
        assetStatus: r.onboarding === 'Completed' ? 'Assigned' : 'Pending',
      })),
    };
  }
}
