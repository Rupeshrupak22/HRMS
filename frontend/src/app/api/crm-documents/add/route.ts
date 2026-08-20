import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CRM_BACKEND_URL = process.env.CRM_BACKEND_URL || 'https://adyapancrm.in';
const CRM_SYNC_API_KEY = process.env.CRM_SYNC_API_KEY || 'hrms-sync-key-2026';

// POST /api/crm-documents/add — Add document to employee in CRM
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, ...docData } = body;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: 'employeeId is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${CRM_BACKEND_URL}/api/hrms-sync/employees/${employeeId}/documents`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-HRMS-API-KEY': CRM_SYNC_API_KEY,
      },
      body: JSON.stringify(docData),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        data || { success: false, message: `CRM document add failed (${response.status})` },
        { status: response.status }
      );
    }

    return NextResponse.json(data || { success: true });
  } catch (error: any) {
    console.error('CRM document add error:', error.message);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to add document in CRM' },
      { status: 500 }
    );
  }
}
