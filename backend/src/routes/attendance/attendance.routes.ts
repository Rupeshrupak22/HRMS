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
router.get('/today-stats', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'EMPLOYEE'), async (req: AuthRequest, res: Response, next) => {
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
      date: `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}-${String(r.date.getDate()).padStart(2, '0')}`,
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
        employeeId: r.employeeId,
        empId: r.employee?.employeeCode || r.employeeId || 'EMP-000',
        empName: r.employee ? `${r.employee.firstName || ''} ${r.employee.lastName || ''}`.trim() : 'Employee',
        role: metadata.role || r.employee?.user?.role || 'EMPLOYEE',
        department: metadata.department || r.employee?.department?.name || '-',
        designation: metadata.designation || r.employee?.designation?.title || '-',
        date: `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}-${String(r.date.getDate()).padStart(2, '0')}`,
        checkInTime: r.checkInTime ? r.checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
        checkOutTime: r.checkOutTime ? r.checkOutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
        workHours: r.workHours,
        status: r.status,
        lateMinutes: r.lateMinutes,
        source: r.source,
        notes: r.notes,
        summary: metadata.summary || (Object.keys(metadata).length > 0 ? metadata : undefined),
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance/bulk-import — ultra-fast batch import attendance from XLSX/CSV
router.post('/bulk-import', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'EMPLOYEE'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { records } = req.body;
    if (!records || !Array.isArray(records) || records.length === 0) {
      res.status(400).json({ success: false, message: 'No records provided' });
      return;
    }

    // 1. Preload all employees, departments, and designations into memory caches
    const allEmployees = await prisma.employee.findMany({
      select: { id: true, employeeCode: true, firstName: true, lastName: true, departmentId: true, designationId: true },
    });
    const empByCode = new Map<string, typeof allEmployees[0]>();
    const empByName = new Map<string, typeof allEmployees[0]>();
    for (const emp of allEmployees) {
      if (emp.employeeCode) {
        empByCode.set(emp.employeeCode.toUpperCase().trim(), emp);
      }
      const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase().trim();
      if (fullName) empByName.set(fullName, emp);
      if (emp.firstName) empByName.set(emp.firstName.toLowerCase().trim(), emp);
    }

    const allDepts = await prisma.department.findMany();
    const deptByName = new Map<string, typeof allDepts[0]>();
    for (const d of allDepts) {
      deptByName.set(d.name.toLowerCase().trim(), d);
    }

    const allDesigs = await prisma.designation.findMany();
    const desigByTitle = new Map<string, typeof allDesigs[0]>();
    for (const d of allDesigs) {
      desigByTitle.set(d.title.toLowerCase().trim(), d);
    }

    // 2. Identify missing employees, departments, and designations upfront
    const missingEmpCodes = new Set<string>();
    const missingDepts = new Set<string>();
    const missingDesigs = new Set<string>();

    for (const r of records) {
      const code = String(r.employeeCode || '').trim();
      const codeUpper = code.toUpperCase();
      const name = String(r.employeeName || '').toLowerCase().trim();
      const firstWord = name.split(' ')[0] || '';
      if (!empByCode.has(codeUpper) && !empByName.has(name) && !empByName.has(firstWord) && code) {
        missingEmpCodes.add(code);
      }
      if (r.department && r.department !== '-' && !deptByName.has(String(r.department).toLowerCase().trim())) {
        missingDepts.add(String(r.department).trim());
      }
      if (r.designation && r.designation !== '-' && !desigByTitle.has(String(r.designation).toLowerCase().trim())) {
        missingDesigs.add(String(r.designation).trim());
      }
    }

    // Create missing departments in parallel
    for (const dName of missingDepts) {
      try {
        const d = await prisma.department.create({
          data: {
            name: dName,
            code: (dName.slice(0, 4).toUpperCase() || 'DEPT') + Math.floor(Math.random() * 100),
          },
        });
        deptByName.set(dName.toLowerCase().trim(), d);
      } catch {}
    }

    // Create missing designations in parallel
    for (const dTitle of missingDesigs) {
      try {
        const d = await prisma.designation.create({
          data: {
            title: dTitle,
            code: (dTitle.slice(0, 4).toUpperCase() || 'DESIG') + Math.floor(Math.random() * 100),
          },
        });
        desigByTitle.set(dTitle.toLowerCase().trim(), d);
      } catch {}
    }

    // Create missing employees in parallel
    for (const empCode of missingEmpCodes) {
      try {
        const matchingRecord = records.find(r => String(r.employeeCode || '').trim() === empCode);
        const empName = matchingRecord ? String(matchingRecord.employeeName || '').trim() : '';
        const role = matchingRecord ? String(matchingRecord.role || '').trim() : '';
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
        const names = (empName || 'Employee').split(' ');
        const emp = await prisma.employee.create({
          data: {
            employeeCode: empCode,
            userId: user.id,
            firstName: names[0] || 'Employee',
            lastName: names.slice(1).join(' ') || '',
          },
        });
        empByCode.set(empCode.toUpperCase().trim(), emp);
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase().trim();
        empByName.set(fullName, emp);
      } catch {}
    }

    // 3. Prepare all records for atomic bulk insert
    let skipped = 0;
    const insertPayload: any[] = [];
    const touchedEmployees = new Set<string>();
    let minDateObj: Date | null = null;
    let maxDateObj: Date | null = null;

    for (const record of records) {
      const empCode = String(record.employeeCode || '').trim().toUpperCase();
      const empName = String(record.employeeName || '').toLowerCase().trim();
      const firstWord = empName.split(' ')[0] || '';

      const employee = empByCode.get(empCode) || empByName.get(empName) || empByName.get(firstWord);
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
      if (record.summary || record.department || record.designation || record.role) {
        notesToStore = JSON.stringify({
          ...(record.summary || {}),
          department: record.department || undefined,
          designation: record.designation || undefined,
          role: record.role || undefined,
          remarks: record.remarks || undefined,
        });
      }

      touchedEmployees.add(employee.id);
      insertPayload.push({
        employeeId: employee.id,
        date: dateObj,
        status: record.status || 'PRESENT',
        checkInTime,
        checkOutTime,
        workHours,
        notes: notesToStore,
        source: 'IMPORT',
      });
    }

    let imported = 0;
    if (insertPayload.length > 0 && minDateObj && maxDateObj) {
      // 1. Delete existing records for touched employees in this date range
      await prisma.attendanceRecord.deleteMany({
        where: {
          employeeId: { in: Array.from(touchedEmployees) },
          date: { gte: minDateObj, lte: maxDateObj },
        },
      });

      // 2. Ultra-fast bulk insert with createMany
      const result = await prisma.attendanceRecord.createMany({
        data: insertPayload,
        skipDuplicates: true,
      });
      imported = result.count;
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
    const { employeeId, employeeCode, employeeName, role, department, designation, month, records } = req.body;
    // month format: "2026-08"
    if ((!employeeCode && !employeeId) || !month || !records || !Array.isArray(records)) {
      res.status(400).json({ success: false, message: 'employeeCode/employeeId, month, and records are required' });
      return;
    }

    const empIdentifier = String(employeeId || employeeCode || '').trim();

    // 1. Find employee by ID, Code, CRM external ID, or Name
    let employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: empIdentifier },
          { employeeCode: empIdentifier },
          { employeeCode: empIdentifier.toUpperCase() },
          { employeeCode: empIdentifier.toLowerCase() },
          { crmExternalId: empIdentifier },
        ],
      },
    });

    // Fallback: match by name
    if (!employee && employeeName) {
      const firstWord = String(employeeName).trim().split(' ')[0];
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
      const safeCode = (employeeCode || empIdentifier || 'EMP').replace(/[^a-zA-Z0-9_-]/g, '');
      const email = `${safeCode.toLowerCase().replace(/[^a-z0-9]/g, '') || 'emp'}@adyapan.com`;
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
          employeeCode: safeCode,
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

    // Delete all existing records for this employee in the target month with full date window
    const [yearPart, monthPart] = month.split('-');
    const y = parseInt(yearPart, 10);
    const m = parseInt(monthPart, 10);
    const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    const searchStart = new Date(startDate.getTime() - (2 * 24 * 60 * 60 * 1000));
    const searchEnd = new Date(endDate.getTime() + (2 * 24 * 60 * 60 * 1000));

    const deleted = await prisma.attendanceRecord.deleteMany({
      where: {
        employeeId: employee.id,
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
        dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        dateObj = new Date(record.date);
      }
      dateObj.setHours(0, 0, 0, 0);

      let checkInTime: Date | null = null;
      let checkOutTime: Date | null = null;
      if (record.checkInTime) checkInTime = parseTimeString(record.checkInTime, dateObj);
      if (record.checkOutTime) checkOutTime = parseTimeString(record.checkOutTime, dateObj);

      const workHours = checkInTime && checkOutTime
        ? Math.round(((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)) * 100) / 100
        : 0;

      const notesToStore = record.remarks || null;

      insertData.push({
        employeeId: employee.id,
        date: dateObj,
        status: record.status || 'PRESENT',
        checkInTime,
        checkOutTime,
        workHours,
        notes: notesToStore,
        source: 'ADMIN',
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
router.delete('/monthly-delete', authorize('SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'EMPLOYEE'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { employeeId, employeeCode, employeeName, month } = req.body;
    if ((!employeeId && !employeeCode && !employeeName) || !month) {
      res.status(400).json({ success: false, message: 'employee identifier and month are required' });
      return;
    }

    const empIdentifiers = [
      employeeId ? String(employeeId).trim() : null,
      employeeCode ? String(employeeCode).trim() : null,
    ].filter(Boolean) as string[];

    const whereOr: any[] = [];
    for (const idf of empIdentifiers) {
      whereOr.push({ id: idf });
      whereOr.push({ employeeCode: idf });
      whereOr.push({ employeeCode: idf.toUpperCase() });
      whereOr.push({ employeeCode: idf.toLowerCase() });
      whereOr.push({ crmExternalId: idf });
    }

    if (employeeName) {
      const name = String(employeeName).trim();
      const firstWord = name.split(' ')[0];
      whereOr.push({ firstName: { contains: firstWord, mode: 'insensitive' } });
      whereOr.push({ lastName: { contains: firstWord, mode: 'insensitive' } });
    }

    const matchedEmployees = await prisma.employee.findMany({
      where: { OR: whereOr },
      select: { id: true },
    });

    const targetEmployeeIds = new Set<string>(matchedEmployees.map(e => e.id));
    for (const idf of empIdentifiers) {
      targetEmployeeIds.add(idf);
    }

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
        employeeId: { in: Array.from(targetEmployeeIds) },
        date: { gte: searchStart, lte: searchEnd },
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
    const { employeeId, employeeCode, date } = req.body;
    if ((!employeeId && !employeeCode) || !date) {
      res.status(400).json({ success: false, message: 'employeeId/employeeCode and date are required' });
      return;
    }

    const parts = String(date).split('T')[0].split('-');
    let dateObj: Date;
    if (parts.length === 3) {
      dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      dateObj = new Date(date);
    }
    dateObj.setHours(0, 0, 0, 0);

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
