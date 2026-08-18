import { NextRequest, NextResponse } from 'next/server';

const CRM_API_ENDPOINT = 'https://adyapancrm.in/api/hr/employee';

function getAuthHeaders(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const url = new URL(request.url);
  const tokenQuery = url.searchParams.get('token') || '';

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  if (authHeader) {
    headers['Authorization'] = authHeader;
  } else if (tokenQuery) {
    headers['Authorization'] = tokenQuery.startsWith('Bearer ') ? tokenQuery : `Bearer ${tokenQuery}`;
  }

  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request);
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || '';
    const uploads = url.searchParams.get('uploads') || '';

    let targetUrl = CRM_API_ENDPOINT;
    if (id) {
      targetUrl = `${CRM_API_ENDPOINT}/${id}`;
      if (uploads) {
        targetUrl += `?uploads=${uploads}`;
      }
    }

    const crmResponse = await fetch(targetUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const data = await crmResponse.json().catch(() => null);

    if (!crmResponse.ok) {
      return NextResponse.json(
        data || { success: false, message: `CRM API responded with status ${crmResponse.status}` },
        { status: crmResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('CRM Proxy GET Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to connect to server' },
      { status: 500 }
    );
  }
}

const VALID_ROLES = [
  'EMPLOYEE',
  'ADMIN',
  'SUPER_ADMIN',
  'HR_ADMIN',
  'HR_EXECUTIVE',
  'HR',
  'MANAGER',
  'TEAM_LEAD',
  'TEAM_LEADER',
  'COUNSELOR',
  'TELECALLER',
  'DEVELOPER',
];

function sanitizeRole(role?: string) {
  const upper = String(role || '').trim().toUpperCase();
  return VALID_ROLES.includes(upper) ? upper : 'EMPLOYEE';
}

function safeIsoDate(d?: any): string | undefined {
  if (!d || d === '' || d === 'null' || d === 'undefined') return undefined;
  try {
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return undefined;
    return parsed.toISOString();
  } catch {
    return undefined;
  }
}

function sanitizeEmploymentType(type?: string) {
  const clean = String(type || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (clean.includes('FULL') || clean === 'FT') return 'FULL_TIME';
  if (clean.includes('PART') || clean === 'PT') return 'PART_TIME';
  if (clean.includes('INTERN')) return 'INTERNSHIP';
  if (clean.includes('CONTRACT')) return 'CONTRACT';
  if (clean.includes('PROBATION')) return 'PROBATION';
  if (clean.includes('FREELANCE')) return 'FREELANCE';
  return 'FULL_TIME';
}

function sanitizeGender(gender?: string) {
  const clean = String(gender || '').trim().toUpperCase();
  if (clean.startsWith('F')) return 'FEMALE';
  if (clean.startsWith('O')) return 'OTHER';
  return 'MALE';
}

function sanitizePayload(body: any) {
  if (!body || typeof body !== 'object') return body;

  const sanitized: any = { ...body };

  // Password guaranteed
  if (!sanitized.password || String(sanitized.password).trim() === '') {
    sanitized.password = 'Adyapan@123';
  }

  // Name normalization
  if (sanitized.name) {
    sanitized.name = String(sanitized.name).trim();
    sanitized.fullName = sanitized.name;
    const names = sanitized.name.split(' ');
    sanitized.firstName = names[0] || '';
    sanitized.lastName = names.slice(1).join(' ') || '';
  }

  // Email normalization
  if (sanitized.email) {
    sanitized.email = String(sanitized.email).trim();
    sanitized.officialEmail = sanitized.email;
  }

  // Mobile normalization
  if (sanitized.mobile) {
    sanitized.mobile = String(sanitized.mobile).trim();
    sanitized.phone = sanitized.mobile;
    sanitized.mobileNumber = sanitized.mobile;
    sanitized.contactNumber = sanitized.mobile;
  }

  // Employee Code / ID
  if (sanitized.employeeId) {
    sanitized.employeeId = String(sanitized.employeeId).trim();
    sanitized.employeeCode = sanitized.employeeId;
    sanitized.empCode = sanitized.employeeId;
    sanitized.empId = sanitized.employeeId;
  }

  // Department & Designation
  if (sanitized.department) {
    sanitized.department = String(sanitized.department).trim();
    sanitized.departmentName = sanitized.department;
    sanitized.dept = sanitized.department;
  }

  if (sanitized.designation) {
    sanitized.designation = String(sanitized.designation).trim();
    sanitized.designationTitle = sanitized.designation;
    sanitized.jobTitle = sanitized.designation;
  }

  // Enums
  sanitized.role = sanitizeRole(sanitized.role);
  sanitized.employmentType = sanitizeEmploymentType(sanitized.employmentType);
  sanitized.gender = sanitizeGender(sanitized.gender);

  // Status & Active
  const isActiveBool = sanitized.isActive !== undefined ? Boolean(sanitized.isActive) : true;
  sanitized.isActive = isActiveBool;
  sanitized.status = isActiveBool ? 'ACTIVE' : 'INACTIVE';

  // Dates (Safe ISO or undefined, never empty strings)
  sanitized.dateOfBirth = safeIsoDate(sanitized.dateOfBirth);
  sanitized.joiningDate = safeIsoDate(sanitized.joiningDate || sanitized.dateOfJoining);
  sanitized.dateOfJoining = sanitized.joiningDate;
  sanitized.onboardingDate = safeIsoDate(sanitized.onboardingDate);

  // Salary
  sanitized.baseSalary = Number(sanitized.baseSalary) || 0;
  sanitized.ctc = Number(sanitized.ctc || sanitized.baseSalary) || 0;

  // Clean empty teamId
  if (!sanitized.teamId || sanitized.teamId === '') {
    delete sanitized.teamId;
  }

  return sanitized;
}

export async function POST(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request);
    let body = await request.json().catch(() => ({}));
    body = sanitizePayload(body);

    const crmResponse = await fetch(CRM_API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await crmResponse.json().catch(() => null);

    if (!crmResponse.ok) {
      return NextResponse.json(
        data || { success: false, message: `CRM API create failed with status ${crmResponse.status}` },
        { status: crmResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('CRM Proxy POST Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create employee' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request);
    let body = await request.json().catch(() => ({}));
    body = sanitizePayload(body);
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || body.id || body._id || '';

    // If endpoint supports /api/hr/employees/${id} or /api/hr/employees with id in body
    const targetUrl = id ? `${CRM_API_ENDPOINT}/${id}` : CRM_API_ENDPOINT;

    let crmResponse = await fetch(targetUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    // Fallback if targetUrl /:id returned 404/405, try main endpoint with PUT/PATCH
    if (crmResponse.status === 404 || crmResponse.status === 405) {
      crmResponse = await fetch(CRM_API_ENDPOINT, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
    }

    const data = await crmResponse.json().catch(() => null);

    if (!crmResponse.ok) {
      return NextResponse.json(
        data || { success: false, message: `CRM API update failed with status ${crmResponse.status}` },
        { status: crmResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('CRM Proxy PUT Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update employee' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request);
    let body = await request.json().catch(() => ({}));
    body = sanitizePayload(body);
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || body.id || body._id || '';

    const targetUrl = id ? `${CRM_API_ENDPOINT}/${id}` : CRM_API_ENDPOINT;

    let crmResponse = await fetch(targetUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    if (crmResponse.status === 404 || crmResponse.status === 405) {
      crmResponse = await fetch(CRM_API_ENDPOINT, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });
    }

    const data = await crmResponse.json().catch(() => null);

    if (!crmResponse.ok) {
      return NextResponse.json(
        data || { success: false, message: `CRM API update failed with status ${crmResponse.status}` },
        { status: crmResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('CRM Proxy PATCH Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update employee' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request);
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || '';

    const targetUrl = id ? `${CRM_API_ENDPOINT}/${id}` : CRM_API_ENDPOINT;

    const crmResponse = await fetch(targetUrl, {
      method: 'DELETE',
      headers,
    });

    const data = await crmResponse.json().catch(() => null);

    if (!crmResponse.ok) {
      return NextResponse.json(
        data || { success: false, message: `CRM API delete failed with status ${crmResponse.status}` },
        { status: crmResponse.status }
      );
    }

    return NextResponse.json(data || { success: true });
  } catch (error: any) {
    console.error('CRM Proxy DELETE Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
