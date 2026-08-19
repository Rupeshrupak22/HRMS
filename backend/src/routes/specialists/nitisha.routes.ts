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
        const isNitishaLead =
          req.user!.email === 'nitisha@adyapan.com' ||
          req.user!.specialization === 'DISCIPLINE_POSH' ||
          ['SUPER_ADMIN', 'HR_ADMIN'].includes(req.user!.role);
        if (!isNitishaLead && req.user!.role === 'HR_EXECUTIVE') {
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

// Performance
const performance = crud(prisma.employeePerformance);
router.get('/performance', performance.getAll);
router.post('/performance', performance.create);
router.post('/performance/bulk', async (req: AuthRequest, res: Response) => {
  try {
    const rawItems: any[] = Array.isArray(req.body) ? req.body : (Array.isArray(req.body?.items) ? req.body.items : []);
    if (rawItems.length === 0) {
      return res.json({ success: true, count: 0 });
    }
    let count = 0;
    for (const item of rawItems) {
      if (!item.employeeName && !item.employeeId) continue;
      try {
        await prisma.employeePerformance.create({
          data: {
            employeeName: String(item.employeeName || item.name || '').trim(),
            joiningDate: String(item.joiningDate || '').trim(),
            employeeId: String(item.employeeId || item.empId || '').trim(),
            department: String(item.department || 'Sales').trim(),
            designation: String(item.designation || 'Associate').trim(),
            kpi: String(item.kpi || '').trim(),
            dailyPerformance: String(item.dailyPerformance || '').trim(),
            weeklyPerformance: String(item.weeklyPerformance || '').trim(),
            monthlyPerformance: String(item.monthlyPerformance || '').trim(),
            dailyRevenue: String(item.dailyRevenue || '').trim(),
            weeklyRevenue: String(item.weeklyRevenue || '').trim(),
            monthlyRevenue: String(item.monthlyRevenue || '').trim(),
            pipCase: String(item.pipCase || 'No').trim(),
            reasonForPip: String(item.reasonForPip || '').trim(),
            performanceGap: String(item.performanceGap || '').trim(),
            currentPerformance: String(item.currentPerformance || '').trim(),
            improvementAction: String(item.improvementAction || '').trim(),
            managerRemark: String(item.managerRemark || '').trim(),
            finalRemark: String(item.finalRemark || '').trim(),
            furtherActions: String(item.furtherActions || '').trim(),
            createdByEmail: req.user!.email,
          },
        });
        count++;
      } catch (e) {
        console.error('Error inserting performance item:', e);
      }
    }
    return res.status(201).json({ success: true, count, message: `Successfully saved ${count} records` });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Bulk import failed' });
  }
});
router.put('/performance/:id', performance.update);
router.delete('/performance/:id', performance.remove);

// Employee Issues
const issues = crud(prisma.employeeIssue);
router.get('/issues', issues.getAll);
router.post('/issues', issues.create);
router.put('/issues/:id', issues.update);
router.delete('/issues/:id', issues.remove);

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
