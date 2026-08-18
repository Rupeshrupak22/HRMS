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
        const isAravindLead =
          req.user!.email === 'aravind@adyapan.com' ||
          req.user!.specialization === 'RESIGNATION_EXIT' ||
          ['SUPER_ADMIN', 'HR_ADMIN'].includes(req.user!.role);
        if (!isAravindLead && req.user!.role === 'HR_EXECUTIVE') {
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

// Abscond
const abscond = crud(prisma.abscondTracker);
router.get('/abscond', abscond.getAll);
router.post('/abscond', abscond.create);
router.put('/abscond/:id', abscond.update);
router.delete('/abscond/:id', abscond.remove);

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
