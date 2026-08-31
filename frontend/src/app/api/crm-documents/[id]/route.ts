import { NextRequest, NextResponse } from 'next/server';
import { crmFetch } from '@/lib/crm-client';

export const dynamic = 'force-dynamic';

// DELETE /api/crm-documents/:id — Delete document from CRM
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const res = await crmFetch(`/api/hrms-sync/documents/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      return NextResponse.json(
        res.data || { success: false, message: `CRM document delete failed (${res.status})` },
        { status: res.status }
      );
    }

    return NextResponse.json(res.data || { success: true });
  } catch (error: any) {
    console.error('CRM document delete error:', error.message);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete document from CRM' },
      { status: 500 }
    );
  }
}
