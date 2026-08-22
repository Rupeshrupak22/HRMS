import { Router, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

const resignationSchema = z.object({
  lastWorkingDay: z.string(),
  reason: z.string().min(1),
});

const fnfSchema = z.object({
  employeeId: z.string().uuid(),
  pendingSalary: z.number().optional(),
  leaveEncashment: z.number().optional(),
  bonusIncentives: z.number().optional(),
  deductions: z.number().optional(),
});

// GET /api/exit/resignations
router.get('/resignations', authorize('HR_ADMIN', 'HR_MANAGER', 'MANAGER'), async (_req, res: Response, next) => {
  try {
    const resignations = await prisma.resignation.findMany({
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true, departmentId: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: resignations });
  } catch (err) {
    next(err);
  }
});

// POST /api/exit/resign
router.post('/resign', validate(resignationSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    if (!req.user!.employeeId) {
      res.status(400).json({ success: false, message: 'No employee profile linked to this account' });
      return;
    }
    const resignation = await prisma.resignation.create({
      data: {
        employeeId: req.user!.employeeId,
        lastWorkingDay: new Date(req.body.lastWorkingDay),
        reason: req.body.reason,
      },
    });
    res.status(201).json({ success: true, data: resignation });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/exit/resignations/:id/approve
router.patch('/resignations/:id/approve', authorize('HR_ADMIN', 'HR_MANAGER', 'MANAGER'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { approvalType } = req.body; // 'manager' or 'hr'
    const data: any = {};
    if (approvalType === 'manager') data.managerApproval = true;
    if (approvalType === 'hr') data.hrApproval = true;

    // If both approved, update status
    const resignation = await prisma.resignation.findUnique({ where: { id: String(req.params.id) } });
    if (!resignation) throw new NotFoundError('Resignation not found');

    if ((approvalType === 'manager' && resignation.hrApproval) || (approvalType === 'hr' && resignation.managerApproval)) {
      data.status = 'APPROVED';
    } else {
      data.status = 'IN_REVIEW';
    }

    const updated = await prisma.resignation.update({ where: { id: String(req.params.id) }, data });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/exit/fnf
router.post('/fnf', authorize('HR_ADMIN'), validate(fnfSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { employeeId, pendingSalary = 0, leaveEncashment = 0, bonusIncentives = 0, deductions = 0 } = req.body;
    const netSettlement = pendingSalary + leaveEncashment + bonusIncentives - deductions;

    const fnf = await prisma.fnFSettlement.upsert({
      where: { employeeId },
      update: { pendingSalary, leaveEncashment, bonusIncentives, deductions, netSettlement },
      create: { employeeId, pendingSalary, leaveEncashment, bonusIncentives, deductions, netSettlement },
    });
    res.json({ success: true, data: fnf });
  } catch (err) {
    next(err);
  }
});

// GET /api/exit/fnf/:employeeId
router.get('/fnf/:employeeId', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response, next) => {
  try {
    // BOLA: employees can only view their own F&F
    if (req.user!.role === 'EMPLOYEE' && req.user!.employeeId !== String(req.params.employeeId)) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }
    const fnf = await prisma.fnFSettlement.findUnique({ where: { employeeId: String(req.params.employeeId) } });
    res.json({ success: true, data: fnf });
  } catch (err) {
    next(err);
  }
});

export default router;
