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
        const isVeenaLead = req.user!.email === 'veena@adyapan.com' || req.user!.specialization === 'ONBOARDING_HIRING' || ['SUPER_ADMIN', 'HR_ADMIN'].includes(req.user!.role);
        if (!isVeenaLead && req.user!.role === 'HR_EXECUTIVE') {
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

// Onboarding
const onboarding = crud(prisma.onboardingTracker, 'veena_onboarding.json');
router.delete('/onboarding/clear-all', async (req: AuthRequest, res: Response, next: any) => {
  try {
    saveDiskStore('veena_onboarding.json', []);
    if (prisma.onboardingTracker) {
      await prisma.onboardingTracker.deleteMany({});
    }
    res.json({ success: true, message: 'All onboarding records cleared' });
  } catch (e) { next(e); }
});
router.get('/onboarding', onboarding.getAll);
router.post('/onboarding', onboarding.create);
router.put('/onboarding/:id', onboarding.update);
router.delete('/onboarding/:id', onboarding.remove);

// Dropouts
const dropouts = crud(prisma.dropoutRecord, 'veena_dropouts.json');
router.get('/dropouts', dropouts.getAll);
router.post('/dropouts', dropouts.create);
router.put('/dropouts/:id', dropouts.update);
router.delete('/dropouts/:id', dropouts.remove);

// Daily Reports
const dailyReports = crud(prisma.veenaDailyReport, 'veena_daily_reports.json');
router.get('/daily-reports', dailyReports.getAll);
router.post('/daily-reports', dailyReports.create);
router.put('/daily-reports/:id', dailyReports.update);
router.delete('/daily-reports/:id', dailyReports.remove);

export default router;
