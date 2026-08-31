import { NextRequest, NextResponse } from 'next/server';
import { crmFetch } from '@/lib/crm-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const res = await crmFetch('/api/hrms-sync/employees');

    if (!res.ok) {
      return NextResponse.json(
        { success: false, employees: [], message: `CRM API returned ${res.status}` },
        { status: 200 }
      );
    }

    return NextResponse.json(res.data);
  } catch (error: any) {
    console.error('CRM employees proxy error:', error.message);
    return NextResponse.json(
      { success: false, employees: [], message: error.message || 'Failed to fetch CRM employees' },
      { status: 200 }
    );
  }
}
