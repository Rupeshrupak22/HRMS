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
  type: z.string().optional(),
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
// - HR_ADMIN (Nandini/HR Manager): sees reports sent TO her by specialists
// - SUPER_ADMIN: sees ALL reports
router.get('/daily', async (req: AuthRequest, res: Response, next) => {
  try {
    const where: any = {};
    const userRole = req.user!.role;
    const userEmail = req.user!.email;

    if (userRole === 'SUPER_ADMIN') {
      // Super Admin sees everything
      if (req.query.userEmail) where.userEmail = req.query.userEmail;
    } else if (userRole === 'HR_ADMIN') {
      // HR Manager sees reports sent to her OR her own reports
      if (req.query.userEmail) {
        where.userEmail = req.query.userEmail;
      } else {
        where.OR = [
          { sentToEmail: userEmail },
          { userEmail: userEmail },
        ];
      }
    } else if (userRole === 'HR_EXECUTIVE') {
      // HR Specialists see only their own reports
      where.userEmail = userEmail;
    } else {
      // Regular employees see only their own
      where.userEmail = userEmail;
    }

    if (req.query.date) where.date = req.query.date;
    if (req.query.status) where.status = req.query.status;

    const reports = await prisma.dailyReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: reports });
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
        employeeName: req.body.employeeName || `${firstName} ${lastName}`.trim() || userEmail,
        userEmail,
        createdByEmail: userEmail,
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
    const todayAttendance = await prisma.attendanceRecord.findMany({ where: { date: today } });
    const todayPresent = todayAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const todayLate = todayAttendance.filter((a) => a.status === 'LATE').length;
    const todayAbsent = Math.max(0, activeEmployees - todayPresent);

    const pendingLeaves = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });
    const openJobs = await prisma.jobOpening.count({ where: { status: 'OPEN' } });

    const deptDistribution = await prisma.department.findMany({
      select: { name: true, _count: { select: { employees: true } } },
    });

    const salarySum = await prisma.salaryStructure.aggregate({ _sum: { ctc: true } });

    // Charitha Payroll Data
    const manualRecords = await prisma.manualPayrollRecord.findMany({
      orderBy: { createdAt: 'desc' }
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

export default router;
