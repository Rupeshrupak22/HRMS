import { NextRequest, NextResponse } from 'next/server';

const CRM_BACKEND_URL = process.env.CRM_BACKEND_URL || 'https://adyapancrm.in';
const CRM_SYNC_API_KEY = process.env.CRM_SYNC_API_KEY || 'hrms-sync-key-2026';

export async function GET(_request: NextRequest) {
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
      return NextResponse.json(
        { success: false, message: `CRM API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('CRM employees proxy error:', error.message);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch CRM employees' },
      { status: 500 }
    );
  }
}
