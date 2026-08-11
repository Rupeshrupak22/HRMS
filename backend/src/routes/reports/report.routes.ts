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
