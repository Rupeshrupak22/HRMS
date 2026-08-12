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
const performance = crud(prisma.employeePerformance);
router.get('/performance', performance.getAll);
router.post('/performance', performance.create);
router.put('/performance/:id', performance.update);
router.delete('/performance/:id', performance.remove);

// Discipline
const discipline = crud(prisma.disciplineCase);
router.get('/discipline', discipline.getAll);
router.post('/discipline', discipline.create);
router.put('/discipline/:id', discipline.update);
router.delete('/discipline/:id', discipline.remove);

// Relations
const relations = crud(prisma.employeeRelation);
router.get('/relations', relations.getAll);
router.post('/relations', relations.create);
router.put('/relations/:id', relations.update);
router.delete('/relations/:id', relations.remove);

// Daily Reports
const dailyReports = crud(prisma.nitishaDailyReport);
router.get('/daily-reports', dailyReports.getAll);
router.post('/daily-reports', dailyReports.create);
router.put('/daily-reports/:id', dailyReports.update);
router.delete('/daily-reports/:id', dailyReports.remove);

export default router;
