import { Router, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { NotFoundError, BadRequestError } from '../../lib/errors';
import { AuthRequest } from '../../types';

const router = Router();
router.use(authenticate);

const applyLeaveSchema = z.object({
  leaveTypeId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(1),
});

const updateStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

// GET /api/leave/types
router.get('/types', async (_req, res: Response, next) => {
  try {
    const types = await prisma.leaveType.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: types });
  } catch (err) {
    next(err);
  }
});

// GET /api/leave/balances
router.get('/balances', async (req: AuthRequest, res: Response, next) => {
  try {
    const employeeId = (req.query.employeeId as string) || req.user!.employeeId;
    if (!employeeId) {
      res.json({ success: true, data: [] });
      return;
    }
    const year = parseInt((req.query.year as string) || String(new Date().getFullYear()));

    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true },
    });
    res.json({ success: true, data: balances });
  } catch (err) {
    next(err);
  }
});

// GET /api/leave/requests
router.get('/requests', async (req: AuthRequest, res: Response, next) => {
  try {
    const where: any = {};

    if (req.user!.role === 'EMPLOYEE') {
      where.employeeId = req.user!.employeeId;
    } else if (req.query.employeeId) {
      where.employeeId = req.query.employeeId;
    }
    if (req.query.status) where.status = req.query.status;

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
});

// POST /api/leave/apply
router.post('/apply', validate(applyLeaveSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { leaveTypeId, startDate, endDate, reason } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (totalDays <= 0) throw new BadRequestError('End date must be after start date');

    // Check balance
    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId: req.user!.employeeId!, leaveTypeId, year: new Date().getFullYear() },
    });

    if (balance && (balance.totalDays - balance.usedDays) < totalDays) {
      throw new BadRequestError('Insufficient leave balance');
    }

    const request = await prisma.leaveRequest.create({
      data: {
        employeeId: req.user!.employeeId!,
        leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status: 'PENDING',
      },
      include: { leaveType: true },
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/leave/requests/:id/status
router.patch('/requests/:id/status', authorize('HR_ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE', 'MANAGER'), validate(updateStatusSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const leaveReq = await prisma.leaveRequest.findUnique({ where: { id: String(req.params.id) } });
    if (!leaveReq) throw new NotFoundError('Leave request not found');

    const { status, rejectionReason } = req.body;

    const updated = await prisma.leaveRequest.update({
      where: { id: String(req.params.id) },
      data: { status, approvedById: req.user!.id, rejectionReason },
    });

    // Update balance if approved
    if (status === 'APPROVED') {
      await prisma.leaveBalance.updateMany({
        where: {
          employeeId: leaveReq.employeeId,
          leaveTypeId: leaveReq.leaveTypeId,
          year: new Date().getFullYear(),
        },
        data: { usedDays: { increment: leaveReq.totalDays } },
      });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// GET /api/leave/holidays
router.get('/holidays', async (_req, res: Response, next) => {
  try {
    const holidays = await prisma.holiday.findMany({ orderBy: { date: 'asc' } });
    res.json({ success: true, data: holidays });
  } catch (err) {
    next(err);
  }
});

// POST /api/leave/bulk-import — import leave records from XLSX/CSV
router.post('/bulk-import', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { records } = req.body;
    if (!records || !Array.isArray(records) || records.length === 0) {
      res.status(400).json({ success: false, message: 'No records provided' });
      return;
    }

    let imported = 0;
    let skipped = 0;

    for (const record of records) {
      try {
        // Find employee by code
        const employee = await prisma.employee.findUnique({
          where: { employeeCode: record.employeeCode },
        });

        if (!employee) {
          skipped++;
          continue;
        }

        // Find leave type by name
        const leaveType = await prisma.leaveType.findFirst({
          where: { name: { contains: record.leaveType, mode: 'insensitive' } },
        });

        if (!leaveType) {
          skipped++;
          continue;
        }

        const startDate = new Date(record.startDate);
        const endDate = new Date(record.endDate);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        if (totalDays <= 0) {
          skipped++;
          continue;
        }

        const status = ['PENDING', 'APPROVED', 'REJECTED'].includes(record.status) ? record.status : 'PENDING';

        await prisma.leaveRequest.create({
          data: {
            employeeId: employee.id,
            leaveTypeId: leaveType.id,
            startDate,
            endDate,
            totalDays,
            reason: record.reason || 'Imported via XLSX',
            status,
            approvedById: status !== 'PENDING' ? req.user!.id : null,
          },
        });

        // Update balance if approved
        if (status === 'APPROVED') {
          await prisma.leaveBalance.updateMany({
            where: {
              employeeId: employee.id,
              leaveTypeId: leaveType.id,
              year: new Date().getFullYear(),
            },
            data: { usedDays: { increment: totalDays } },
          });
        }

        imported++;
      } catch {
        skipped++;
      }
    }

    res.json({ success: true, data: { imported, skipped, total: records.length } });
  } catch (err) {
    next(err);
  }
});

export default router;
