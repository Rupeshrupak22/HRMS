import { Router, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

// Helper for 100% pure Database CRUD with ownership handling
function crud(model: any) {
  return {
    getAll: async (req: AuthRequest, res: Response) => {
      try {
        const where: any = {};
        const isVeenaLead =
          req.user!.email === 'veena@adyapan.com' ||
          req.user!.specialization === 'ONBOARDING_HIRING' ||
          ['SUPER_ADMIN', 'HR_ADMIN'].includes(req.user!.role);
        if (!isVeenaLead && req.user!.role === 'HR_EXECUTIVE') {
          where.createdByEmail = req.user!.email;
        }
        const list = await model.findMany({ where, orderBy: { createdAt: 'desc' } });
        return res.json(list);
      } catch (e: any) {
        console.error('Database getAll error:', e?.message);
        return res.status(500).json({ error: 'Database query failed' });
      }
    },
    create: async (req: AuthRequest, res: Response) => {
      try {
        const dbCreated = await model.create({
          data: {
            ...req.body,
            createdByEmail: req.user!.email,
          },
        });
        return res.status(201).json(dbCreated);
      } catch (e: any) {
        console.error('Database create error:', e?.message);
        return res.status(500).json({ error: e?.message || 'Database create failed' });
      }
    },
    update: async (req: AuthRequest, res: Response) => {
      try {
        const id = String(req.params.id);
        const updated = await model.update({
          where: { id },
          data: req.body,
        });
        return res.json(updated);
      } catch (e: any) {
        console.error('Database update error:', e?.message);
        return res.status(500).json({ error: e?.message || 'Database update failed' });
      }
    },
    remove: async (req: AuthRequest, res: Response) => {
      try {
        const id = String(req.params.id);
        await model.delete({ where: { id } });
        return res.json({ success: true });
      } catch (e: any) {
        console.error('Database delete error:', e?.message);
        return res.status(500).json({ error: e?.message || 'Database delete failed' });
      }
    },
  };
}

// Onboarding
const onboarding = crud(prisma.onboardingTracker);
router.delete('/onboarding/clear-all', async (req: AuthRequest, res: Response, next: any) => {
  try {
    await prisma.onboardingTracker.deleteMany({});
    res.json({ success: true, message: 'All onboarding records cleared from Database' });
  } catch (e) { next(e); }
});
router.get('/onboarding', onboarding.getAll);
router.post('/onboarding', onboarding.create);
router.put('/onboarding/:id', onboarding.update);
router.delete('/onboarding/:id', onboarding.remove);

// Dropouts
const dropouts = crud(prisma.dropoutRecord);
router.get('/dropouts', dropouts.getAll);
router.post('/dropouts', dropouts.create);
router.put('/dropouts/:id', dropouts.update);
router.delete('/dropouts/:id', dropouts.remove);

// Daily Reports
const dailyReports = crud(prisma.veenaDailyReport);
router.get('/daily-reports', dailyReports.getAll);
router.post('/daily-reports', dailyReports.create);
router.put('/daily-reports/:id', dailyReports.update);
router.delete('/daily-reports/:id', dailyReports.remove);

export default router;
