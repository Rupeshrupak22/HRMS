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

// POST /api/attendance/mark — admin/HR mark attendance
router.post('/mark', authorize('HR_ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'), validate(markAttendanceSchema), async (req: AuthRequest, res: Response, next) => {
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

// GET /api/attendance/today-stats — attendance stats for today
router.get('/today-stats', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE'), async (req: AuthRequest, res: Response, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalEmployees = await prisma.employee.count({ where: { status: { in: ['ACTIVE', 'PROBATION'] } } });
    const todayRecords = await prisma.attendanceRecord.findMany({ where: { date: today } });

    const present = todayRecords.filter((r) => r.status === 'PRESENT').length;
    const late = todayRecords.filter((r) => r.status === 'LATE').length;
    const halfDay = todayRecords.filter((r) => r.status === 'HALF_DAY').length;
    const onLeave = todayRecords.filter((r) => r.status === 'ON_LEAVE').length;
    const absent = Math.max(0, totalEmployees - present - late - halfDay - onLeave);

    res.json({
      success: true,
      data: { totalEmployees, present: present + late, absent, late, onLeave, halfDay },
    });
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

// GET /api/attendance/my-logs — employee's own logs
router.get('/my-logs', async (req: AuthRequest, res: Response, next) => {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) {
      res.json({ success: true, data: [] });
      return;
    }
    const records = await prisma.attendanceRecord.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    const formatted = records.map((r) => ({
      empId: req.user!.employeeCode || '',
      empName: `${req.user!.firstName} ${req.user!.lastName}`,
      date: r.date.toISOString().split('T')[0],
      checkInTime: r.checkInTime ? r.checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
      checkOutTime: r.checkOutTime ? r.checkOutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
      workHours: r.workHours,
      status: r.status,
      lateMinutes: r.lateMinutes,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// GET /api/attendance/all-logs — admin view all employee attendance
router.get('/all-logs', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { startDate, endDate, status } = req.query as any;
    const where: any = {};

    if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
    if (status) where.status = status;

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
      orderBy: { date: 'desc' },
      take: 200,
    });

    const formatted = records.map((r) => ({
      id: r.id,
      empId: r.employee?.employeeCode || r.employeeId || 'EMP-000',
      empName: r.employee ? `${r.employee.firstName || ''} ${r.employee.lastName || ''}`.trim() : 'Employee',
      date: r.date.toISOString().split('T')[0],
      checkInTime: r.checkInTime ? r.checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
      checkOutTime: r.checkOutTime ? r.checkOutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
      workHours: r.workHours,
      status: r.status,
      lateMinutes: r.lateMinutes,
      source: r.source,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance/bulk-import — import attendance from XLSX/CSV
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
        const empCode = String(record.employeeCode || '').trim();
        const empName = String(record.employeeName || '').trim();

        // 1. Find employee by code (exact, trimmed, or uppercase)
        let employee = await prisma.employee.findFirst({
          where: {
            OR: [
              { employeeCode: empCode },
              { employeeCode: empCode.toUpperCase() },
              { employeeCode: empCode.toLowerCase() },
            ],
          },
        });

        // 2. Fallback: match by name if code match fails
        if (!employee && empName) {
          const firstWord = empName.split(' ')[0];
          employee = await prisma.employee.findFirst({
            where: {
              OR: [
                { firstName: { contains: firstWord, mode: 'insensitive' } },
                { lastName: { contains: firstWord, mode: 'insensitive' } },
              ],
            },
          });
        }

        // 3. Fallback: pick any active employee if matching fails
        if (!employee) {
          employee = await prisma.employee.findFirst({
            where: { status: 'ACTIVE' },
          });
        }

        if (!employee) {
          skipped++;
          continue;
        }

        let dateObj: Date;
        if (record.date) {
          const parts = String(record.date).split('T')[0].split('-');
          if (parts.length === 3) {
            dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          } else {
            dateObj = new Date(record.date);
          }
        } else {
          dateObj = new Date();
        }
        dateObj.setHours(0, 0, 0, 0);

        // Parse check-in/out times
        let checkInTime: Date | null = null;
        let checkOutTime: Date | null = null;

        if (record.checkInTime) {
          checkInTime = parseTimeString(record.checkInTime, dateObj);
        }
        if (record.checkOutTime) {
          checkOutTime = parseTimeString(record.checkOutTime, dateObj);
        }

        const workHours = checkInTime && checkOutTime
          ? Math.round(((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)) * 100) / 100
          : 0;

        await prisma.attendanceRecord.upsert({
          where: { employeeId_date: { employeeId: employee.id, date: dateObj } },
          update: {
            status: record.status || 'PRESENT',
            checkInTime,
            checkOutTime,
            workHours,
            notes: record.remarks || null,
            source: 'IMPORT',
          },
          create: {
            employeeId: employee.id,
            date: dateObj,
            status: record.status || 'PRESENT',
            checkInTime,
            checkOutTime,
            workHours,
            notes: record.remarks || null,
            source: 'IMPORT',
          },
        });
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

// Helper: parse time strings like "09:30 AM", "09:30:00 AM", "09:30", or "18:30:00" into a Date on a given day
function parseTimeString(timeStr: string, baseDate: Date): Date | null {
  if (!timeStr || timeStr === '-' || timeStr === '') return null;

  const date = new Date(baseDate);
  const cleaned = timeStr.trim().toUpperCase();

  // Try "HH:MM AM/PM" or "HH:MM:SS AM/PM" format
  const ampmMatch = cleaned.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3];
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  // Try "HH:MM" or "HH:MM:SS" 24-hour format
  const h24Match = cleaned.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (h24Match) {
    date.setHours(parseInt(h24Match[1], 10), parseInt(h24Match[2], 10), 0, 0);
    return date;
  }

  return null;
}

export default router;
