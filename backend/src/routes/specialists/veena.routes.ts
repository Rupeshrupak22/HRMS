import { Router, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

function crud(model: any) {
  return {
    getAll: async (req: AuthRequest, res: Response, next: any) => {
      try {
        const where: any = {};
        if (req.user!.role === 'HR_EXECUTIVE') {
          where.createdByEmail = req.user!.email;
        }
        res.json(await model.findMany({ where, orderBy: { createdAt: 'desc' } }));
      } catch (e) { next(e); }
    },
    create: async (req: AuthRequest, res: Response, next: any) => {
      try {
        res.status(201).json(await model.create({ data: { ...req.body, createdByEmail: req.user!.email } }));
      } catch (e) { next(e); }
    },
    update: async (req: AuthRequest, res: Response, next: any) => {
      try { res.json(await model.update({ where: { id: String(req.params.id) }, data: req.body })); } catch (e) { next(e); }
    },
    remove: async (req: AuthRequest, res: Response, next: any) => {
      try { await model.delete({ where: { id: String(req.params.id) } }); res.json({ success: true }); } catch (e) { next(e); }
    },
  };
}

// Onboarding
const onboarding = crud(prisma.onboardingTracker);
router.delete('/onboarding/clear-all', async (req: AuthRequest, res: Response, next: any) => {
  try {
    await prisma.onboardingTracker.deleteMany({});
    res.json({ success: true, message: 'All onboarding records cleared' });
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
