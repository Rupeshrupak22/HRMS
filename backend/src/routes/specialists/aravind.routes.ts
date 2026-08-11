import { Router, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// Helper for CRUD
function crud(model: any) {
  return {
    getAll: async (_req: any, res: Response, next: any) => {
      try { res.json(await model.findMany({ orderBy: { createdAt: 'desc' } })); } catch (e) { next(e); }
    },
    create: async (req: any, res: Response, next: any) => {
      try { res.status(201).json(await model.create({ data: req.body })); } catch (e) { next(e); }
    },
    update: async (req: any, res: Response, next: any) => {
      try { res.json(await model.update({ where: { id: String(req.params.id) }, data: req.body })); } catch (e) { next(e); }
    },
    remove: async (req: any, res: Response, next: any) => {
      try { await model.delete({ where: { id: String(req.params.id) } }); res.json({ success: true }); } catch (e) { next(e); }
    },
  };
}

// Retention
const retention = crud(prisma.retentionCase);
router.get('/retention', retention.getAll);
router.post('/retention', retention.create);
router.put('/retention/:id', retention.update);
router.delete('/retention/:id', retention.remove);

// Resignation
const resignation = crud(prisma.resignationTracker);
router.get('/resignation', resignation.getAll);
router.post('/resignation', resignation.create);
router.put('/resignation/:id', resignation.update);
router.delete('/resignation/:id', resignation.remove);

// Exit Clearance
const exitClearance = crud(prisma.exitClearance);
router.get('/exit-clearance', exitClearance.getAll);
router.post('/exit-clearance', exitClearance.create);
router.put('/exit-clearance/:id', exitClearance.update);
router.delete('/exit-clearance/:id', exitClearance.remove);

// F&F
const fnf = crud(prisma.fnFTracker);
router.get('/fnf', fnf.getAll);
router.post('/fnf', fnf.create);
router.put('/fnf/:id', fnf.update);
router.delete('/fnf/:id', fnf.remove);

// Complaints
const complaints = crud(prisma.employeeComplaint);
router.get('/complaints', complaints.getAll);
router.post('/complaints', complaints.create);
router.put('/complaints/:id', complaints.update);
router.delete('/complaints/:id', complaints.remove);

// Exit Interview
const exitInterview = crud(prisma.exitInterview);
router.get('/exit-interview', exitInterview.getAll);
router.post('/exit-interview', exitInterview.create);
router.put('/exit-interview/:id', exitInterview.update);
router.delete('/exit-interview/:id', exitInterview.remove);

// Daily Reports
const dailyReports = crud(prisma.aravindDailyReport);
router.get('/daily-reports', dailyReports.getAll);
router.post('/daily-reports', dailyReports.create);
router.put('/daily-reports/:id', dailyReports.update);
router.delete('/daily-reports/:id', dailyReports.remove);

export default router;
