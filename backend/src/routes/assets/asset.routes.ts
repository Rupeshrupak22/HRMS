import { Router, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

const createAssetSchema = z.object({
  assetTag: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
});

const assignAssetSchema = z.object({
  assetId: z.string().uuid(),
  employeeId: z.string().uuid(),
  condition: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/assets
router.get('/', async (_req, res: Response, next) => {
  try {
    const assets = await prisma.asset.findMany({
      include: { assignments: { where: { returnedAt: null }, include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: assets });
  } catch (err) {
    next(err);
  }
});

// GET /api/assets/:id
router.get('/:id', async (req, res: Response, next) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: String(req.params.id) },
      include: { assignments: { include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } }, orderBy: { assignedAt: 'desc' } } },
    });
    if (!asset) throw new NotFoundError('Asset not found');
    res.json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
});

// POST /api/assets
router.post('/', authorize('HR_ADMIN', 'HR_MANAGER'), validate(createAssetSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const data: any = { ...req.body };
    if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate);
    if (data.warrantyExpiry) data.warrantyExpiry = new Date(data.warrantyExpiry);
    const asset = await prisma.asset.create({ data });
    res.status(201).json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
});

// POST /api/assets/assign
router.post('/assign', authorize('HR_ADMIN', 'HR_MANAGER'), validate(assignAssetSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { assetId, employeeId, condition, notes } = req.body;
    const assignment = await prisma.assetAssignment.create({
      data: { assetId, employeeId, condition: condition || 'EXCELLENT', notes },
    });
    await prisma.asset.update({ where: { id: assetId }, data: { status: 'ASSIGNED' } });
    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
});

// POST /api/assets/return/:assignmentId
router.post('/return/:assignmentId', authorize('HR_ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response, next) => {
  try {
    const assignment = await prisma.assetAssignment.update({
      where: { id: String(req.params.assignmentId) },
      data: { returnedAt: new Date(), condition: req.body.condition || 'GOOD' },
    });
    await prisma.asset.update({ where: { id: assignment.assetId }, data: { status: 'AVAILABLE' } });
    res.json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
});

export default router;
