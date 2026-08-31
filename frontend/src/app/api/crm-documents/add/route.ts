import { NextRequest, NextResponse } from 'next/server';
import { crmFetch } from '@/lib/crm-client';

export const dynamic = 'force-dynamic';

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

    const payload: any = {
      name: docData.name?.trim() || 'Document',
      documentType: docData.documentType || 'OTHER',
      fileUrl: docData.fileUrl?.trim() || '',
      status: docData.status || 'ACTIVE',
      notes: docData.notes?.trim() || null,
    };

    if (docData.issuedAt) {
      try {
        payload.issuedAt = new Date(docData.issuedAt).toISOString();
      } catch {
        payload.issuedAt = null;
      }
    } else {
      payload.issuedAt = null;
    }

    if (docData.expiresAt) {
      try {
        payload.expiresAt = new Date(docData.expiresAt).toISOString();
      } catch {
        payload.expiresAt = null;
      }
    } else {
      payload.expiresAt = null;
    }

    const res = await crmFetch(`/api/hrms-sync/employees/${employeeId}/documents`, {
      method: 'POST',
      body: payload,
    });

    if (!res.ok) {
      return NextResponse.json(
        res.data || { success: false, message: `CRM document add failed (${res.status})` },
        { status: res.status }
      );
    }

    return NextResponse.json(res.data || { success: true });
  } catch (error: any) {
    console.error('CRM document add error:', error.message);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to add document in CRM' },
      { status: 500 }
    );
  }
}
