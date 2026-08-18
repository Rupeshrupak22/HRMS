import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

function getDiskStore(filename: string): any[] {
  const dataDir = path.join(__dirname, '../../../data');
  const filePath = path.join(dataDir, filename);
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

function saveDiskStore(filename: string, list: any[]) {
  const dataDir = path.join(__dirname, '../../../data');
  const filePath = path.join(dataDir, filename);
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
  } catch {}
}

function crud(model: any, filename: string) {
  return {
    getAll: async (req: AuthRequest, res: Response, next: any) => {
      try {
        const where: any = {};
        const isNitishaLead = req.user!.email === 'nitisha@adyapan.com' || req.user!.specialization === 'DISCIPLINE_POSH' || ['SUPER_ADMIN', 'HR_ADMIN'].includes(req.user!.role);
        if (!isNitishaLead && req.user!.role === 'HR_EXECUTIVE') {
          where.createdByEmail = req.user!.email;
        }
        let list: any[] = [];
        if (model) {
          list = await model.findMany({ where, orderBy: { createdAt: 'desc' } });
        }
        const diskList = getDiskStore(filename);
        const combined = [...list];
        for (const disk of diskList) {
          if (!combined.some(c => (c.id || c._id) === (disk.id || disk._id))) {
            combined.push(disk);
          }
        }
        res.json(combined);
      } catch (e) {
        res.json(getDiskStore(filename));
      }
    },
    create: async (req: AuthRequest, res: Response, next: any) => {
      const newRecord = {
        id: `${filename.replace('.json', '')}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...req.body,
        createdByEmail: req.user!.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const currentDisk = getDiskStore(filename);
      saveDiskStore(filename, [newRecord, ...currentDisk.filter((r: any) => r.id !== newRecord.id)]);

      try {
        if (model) {
          const dbCreated = await model.create({ data: { ...req.body, createdByEmail: req.user!.email } });
          return res.status(201).json(dbCreated);
        }
      } catch (e) {
        console.warn(`Prisma create fallback to disk for ${filename}:`, (e as any)?.message);
      }
      return res.status(201).json(newRecord);
    },
    update: async (req: AuthRequest, res: Response, next: any) => {
      const id = String(req.params.id);
      const currentDisk = getDiskStore(filename);
      const updatedDisk = currentDisk.map((item: any) =>
        (item.id || item._id) === id ? { ...item, ...req.body, updatedAt: new Date().toISOString() } : item
      );
      saveDiskStore(filename, updatedDisk);

      try {
        if (model) {
          const updated = await model.update({ where: { id }, data: req.body });
          return res.json(updated);
        }
      } catch (e) {
        console.warn(`Prisma update fallback to disk for ${filename}:`, (e as any)?.message);
      }
      const found = updatedDisk.find((i: any) => (i.id || i._id) === id) || { id, ...req.body };
      return res.json(found);
    },
    remove: async (req: AuthRequest, res: Response, next: any) => {
      const id = String(req.params.id);
      const currentDisk = getDiskStore(filename);
      saveDiskStore(filename, currentDisk.filter((item: any) => (item.id || item._id) !== id));

      try {
        if (model) {
          await model.delete({ where: { id } });
        }
      } catch (e) {}
      return res.json({ success: true });
    },
  };
}

const performance = crud(prisma.employeePerformance, 'nitisha_performance.json');
router.get('/performance', performance.getAll);
router.post('/performance', performance.create);
router.put('/performance/:id', performance.update);
router.delete('/performance/:id', performance.remove);

// Employee Issues with dual DB + disk persistence
router.get('/issues', async (req: AuthRequest, res: Response) => {
  try {
    let dbList: any[] = [];
    if ((prisma as any).employeeIssue) {
      const where: any = {};
      const isNitishaLead = req.user!.email === 'nitisha@adyapan.com' || req.user!.specialization === 'DISCIPLINE_POSH' || ['SUPER_ADMIN', 'HR_ADMIN'].includes(req.user!.role);
      if (!isNitishaLead && req.user!.role === 'HR_EXECUTIVE') {
        where.createdByEmail = req.user!.email;
      }
      dbList = await (prisma as any).employeeIssue.findMany({ where, orderBy: { createdAt: 'desc' } });
    }
    const diskList = getDiskStore('nitisha_issues.json');
    const combined = [...dbList];
    for (const disk of diskList) {
      if (!combined.some(c => c.id === disk.id)) {
        combined.push(disk);
      }
    }
    res.json(combined);
  } catch {
    res.json(getDiskStore('nitisha_issues.json'));
  }
});

router.post('/issues', async (req: AuthRequest, res: Response) => {
  const newRecord = {
    id: `iss-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ...req.body,
    createdByEmail: req.user!.email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const currentDisk = getDiskStore('nitisha_issues.json');
  saveDiskStore('nitisha_issues.json', [newRecord, ...currentDisk.filter((r: any) => r.id !== newRecord.id)]);

  try {
    if ((prisma as any).employeeIssue) {
      const dbCreated = await (prisma as any).employeeIssue.create({ data: { ...req.body, createdByEmail: req.user!.email } });
      return res.status(201).json(dbCreated);
    }
  } catch (err: any) {
    console.warn('Prisma EmployeeIssue create fallback to disk:', err?.message);
  }
  return res.status(201).json(newRecord);
});

router.put('/issues/:id', async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const currentDisk = getDiskStore('nitisha_issues.json');
  const updatedDisk = currentDisk.map((item: any) =>
    item.id === id ? { ...item, ...req.body, updatedAt: new Date().toISOString() } : item
  );
  saveDiskStore('nitisha_issues.json', updatedDisk);

  try {
    if ((prisma as any).employeeIssue) {
      const updated = await (prisma as any).employeeIssue.update({ where: { id }, data: req.body });
      return res.json(updated);
    }
  } catch (err: any) {
    console.warn('Prisma EmployeeIssue update fallback to disk:', err?.message);
  }
  const found = updatedDisk.find((i: any) => i.id === id) || { id, ...req.body };
  return res.json(found);
});

router.delete('/issues/:id', async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const currentDisk = getDiskStore('nitisha_issues.json');
  saveDiskStore('nitisha_issues.json', currentDisk.filter((item: any) => item.id !== id));

  try {
    if ((prisma as any).employeeIssue) {
      await (prisma as any).employeeIssue.delete({ where: { id } });
    }
  } catch {}
  return res.json({ success: true });
});

// Discipline
const discipline = crud(prisma.disciplineCase, 'nitisha_discipline.json');
router.get('/discipline', discipline.getAll);
router.post('/discipline', discipline.create);
router.put('/discipline/:id', discipline.update);
router.delete('/discipline/:id', discipline.remove);

// Relations
const relations = crud(prisma.employeeRelation, 'nitisha_relations.json');
router.get('/relations', relations.getAll);
router.post('/relations', relations.create);
router.put('/relations/:id', relations.update);
router.delete('/relations/:id', relations.remove);

// Daily Reports
const dailyReports = crud(prisma.nitishaDailyReport, 'nitisha_daily_reports.json');
router.get('/daily-reports', dailyReports.getAll);
router.post('/daily-reports', dailyReports.create);
router.put('/daily-reports/:id', dailyReports.update);
router.delete('/daily-reports/:id', dailyReports.remove);

export default router;
