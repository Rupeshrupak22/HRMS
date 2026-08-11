import { Router, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

const checkInSchema = z.object({
  employeeId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const markAttendanceSchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string(),
  status: z.string(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/attendance — list attendance records
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { employeeId, startDate, endDate, status } = req.query as any;
    const where: any = {};

    // Regular employees can only see their own attendance
    if (req.user!.role === 'EMPLOYEE') {
      where.employeeId = req.user!.employeeId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
    if (status) where.status = status;

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
      orderBy: { date: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance/check-in
router.post('/check-in', validate(checkInSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const employeeId = req.body.employeeId || req.user!.employeeId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (existing) {
      res.json({ success: true, data: existing, message: 'Already checked in' });
      return;
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        employeeId,
        date: today,
        checkInTime: new Date(),
        status: 'PRESENT',
        source: 'WEB',
        notes: req.body.notes,
      },
    });
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance/check-out
router.post('/check-out', async (req: AuthRequest, res: Response, next) => {
  try {
    const employeeId = req.user!.employeeId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId: employeeId!, date: today } },
    });

    if (!existing) {
      res.status(400).json({ success: false, message: 'No check-in found for today' });
      return;
    }

    const checkOut = new Date();
    const workHours = existing.checkInTime
      ? (checkOut.getTime() - existing.checkInTime.getTime()) / (1000 * 60 * 60)
      : 0;

    const record = await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { checkOutTime: checkOut, workHours: Math.round(workHours * 100) / 100 },
    });
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance/mark — admin mark attendance
router.post('/mark', authorize('HR_ADMIN', 'HR_MANAGER'), validate(markAttendanceSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { employeeId, date, status, checkInTime, checkOutTime, notes } = req.body;
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const record = await prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId, date: dateObj } },
      update: {
        status,
        checkInTime: checkInTime ? new Date(checkInTime) : undefined,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : undefined,
        notes,
      },
      create: {
        employeeId,
        date: dateObj,
        status,
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
        notes,
        source: 'ADMIN',
      },
    });
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

// GET /api/attendance/policy
router.get('/policy', async (_req, res: Response, next) => {
  try {
    const policy = await prisma.attendancePolicy.findFirst();
    res.json({ success: true, data: policy });
  } catch (err) {
    next(err);
  }
});

export default router;
