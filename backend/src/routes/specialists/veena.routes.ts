import { Router, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

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

// GET /onboarding with auto-sync of recruitment candidates having status in Active, Selected, Joining, Joined, Onboarding without duplicates
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
    const rawOnboarding = await prisma.onboardingTracker.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch all recruitment candidates
    const recCandidates = await prisma.recruitmentTracker.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Deduplicate existing onboarding records by candidate name
    const seenNames = new Set<string>();
    const deduplicatedOnboarding: any[] = [];
    const duplicateIdsToDelete: string[] = [];

    for (const item of rawOnboarding) {
      const normName = (item.candidateName || '').toLowerCase().replace(/\s+/g, ' ').trim();
      if (!normName) continue;
      if (seenNames.has(normName)) {
        duplicateIdsToDelete.push(item.id);
      } else {
        seenNames.add(normName);
        deduplicatedOnboarding.push(item);
      }
    }

    if (duplicateIdsToDelete.length > 0) {
      prisma.onboardingTracker
        .deleteMany({ where: { id: { in: duplicateIdsToDelete } } })
        .catch((e) => console.error('Error cleaning duplicate onboarding rows:', e));
    }

    // 3. Auto-sync any qualifying recruitment candidate that is not yet in onboarding
    const qualifyingRec = recCandidates.filter((r) => qualifiesForOnboarding(r.status || ''));

    for (const rec of qualifyingRec) {
      const normName = (rec.candidateName || '').toLowerCase().replace(/\s+/g, ' ').trim();
      if (!normName) continue;

      if (!seenNames.has(normName)) {
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
              currentStage: rec.currentStage || 'Joining',
              status: rec.status || 'Active',
              interviews: rec.interviews || '',
              selection: rec.selection || 'Selected',
              offers: rec.offers || '',
              joining: rec.joining || 'Yes',
              onboarding: rec.onboarding || 'Pending',
              offerRemarks: rec.offerRemarks || '',
              createdByEmail: rec.createdByEmail || req.user!.email,
            },
          });
          seenNames.add(normName);
          deduplicatedOnboarding.push(created);
        } catch (err) {
          console.error('Failed to auto-sync recruitment candidate to onboarding:', err);
        }
      }
    }

    return res.json(deduplicatedOnboarding);
  } catch (e: any) {
    console.error('Database onboarding query error:', e?.message);
    return res.status(500).json({ error: 'Database query failed' });
  }
});

// POST /onboarding (single)
router.post('/onboarding', async (req: AuthRequest, res: Response) => {
  try {
    const data = sanitizeOnboarding(req.body, req.user!.email);
    if (!data.candidateName) {
      return res.status(400).json({ error: 'Candidate Name is required' });
    }
    const dbCreated = await prisma.onboardingTracker.create({ data });
    return res.status(201).json(dbCreated);
  } catch (e: any) {
    console.error('Database onboarding create error:', e?.message);
    return res.status(500).json({ error: e?.message || 'Database create failed' });
  }
});

// POST /onboarding/bulk (fast batch import)
router.post('/onboarding/bulk', async (req: AuthRequest, res: Response) => {
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
    console.error('Database onboarding bulk error:', e?.message);
    return res.status(500).json({ error: e?.message || 'Database bulk import failed' });
  }
});

router.put('/onboarding/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const data = sanitizeOnboarding(req.body, req.user!.email);
    const updated = await prisma.onboardingTracker.update({
      where: { id },
      data,
    });
    return res.json(updated);
  } catch (e: any) {
    console.error('Database onboarding update error:', e?.message);
    return res.status(500).json({ error: e?.message || 'Database update failed' });
  }
});

router.delete('/onboarding/:id', onboardingCrud.remove);

// ----------------------------------------------------
// RECRUITMENT (prisma.recruitmentTracker)
// ----------------------------------------------------
const recruitmentCrud = crud(prisma.recruitmentTracker);

router.get('/recruitment', recruitmentCrud.getAll);

// POST recruitment with auto-sync to onboarding if status in Active, Selected, Joining, Joined, Onboarding
router.post('/recruitment', async (req: AuthRequest, res: Response) => {
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
    console.error('Database recruitment create error:', e?.message);
    return res.status(500).json({ error: e?.message || 'Database create failed' });
  }
});

// POST /recruitment/bulk (fast batch import)
router.post('/recruitment/bulk', async (req: AuthRequest, res: Response) => {
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
    console.error('Database recruitment bulk error:', e?.message);
    return res.status(500).json({ error: e?.message || 'Database bulk import failed' });
  }
});

// PUT recruitment with auto-sync to onboarding if updated to status in Active, Selected, Joining, Joined, Onboarding
router.put('/recruitment/:id', async (req: AuthRequest, res: Response) => {
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
