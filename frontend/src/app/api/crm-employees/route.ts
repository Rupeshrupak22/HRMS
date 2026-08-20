import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CRM_BACKEND_URL = process.env.CRM_BACKEND_URL || 'https://adyapancrm.in';
const CRM_SYNC_API_KEY = process.env.CRM_SYNC_API_KEY || '';

export async function GET(request: NextRequest) {
  // Require auth — check for access_token cookie or Authorization header
  const accessToken = request.cookies.get('access_token')?.value || request.headers.get('authorization');
  if (!accessToken) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  if (!CRM_SYNC_API_KEY) {
    return NextResponse.json({ success: false, employees: [], message: 'CRM API key not configured' }, { status: 200 });
  }

  try {
    const response = await fetch(`${CRM_BACKEND_URL}/api/hrms-sync/employees`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-HRMS-API-KEY': CRM_SYNC_API_KEY,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`CRM API error ${response.status}:`, errText.slice(0, 200));
      return NextResponse.json(
        { success: false, employees: [], message: `CRM API returned ${response.status}` },
        { status: 200 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('CRM employees proxy error:', error.message);
    return NextResponse.json(
      { success: false, employees: [], message: error.message || 'Failed to fetch CRM employees' },
      { status: 200 }
    );
  }
}
