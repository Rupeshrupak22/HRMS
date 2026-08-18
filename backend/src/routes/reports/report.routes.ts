import { Router, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

const createReportSchema = z.object({
  employeeName: z.string().optional(),
  date: z.string(),
  hoursWorked: z.number().optional(),
  tasksCompleted: z.string().optional(),
  blockers: z.string().optional(),
  role: z.string().optional(),
  candidateSource: z.string().optional(),
  screeningCompleted: z.string().optional(),
  interviewTakenBy: z.string().optional(),
  selectionStatus: z.string().optional(),
  offerLetterSent: z.string().optional(),
  offerLetterAccepted: z.string().optional(),
  joiningConfirmation: z.string().optional(),
  joinedOnboarded: z.string().optional(),
  pendingFollowups: z.string().optional(),
  keyUpdates: z.string().optional(),
  issue: z.string().optional(),
  comment: z.string().optional(),
  numScreened: z.number().optional(),
  numInterviews: z.number().optional(),
  numOffersSent: z.number().optional(),
  numJoined: z.number().optional(),
  numDropouts: z.number().optional(),
});

// HR Manager email constant
const HR_MANAGER_EMAIL = 'nandini@adyapan.com';
const SUPER_ADMIN_EMAIL = 'superadmin@adyapan.com';

// GET /api/reports/daily
// - EMPLOYEE: sees only their own reports
// - HR_EXECUTIVE (specialists): sees only their own reports
// - HR_ADMIN (Nandini/HR Manager): sees all specialists' reports
// - SUPER_ADMIN / ADMIN: sees ALL reports across all specialists
router.get('/daily', async (req: AuthRequest, res: Response, next) => {
  try {
    const where: any = {};
    const userRole = req.user!.role;
    const userEmail = req.user!.email;

    const isManagerOrAdmin = 
      userRole === 'SUPER_ADMIN' || 
      userRole === 'HR_ADMIN' || 
      userRole === 'ADMIN' ||
      req.user!.specialization === 'HR_MANAGER_ALL' || 
      userEmail === 'nandini@adyapan.com' || 
      userEmail === 'nandani@adyapan.com' || 
      userEmail === 'admin@adyapan.com' ||
      userEmail === 'superadmin@adyapan.com';

    if (isManagerOrAdmin) {
      if (req.query.userEmail) {
        where.userEmail = String(req.query.userEmail).trim();
      }
    } else {
      where.userEmail = userEmail;
    }

    if (req.query.date) {
      where.date = String(req.query.date).trim();
    }
    if (req.query.status) {
      where.status = String(req.query.status).trim();
    }

    const searchQuery = req.query.search ? String(req.query.search).trim() : '';
    if (searchQuery) {
      where.OR = [
        { employeeName: { contains: searchQuery, mode: 'insensitive' } },
        { userEmail: { contains: searchQuery, mode: 'insensitive' } },
        { role: { contains: searchQuery, mode: 'insensitive' } },
        { keyUpdates: { contains: searchQuery, mode: 'insensitive' } },
        { issue: { contains: searchQuery, mode: 'insensitive' } },
        { comment: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // 1. Fetch from core DailyReport table
    const dailyReports = await prisma.dailyReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch specialized reports from specialist tables if viewing all or specific specialist
    let combinedReports = [...dailyReports];
    const existingKeys = new Set(
      dailyReports.map((r) => `${r.userEmail}_${r.date}_${(r.keyUpdates || '').slice(0, 20)}`)
    );

    try {
      // Veena Daily Reports
      if (isManagerOrAdmin || userEmail === 'veena@adyapan.com') {
        const veenaReports = await prisma.veenaDailyReport.findMany({
          where: req.query.date ? { date: String(req.query.date) } : {},
          orderBy: { createdAt: 'desc' },
        });

        for (const vr of veenaReports) {
          const key = `veena@adyapan.com_${vr.date}_${(vr.keyUpdatesIssue || '').slice(0, 20)}`;
          if (!existingKeys.has(key)) {
            existingKeys.add(key);
            combinedReports.push({
              id: vr.id,
              employeeName: 'Abbu Veena',
              userEmail: vr.createdByEmail || 'veena@adyapan.com',
              date: vr.date,
              role: vr.role || 'Onboarding & Hiring',
              candidateSource: vr.candidateSourced || '-',
              screeningCompleted: vr.screeningDone || '-',
              interviewTakenBy: vr.interviewsTaken || '-',
              selectionStatus: vr.selected || '-',
              offerLetterSent: vr.offerLetterSent || '-',
              offerLetterAccepted: vr.offerAccepted || '-',
              joiningConfirmation: vr.joiningConfirmed || '-',
              joinedOnboarded: vr.joined || vr.onboarded || '-',
              pendingFollowups: vr.pendingFollowups || '-',
              keyUpdates: `Sourced: ${vr.candidateSourced || 0}, Screened: ${vr.screeningDone || 0}, Intv: ${vr.interviewsTaken || 0}, Selected: ${vr.selected || 0}, Offers: ${vr.offerLetterSent || 0}, Joined: ${vr.joined || 0}`,
              issue: vr.keyUpdatesIssue || '-',
              comment: `Pending follow-ups: ${vr.pendingFollowups || 'None'}`,
              numScreened: parseInt(vr.screeningDone || '0', 10) || 0,
              numInterviews: parseInt(vr.interviewsTaken || '0', 10) || 0,
              numOffersSent: parseInt(vr.offerLetterSent || '0', 10) || 0,
              numJoined: parseInt(vr.joined || '0', 10) || 0,
              numDropouts: 0,
              status: 'APPROVED',
              sendStatus: 'SENT',
              sentToEmail: 'nandini@adyapan.com',
              reviewedByEmail: null,
              createdByEmail: vr.createdByEmail || 'veena@adyapan.com',
              createdAt: vr.createdAt,
              updatedAt: vr.updatedAt,
            } as any);
          }
        }
      }

      // Nitisha Daily Reports
      if (isManagerOrAdmin || userEmail === 'nitisha@adyapan.com') {
        const nitishaReports = await prisma.nitishaDailyReport.findMany({
          orderBy: { createdAt: 'desc' },
        });

        for (const nr of nitishaReports) {
          const dateStr = nr.createdAt.toISOString().split('T')[0];
          if (req.query.date && dateStr !== String(req.query.date)) continue;

          const key = `nitisha@adyapan.com_${dateStr}_${(nr.employeeIssue || '').slice(0, 20)}`;
          if (!existingKeys.has(key)) {
            existingKeys.add(key);
            combinedReports.push({
              id: nr.id,
              employeeName: 'Nitisha',
              userEmail: nr.createdByEmail || 'nitisha@adyapan.com',
              date: dateStr,
              role: 'Discipline & POSH Specialist',
              candidateSource: null,
              screeningCompleted: null,
              interviewTakenBy: null,
              selectionStatus: null,
              offerLetterSent: null,
              offerLetterAccepted: null,
              joiningConfirmation: null,
              joinedOnboarded: null,
              pendingFollowups: null,
              keyUpdates: `Issues: ${nr.employeeIssue}, Engagement: ${nr.employeeEngagement}, Discipline: ${nr.disciplineCases}`,
              issue: nr.employeeIssue || '-',
              comment: `PIP Case: ${nr.pipCase} (${nr.pipReason || 'None'}). Low: ${nr.performanceLow}, Med: ${nr.performanceMedium}, High: ${nr.performanceHigh}`,
              numScreened: 0,
              numInterviews: 0,
              numOffersSent: 0,
              numJoined: 0,
              numDropouts: 0,
              status: 'APPROVED',
              sendStatus: 'SENT',
              sentToEmail: 'nandini@adyapan.com',
              reviewedByEmail: null,
              createdByEmail: nr.createdByEmail || 'nitisha@adyapan.com',
              createdAt: nr.createdAt,
              updatedAt: nr.updatedAt,
            } as any);
          }
        }
      }
    } catch {
      // Graceful fallback to dailyReports
    }

    // Sort by date / createdAt desc
    combinedReports.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt).getTime();
      const dateB = new Date(b.date || b.createdAt).getTime();
      return dateB - dateA;
    });

    const total = combinedReports.length;
    const page = parseInt(String(req.query.page || '1'), 10) || 1;
    const limit = parseInt(String(req.query.limit || '0'), 10);

    let paginatedData = combinedReports;
    if (limit > 0) {
      const start = (page - 1) * limit;
      paginatedData = combinedReports.slice(start, start + limit);
    }

    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        total,
        page,
        limit: limit > 0 ? limit : total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/reports/daily
// When a specialist submits, it is auto-routed to HR Manager (Nandini)
// When HR Manager submits her own report, it is auto-routed to Super Admin
router.post('/daily', validate(createReportSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const userRole = req.user!.role;
    const userEmail = req.user!.email;
    const firstName = req.user!.firstName || '';
    const lastName = req.user!.lastName || '';

    // Determine where the report goes
    let sentToEmail: string | null = null;
    if (userRole === 'HR_EXECUTIVE') {
      // Specialists send to HR Manager
      sentToEmail = HR_MANAGER_EMAIL;
    } else if (userRole === 'HR_ADMIN') {
      // HR Manager sends to Super Admin
      sentToEmail = SUPER_ADMIN_EMAIL;
    }

    const report = await prisma.dailyReport.create({
      data: {
        ...req.body,
        type: undefined,
        hoursWorked: undefined,
        tasksCompleted: undefined,
        blockers: undefined,
        employeeName: req.body.employeeName || `${firstName} ${lastName}`.trim() || userEmail,
        userEmail,
        sentToEmail,
        sendStatus: sentToEmail ? 'SENT' : 'NOT_SENT',
      },
    });
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

// PUT /api/reports/daily/:id/approve — HR Manager or Admin approves a report
router.put('/daily/:id/approve', authorize('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response, next) => {
  try {
    const report = await prisma.dailyReport.update({
      where: { id: String(req.params.id) },
      data: { status: 'APPROVED', reviewedByEmail: req.user!.email } as any,
    });
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

// PUT /api/reports/daily/:id/reject — HR Manager or Admin rejects a report
router.put('/daily/:id/reject', authorize('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response, next) => {
  try {
    const report = await prisma.dailyReport.update({
      where: { id: String(req.params.id) },
      data: { status: 'REJECTED', reviewedByEmail: req.user!.email } as any,
    });
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/specialist-summary
// HR Manager and Admin can view aggregated data per specialist
router.get('/specialist-summary', authorize('HR_ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response, next) => {
  try {
    const today = req.query.date as string || new Date().toISOString().split('T')[0];

    const specialists = [
      { email: 'aravind@adyapan.com', name: 'Aravind', role: 'Resignation & Exit' },
      { email: 'nitisha@adyapan.com', name: 'Nitisha', role: 'Discipline & POSH' },
      { email: 'veena@adyapan.com', name: 'Veena', role: 'Onboarding & Hiring' },
      { email: 'pavitra@adyapan.com', name: 'Pavitra', role: 'Attendance & Leave' },
      { email: 'charitha@adyapan.com', name: 'Charitha', role: 'Salary & Payroll' },
    ];

    const summary = await Promise.all(
      specialists.map(async (spec) => {
        const todayReport = await prisma.dailyReport.findFirst({
          where: { userEmail: spec.email, date: today },
          orderBy: { createdAt: 'desc' },
        });

        const totalReports = await prisma.dailyReport.count({
          where: { userEmail: spec.email },
        });

        const employeesManaged = await prisma.employee.count({
          where: { createdByEmail: spec.email } as any,
        });

        return {
          ...spec,
          todayReportSubmitted: !!todayReport,
          todayReportStatus: todayReport?.status || 'NOT_SUBMITTED',
          totalReports,
          employeesManaged,
          lastReport: todayReport,
        };
      })
    );

    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/dashboard-metrics
router.get('/dashboard-metrics', async (req: AuthRequest, res: Response, next) => {
  try {
    const userRole = req.user!.role;
    const userEmail = req.user!.email;

    const totalEmployees = await prisma.employee.count();
    const activeEmployees = await prisma.employee.count({ where: { status: 'ACTIVE' } });
    const probationEmployees = await prisma.employee.count({ where: { status: 'PROBATION' } });

    // For HR_EXECUTIVE, show only their managed employees count
    let myEmployees = 0;
    if (userRole === 'HR_EXECUTIVE') {
      myEmployees = await prisma.employee.count({ where: { createdByEmail: userEmail } as any });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await prisma.attendanceRecord.findMany({
      where: { date: { gte: today, lt: tomorrow } },
    });
    const todayPresent = todayAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const todayLate = todayAttendance.filter((a) => a.status === 'LATE').length;
    const todayAbsent = Math.max(0, (activeEmployees + probationEmployees) - todayPresent);

    const pendingLeaves = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });
    const approvedLeavesToday = await prisma.leaveRequest.count({
      where: {
        status: 'APPROVED',
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });

    const totalWorkforce = activeEmployees + probationEmployees;
    const attendanceRate = totalWorkforce > 0 ? Math.round((todayPresent / totalWorkforce) * 100) : 0;

    const lopLeaveRequests = await prisma.leaveRequest.count({
      where: {
        OR: [
          { leaveType: { name: { contains: 'LOP', mode: 'insensitive' } } },
          { leaveType: { name: { contains: 'UNPAID', mode: 'insensitive' } } },
        ],
      },
    });
    const openJobs = await prisma.jobOpening.count({ where: { status: 'OPEN' } });

    const deptDistribution = await prisma.department.findMany({
      select: { name: true, _count: { select: { employees: true } } },
    });

    const salarySum = await prisma.salaryStructure.aggregate({ _sum: { ctc: true } });

    // Charitha Payroll Data
    const manualRecords = await prisma.manualPayrollRecord.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const payrollTotalEmployees = manualRecords.length;
    const payrollTotalGross = manualRecords.reduce((sum: number, r: any) => sum + (parseFloat(r.newSalary || '0') || 0), 0);
    const payrollTotalDeductions = manualRecords.reduce((sum: number, r: any) => sum + (parseFloat(r.lopDeduction || '0') || 0), 0);
    const payrollTotalNetPay = manualRecords.reduce((sum: number, r: any) => sum + (parseFloat(r.netPay || '0') || 0), 0);
    const payrollTotalLopDays = manualRecords.reduce((sum: number, r: any) => sum + (parseFloat(r.lopDays || '0') || 0), 0);
    const payrollTotalWorkingDays = manualRecords.reduce((sum: number, r: any) => sum + (parseFloat(r.workingDays || '0') || 0), 0);
    const payrollTotalLeavesTaken = manualRecords.reduce((sum: number, r: any) => sum + (parseFloat(r.leavesTaken || '0') || 0), 0);
    const payrollAttendanceFrozen = manualRecords.filter((r: any) => r.attendanceFreeze === 'YES').length;
    const payrollSalaryChanges = manualRecords.filter((r: any) => r.salaryChangeDate && r.salaryChangeDate !== '').length;

    const payroll = {
      totalRecords: payrollTotalEmployees,
      totalGross: payrollTotalGross,
      totalDeductions: payrollTotalDeductions,
      totalNet: payrollTotalNetPay,
      totalLopDays: payrollTotalLopDays,
      totalWorkingDays: payrollTotalWorkingDays,
      totalLeavesTaken: payrollTotalLeavesTaken,
      attendanceFrozen: payrollAttendanceFrozen,
      salaryChanges: payrollSalaryChanges,
      records: manualRecords.slice(0, 10),
    };

    const dailyReports = await prisma.dailyReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      totalEmployees,
      activeEmployees,
      probationEmployees,
      myEmployees,
      todayPresent,
      todayLate,
      todayAbsent,
      pendingLeaves,
      approvedLeavesToday,
      attendanceRate,
      lopCount: lopLeaveRequests,
      openJobs,
      totalPayrollCtc: salarySum._sum.ctc || 0,
      departmentDistribution: deptDistribution.map((d) => ({ name: d.name, count: d._count.employees })),
      payroll,
      dailyReports,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/audit-logs
router.get('/audit-logs', authorize('HR_ADMIN', 'SUPER_ADMIN'), async (req, res: Response, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/reports/daily/clear-all — delete today's daily reports from DB
router.delete('/daily/clear-all', async (req: AuthRequest, res: Response, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    await prisma.dailyReport.deleteMany({
      where: {
        userEmail: req.user?.email || 'pavitra@adyapan.com',
        OR: [
          { date: todayStr },
          { date: '2026-08-13' }
        ]
      }
    });
    res.json({ success: true, message: 'Today daily reports deleted from DB successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
