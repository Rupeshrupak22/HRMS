import { Router, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

const createReportSchema = z.object({
  employeeName: z.string().min(1),
  date: z.string(),
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

// GET /api/reports/daily
router.get('/daily', async (req: AuthRequest, res: Response, next) => {
  try {
    const where: any = {};
    if (req.user!.role === 'EMPLOYEE') {
      where.userEmail = req.user!.email;
    } else if (req.query.userEmail) {
      where.userEmail = req.query.userEmail;
    }
    if (req.query.date) where.date = req.query.date;

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
router.post('/daily', validate(createReportSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const report = await prisma.dailyReport.create({
      data: { ...req.body, userEmail: req.user!.email },
    });
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/dashboard-metrics
router.get('/dashboard-metrics', async (req: AuthRequest, res: Response, next) => {
  try {
    const totalEmployees = await prisma.employee.count();
    const activeEmployees = await prisma.employee.count({ where: { status: 'ACTIVE' } });
    const probationEmployees = await prisma.employee.count({ where: { status: 'PROBATION' } });

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
      records: manualRecords.slice(0, 10), // Send recent records
    };

    const dailyReports = await prisma.dailyReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Return the object directly to match the old NestJS response format expected by frontend
    res.json({
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
      payroll,
      dailyReports,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/audit-logs
router.get('/audit-logs', authorize('HR_ADMIN'), async (req, res: Response, next) => {
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
