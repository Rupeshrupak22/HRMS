import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CRM_BACKEND_URL = process.env.CRM_BACKEND_URL || 'https://adyapancrm.in';
const CRM_SYNC_API_KEY = process.env.CRM_SYNC_API_KEY || '';

// POST /api/crm-employees/create — Create new employee in CRM
export async function POST(request: NextRequest) {
  try {
    // Require auth
    const accessToken = request.cookies.get('access_token')?.value || request.headers.get('authorization');
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${CRM_BACKEND_URL}/api/hrms-sync/employees`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-HRMS-API-KEY': CRM_SYNC_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        data || { success: false, message: `CRM create failed (${response.status})` },
        { status: response.status }
      );
    }

    return NextResponse.json(data || { success: true });
  } catch (error: any) {
    console.error('CRM employee create error:', error.message);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create employee in CRM' },
      { status: 500 }
    );
  }
}
