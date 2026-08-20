import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CRM_BACKEND_URL = process.env.CRM_BACKEND_URL || 'https://adyapancrm.in';
const CRM_SYNC_API_KEY = process.env.CRM_SYNC_API_KEY || '';

// PUT /api/crm-employees/:id — Update employee in CRM
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require auth
    const accessToken = request.cookies.get('access_token')?.value || request.headers.get('authorization');
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Try hrms-sync endpoint first, then fallback to /api/hr/employee/:id
    let response = await fetch(`${CRM_BACKEND_URL}/api/hrms-sync/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-HRMS-API-KEY': CRM_SYNC_API_KEY,
      },
      body: JSON.stringify(body),
    });

    // Fallback to CRM's main employee API if sync endpoint doesn't support PUT
    if (response.status === 404 || response.status === 405) {
      response = await fetch(`${CRM_BACKEND_URL}/api/hr/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-HRMS-API-KEY': CRM_SYNC_API_KEY,
        },
        body: JSON.stringify(body),
      });
    }

    // If still failing, try PATCH
    if (response.status === 404 || response.status === 405) {
      response = await fetch(`${CRM_BACKEND_URL}/api/hr/employees/${id}`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-HRMS-API-KEY': CRM_SYNC_API_KEY,
        },
        body: JSON.stringify(body),
      });
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        data || { success: false, message: `CRM update failed with status ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json(data || { success: true });
  } catch (error: any) {
    console.error('CRM employee update error:', error.message);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update employee in CRM' },
      { status: 500 }
    );
  }
}

// DELETE /api/crm-employees/:id — Delete/deactivate employee in CRM
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require auth
    const accessToken = request.cookies.get('access_token')?.value || request.headers.get('authorization');
    if (!accessToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    let response = await fetch(`${CRM_BACKEND_URL}/api/hrms-sync/employees/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-HRMS-API-KEY': CRM_SYNC_API_KEY,
      },
    });

    // Fallback
    if (response.status === 404 || response.status === 405) {
      response = await fetch(`${CRM_BACKEND_URL}/api/hr/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-HRMS-API-KEY': CRM_SYNC_API_KEY,
        },
      });
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        data || { success: false, message: `CRM delete failed with status ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json(data || { success: true });
  } catch (error: any) {
    console.error('CRM employee delete error:', error.message);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete employee from CRM' },
      { status: 500 }
    );
  }
}
