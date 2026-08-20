import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CRM_BACKEND_URL = process.env.CRM_BACKEND_URL || 'https://adyapancrm.in';
const CRM_SYNC_API_KEY = process.env.CRM_SYNC_API_KEY || 'hrms-sync-key-2026';

// DELETE /api/crm-documents/:id — Delete document from CRM
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const response = await fetch(`${CRM_BACKEND_URL}/api/hrms-sync/documents/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-HRMS-API-KEY': CRM_SYNC_API_KEY,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        data || { success: false, message: `CRM document delete failed (${response.status})` },
        { status: response.status }
      );
    }

    return NextResponse.json(data || { success: true });
  } catch (error: any) {
    console.error('CRM document delete error:', error.message);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete document from CRM' },
      { status: 500 }
    );
  }
}
