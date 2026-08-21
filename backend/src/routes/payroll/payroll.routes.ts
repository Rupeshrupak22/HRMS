import { Router, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

const createCycleSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
});

const processCycleSchema = z.object({
  cycleId: z.string().uuid(),
});

// GET /api/payroll/cycles
router.get('/cycles', authorize('HR_ADMIN', 'HR_MANAGER'), async (_req, res: Response, next) => {
  try {
    const cycles = await prisma.payrollCycle.findMany({
      include: { _count: { select: { records: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    res.json({ success: true, data: cycles });
  } catch (err) {
    next(err);
  }
});

// POST /api/payroll/cycles
router.post('/cycles', authorize('HR_ADMIN'), validate(createCycleSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const cycle = await prisma.payrollCycle.create({ data: req.body });
    res.status(201).json({ success: true, data: cycle });
  } catch (err) {
    next(err);
  }
});

// POST /api/payroll/process
router.post('/process', authorize('HR_ADMIN'), validate(processCycleSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const cycle = await prisma.payrollCycle.findUnique({ where: { id: req.body.cycleId } });
    if (!cycle) throw new NotFoundError('Payroll cycle not found');

    // Get all active employees with salary structures
    const employees = await prisma.employee.findMany({
      where: { status: { not: 'TERMINATED' }, salaryStructure: { isNot: null } },
      include: { salaryStructure: true },
    });

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const emp of employees) {
      if (!emp.salaryStructure) continue;

      const ss = emp.salaryStructure;
      const monthlyGross = ss.ctc / 12;
      const monthlyDeductions = (ss.pfDeduction + ss.esiDeduction + ss.ptDeduction + ss.tdsDeduction) / 12;
      const netSalary = monthlyGross - monthlyDeductions;

      await prisma.payrollRecord.upsert({
        where: { payrollCycleId_employeeId: { payrollCycleId: cycle.id, employeeId: emp.id } },
        update: { grossSalary: monthlyGross, totalDeductions: monthlyDeductions, netSalary },
        create: {
          payrollCycleId: cycle.id,
          employeeId: emp.id,
          grossSalary: monthlyGross,
          totalDeductions: monthlyDeductions,
          netSalary,
        },
      });

      totalGross += monthlyGross;
      totalDeductions += monthlyDeductions;
      totalNet += netSalary;
    }

    const updated = await prisma.payrollCycle.update({
      where: { id: cycle.id },
      data: { status: 'PROCESSED', totalGross, totalDeductions, totalNet, processedAt: new Date() },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// GET /api/payroll/records/:cycleId
router.get('/records/:cycleId', authorize('HR_ADMIN', 'HR_MANAGER'), async (req, res: Response, next) => {
  try {
    const records = await prisma.payrollRecord.findMany({
      where: { payrollCycleId: String(req.params.cycleId) },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
      orderBy: { employee: { employeeCode: 'asc' } },
    });
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
});

// GET /api/payroll/my-payslips
router.get('/my-payslips', async (req: AuthRequest, res: Response, next) => {
  try {
    if (!req.user!.employeeId) {
      res.json({ success: true, data: [] });
      return;
    }
    const records = await prisma.payrollRecord.findMany({
      where: { employeeId: req.user!.employeeId },
      include: { payrollCycle: true },
      orderBy: { payrollCycle: { year: 'desc' } },
    });
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
});

// GET /api/payroll/salary-structure/:employeeId
router.get('/salary-structure/:employeeId', async (req: AuthRequest, res: Response, next) => {
  try {
    // Employees can only view their own
    if (req.user!.role === 'EMPLOYEE' && req.user!.employeeId !== String(req.params.employeeId)) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }
    const structure = await prisma.salaryStructure.findUnique({ where: { employeeId: String(req.params.employeeId) } });
    res.json({ success: true, data: structure });
  } catch (err) {
    next(err);
  }
});

// GET /api/payroll/manual
router.get('/manual', async (req: AuthRequest, res: Response, next) => {
  try {
    const where: any = {};
    // Data isolation: HR_EXECUTIVE sees only their own payroll records
    if (req.user!.role === 'HR_EXECUTIVE') {
      where.createdByEmail = req.user!.email;
    }
    const records = await prisma.manualPayrollRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
});

// POST /api/payroll/manual
router.post('/manual', async (req: AuthRequest, res: Response, next) => {
  try {
    const { employeeId, employeeName, department, joinDate, exitDate, workingDays,
      attendanceFreeze, freezeReason, leavesTaken, lopDays, salaryChangeDate,
      oldSalary, newSalary, salaryChangeReason, performanceRating, performanceComment,
      deductionType, lopDeduction, netPay, verifiedBy, verificationDate,
      headApproval, headApprovalDate, headSignature } = req.body;

    const record = await prisma.manualPayrollRecord.create({
      data: {
        employeeId: employeeId || null,
        employeeName: employeeName || null,
        department: department || null,
        joinDate: joinDate || null,
        exitDate: exitDate || null,
        workingDays: workingDays || null,
        attendanceFreeze: attendanceFreeze || null,
        freezeReason: freezeReason || null,
        leavesTaken: leavesTaken || null,
        lopDays: lopDays || null,
        salaryChangeDate: salaryChangeDate || null,
        oldSalary: oldSalary || null,
        newSalary: newSalary || null,
        salaryChangeReason: salaryChangeReason || null,
        performanceRating: performanceRating || null,
        performanceComment: performanceComment || null,
        deductionType: deductionType || null,
        lopDeduction: lopDeduction || null,
        netPay: netPay || null,
        verifiedBy: verifiedBy || null,
        verificationDate: verificationDate || null,
        headApproval: headApproval || null,
        headApprovalDate: headApprovalDate || null,
        headSignature: headSignature || null,
        createdByEmail: req.user!.email,
      }
    });
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

// PUT /api/payroll/manual/:id
router.put('/manual/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { employeeId, employeeName, department, joinDate, exitDate, workingDays,
      attendanceFreeze, freezeReason, leavesTaken, lopDays, salaryChangeDate,
      oldSalary, newSalary, salaryChangeReason, performanceRating, performanceComment,
      deductionType, lopDeduction, netPay, verifiedBy, verificationDate,
      headApproval, headApprovalDate, headSignature } = req.body;

    const data: any = {};
    if (employeeId !== undefined) data.employeeId = employeeId;
    if (employeeName !== undefined) data.employeeName = employeeName;
    if (department !== undefined) data.department = department;
    if (joinDate !== undefined) data.joinDate = joinDate;
    if (exitDate !== undefined) data.exitDate = exitDate;
    if (workingDays !== undefined) data.workingDays = workingDays;
    if (attendanceFreeze !== undefined) data.attendanceFreeze = attendanceFreeze;
    if (freezeReason !== undefined) data.freezeReason = freezeReason;
    if (leavesTaken !== undefined) data.leavesTaken = leavesTaken;
    if (lopDays !== undefined) data.lopDays = lopDays;
    if (salaryChangeDate !== undefined) data.salaryChangeDate = salaryChangeDate;
    if (oldSalary !== undefined) data.oldSalary = oldSalary;
    if (newSalary !== undefined) data.newSalary = newSalary;
    if (salaryChangeReason !== undefined) data.salaryChangeReason = salaryChangeReason;
    if (performanceRating !== undefined) data.performanceRating = performanceRating;
    if (performanceComment !== undefined) data.performanceComment = performanceComment;
    if (deductionType !== undefined) data.deductionType = deductionType;
    if (lopDeduction !== undefined) data.lopDeduction = lopDeduction;
    if (netPay !== undefined) data.netPay = netPay;
    if (verifiedBy !== undefined) data.verifiedBy = verifiedBy;
    if (verificationDate !== undefined) data.verificationDate = verificationDate;
    if (headApproval !== undefined) data.headApproval = headApproval;
    if (headApprovalDate !== undefined) data.headApprovalDate = headApprovalDate;
    if (headSignature !== undefined) data.headSignature = headSignature;

    const record = await prisma.manualPayrollRecord.update({
      where: { id: String(req.params.id) },
      data,
    });
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/payroll/manual/:id
router.delete('/manual/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.manualPayrollRecord.delete({
      where: { id: String(req.params.id) }
    });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/payroll/manual/bulk
router.post('/manual/bulk', async (req: AuthRequest, res: Response, next) => {
  try {
    const records = req.body;
    if (!Array.isArray(records)) {
       res.status(400).json({ success: false, message: 'Expected an array' });
       return;
    }
    const created = await prisma.$transaction(
      records.map((r: any) => prisma.manualPayrollRecord.create({ data: { ...r, createdByEmail: req.user!.email } }))
    );
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

export default router;
