import crypto from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma';
import { env } from '../../lib/env';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CrmEmployeeData {
  id: string;
  name: string;
  email: string;
  mobile: string;
  employeeId: string;
  designation: string;
  specialization?: string;
  joiningDate: string;
  role: string;
  isActive: boolean;
  avatarUrl?: string | null;
  teamName?: string;
  reportingManager?: string;
  department?: string;
  dateOfBirth?: string | null;
  gender?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  employmentType?: string;
  baseSalary?: number;
  hra?: number;
  conveyance?: number;
  specialAllow?: number;
  performPay?: number;
  pfDeduction?: number;
  profTax?: number;
  weekOff?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  panNumber?: string;
  uanNumber?: string;
  notes?: string;
  documents?: CrmDocument[];
  recentAttendance?: CrmAttendance[];
}

export interface CrmDocument {
  id: string;
  name: string;
  documentType: string;
  fileUrl: string;
  issuedAt?: string | null;
  expiresAt?: string | null;
  status: string;
  notes?: string;
}

export interface CrmAttendance {
  date: string;
  status: string;
  checkIn?: string | null;
  checkOut?: string | null;
  workMinutes: number;
}

export type WebhookEvent = 'employee.created' | 'employee.updated' | 'employee.deactivated';

// ─────────────────────────────────────────────────────────────────────────────
// Signature Verification
// ─────────────────────────────────────────────────────────────────────────────

export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader, 'utf8'),
      Buffer.from(expected, 'utf8')
    );
  } catch {
    return false;
  }
}

export function isTimestampValid(timestamp: string, maxAgeMs = 5 * 60 * 1000): boolean {
  try {
    const ts = new Date(timestamp).getTime();
    const now = Date.now();
    return Math.abs(now - ts) <= maxAgeMs;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Employee Upsert Logic
// ─────────────────────────────────────────────────────────────────────────────

function mapRole(crmRole: string): string {
  const roleMap: Record<string, string> = {
    'HR': 'HR_EXECUTIVE',
    'TEAM_LEADER': 'MANAGER',
    'SALES_MEMBER': 'EMPLOYEE',
    'TECH_LEAD': 'MANAGER',
    'TECH': 'EMPLOYEE',
    'OPERATIONAL_HEAD': 'HR_ADMIN',
  };
  return roleMap[crmRole] || crmRole || 'EMPLOYEE';
}

function mapEmploymentType(type?: string): string {
  if (!type) return 'FULL_TIME';
  const clean = type.toUpperCase().replace(/[\s-]+/g, '_');
  if (clean.includes('FULL') || clean === 'FT') return 'FULL_TIME';
  if (clean.includes('PART') || clean === 'PT') return 'PART_TIME';
  if (clean.includes('INTERN')) return 'INTERNSHIP';
  if (clean.includes('CONTRACT')) return 'CONTRACT';
  return 'FULL_TIME';
}

function safeDate(d?: string | null): Date | undefined {
  if (!d) return undefined;
  try {
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function generateSecurePassword(): string {
  return crypto.randomBytes(12).toString('base64url') + '!A1';
}

export async function upsertEmployeeFromCrm(data: CrmEmployeeData): Promise<{ action: 'created' | 'updated'; employeeId: string }> {
  const crmId = data.id;
  const email = data.email.toLowerCase().trim();

  // Split name
  const nameParts = (data.name || '').trim().split(' ');
  const firstName = nameParts[0] || 'Unknown';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Check if employee already exists by crmExternalId
  let existingEmployee = await prisma.employee.findUnique({
    where: { crmExternalId: crmId },
    include: { user: true },
  });

  // Also check by email if not found by CRM ID
  if (!existingEmployee) {
    const userByEmail = await prisma.user.findUnique({ where: { email } });
    if (userByEmail) {
      existingEmployee = await prisma.employee.findUnique({
        where: { userId: userByEmail.id },
        include: { user: true },
      });
    }
  }

  const mappedRole = mapRole(data.role);
  const employmentType = mapEmploymentType(data.employmentType);
  const joiningDate = safeDate(data.joiningDate) || new Date();
  const dateOfBirth = safeDate(data.dateOfBirth);
  const status = data.isActive ? 'ACTIVE' : 'INACTIVE';

  if (existingEmployee) {
    // UPDATE existing employee
    await prisma.user.update({
      where: { id: existingEmployee.userId },
      data: { role: mappedRole },
    });

    await prisma.employee.update({
      where: { id: existingEmployee.id },
      data: {
        crmExternalId: crmId,
        firstName,
        lastName,
        profilePhoto: data.avatarUrl || existingEmployee.profilePhoto,
        gender: data.gender || existingEmployee.gender,
        dateOfBirth: dateOfBirth || existingEmployee.dateOfBirth,
        mobileNumber: data.mobile || existingEmployee.mobileNumber,
        address: data.address || existingEmployee.address,
        employmentType,
        joiningDate,
        status,
        weekOff: data.weekOff || (existingEmployee as any).weekOff,
        specialization: data.specialization || (existingEmployee as any).specialization,
        emergencyContactName: data.emergencyContactName || existingEmployee.emergencyContactName,
        emergencyPhone: data.emergencyContactPhone || existingEmployee.emergencyPhone,
        bankName: data.bankName || existingEmployee.bankName,
        bankAccountNo: data.bankAccountNumber || existingEmployee.bankAccountNo,
        ifscCode: data.bankIfsc || existingEmployee.ifscCode,
        panNumber: data.panNumber || (existingEmployee as any).panNumber,
        uanNumber: data.uanNumber || (existingEmployee as any).uanNumber,
      },
    });

    // Update salary structure if salary data provided
    if (data.baseSalary && data.baseSalary > 0) {
      await upsertSalaryStructure(existingEmployee.id, data);
    }

    // Update documents
    if (data.documents && data.documents.length > 0) {
      await syncDocuments(existingEmployee.id, data.documents);
    }

    // Sync recent attendance
    if (data.recentAttendance && data.recentAttendance.length > 0) {
      await syncAttendance(existingEmployee.id, data.recentAttendance);
    }

    return { action: 'updated', employeeId: existingEmployee.id };
  } else {
    // CREATE new employee
    const hashedPassword = await bcrypt.hash(generateSecurePassword(), 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: mappedRole,
        isEmailVerified: true,
      },
    });

    const employeeCode = data.employeeId || `CRM${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

    const emp = await prisma.employee.create({
      data: {
        userId: user.id,
        crmExternalId: crmId,
        employeeCode,
        firstName,
        lastName,
        profilePhoto: data.avatarUrl || null,
        gender: data.gender || null,
        dateOfBirth,
        mobileNumber: data.mobile || null,
        address: data.address || null,
        employmentType,
        joiningDate,
        status,
        weekOff: data.weekOff || null,
        specialization: data.specialization || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyPhone: data.emergencyContactPhone || null,
        bankName: data.bankName || null,
        bankAccountNo: data.bankAccountNumber || null,
        ifscCode: data.bankIfsc || null,
        panNumber: data.panNumber || null,
        uanNumber: data.uanNumber || null,
      } as any,
    });

    // Create salary structure
    if (data.baseSalary && data.baseSalary > 0) {
      await upsertSalaryStructure(emp.id, data);
    }

    // Create default leave balances
    const leaveTypes = await prisma.leaveType.findMany();
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: emp.id,
          leaveTypeId: lt.id,
          totalDays: lt.annualDays,
          usedDays: 0,
          year: new Date().getFullYear(),
        },
      });
    }

    // Sync documents
    if (data.documents && data.documents.length > 0) {
      await syncDocuments(emp.id, data.documents);
    }

    // Sync attendance
    if (data.recentAttendance && data.recentAttendance.length > 0) {
      await syncAttendance(emp.id, data.recentAttendance);
    }

    return { action: 'created', employeeId: emp.id };
  }
}

export async function deactivateEmployeeFromCrm(crmId: string): Promise<void> {
  const emp = await prisma.employee.findUnique({ where: { crmExternalId: crmId } });
  if (emp) {
    await prisma.employee.update({
      where: { id: emp.id },
      data: { status: 'INACTIVE' },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Salary Structure Upsert
// ─────────────────────────────────────────────────────────────────────────────

async function upsertSalaryStructure(employeeId: string, data: CrmEmployeeData) {
  const baseSalary = data.baseSalary || 0;
  const hra = data.hra || baseSalary * 0.4;
  const conveyance = data.conveyance || 2000;
  const specialAllowance = data.specialAllow || 0;
  const pfDeduction = data.pfDeduction || 0;
  const ptDeduction = data.profTax || 0;
  const ctc = (baseSalary + hra + conveyance + specialAllowance + (data.performPay || 0)) * 12;

  const existing = await prisma.salaryStructure.findUnique({ where: { employeeId } });

  if (existing) {
    await prisma.salaryStructure.update({
      where: { employeeId },
      data: {
        ctc,
        basicSalary: baseSalary,
        hra,
        conveyance,
        specialAllowance,
        pfDeduction,
        ptDeduction,
      },
    });
  } else {
    await prisma.salaryStructure.create({
      data: {
        employeeId,
        ctc,
        basicSalary: baseSalary,
        hra,
        conveyance,
        specialAllowance,
        pfDeduction,
        ptDeduction,
        tdsDeduction: 0,
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Document Sync (store URL references)
// ─────────────────────────────────────────────────────────────────────────────

async function syncDocuments(employeeId: string, documents: CrmDocument[]) {
  for (const doc of documents) {
    // Build full URL for the document
    const fileUrl = doc.fileUrl.startsWith('http')
      ? doc.fileUrl
      : `${env.CRM_BACKEND_URL}${doc.fileUrl}`;

    // Check if document already exists (by title + employeeId combo)
    const existing = await prisma.employeeDocument.findFirst({
      where: {
        employeeId,
        title: doc.name,
        category: doc.documentType,
      },
    });

    if (existing) {
      await prisma.employeeDocument.update({
        where: { id: existing.id },
        data: {
          fileUrl,
          isVerified: doc.status === 'ACTIVE',
        },
      });
    } else {
      await prisma.employeeDocument.create({
        data: {
          employeeId,
          title: doc.name,
          category: doc.documentType,
          fileUrl,
          isVerified: doc.status === 'ACTIVE',
        },
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Attendance Sync
// ─────────────────────────────────────────────────────────────────────────────

async function syncAttendance(employeeId: string, records: CrmAttendance[]) {
  for (const rec of records) {
    const date = safeDate(rec.date);
    if (!date) continue;

    const checkIn = safeDate(rec.checkIn);
    const checkOut = safeDate(rec.checkOut);
    const workHours = (rec.workMinutes || 0) / 60;

    // Map CRM status to HRMS status
    const statusMap: Record<string, string> = {
      'PRESENT': 'PRESENT',
      'ABSENT': 'ABSENT',
      'LATE': 'LATE',
      'HALF_DAY': 'HALF_DAY',
      'WORK_FROM_HOME': 'WFH',
      'LEAVE': 'ON_LEAVE',
    };
    const status = statusMap[rec.status] || rec.status || 'PRESENT';

    try {
      await prisma.attendanceRecord.upsert({
        where: {
          employeeId_date: { employeeId, date },
        },
        update: {
          checkInTime: checkIn,
          checkOutTime: checkOut,
          workHours,
          status,
          source: 'CRM_SYNC',
        },
        create: {
          employeeId,
          date,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          workHours,
          status,
          source: 'CRM_SYNC',
        },
      });
    } catch (err) {
      // Skip duplicates or constraint violations silently
      console.warn(`Attendance sync skipped for ${employeeId} on ${rec.date}:`, (err as Error).message);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Full / Incremental Sync from CRM Pull API
// ─────────────────────────────────────────────────────────────────────────────

export async function runCrmSync(options?: { updatedSince?: string; includeInactive?: boolean }): Promise<{
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
}> {
  const result = { total: 0, created: 0, updated: 0, failed: 0, errors: [] as string[] };

  if (!env.CRM_BACKEND_URL || !env.CRM_SYNC_API_KEY) {
    throw new Error('CRM_BACKEND_URL and CRM_SYNC_API_KEY must be configured');
  }

  // Build URL
  const url = new URL(`${env.CRM_BACKEND_URL}/api/hrms-sync/employees`);
  if (options?.updatedSince) {
    url.searchParams.set('updatedSince', options.updatedSince);
  }
  if (options?.includeInactive) {
    url.searchParams.set('includeInactive', 'true');
  }

  // Fetch employees from CRM
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-HRMS-API-KEY': env.CRM_SYNC_API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`CRM API returned ${response.status}: ${errorText}`);
  }

  const json: any = await response.json();
  const employees: CrmEmployeeData[] = Array.isArray(json) ? json : (json.employees || json.data || []);
  result.total = employees.length;

  // Process each employee
  for (const empData of employees) {
    try {
      if (!empData.id || !empData.email) {
        result.failed++;
        result.errors.push(`Skipped employee with missing id/email: ${JSON.stringify({ id: empData.id, email: empData.email })}`);
        continue;
      }

      const { action } = await upsertEmployeeFromCrm(empData);
      if (action === 'created') result.created++;
      else result.updated++;

      // Log sync
      await prisma.crmSyncLog.create({
        data: {
          syncType: options?.updatedSince ? 'INCREMENTAL_SYNC' : 'FULL_SYNC',
          event: `employee.${action}`,
          crmEmployeeId: empData.id,
          status: 'SUCCESS',
        },
      });
    } catch (err) {
      result.failed++;
      const errMsg = (err as Error).message;
      result.errors.push(`Failed to sync ${empData.email || empData.id}: ${errMsg}`);

      await prisma.crmSyncLog.create({
        data: {
          syncType: options?.updatedSince ? 'INCREMENTAL_SYNC' : 'FULL_SYNC',
          event: 'employee.sync_failed',
          crmEmployeeId: empData.id,
          status: 'FAILED',
          errorMessage: errMsg,
        },
      });
    }
  }

  // Update sync state
  await prisma.crmSyncState.upsert({
    where: { id: 'singleton' },
    update: {
      lastSyncAt: new Date(),
      lastSyncStatus: result.failed === 0 ? 'SUCCESS' : 'PARTIAL',
      totalSynced: { increment: result.created + result.updated },
      errorCount: { increment: result.failed },
    },
    create: {
      id: 'singleton',
      lastSyncAt: new Date(),
      lastSyncStatus: result.failed === 0 ? 'SUCCESS' : 'PARTIAL',
      totalSynced: result.created + result.updated,
      errorCount: result.failed,
    },
  });

  return result;
}
