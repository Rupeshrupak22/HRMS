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
router.get('/today-stats', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'EMPLOYEE'), async (req: AuthRequest, res: Response, next) => {
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
router.get('/all-logs', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'EMPLOYEE'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { startDate, endDate, status } = req.query as any;
    const where: any = {};

    if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
    if (status) where.status = status;

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
            designation: { select: { title: true } },
            user: { select: { role: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const formatted = records.map((r) => {
      let metadata: any = {};
      if (r.notes) {
        try {
          if (r.notes.startsWith('{') && r.notes.endsWith('}')) {
            metadata = JSON.parse(r.notes);
          }
        } catch {}
      }

      return {
        id: r.id,
        empId: r.employee?.employeeCode || r.employeeId || 'EMP-000',
        empName: r.employee ? `${r.employee.firstName || ''} ${r.employee.lastName || ''}`.trim() : 'Employee',
        role: metadata.role || r.employee?.user?.role || 'EMPLOYEE',
        department: metadata.department || r.employee?.department?.name || '-',
        designation: metadata.designation || r.employee?.designation?.title || '-',
        date: r.date.toISOString().split('T')[0],
        checkInTime: r.checkInTime ? r.checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
        checkOutTime: r.checkOutTime ? r.checkOutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
        workHours: r.workHours,
        status: r.status,
        lateMinutes: r.lateMinutes,
        source: r.source,
        notes: r.notes,
        summary: metadata.summary || (metadata.sickLeave !== undefined ? metadata : undefined),
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance/bulk-import — import attendance from XLSX/CSV
router.post('/bulk-import', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'EMPLOYEE'), async (req: AuthRequest, res: Response, next) => {
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
        const department = record.department ? String(record.department).trim() : '';
        const designation = record.designation ? String(record.designation).trim() : '';
        const role = record.role ? String(record.role).trim() : '';

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

        // 3. Auto provision employee with exact employeeCode if missing
        if (!employee && empCode) {
          const email = `${empCode.toLowerCase().replace(/[^a-z0-9]/g, '') || 'emp'}@adyapan.com`;
          let user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                passwordHash: '$2b$10$dummyhashplaceholderforattendancerecordcreation',
                role: role || 'EMPLOYEE',
              },
            });
          }
          const names = (empName || 'Employee').trim().split(' ');
          employee = await prisma.employee.create({
            data: {
              employeeCode: empCode,
              userId: user.id,
              firstName: names[0] || 'Employee',
              lastName: names.slice(1).join(' ') || '',
            },
          });
        }

        if (!employee) {
          skipped++;
          continue;
        }

        // 4. Update employee department / designation if passed in Excel
        const updateData: any = {};
        if (department && department !== '-') {
          let dept = await prisma.department.findFirst({ where: { name: { equals: department, mode: 'insensitive' } } });
          if (!dept) {
            dept = await prisma.department.create({
              data: {
                name: department,
                code: (department.slice(0, 4).toUpperCase() || 'DEPT') + Math.floor(Math.random() * 100),
              },
            });
          }
          updateData.departmentId = dept.id;
        }

        if (designation && designation !== '-') {
          let desig = await prisma.designation.findFirst({ where: { title: { equals: designation, mode: 'insensitive' } } });
          if (!desig) {
            desig = await prisma.designation.create({
              data: {
                title: designation,
                code: (designation.slice(0, 4).toUpperCase() || 'DESIG') + Math.floor(Math.random() * 100),
              },
            });
          }
          updateData.designationId = desig.id;
        }

        if (empName && (!employee.firstName || employee.firstName === 'Employee')) {
          const names = empName.split(' ');
          updateData.firstName = names[0] || employee.firstName;
          updateData.lastName = names.slice(1).join(' ') || employee.lastName;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.employee.update({
            where: { id: employee.id },
            data: updateData,
          });
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

        // Build metadata notes
        let notesToStore: string | null = record.remarks || null;
        if (record.summary || department || designation || role) {
          notesToStore = JSON.stringify({
            ...(record.summary || {}),
            department: department || undefined,
            designation: designation || undefined,
            role: role || undefined,
            remarks: record.remarks || undefined,
          });
        }

        await prisma.attendanceRecord.upsert({
          where: { employeeId_date: { employeeId: employee.id, date: dateObj } },
          update: {
            status: record.status || 'PRESENT',
            checkInTime,
            checkOutTime,
            workHours,
            notes: notesToStore,
            source: 'IMPORT',
          },
          create: {
            employeeId: employee.id,
            date: dateObj,
            status: record.status || 'PRESENT',
            checkInTime,
            checkOutTime,
            workHours,
            notes: notesToStore,
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

// PUT /api/attendance/monthly-update — update monthly attendance records from month view edit
router.put('/monthly-update', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'EMPLOYEE'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { employeeCode, employeeName, role, department, designation, month, records } = req.body;
    // month format: "2026-08"
    if (!employeeCode || !month || !records || !Array.isArray(records)) {
      res.status(400).json({ success: false, message: 'employeeCode, month, and records are required' });
      return;
    }

    // Find employee by code
    const empCode = String(employeeCode).trim();
    let employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { employeeCode: empCode },
          { employeeCode: empCode.toUpperCase() },
          { employeeCode: empCode.toLowerCase() },
        ],
      },
    });

    // Fallback: match by name
    if (!employee && employeeName) {
      const firstWord = String(employeeName).split(' ')[0];
      employee = await prisma.employee.findFirst({
        where: {
          OR: [
            { firstName: { contains: firstWord, mode: 'insensitive' } },
            { lastName: { contains: firstWord, mode: 'insensitive' } },
          ],
        },
      });
    }

    // Auto provision if new
    if (!employee) {
      const email = `${empCode.toLowerCase().replace(/[^a-z0-9]/g, '') || 'emp'}@adyapan.com`;
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            passwordHash: '$2b$10$dummyhashplaceholderforattendancerecordcreation',
            role: role || 'EMPLOYEE',
          },
        });
      }
      const names = (employeeName || 'Employee').trim().split(' ');
      employee = await prisma.employee.create({
        data: {
          employeeCode: empCode,
          userId: user.id,
          firstName: names[0] || 'Employee',
          lastName: names.slice(1).join(' ') || '',
        },
      });
    }

    // Update Employee details if provided
    if (employee) {
      const updateData: any = {};
      if (employeeName) {
        const names = String(employeeName).trim().split(' ');
        updateData.firstName = names[0] || employee.firstName;
        updateData.lastName = names.slice(1).join(' ');
      }
      if (department && department !== '-') {
        let dept = await prisma.department.findFirst({ where: { name: { equals: department, mode: 'insensitive' } } });
        if (!dept) {
          dept = await prisma.department.create({ data: { name: department, code: department.slice(0, 4).toUpperCase() + Math.floor(Math.random()*100) } });
        }
        updateData.departmentId = dept.id;
      }
      if (designation && designation !== '-') {
        let desig = await prisma.designation.findFirst({ where: { title: { equals: designation, mode: 'insensitive' } } });
        if (!desig) {
          desig = await prisma.designation.create({ data: { title: designation, code: designation.slice(0, 4).toUpperCase() + Math.floor(Math.random()*100) } });
        }
        updateData.designationId = desig.id;
      }
      if (Object.keys(updateData).length > 0) {
        await prisma.employee.update({ where: { id: employee.id }, data: updateData }).catch(() => {});
      }
      if (role && role !== '-' && employee.userId) {
        await prisma.user.update({ where: { id: employee.userId }, data: { role } }).catch(() => {});
      }
    }

    let updated = 0;
    let created = 0;

    for (const record of records) {
      try {
        const dateStr = record.date; // "2026-08-01"
        const parts = dateStr.split('-');
        const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        dateObj.setHours(0, 0, 0, 0);

        let checkInTime: Date | null = null;
        let checkOutTime: Date | null = null;
        if (record.checkInTime) checkInTime = parseTimeString(record.checkInTime, dateObj);
        if (record.checkOutTime) checkOutTime = parseTimeString(record.checkOutTime, dateObj);

        const workHours = checkInTime && checkOutTime
          ? Math.round(((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)) * 100) / 100
          : 0;

        const existing = await prisma.attendanceRecord.findUnique({
          where: { employeeId_date: { employeeId: employee.id, date: dateObj } },
        });

        if (existing) {
          await prisma.attendanceRecord.update({
            where: { id: existing.id },
            data: {
              status: record.status || 'PRESENT',
              checkInTime,
              checkOutTime,
              workHours,
              notes: record.remarks || existing.notes,
              source: 'ADMIN',
            },
          });
          updated++;
        } else {
          await prisma.attendanceRecord.create({
            data: {
              employeeId: employee.id,
              date: dateObj,
              status: record.status || 'PRESENT',
              checkInTime,
              checkOutTime,
              workHours,
              notes: record.remarks || null,
              source: 'ADMIN',
            },
          });
          created++;
        }
      } catch {
        // Skip individual record errors
      }
    }

    res.json({ success: true, data: { updated, created, total: records.length } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/attendance/monthly-delete — delete a whole month's records for an employee
router.delete('/monthly-delete', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'EMPLOYEE'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { employeeId, month } = req.body;
    // month format: "2026-08"
    if (!employeeId || !month) {
      res.status(400).json({ success: false, message: 'employeeId and month are required' });
      return;
    }

    const parts = month.split('-');
    const year = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const startDate = new Date(year, m - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(year, m, 0, 23, 59, 59, 999);

    const empIdentifier = String(employeeId).trim();

    // Find all matching employee records (by code or id)
    const employees = await prisma.employee.findMany({
      where: {
        OR: [
          { id: empIdentifier },
          { employeeCode: empIdentifier },
          { employeeCode: empIdentifier.toUpperCase() },
          { employeeCode: empIdentifier.toLowerCase() },
        ],
      },
    });

    const employeeIds = employees.map(e => e.id);
    if (!employeeIds.includes(empIdentifier)) {
      employeeIds.push(empIdentifier);
    }

    const result = await prisma.attendanceRecord.deleteMany({
      where: {
        employeeId: { in: employeeIds },
        date: { gte: startDate, lte: endDate },
      },
    });

    res.json({ success: true, data: { deleted: result.count } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/attendance/daily-delete — delete a specific date's record
router.delete('/daily-delete', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'EMPLOYEE'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { employeeId, date } = req.body;
    if (!employeeId || !date) {
      res.status(400).json({ success: false, message: 'employeeId and date are required' });
      return;
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    const empIdentifier = String(employeeId).trim();

    const employees = await prisma.employee.findMany({
      where: {
        OR: [
          { id: empIdentifier },
          { employeeCode: empIdentifier },
          { employeeCode: empIdentifier.toUpperCase() },
          { employeeCode: empIdentifier.toLowerCase() },
        ],
      },
    });

    const employeeIds = employees.map(e => e.id);
    if (!employeeIds.includes(empIdentifier)) {
      employeeIds.push(empIdentifier);
    }

    const result = await prisma.attendanceRecord.deleteMany({
      where: {
        employeeId: { in: employeeIds },
        date: { gte: dateObj, lt: nextDay },
      },
    });

    res.json({ success: true, data: { deleted: result.count } });
  } catch (err) {
    next(err);
  }
});

export default router;
