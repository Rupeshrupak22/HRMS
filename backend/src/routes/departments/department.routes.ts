import { Router, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  headId: z.string().uuid().optional(),
});

const updateSchema = createSchema.partial();

// GET /api/departments
router.get('/', async (_req, res: Response, next) => {
  try {
    const departments = await prisma.department.findMany({
      include: { _count: { select: { employees: true, teams: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: departments });
  } catch (err) {
    next(err);
  }
});

// GET /api/departments/:id
router.get('/:id', async (req, res: Response, next) => {
  try {
    const dept = await prisma.department.findUnique({
      where: { id: String(req.params.id) },
      include: { teams: true, employees: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } },
    });
    if (!dept) throw new NotFoundError('Department not found');
    res.json({ success: true, data: dept });
  } catch (err) {
    next(err);
  }
});

// POST /api/departments
router.post('/', authorize('HR_ADMIN'), validate(createSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const dept = await prisma.department.create({ data: req.body });
    res.status(201).json({ success: true, data: dept });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/departments/:id
router.patch('/:id', authorize('HR_ADMIN'), validate(updateSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const dept = await prisma.department.update({ where: { id: String(req.params.id) }, data: req.body });
    res.json({ success: true, data: dept });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/departments/:id
router.delete('/:id', authorize('HR_ADMIN'), async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.department.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, data: { message: 'Department deleted' } });
  } catch (err) {
    next(err);
  }
});

export default router;
