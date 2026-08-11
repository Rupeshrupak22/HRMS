import { Router, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

const uploadSchema = z.object({
  employeeId: z.string().uuid().optional(),
  title: z.string().min(1),
  category: z.string().min(1),
  fileUrl: z.string().min(1),
  fileSize: z.number().optional(),
});

// GET /api/documents
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const where: any = {};
    if (req.user!.role === 'EMPLOYEE') {
      where.employeeId = req.user!.employeeId;
    } else if (req.query.employeeId) {
      where.employeeId = req.query.employeeId;
    }
    if (req.query.category) where.category = req.query.category;

    const docs = await prisma.employeeDocument.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: docs });
  } catch (err) {
    next(err);
  }
});

// POST /api/documents
router.post('/', validate(uploadSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const doc = await prisma.employeeDocument.create({
      data: {
        ...req.body,
        employeeId: req.body.employeeId || req.user!.employeeId!,
      },
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/documents/:id/verify
router.patch('/:id/verify', authorize('HR_ADMIN', 'HR_MANAGER'), async (req: AuthRequest, res: Response, next) => {
  try {
    const doc = await prisma.employeeDocument.update({
      where: { id: String(req.params.id) },
      data: { isVerified: true },
    });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.employeeDocument.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, data: { message: 'Document deleted' } });
  } catch (err) {
    next(err);
  }
});

export default router;
