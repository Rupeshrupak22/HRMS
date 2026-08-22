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
    if (!employeeId) {
      res.status(400).json({ success: false, message: 'No employee profile linked to this account' });
      return;
    }
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
    if (!employeeId) {
      res.status(400).json({ success: false, message: 'No employee profile linked to this account' });
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
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
router.post('/mark', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE', 'EMPLOYEE'), validate(markAttendanceSchema), async (req: AuthRequest, res: Response, next) => {
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

    const isPresent = (s: string) => s === 'PRESENT' || s === 'P' || s === 'PR' || s === 'PRES' || s === '1' || s === 'WORK_FROM_HOME' || s === 'WFH';
    const isLate = (s: string) => s === 'LATE' || s === 'LATE_LOGIN' || s === 'LL';
    const isHalfDay = (s: string) => s === 'HALF_DAY' || s === 'HD' || s === '0.5';
    const isLOP = (s: string) => s === 'LOP' || s === 'LOSS OF PAY' || s === 'LOSS_OF_PAY';
    const isOnLeave = (s: string) => s === 'ON_LEAVE' || s === 'SICK_LEAVE' || s === 'SL' || s === 'CASUAL_LEAVE' || s === 'CL' || s === 'PAID_LEAVE' || s === 'PL' || s === 'EMERGENCY_LEAVE' || s === 'E_L' || s === 'LONG_LEAVE' || s === 'LLV' || s === 'PERSONAL_LEAVE' || s === 'PEL';

    const present = todayRecords.filter((r) => isPresent(r.status)).length;
    const late = todayRecords.filter((r) => isLate(r.status)).length;
    const halfDay = todayRecords.filter((r) => isHalfDay(r.status)).length;
    const lop = todayRecords.filter((r) => isLOP(r.status)).length;
    const onLeave = todayRecords.filter((r) => isOnLeave(r.status)).length;
    const explicitAbsent = todayRecords.filter((r) => r.status === 'ABSENT' || r.status === 'A').length;
    const absent = Math.max(explicitAbsent, totalEmployees - present - late - halfDay - onLeave - lop);

    res.json({
      success: true,
      data: { totalEmployees, present: present + late, absent, late, onLeave, halfDay, lop },
    });
  } catch (err) {
    next(err);
  }
});

// Safe formatters to prevent RangeError: Invalid time value / TypeError crashes
function safeFormatTime(d: any): string {
  if (!d) return '-';
  try {
    const dateObj = d instanceof Date ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return '-';
    return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '-';
  }
}

function safeFormatDate(d: any): string {
  if (!d) return '';
  try {
    const dateObj = d instanceof Date ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    const istMs = dateObj.getTime() + (5.5 * 60 * 60 * 1000);
    const istDate = new Date(istMs);
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

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
      empName: `${req.user!.firstName || ''} ${req.user!.lastName || ''}`.trim() || 'Employee',
      date: safeFormatDate(r.date),
      checkInTime: safeFormatTime(r.checkInTime),
      checkOutTime: safeFormatTime(r.checkOutTime),
      workHours: r.workHours || 0,
      status: r.status || 'PRESENT',
      lateMinutes: r.lateMinutes || 0,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// GET /api/attendance/all-logs — admin & employee view attendance
router.get('/all-logs', async (req: AuthRequest, res: Response, next) => {
  try {
    const { month, startDate, endDate, status, employeeId } = req.query as any;
    const where: any = {};

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yStr, mStr] = month.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);
      const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      where.date = {
        gte: new Date(start.getTime() - (6 * 60 * 60 * 1000)),
        lte: new Date(end.getTime() + (6 * 60 * 60 * 1000)),
      };
    } else {
      if (startDate) {
        const s = new Date(startDate);
        if (!isNaN(s.getTime())) {
          where.date = { ...where.date, gte: new Date(s.getTime() - (6 * 60 * 60 * 1000)) };
        }
      }
      if (endDate) {
        const e = new Date(endDate);
        if (!isNaN(e.getTime())) {
          where.date = { ...where.date, lte: new Date(e.getTime() + (6 * 60 * 60 * 1000)) };
        }
      }
    }
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;

    const records = await prisma.attendanceRecord.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    let formatted = records.map((r) => {
      let metadata: any = {};
      if (r.notes) {
        try {
          if (typeof r.notes === 'string' && r.notes.trim().startsWith('{')) {
            metadata = JSON.parse(r.notes);
          }
        } catch {}
      }

      const dateStr = safeFormatDate(r.date);
      const inStr = safeFormatTime(r.checkInTime);
      const outStr = safeFormatTime(r.checkOutTime);

      return {
        id: r.id,
        employeeId: r.employeeId,
        empId: metadata.empId || metadata.employeeCode || r.employeeId || 'EMP-000',
        empName: metadata.empName || metadata.employeeName || 'Employee',
        role: metadata.role || 'EMPLOYEE',
        department: metadata.department || '-',
        designation: metadata.designation || '-',
        date: dateStr,
        checkInTime: inStr,
        checkOutTime: outStr,
        workHours: r.workHours || 0,
        status: r.status || 'PRESENT',
        lateMinutes: r.lateMinutes || 0,
        source: r.source || 'WEB',
        notes: r.notes,
        summary: metadata.summary || (Object.keys(metadata).length > 0 ? metadata : undefined),
      };
    });

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      formatted = formatted.filter((r) => r.date.startsWith(month));
    }

    res.json({ success: true, data: formatted });
  } catch (err: any) {
    console.error('Error in /attendance/all-logs:', err);
    res.status(500).json({ success: false, message: 'Internal server error', error: err?.message });
  }
});

// POST /api/attendance/bulk-import — batch import attendance from XLSX/CSV
router.post('/bulk-import', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { records } = req.body;
    if (!records || !Array.isArray(records) || records.length === 0) {
      res.status(400).json({ success: false, message: 'No records provided' });
      return;
    }

    const insertPayload: any[] = [];
    const touchedEmployees = new Set<string>();
    let minDateObj: Date | null = null;
    let maxDateObj: Date | null = null;

    for (const record of records) {
      const empCode = String(record.employeeCode || record.empId || record.employeeId || 'EMP-000').trim();
      if (!empCode) continue;

      let dateObj: Date;
      if (record.date) {
        const parts = String(record.date).split('T')[0].split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          const d = parseInt(parts[2], 10);
          // Store at UTC 12:00:00 to prevent timezone shifts
          dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
        } else {
          dateObj = new Date(record.date);
        }
      } else {
        dateObj = new Date();
      }

      if (!minDateObj || dateObj < minDateObj) minDateObj = dateObj;
      if (!maxDateObj || dateObj > maxDateObj) maxDateObj = dateObj;

      let checkInTime: Date | null = null;
      let checkOutTime: Date | null = null;
      if (record.checkInTime) checkInTime = parseTimeString(record.checkInTime, dateObj);
      if (record.checkOutTime) checkOutTime = parseTimeString(record.checkOutTime, dateObj);

      const workHours = checkInTime && checkOutTime
        ? Math.round(((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)) * 100) / 100
        : 0;

      let notesToStore: string | null = record.remarks || null;
      notesToStore = JSON.stringify({
        ...(record.summary || {}),
        empId: empCode,
        empName: record.employeeName || record.empName || undefined,
        department: record.department || undefined,
        designation: record.designation || undefined,
        role: record.role || undefined,
        remarks: record.remarks || undefined,
      });

      touchedEmployees.add(empCode);
      insertPayload.push({
        employeeId: empCode,
        date: dateObj,
        status: record.status || 'PRESENT',
        checkInTime,
        checkOutTime,
        workHours,
        notes: notesToStore,
        source: 'EXCEL',
      });
    }

    let imported = 0;
    if (insertPayload.length > 0) {
      // Group dates by distinct year-month (e.g. "2026-08", "2026-07") so uploading August NEVER touches July
      const monthRanges = new Map<string, { start: Date; end: Date }>();
      for (const item of insertPayload) {
        const d = item.date as Date;
        const y = d.getUTCFullYear();
        const m = d.getUTCMonth();
        const key = `${y}-${m}`;
        if (!monthRanges.has(key)) {
          monthRanges.set(key, {
            start: new Date(Date.UTC(y, m, 1, 0, 0, 0, 0)),
            end: new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999)),
          });
        }
      }

      // Delete only the touched employees for the exact months being imported
      for (const range of monthRanges.values()) {
        await prisma.attendanceRecord.deleteMany({
          where: {
            employeeId: { in: Array.from(touchedEmployees) },
            date: { gte: range.start, lte: range.end },
          },
        }).catch(() => {});
      }

      // Fast bulk insert
      const result = await prisma.attendanceRecord.createMany({
        data: insertPayload,
        skipDuplicates: true,
      });
      imported = result.count;
    }

    res.json({ success: true, data: { imported, total: records.length } });
  } catch (err) {
    next(err);
  }
});

// Helper: parse time strings into a Date on a given day
function parseTimeString(timeStr: string, baseDate: Date): Date | null {
  if (!timeStr || timeStr === '-' || timeStr === '') return null;

  const date = new Date(baseDate);
  const cleaned = timeStr.trim().toUpperCase();

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

  const h24Match = cleaned.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (h24Match) {
    date.setHours(parseInt(h24Match[1], 10), parseInt(h24Match[2], 10), 0, 0);
    return date;
  }

  return null;
}

// PUT /api/attendance/monthly-update — update monthly attendance records from month view edit
router.put('/monthly-update', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { employeeId, employeeCode, originalEmployeeCode, employeeName, department, designation, role, month, records } = req.body;
    if ((!employeeCode && !employeeId) || !month || !records || !Array.isArray(records)) {
      res.status(400).json({ success: false, message: 'employeeCode/employeeId, month, and records are required' });
      return;
    }

    const currentEmpId = String(employeeCode || employeeId || '').trim();
    const origEmpId = String(originalEmployeeCode || employeeId || '').trim();

    const targetEmpIds = Array.from(new Set([currentEmpId, origEmpId, employeeId].filter(Boolean) as string[]));

    // Delete all existing records for this employee in the target month
    const [yearPart, monthPart] = month.split('-');
    const y = parseInt(yearPart, 10);
    const m = parseInt(monthPart, 10);
    const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    const searchStart = new Date(startDate.getTime() - (2 * 24 * 60 * 60 * 1000));
    const searchEnd = new Date(endDate.getTime() + (2 * 24 * 60 * 60 * 1000));

    const deleted = await prisma.attendanceRecord.deleteMany({
      where: {
        employeeId: { in: targetEmpIds },
        date: { gte: searchStart, lte: searchEnd },
      },
    });

    // Prepare fresh records for insertion
    const insertData: any[] = [];
    for (const record of records) {
      if (!record.date) continue;
      const parts = String(record.date).split('T')[0].split('-');
      let dateObj: Date;
      if (parts.length === 3) {
        const ry = parseInt(parts[0], 10);
        const rm = parseInt(parts[1], 10);
        const rd = parseInt(parts[2], 10);
        dateObj = new Date(Date.UTC(ry, rm - 1, rd, 12, 0, 0, 0));
      } else {
        dateObj = new Date(record.date);
      }

      let checkInTime: Date | null = null;
      let checkOutTime: Date | null = null;
      if (record.checkInTime) checkInTime = parseTimeString(record.checkInTime, dateObj);
      if (record.checkOutTime) checkOutTime = parseTimeString(record.checkOutTime, dateObj);

      const workHours = checkInTime && checkOutTime
        ? Math.round(((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)) * 100) / 100
        : 0;

      let notesToStore = record.remarks;
      if (!notesToStore) {
        notesToStore = JSON.stringify({
          empId: currentEmpId,
          empName: employeeName || undefined,
          department: department || undefined,
          designation: designation || undefined,
          role: role || undefined,
        });
      }

      insertData.push({
        employeeId: currentEmpId,
        date: dateObj,
        status: record.status || 'PRESENT',
        checkInTime,
        checkOutTime,
        workHours,
        notes: notesToStore,
        source: 'EXCEL',
      });
    }

    let created = 0;
    if (insertData.length > 0) {
      const result = await prisma.attendanceRecord.createMany({
        data: insertData,
        skipDuplicates: true,
      });
      created = result.count;
    }

    res.json({ success: true, data: { updated: deleted.count, created, total: records.length } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/attendance/monthly-delete — delete a whole month's records for an employee
router.delete('/monthly-delete', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { employeeId, employeeCode, originalEmployeeCode, month } = req.body;
    if ((!employeeId && !employeeCode) || !month) {
      res.status(400).json({ success: false, message: 'employee identifier and month are required' });
      return;
    }

    const targetEmpIds = Array.from(new Set([employeeId, employeeCode, originalEmployeeCode].filter(Boolean) as string[]));

    const [yearPart, monthPart] = month.split('-');
    const y = parseInt(yearPart, 10);
    const m = parseInt(monthPart, 10);
    
    // Inclusive range covering UTC and all timezones
    const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    const searchStart = new Date(startDate.getTime() - (2 * 24 * 60 * 60 * 1000));
    const searchEnd = new Date(endDate.getTime() + (2 * 24 * 60 * 60 * 1000));

    const result = await prisma.attendanceRecord.deleteMany({
      where: {
        employeeId: { in: targetEmpIds },
        date: { gte: searchStart, lte: searchEnd },
      },
    });

    res.json({ success: true, data: { deleted: result.count } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/attendance/daily-delete — delete a specific date's record
router.delete('/daily-delete', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { employeeId, employeeCode, date } = req.body;
    if ((!employeeId && !employeeCode) || !date) {
      res.status(400).json({ success: false, message: 'employeeId/employeeCode and date are required' });
      return;
    }

    const parts = String(date).split('T')[0].split('-');
    let dateObj: Date;
    if (parts.length === 3) {
      const ry = parseInt(parts[0], 10);
      const rm = parseInt(parts[1], 10);
      const rd = parseInt(parts[2], 10);
      dateObj = new Date(Date.UTC(ry, rm - 1, rd, 12, 0, 0, 0));
    } else {
      dateObj = new Date(date);
    }

    const searchStart = new Date(dateObj.getTime() - (24 * 60 * 60 * 1000));
    const searchEnd = new Date(dateObj.getTime() + (24 * 60 * 60 * 1000));

    const empIdentifier = String(employeeId || employeeCode).trim();
    const employees = await prisma.employee.findMany({
      where: {
        OR: [
          { id: empIdentifier },
          { employeeCode: empIdentifier },
          { employeeCode: empIdentifier.toUpperCase() },
          { employeeCode: empIdentifier.toLowerCase() },
          { crmExternalId: empIdentifier },
        ],
      },
      select: { id: true },
    });

    const employeeIds = new Set<string>(employees.map(e => e.id));
    employeeIds.add(empIdentifier);

    const result = await prisma.attendanceRecord.deleteMany({
      where: {
        employeeId: { in: Array.from(employeeIds) },
        date: { gte: searchStart, lte: searchEnd },
      },
    });

    res.json({ success: true, data: { deleted: result.count } });
  } catch (err) {
    next(err);
  }
});

export default router;
