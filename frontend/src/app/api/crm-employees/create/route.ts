import { NextRequest, NextResponse } from 'next/server';
import { crmFetch } from '@/lib/crm-client';

export const dynamic = 'force-dynamic';

// POST /api/crm-employees/create — Create new employee in CRM
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await crmFetch('/api/hrms-sync/employees', {
      method: 'POST',
      body,
    });

    if (!res.ok) {
      return NextResponse.json(
        res.data || { success: false, message: `CRM create failed (${res.status})` },
        { status: res.status }
      );
    }

    return NextResponse.json(res.data || { success: true });
  } catch (error: any) {
    console.error('CRM employee create error:', error.message);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create employee in CRM' },
      { status: 500 }
    );
  }
}
