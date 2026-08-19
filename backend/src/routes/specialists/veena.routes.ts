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

// ----------------------------------------------------
// ONBOARDING (prisma.onboardingTracker)
// ----------------------------------------------------
const onboardingCrud = crud(prisma.onboardingTracker);

// GET /onboarding with auto-fetch of candidates from Recruitment where stage=Joining & status=Active
router.get('/onboarding', async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    const isVeenaLead =
      req.user!.email === 'veena@adyapan.com' ||
      req.user!.specialization === 'ONBOARDING_HIRING' ||
      ['SUPER_ADMIN', 'HR_ADMIN'].includes(req.user!.role);
    if (!isVeenaLead && req.user!.role === 'HR_EXECUTIVE') {
      where.createdByEmail = req.user!.email;
    }

    // 1. Fetch current onboarding tracker records
    const onboardingList = await prisma.onboardingTracker.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch recruitment candidates that qualify (stage = joining & status = active)
    const recCandidates = await prisma.recruitmentTracker.findMany({
      where: {
        AND: [
          { currentStage: { equals: 'Joining', mode: 'insensitive' } },
          { status: { equals: 'Active', mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Auto-sync any qualifying recruitment candidate into onboarding if not already present
    const existingKeys = new Set(
      onboardingList.map((o) => `${(o.candidateName || '').toLowerCase().trim()}_${(o.phoneNumber || '').trim()}`)
    );

    const newlyCreated: any[] = [];
    for (const rec of recCandidates) {
      const key = `${(rec.candidateName || '').toLowerCase().trim()}_${(rec.phoneNumber || '').trim()}`;
      if (!existingKeys.has(key) && rec.candidateName) {
        try {
          const created = await prisma.onboardingTracker.create({
            data: {
              employeeId: '',
              candidateName: rec.candidateName,
              phoneNumber: rec.phoneNumber || '',
              email: rec.email || '',
              college: rec.college || '',
              location: rec.location || '',
              source: rec.source || 'Recruitment',
              roleApplied: rec.roleApplied || 'Sales',
              recruiter: rec.recruiter || 'Abbu Veena',
              applicationDate: rec.applicationDate || '',
              currentStage: 'Joining',
              status: 'Active',
              interviews: rec.interviews || '',
              selection: rec.selection || 'Selected',
              offers: rec.offers || '',
              joining: rec.joining || 'Yes',
              onboarding: rec.onboarding || 'Pending',
              offerRemarks: rec.offerRemarks || '',
              createdByEmail: rec.createdByEmail || req.user!.email,
            },
          });
          newlyCreated.push(created);
          existingKeys.add(key);
        } catch (err) {
          console.error('Failed to auto-sync recruitment candidate to onboarding:', err);
        }
      }
    }

    const finalList = [...newlyCreated, ...onboardingList];
    return res.json(finalList);
  } catch (e: any) {
    console.error('Database onboarding query error:', e?.message);
    return res.status(500).json({ error: 'Database query failed' });
  }
});

router.post('/onboarding', onboardingCrud.create);
router.put('/onboarding/:id', onboardingCrud.update);
router.delete('/onboarding/:id', onboardingCrud.remove);

// ----------------------------------------------------
// RECRUITMENT (prisma.recruitmentTracker)
// ----------------------------------------------------
const recruitmentCrud = crud(prisma.recruitmentTracker);

router.get('/recruitment', recruitmentCrud.getAll);

// POST recruitment with auto-sync to onboarding if stage=Joining & status=Active
router.post('/recruitment', async (req: AuthRequest, res: Response) => {
  try {
    const dbCreated = await prisma.recruitmentTracker.create({
      data: {
        ...req.body,
        createdByEmail: req.user!.email,
      },
    });

    const isJoining = (dbCreated.currentStage || '').toLowerCase().trim() === 'joining';
    const isActive = (dbCreated.status || '').toLowerCase().trim() === 'active';

    if (isJoining && isActive) {
      try {
        await prisma.onboardingTracker.create({
          data: {
            employeeId: '',
            candidateName: dbCreated.candidateName,
            phoneNumber: dbCreated.phoneNumber || '',
            email: dbCreated.email || '',
            college: dbCreated.college || '',
            location: dbCreated.location || '',
            source: dbCreated.source || 'Recruitment',
            roleApplied: dbCreated.roleApplied || 'Sales',
            recruiter: dbCreated.recruiter || 'Abbu Veena',
            applicationDate: dbCreated.applicationDate || '',
            currentStage: 'Joining',
            status: 'Active',
            interviews: dbCreated.interviews || '',
            selection: dbCreated.selection || 'Selected',
            offers: dbCreated.offers || '',
            joining: dbCreated.joining || 'Yes',
            onboarding: dbCreated.onboarding || 'Pending',
            offerRemarks: dbCreated.offerRemarks || '',
            createdByEmail: req.user!.email,
          },
        });
      } catch (syncErr) {
        console.error('Auto-sync to onboarding on recruitment create failed:', syncErr);
      }
    }

    return res.status(201).json(dbCreated);
  } catch (e: any) {
    console.error('Database recruitment create error:', e?.message);
    return res.status(500).json({ error: e?.message || 'Database create failed' });
  }
});

// PUT recruitment with auto-sync to onboarding if updated to stage=Joining & status=Active
router.put('/recruitment/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const updated = await prisma.recruitmentTracker.update({
      where: { id },
      data: req.body,
    });

    const isJoining = (updated.currentStage || '').toLowerCase().trim() === 'joining';
    const isActive = (updated.status || '').toLowerCase().trim() === 'active';

    if (isJoining && isActive) {
      try {
        const existing = await prisma.onboardingTracker.findFirst({
          where: {
            candidateName: updated.candidateName,
            phoneNumber: updated.phoneNumber || undefined,
          },
        });
        if (!existing) {
          await prisma.onboardingTracker.create({
            data: {
              employeeId: '',
              candidateName: updated.candidateName,
              phoneNumber: updated.phoneNumber || '',
              email: updated.email || '',
              college: updated.college || '',
              location: updated.location || '',
              source: updated.source || 'Recruitment',
              roleApplied: updated.roleApplied || 'Sales',
              recruiter: updated.recruiter || 'Abbu Veena',
              applicationDate: updated.applicationDate || '',
              currentStage: 'Joining',
              status: 'Active',
              interviews: updated.interviews || '',
              selection: updated.selection || 'Selected',
              offers: updated.offers || '',
              joining: updated.joining || 'Yes',
              onboarding: updated.onboarding || 'Pending',
              offerRemarks: updated.offerRemarks || '',
              createdByEmail: req.user!.email,
            },
          });
        }
      } catch (syncErr) {
        console.error('Auto-sync to onboarding on recruitment update failed:', syncErr);
      }
    }

    return res.json(updated);
  } catch (e: any) {
    console.error('Database recruitment update error:', e?.message);
    return res.status(500).json({ error: e?.message || 'Database update failed' });
  }
});

router.delete('/recruitment/:id', recruitmentCrud.remove);

// ----------------------------------------------------
// DROPOUTS & DAILY REPORTS
// ----------------------------------------------------
const dropouts = crud(prisma.dropoutRecord);
router.get('/dropouts', dropouts.getAll);
router.post('/dropouts', dropouts.create);
router.put('/dropouts/:id', dropouts.update);
router.delete('/dropouts/:id', dropouts.remove);

const dailyReports = crud(prisma.veenaDailyReport);
router.get('/daily-reports', dailyReports.getAll);
router.post('/daily-reports', dailyReports.create);
router.put('/daily-reports/:id', dailyReports.update);
router.delete('/daily-reports/:id', dailyReports.remove);

export default router;
