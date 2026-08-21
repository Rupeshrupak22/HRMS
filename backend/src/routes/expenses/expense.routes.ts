import { Router, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

const createExpenseSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().positive(),
  expenseDate: z.string(),
  receiptUrl: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'REIMBURSED']),
});

// GET /api/expenses
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const where: any = {};
    if (req.user!.role === 'EMPLOYEE') {
      where.employeeId = req.user!.employeeId;
    } else if (req.query.employeeId) {
      where.employeeId = req.query.employeeId;
    }
    if (req.query.status) where.status = req.query.status;

    const claims = await prisma.expenseClaim.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: claims });
  } catch (err) {
    next(err);
  }
});

// POST /api/expenses
router.post('/', validate(createExpenseSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    if (!req.user!.employeeId) {
      res.status(400).json({ success: false, message: 'No employee profile linked to this account' });
      return;
    }
    const claim = await prisma.expenseClaim.create({
      data: {
        ...req.body,
        employeeId: req.user!.employeeId,
        expenseDate: new Date(req.body.expenseDate),
      },
    });
    res.status(201).json({ success: true, data: claim });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/expenses/:id/status
router.patch('/:id/status', authorize('HR_ADMIN', 'HR_MANAGER', 'MANAGER'), validate(updateStatusSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const data: any = { status: req.body.status };
    if (req.body.status === 'APPROVED') data.approvedAt = new Date();
    if (req.body.status === 'REIMBURSED') data.reimbursedAt = new Date();

    const claim = await prisma.expenseClaim.update({ where: { id: String(req.params.id) }, data });
    res.json({ success: true, data: claim });
  } catch (err) {
    next(err);
  }
});

export default router;
