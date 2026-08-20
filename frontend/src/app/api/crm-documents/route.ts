import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CRM_BACKEND_URL = process.env.CRM_BACKEND_URL || 'https://adyapancrm.in';
const CRM_SYNC_API_KEY = process.env.CRM_SYNC_API_KEY || '';

export async function GET(request: NextRequest) {
  // Require auth
  const accessToken = request.cookies.get('access_token')?.value || request.headers.get('authorization');
  if (!accessToken) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  if (!CRM_SYNC_API_KEY) {
    return NextResponse.json({ success: false, documents: [], message: 'CRM API key not configured' }, { status: 200 });
  }

  try {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId') || '';

    let targetUrl = `${CRM_BACKEND_URL}/api/hrms-sync/documents`;
    if (employeeId) {
      targetUrl += `?employeeId=${encodeURIComponent(employeeId)}`;
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-HRMS-API-KEY': CRM_SYNC_API_KEY,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, documents: [], message: `CRM documents API returned ${response.status}` },
        { status: 200 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('CRM documents proxy error:', error.message);
    return NextResponse.json(
      { success: false, documents: [], message: error.message || 'Failed to fetch documents' },
      { status: 200 }
    );
  }
}
