import { NextRequest, NextResponse } from 'next/server';
import { crmFetch } from '@/lib/crm-client';

export const dynamic = 'force-dynamic';

// PUT /api/crm-employees/:id — Update employee in CRM
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const res = await crmFetch(`/api/hrms-sync/employees/${id}`, {
      method: 'PUT',
      body,
    });

    if (!res.ok) {
      return NextResponse.json(
        res.data || { success: false, message: `CRM update failed (${res.status})` },
        { status: res.status }
      );
    }

    return NextResponse.json(res.data || { success: true });
  } catch (error: any) {
    console.error('CRM employee update error:', error.message);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update employee in CRM' },
      { status: 500 }
    );
  }
}

// DELETE /api/crm-employees/:id — Delete/deactivate employee in CRM
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const res = await crmFetch(`/api/hrms-sync/employees/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      return NextResponse.json(
        res.data || { success: false, message: `CRM delete failed (${res.status})` },
        { status: res.status }
      );
    }

    return NextResponse.json(res.data || { success: true });
  } catch (error: any) {
    console.error('CRM employee delete error:', error.message);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete employee from CRM' },
      { status: 500 }
    );
  }
}
