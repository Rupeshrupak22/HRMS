import { Router, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

const createJobSchema = z.object({
  title: z.string().min(1),
  code: z.string().min(1),
  departmentId: z.string().uuid(),
  description: z.string().min(1),
  requirements: z.string().min(1),
  vacancies: z.number().int().min(1).optional(),
  location: z.string().optional(),
  minExpYears: z.number().int().min(0).optional(),
  maxSalary: z.number().optional(),
});

const createCandidateSchema = z.object({
  jobId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  resumeUrl: z.string().optional(),
  skills: z.string().optional(),
  experienceYrs: z.number().optional(),
  currentCtc: z.number().optional(),
  expectedCtc: z.number().optional(),
  noticePeriodDays: z.number().int().optional(),
});

const updateCandidateStatusSchema = z.object({
  status: z.string().min(1),
});

// GET /api/recruitment/jobs
router.get('/jobs', async (_req, res: Response, next) => {
  try {
    const jobs = await prisma.jobOpening.findMany({
      include: { department: true, _count: { select: { candidates: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
});

// GET /api/recruitment/jobs/:id
router.get('/jobs/:id', async (req, res: Response, next) => {
  try {
    const job = await prisma.jobOpening.findUnique({
      where: { id: String(req.params.id) },
      include: { department: true, candidates: { orderBy: { createdAt: 'desc' } } },
    });
    if (!job) throw new NotFoundError('Job not found');
    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
});

// POST /api/recruitment/jobs
router.post('/jobs', authorize('HR_ADMIN', 'HR_MANAGER'), validate(createJobSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const job = await prisma.jobOpening.create({ data: req.body });
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
});

// POST /api/recruitment/candidates
router.post('/candidates', authorize('HR_ADMIN', 'HR_MANAGER'), validate(createCandidateSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const candidate = await prisma.candidate.create({ data: req.body });
    res.status(201).json({ success: true, data: candidate });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/recruitment/candidates/:id/status
router.patch('/candidates/:id/status', authorize('HR_ADMIN', 'HR_MANAGER'), validate(updateCandidateStatusSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const candidate = await prisma.candidate.update({
      where: { id: String(req.params.id) },
      data: { status: req.body.status },
    });
    res.json({ success: true, data: candidate });
  } catch (err) {
    next(err);
  }
});

// GET /api/recruitment/candidates
router.get('/candidates', async (req, res: Response, next) => {
  try {
    const where: any = {};
    if (req.query.jobId) where.jobId = req.query.jobId;
    if (req.query.status) where.status = req.query.status;

    const candidates = await prisma.candidate.findMany({
      where,
      include: { job: { select: { title: true, code: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: candidates });
  } catch (err) {
    next(err);
  }
});

export default router;
