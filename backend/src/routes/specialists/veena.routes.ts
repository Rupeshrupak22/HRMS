import { Router, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, authorize } from '../../middleware/auth';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE'));

function sanitizeRecruitment(item: any, userEmail: string) {
  return {
    candidateName: String(item.candidateName || item.employeeName || item.name || '').trim(),
    phoneNumber: item.phoneNumber ? String(item.phoneNumber).trim() : '',
    email: item.email ? String(item.email).trim() : '',
    college: item.college ? String(item.college).trim() : '',
    location: item.location ? String(item.location).trim() : '',
    source: item.source ? String(item.source).trim() : 'Direct',
    roleApplied: item.roleApplied ? String(item.roleApplied).trim() : 'Sales',
    recruiter: item.recruiter ? String(item.recruiter).trim() : 'Abbu Veena',
    applicationDate: item.applicationDate ? String(item.applicationDate).trim() : '',
    currentStage: item.currentStage ? String(item.currentStage).trim() : 'Application',
    status: item.status ? String(item.status).trim() : 'Pending',
    interviews: item.interviews ? String(item.interviews).trim() : '',
    selection: item.selection ? String(item.selection).trim() : '',
    offers: item.offers ? String(item.offers).trim() : '',
    joining: item.joining ? String(item.joining).trim() : '',
    onboarding: item.onboarding ? String(item.onboarding).trim() : '',
    offerRemarks: item.offerRemarks ? String(item.offerRemarks).trim() : (item.remarks ? String(item.remarks).trim() : ''),
    createdByEmail: userEmail,
  };
}

function sanitizeOnboarding(item: any, userEmail: string) {
  return {
    employeeId: item.employeeId ? String(item.employeeId).trim() : '',
    candidateName: String(item.candidateName || item.employeeName || item.name || '').trim(),
    phoneNumber: item.phoneNumber ? String(item.phoneNumber).trim() : '',
    email: item.email ? String(item.email).trim() : '',
    college: item.college ? String(item.college).trim() : '',
    location: item.location ? String(item.location).trim() : '',
    source: item.source ? String(item.source).trim() : 'Direct',
    roleApplied: item.roleApplied ? String(item.roleApplied).trim() : 'Sales',
    recruiter: item.recruiter ? String(item.recruiter).trim() : 'Abbu Veena',
    applicationDate: item.applicationDate ? String(item.applicationDate).trim() : (item.joiningDate ? String(item.joiningDate).trim() : ''),
    currentStage: item.currentStage ? String(item.currentStage).trim() : 'Joining',
    status: item.status ? String(item.status).trim() : 'Active',
    interviews: item.interviews ? String(item.interviews).trim() : '',
    selection: item.selection ? String(item.selection).trim() : 'Selected',
    offers: item.offers ? String(item.offers).trim() : '',
    joining: item.joining ? String(item.joining).trim() : 'Yes',
    onboarding: item.onboarding ? String(item.onboarding).trim() : 'Pending',
    offerRemarks: item.offerRemarks ? String(item.offerRemarks).trim() : (item.remarks ? String(item.remarks).trim() : ''),
    createdByEmail: userEmail,
  };
}

// User Rule: Candidates qualify for onboarding if recruitment status is one of: active, selected, joining, joined, onboarding
function qualifiesForOnboarding(statusRaw: string = ''): boolean {
  const status = (statusRaw || '').toLowerCase().trim();

  // If rejected or dropped, never qualify for onboarding
  if (status === 'rejected' || status === 'dropped' || status === 'dropout' || status === 'not selected') {
    return false;
  }

  const validStatuses = ['active', 'selected', 'joining', 'joined', 'onboarding'];
  return validStatuses.includes(status);
}

// Helper for pure Database CRUD
function crud(model: any) {
  return {
    getAll: async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const list = await model.findMany({ orderBy: { createdAt: 'desc' } });
        return res.json(list);
      } catch (e: any) {
        next(e);
      }
    },
    create: async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const dbCreated = await model.create({
          data: {
            ...req.body,
            createdByEmail: req.user?.email || 'veena@adyapan.com',
          },
        });
        return res.status(201).json(dbCreated);
      } catch (e: any) {
        next(e);
      }
    },
    update: async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const id = String(req.params.id);
        const updated = await model.update({
          where: { id },
          data: req.body,
        });
        return res.json(updated);
      } catch (e: any) {
        if (e?.code === 'P2025') {
          return res.status(404).json({ success: false, message: 'Record not found' });
        }
        next(e);
      }
    },
    remove: async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const id = String(req.params.id);
        await model.delete({ where: { id } });
        return res.json({ success: true });
      } catch (e: any) {
        if (e?.code === 'P2025') {
          return res.status(404).json({ success: false, message: 'Record not found' });
        }
        next(e);
      }
    },
  };
}

// ----------------------------------------------------
// ONBOARDING (prisma.onboardingTracker)
// ----------------------------------------------------
const onboardingCrud = crud(prisma.onboardingTracker);

// GET /onboarding
router.get('/onboarding', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const list = await prisma.onboardingTracker.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json(list || []);
  } catch (e: any) {
    next(e);
  }
});

// POST /onboarding (single)
router.post('/onboarding', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = sanitizeOnboarding(req.body, req.user!.email);
    if (!data.candidateName) {
      return res.status(400).json({ error: 'Candidate Name is required' });
    }
    const dbCreated = await prisma.onboardingTracker.create({ data });
    return res.status(201).json(dbCreated);
  } catch (e: any) {
    next(e);
  }
});

// POST /onboarding/bulk (fast batch import)
router.post('/onboarding/bulk', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rawItems: any[] = Array.isArray(req.body) ? req.body : (Array.isArray(req.body?.items) ? req.body.items : []);
    if (rawItems.length === 0) {
      return res.json({ success: true, count: 0, message: 'No items provided' });
    }

    const sanitized = rawItems
      .map((item) => sanitizeOnboarding(item, req.user!.email))
      .filter((item) => Boolean(item.candidateName));

    if (sanitized.length === 0) {
      return res.status(400).json({ error: 'No valid records with Candidate Name found' });
    }

    let count = 0;
    for (const item of sanitized) {
      try {
        await prisma.onboardingTracker.create({ data: item });
        count++;
      } catch (err) {
        console.error('Error inserting single onboarding record in bulk:', err);
      }
    }

    return res.status(201).json({ success: true, count, message: `Successfully saved ${count} record(s) to Database` });
  } catch (e: any) {
    next(e);
  }
});

router.put('/onboarding/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const data = sanitizeOnboarding(req.body, req.user!.email);
    const updated = await prisma.onboardingTracker.update({
      where: { id },
      data,
    });
    return res.json(updated);
  } catch (e: any) {
    next(e);
  }
});

router.delete('/onboarding/:id', onboardingCrud.remove);

// ----------------------------------------------------
// RECRUITMENT (prisma.recruitmentTracker)
// ----------------------------------------------------
const recruitmentCrud = crud(prisma.recruitmentTracker);

router.get('/recruitment', recruitmentCrud.getAll);

// POST recruitment with auto-sync to onboarding if status in Active, Selected, Joining, Joined, Onboarding
router.post('/recruitment', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = sanitizeRecruitment(req.body, req.user!.email);
    if (!data.candidateName) {
      return res.status(400).json({ error: 'Candidate Name is required' });
    }

    const dbCreated = await prisma.recruitmentTracker.create({ data });

    if (qualifiesForOnboarding(dbCreated.status || '')) {
      try {
        const normName = (dbCreated.candidateName || '').trim();
        const existing = await prisma.onboardingTracker.findFirst({
          where: { candidateName: { equals: normName, mode: 'insensitive' } },
        });
        if (!existing) {
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
              currentStage: dbCreated.currentStage || 'Joining',
              status: dbCreated.status || 'Active',
              interviews: dbCreated.interviews || '',
              selection: dbCreated.selection || 'Selected',
              offers: dbCreated.offers || '',
              joining: dbCreated.joining || 'Yes',
              onboarding: dbCreated.onboarding || 'Pending',
              offerRemarks: dbCreated.offerRemarks || '',
              createdByEmail: req.user!.email,
            },
          });
        }
      } catch (syncErr) {
        console.error('Auto-sync to onboarding on recruitment create failed:', syncErr);
      }
    }

    return res.status(201).json(dbCreated);
  } catch (e: any) {
    next(e);
  }
});

// POST /recruitment/bulk (fast batch import)
router.post('/recruitment/bulk', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rawItems: any[] = Array.isArray(req.body) ? req.body : (Array.isArray(req.body?.items) ? req.body.items : []);
    if (rawItems.length === 0) {
      return res.json({ success: true, count: 0, message: 'No items provided' });
    }

    const sanitized = rawItems
      .map((item) => sanitizeRecruitment(item, req.user!.email))
      .filter((item) => Boolean(item.candidateName));

    if (sanitized.length === 0) {
      return res.status(400).json({ error: 'No valid records with Candidate Name found' });
    }

    let count = 0;
    for (const item of sanitized) {
      try {
        const created = await prisma.recruitmentTracker.create({ data: item });
        count++;

        if (qualifiesForOnboarding(created.status || '')) {
          try {
            const normName = (created.candidateName || '').trim();
            const existing = await prisma.onboardingTracker.findFirst({
              where: { candidateName: { equals: normName, mode: 'insensitive' } },
            });
            if (!existing) {
              await prisma.onboardingTracker.create({
                data: {
                  employeeId: '',
                  candidateName: created.candidateName,
                  phoneNumber: created.phoneNumber || '',
                  email: created.email || '',
                  college: created.college || '',
                  location: created.location || '',
                  source: created.source || 'Recruitment',
                  roleApplied: created.roleApplied || 'Sales',
                  recruiter: created.recruiter || 'Abbu Veena',
                  applicationDate: created.applicationDate || '',
                  currentStage: created.currentStage || 'Joining',
                  status: created.status || 'Active',
                  interviews: created.interviews || '',
                  selection: created.selection || 'Selected',
                  offers: created.offers || '',
                  joining: created.joining || 'Yes',
                  onboarding: created.onboarding || 'Pending',
                  offerRemarks: created.offerRemarks || '',
                  createdByEmail: req.user!.email,
                },
              });
            }
          } catch {}
        }
      } catch (err) {
        console.error('Error inserting single recruitment record in bulk:', err);
      }
    }

    return res.status(201).json({ success: true, count, message: `Successfully saved ${count} candidate(s) to Database` });
  } catch (e: any) {
    next(e);
  }
});

// PUT recruitment with auto-sync to onboarding if updated to status in Active, Selected, Joining, Joined, Onboarding
router.put('/recruitment/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const data = sanitizeRecruitment(req.body, req.user!.email);
    const updated = await prisma.recruitmentTracker.update({
      where: { id },
      data,
    });

    if (qualifiesForOnboarding(updated.status || '')) {
      try {
        const normName = (updated.candidateName || '').trim();
        const existing = await prisma.onboardingTracker.findFirst({
          where: { candidateName: { equals: normName, mode: 'insensitive' } },
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
              currentStage: updated.currentStage || 'Joining',
              status: updated.status || 'Active',
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
    next(e);
  }
});

router.delete('/recruitment/:id', recruitmentCrud.remove);

// ----------------------------------------------------
// DROPOUTS & DAILY REPORTS
// ----------------------------------------------------
router.get('/dropouts', async (_req: AuthRequest, res: Response) => {
  try {
    const list = await prisma.dropoutRecord.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json(list || []);
  } catch (err: any) {
    console.error('Failed to fetch dropouts:', err?.message);
    return res.json([]);
  }
});

router.post('/dropouts', async (req: AuthRequest, res: Response) => {
  try {
    const created = await prisma.dropoutRecord.create({
      data: {
        candidateName: String(req.body.candidateName || req.body.name || '').trim(),
        employeeId: req.body.employeeId ? String(req.body.employeeId).trim() : '',
        role: req.body.role ? String(req.body.role).trim() : (req.body.roleApplied ? String(req.body.roleApplied).trim() : 'Sales'),
        source: req.body.source ? String(req.body.source).trim() : 'Direct',
        dropoutDate: req.body.dropoutDate ? String(req.body.dropoutDate).trim() : (req.body.date ? String(req.body.date).trim() : ''),
        dropoutStage: req.body.dropoutStage ? String(req.body.dropoutStage).trim() : (req.body.stage ? String(req.body.stage).trim() : 'Recruitment'),
        dropoutReason: req.body.dropoutReason ? String(req.body.dropoutReason).trim() : (req.body.reason ? String(req.body.reason).trim() : 'Dropped'),
        recruiter: req.body.recruiter ? String(req.body.recruiter).trim() : 'Abbu Veena',
        remarks: req.body.remarks ? String(req.body.remarks).trim() : '',
        createdByEmail: req.user?.email || 'veena@adyapan.com',
      },
    });
    return res.status(201).json(created);
  } catch (e: any) {
    console.error('Create dropout error:', e?.message);
    return res.status(500).json({ error: e?.message || 'Failed to create dropout record' });
  }
});

router.put('/dropouts/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const updated = await prisma.dropoutRecord.update({
      where: { id },
      data: req.body,
    });
    return res.json(updated);
  } catch (e: any) {
    console.error('Update dropout error:', e?.message);
    return res.status(500).json({ error: e?.message || 'Failed to update dropout record' });
  }
});

router.delete('/dropouts/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.dropoutRecord.delete({ where: { id } }).catch(async () => {
      // If not in DropoutRecord, update status in RecruitmentTracker
      await prisma.recruitmentTracker.update({ where: { id }, data: { status: 'Active' } }).catch(() => {});
    });
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to delete dropout record' });
  }
});

const dailyReports = crud(prisma.veenaDailyReport);
router.get('/daily-reports', dailyReports.getAll);
router.post('/daily-reports', dailyReports.create);
router.put('/daily-reports/:id', dailyReports.update);
router.delete('/daily-reports/:id', dailyReports.remove);

export default router;
