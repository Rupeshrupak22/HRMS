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

// Helper for CRUD with ownership tracking & dual disk persistence
function crud(model: any, filename: string) {
  return {
    getAll: async (req: AuthRequest, res: Response, next: any) => {
      try {
        const where: any = {};
        if (req.user!.role === 'HR_EXECUTIVE') {
          where.createdByEmail = req.user!.email;
        }
        let list: any[] = [];
        if (model) {
          list = await model.findMany({ where, orderBy: { createdAt: 'desc' } });
        }
        const diskList = getDiskStore(filename);
        const combined = [...list];
        for (const disk of diskList) {
          if (!combined.some((c) => (c.id || c._id) === (disk.id || disk._id))) {
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

// Retention
const retention = crud(prisma.retentionCase, 'aravind_retention.json');
router.get('/retention', retention.getAll);
router.post('/retention', retention.create);
router.put('/retention/:id', retention.update);
router.delete('/retention/:id', retention.remove);

// Resignation
const resignation = crud(prisma.resignationTracker, 'aravind_resignation.json');
router.get('/resignation', resignation.getAll);
router.post('/resignation', resignation.create);
router.put('/resignation/:id', resignation.update);
router.delete('/resignation/:id', resignation.remove);

// Abscond
const abscond = crud((prisma as any).abscondTracker, 'aravind_abscond.json');
router.get('/abscond', abscond.getAll);
router.post('/abscond', abscond.create);
router.put('/abscond/:id', abscond.update);
router.delete('/abscond/:id', abscond.remove);

// Exit Clearance
const exitClearance = crud(prisma.exitClearance, 'aravind_exit_clearance.json');
router.get('/exit-clearance', exitClearance.getAll);
router.post('/exit-clearance', exitClearance.create);
router.put('/exit-clearance/:id', exitClearance.update);
router.delete('/exit-clearance/:id', exitClearance.remove);

// F&F
const fnf = crud(prisma.fnFTracker, 'aravind_fnf.json');
router.get('/fnf', fnf.getAll);
router.post('/fnf', fnf.create);
router.put('/fnf/:id', fnf.update);
router.delete('/fnf/:id', fnf.remove);

// Complaints
const complaints = crud(prisma.employeeComplaint, 'aravind_complaints.json');
router.get('/complaints', complaints.getAll);
router.post('/complaints', complaints.create);
router.put('/complaints/:id', complaints.update);
router.delete('/complaints/:id', complaints.remove);

// Exit Interview
const exitInterview = crud(prisma.exitInterview, 'aravind_exit_interview.json');
router.get('/exit-interview', exitInterview.getAll);
router.post('/exit-interview', exitInterview.create);
router.put('/exit-interview/:id', exitInterview.update);
router.delete('/exit-interview/:id', exitInterview.remove);

// Daily Reports
const dailyReports = crud(prisma.aravindDailyReport, 'aravind_daily_reports.json');
router.get('/daily-reports', dailyReports.getAll);
router.post('/daily-reports', dailyReports.create);
router.put('/daily-reports/:id', dailyReports.update);
router.delete('/daily-reports/:id', dailyReports.remove);

export default router;
