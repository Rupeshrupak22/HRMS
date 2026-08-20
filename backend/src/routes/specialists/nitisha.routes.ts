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
        const { id, _id, _isPlaceholder, createdAt, updatedAt, ...rest } = req.body;
        if (rest.dailyData && typeof rest.dailyData === 'object') {
          rest.dailyData = JSON.stringify(rest.dailyData);
        }
        if (rest.weeklyData && typeof rest.weeklyData === 'object') {
          rest.weeklyData = JSON.stringify(rest.weeklyData);
        }
        const dbCreated = await model.create({
          data: {
            ...rest,
            createdByEmail: req.user?.email || null,
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
        const { id: bodyId, _id, _isPlaceholder, createdAt, updatedAt, ...rest } = req.body;
        if (rest.dailyData && typeof rest.dailyData === 'object') {
          rest.dailyData = JSON.stringify(rest.dailyData);
        }
        if (rest.weeklyData && typeof rest.weeklyData === 'object') {
          rest.weeklyData = JSON.stringify(rest.weeklyData);
        }

        const existing = await model.findUnique({ where: { id } }).catch(() => null);
        if (existing) {
          const updated = await model.update({
            where: { id },
            data: rest,
          });
          return res.json(updated);
        } else {
          const created = await model.create({
            data: {
              ...rest,
              createdByEmail: req.user?.email || null,
            },
          });
          return res.status(201).json(created);
        }
      } catch (e: any) {
        console.error('Database update error:', e?.message);
        try {
          const { id: bodyId, _id, _isPlaceholder, createdAt, updatedAt, ...rest } = req.body;
          const created = await model.create({
            data: {
              ...rest,
              createdByEmail: req.user?.email || null,
            },
          });
          return res.status(201).json(created);
        } catch (err: any) {
          return res.status(500).json({ error: err?.message || 'Database update failed' });
        }
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

function sanitizePerformanceData(body: any) {
  const dailyDataStr = body.dailyData
    ? typeof body.dailyData === 'object'
      ? JSON.stringify(body.dailyData)
      : String(body.dailyData)
    : (body.employeeExplanation || null);

  const weeklyDataStr = body.weeklyData
    ? typeof body.weeklyData === 'object'
      ? JSON.stringify(body.weeklyData)
      : String(body.weeklyData)
    : (body.managerExplanation || null);

  const data: any = {};
  if (body.employeeName !== undefined) data.employeeName = String(body.employeeName || '').trim();
  if (body.joiningDate !== undefined) data.joiningDate = String(body.joiningDate || '').trim();
  if (body.employeeId !== undefined) data.employeeId = String(body.employeeId || '').trim();
  if (body.department !== undefined) data.department = String(body.department || 'Sales').trim();
  if (body.designation !== undefined) data.designation = String(body.designation || 'Associate').trim();
  if (body.kpi !== undefined) data.kpi = String(body.kpi || '').trim();
  if (body.dailyPerformance !== undefined) data.dailyPerformance = String(body.dailyPerformance || '').trim();
  if (body.weeklyPerformance !== undefined) data.weeklyPerformance = String(body.weeklyPerformance || '').trim();
  if (body.monthlyPerformance !== undefined) data.monthlyPerformance = String(body.monthlyPerformance || '').trim();
  if (body.dailyRevenue !== undefined) data.dailyRevenue = body.dailyRevenue ? String(body.dailyRevenue).trim() : null;
  if (body.weeklyRevenue !== undefined) data.weeklyRevenue = body.weeklyRevenue ? String(body.weeklyRevenue).trim() : null;
  if (body.monthlyRevenue !== undefined) data.monthlyRevenue = body.monthlyRevenue ? String(body.monthlyRevenue).trim() : null;
  if (body.pipCase !== undefined) data.pipCase = String(body.pipCase || 'No').trim();
  if (body.reasonForPip !== undefined) data.reasonForPip = body.reasonForPip ? String(body.reasonForPip).trim() : null;
  if (body.performanceGap !== undefined) data.performanceGap = body.performanceGap ? String(body.performanceGap).trim() : null;
  if (body.currentPerformance !== undefined) data.currentPerformance = body.currentPerformance ? String(body.currentPerformance).trim() : null;
  if (body.improvementAction !== undefined) data.improvementAction = body.improvementAction ? String(body.improvementAction).trim() : null;
  if (body.managerRemark !== undefined) data.managerRemark = body.managerRemark ? String(body.managerRemark).trim() : null;
  if (body.finalRemark !== undefined) data.finalRemark = body.finalRemark ? String(body.finalRemark).trim() : null;
  if (body.furtherActions !== undefined) data.furtherActions = body.furtherActions ? String(body.furtherActions).trim() : null;
  if (body.performanceMonth !== undefined) data.performanceMonth = body.performanceMonth ? String(body.performanceMonth).trim() : null;
  if (body.monthPerformance !== undefined) data.monthPerformance = body.monthPerformance ? String(body.monthPerformance).trim() : null;
  
  // Persist day-wise and week-wise JSON reliably in DB columns
  if (dailyDataStr !== null) data.employeeExplanation = dailyDataStr;
  if (weeklyDataStr !== null) data.managerExplanation = weeklyDataStr;

  return data;
}

function mapPerformanceOutput(item: any) {
  if (!item) return item;
  return {
    ...item,
    dailyData: item.employeeExplanation || (item as any).dailyData || '{}',
    weeklyData: item.managerExplanation || (item as any).weeklyData || '{}',
  };
}

// Performance Dedicated Handlers
router.get('/performance', async (req: AuthRequest, res: Response) => {
  try {
    const list = await prisma.employeePerformance.findMany({ orderBy: { createdAt: 'desc' } });
    const mapped = list.map(mapPerformanceOutput);
    return res.json(mapped);
  } catch (e: any) {
    console.error('Database getAll performance error:', e?.message);
    return res.status(500).json({ error: 'Database query failed' });
  }
});

router.post('/performance', async (req: AuthRequest, res: Response) => {
  try {
    const sanitized = sanitizePerformanceData(req.body);

    if (sanitized.employeeId && sanitized.performanceMonth) {
      const existing = await prisma.employeePerformance.findFirst({
        where: {
          employeeId: sanitized.employeeId,
          performanceMonth: sanitized.performanceMonth,
        },
      });

      if (existing) {
        const updated = await prisma.employeePerformance.update({
          where: { id: existing.id },
          data: sanitized,
        });
        return res.json(mapPerformanceOutput(updated));
      }
    }

    const created = await prisma.employeePerformance.create({
      data: {
        ...sanitized,
        createdByEmail: req.user?.email || null,
      },
    });
    return res.status(201).json(mapPerformanceOutput(created));
  } catch (e: any) {
    console.error('Performance create error:', e);
    return res.status(500).json({ error: e?.message || 'Create failed' });
  }
});

router.put('/performance/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const sanitized = sanitizePerformanceData(req.body);

    const existing = await prisma.employeePerformance.findUnique({ where: { id } }).catch(() => null);
    if (existing) {
      const updated = await prisma.employeePerformance.update({
        where: { id },
        data: sanitized,
      });
      return res.json(mapPerformanceOutput(updated));
    } else {
      if (sanitized.employeeId && sanitized.performanceMonth) {
        const byEmpAndMonth = await prisma.employeePerformance.findFirst({
          where: {
            employeeId: sanitized.employeeId,
            performanceMonth: sanitized.performanceMonth,
          },
        });

        if (byEmpAndMonth) {
          const updated = await prisma.employeePerformance.update({
            where: { id: byEmpAndMonth.id },
            data: sanitized,
          });
          return res.json(mapPerformanceOutput(updated));
        }
      }

      const created = await prisma.employeePerformance.create({
        data: {
          ...sanitized,
          createdByEmail: req.user?.email || null,
        },
      });
      return res.status(201).json(mapPerformanceOutput(created));
    }
  } catch (e: any) {
    console.error('Performance update error:', e);
    return res.status(500).json({ error: e?.message || 'Update failed' });
  }
});

router.delete('/performance/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.employeePerformance.delete({ where: { id } }).catch(() => {});
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Delete failed' });
  }
});

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
        const sanitized = sanitizePerformanceData(item);
        await prisma.employeePerformance.create({
          data: {
            ...sanitized,
            createdByEmail: req.user?.email || null,
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
