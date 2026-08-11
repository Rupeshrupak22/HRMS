import { Router, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

const updateSettingsSchema = z.object({
  companyName: z.string().optional(),
  companyLogo: z.string().optional(),
  supportEmail: z.string().email().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
});

const createDesignationSchema = z.object({
  title: z.string().min(1),
  code: z.string().min(1),
  level: z.number().int().optional(),
  description: z.string().optional(),
});

const createTeamSchema = z.object({
  name: z.string().min(1),
  departmentId: z.string().uuid(),
  leaderId: z.string().uuid().optional(),
});

// GET /api/organization/settings
router.get('/settings', async (_req, res: Response, next) => {
  try {
    const settings = await prisma.organizationSetting.findFirst();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/organization/settings
router.patch('/settings', authorize('HR_ADMIN'), validate(updateSettingsSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const existing = await prisma.organizationSetting.findFirst();
    let settings;
    if (existing) {
      settings = await prisma.organizationSetting.update({ where: { id: existing.id }, data: req.body });
    } else {
      settings = await prisma.organizationSetting.create({ data: req.body });
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

// GET /api/organization/designations
router.get('/designations', async (_req, res: Response, next) => {
  try {
    const designations = await prisma.designation.findMany({ orderBy: { level: 'asc' } });
    res.json({ success: true, data: designations });
  } catch (err) {
    next(err);
  }
});

// POST /api/organization/designations
router.post('/designations', authorize('HR_ADMIN'), validate(createDesignationSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const designation = await prisma.designation.create({ data: req.body });
    res.status(201).json({ success: true, data: designation });
  } catch (err) {
    next(err);
  }
});

// GET /api/organization/teams
router.get('/teams', async (_req, res: Response, next) => {
  try {
    const teams = await prisma.team.findMany({
      include: { department: true, _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: teams });
  } catch (err) {
    next(err);
  }
});

// POST /api/organization/teams
router.post('/teams', authorize('HR_ADMIN'), validate(createTeamSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const team = await prisma.team.create({ data: req.body });
    res.status(201).json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
});

// GET /api/organization/dashboard-stats
router.get('/dashboard-stats', async (_req, res: Response, next) => {
  try {
    const [totalEmployees, departments, pendingLeaves, openJobs] = await Promise.all([
      prisma.employee.count({ where: { status: { not: 'TERMINATED' } } }),
      prisma.department.count(),
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      prisma.jobOpening.count({ where: { status: 'OPEN' } }),
    ]);

    res.json({
      success: true,
      data: { totalEmployees, departments, pendingLeaves, openJobs },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
