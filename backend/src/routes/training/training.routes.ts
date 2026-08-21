import { Router, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

const createCourseSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  durationHrs: z.number().int().optional(),
  lmsUrl: z.string().optional(),
});

const enrollSchema = z.object({
  courseId: z.string().uuid(),
  employeeId: z.string().uuid().optional(),
});

const updateProgressSchema = z.object({
  progressPct: z.number().min(0).max(100),
  status: z.string().optional(),
});

// GET /api/training/courses
router.get('/courses', async (_req, res: Response, next) => {
  try {
    const courses = await prisma.trainingCourse.findMany({
      include: { _count: { select: { enrollments: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: courses });
  } catch (err) {
    next(err);
  }
});

// POST /api/training/courses
router.post('/courses', authorize('HR_ADMIN', 'HR_MANAGER'), validate(createCourseSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const course = await prisma.trainingCourse.create({ data: req.body });
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
});

// POST /api/training/enroll
router.post('/enroll', validate(enrollSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const employeeId = req.body.employeeId || req.user!.employeeId;
    if (!employeeId) {
      res.status(400).json({ success: false, message: 'No employee profile linked to this account' });
      return;
    }
    const enrollment = await prisma.trainingEnrollment.create({
      data: {
        courseId: req.body.courseId,
        employeeId,
      },
    });
    res.status(201).json({ success: true, data: enrollment });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/training/enrollments/:id
router.patch('/enrollments/:id', validate(updateProgressSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const data: any = { progressPct: req.body.progressPct };
    if (req.body.status) data.status = req.body.status;
    if (req.body.progressPct >= 100) {
      data.status = 'COMPLETED';
      data.completedAt = new Date();
    }
    const enrollment = await prisma.trainingEnrollment.update({ where: { id: String(req.params.id) }, data });
    res.json({ success: true, data: enrollment });
  } catch (err) {
    next(err);
  }
});

// GET /api/training/my-enrollments
router.get('/my-enrollments', async (req: AuthRequest, res: Response, next) => {
  try {
    if (!req.user!.employeeId) {
      res.json({ success: true, data: [] });
      return;
    }
    const enrollments = await prisma.trainingEnrollment.findMany({
      where: { employeeId: req.user!.employeeId },
      include: { course: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: enrollments });
  } catch (err) {
    next(err);
  }
});

export default router;
