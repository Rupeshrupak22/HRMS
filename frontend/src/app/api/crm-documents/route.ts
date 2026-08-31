import { NextRequest, NextResponse } from 'next/server';
import { crmFetch } from '@/lib/crm-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId') || '';

    let path = '/api/hrms-sync/documents';
    if (employeeId) {
      path += `?employeeId=${encodeURIComponent(employeeId)}`;
    }

    const res = await crmFetch(path);

    if (!res.ok) {
      return NextResponse.json(
        { success: false, documents: [], message: `CRM documents API returned ${res.status}` },
        { status: 200 }
      );
    }

    return NextResponse.json(res.data);
  } catch (error: any) {
    console.error('CRM documents proxy error:', error.message);
    return NextResponse.json(
      { success: false, documents: [], message: error.message || 'Failed to fetch documents' },
      { status: 200 }
    );
  }
}
