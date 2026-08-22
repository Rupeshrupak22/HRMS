import { Router, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

const createGoalSchema = z.object({
  employeeId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  targetValue: z.number().optional(),
  unit: z.string().optional(),
  dueDate: z.string(),
});

const updateGoalSchema = z.object({
  currentValue: z.number().optional(),
  status: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

const createReviewSchema = z.object({
  employeeId: z.string().uuid(),
  cycleName: z.string().optional(),
  selfRating: z.number().min(1).max(5).optional(),
  selfComments: z.string().optional(),
  managerRating: z.number().min(1).max(5).optional(),
  managerComments: z.string().optional(),
  finalRating: z.number().optional(),
  recommendation: z.string().optional(),
  status: z.string().optional(),
});

// GET /api/performance/goals
router.get('/goals', async (req: AuthRequest, res: Response, next) => {
  try {
    // BOLA: employees can only view their own goals; admins can pass employeeId
    let employeeId: string | null = null;
    if (req.user!.role === 'EMPLOYEE') {
      employeeId = req.user!.employeeId;
    } else {
      employeeId = (req.query.employeeId as string) || req.user!.employeeId;
    }
    if (!employeeId) {
      res.json({ success: true, data: [] });
      return;
    }
    const goals = await prisma.goal.findMany({
      where: { employeeId },
      orderBy: { dueDate: 'asc' },
    });
    res.json({ success: true, data: goals });
  } catch (err) {
    next(err);
  }
});

// POST /api/performance/goals
router.post('/goals', validate(createGoalSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const data = {
      ...req.body,
      employeeId: req.body.employeeId || req.user!.employeeId,
      dueDate: new Date(req.body.dueDate),
    };
    const goal = await prisma.goal.create({ data });
    res.status(201).json({ success: true, data: goal });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/performance/goals/:id
router.patch('/goals/:id', validate(updateGoalSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const goal = await prisma.goal.update({ where: { id: String(req.params.id) }, data: req.body });
    res.json({ success: true, data: goal });
  } catch (err) {
    next(err);
  }
});

// GET /api/performance/reviews
router.get('/reviews', async (req: AuthRequest, res: Response, next) => {
  try {
    const where: any = {};
    if (req.user!.role === 'EMPLOYEE') {
      where.employeeId = req.user!.employeeId;
    } else if (req.query.employeeId) {
      where.employeeId = req.query.employeeId;
    }

    const reviews = await prisma.performanceReview.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
});

// POST /api/performance/reviews
router.post('/reviews', authorize('HR_ADMIN', 'HR_MANAGER', 'MANAGER'), validate(createReviewSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const review = await prisma.performanceReview.create({ data: req.body });
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
});

export default router;
