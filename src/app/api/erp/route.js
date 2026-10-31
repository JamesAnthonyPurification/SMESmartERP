// ============================================================================
// FILE: src/app/api/erp/route.js
// PURPOSE: REST API Endpoint connecting Frontend to Node.js Backend Controller
// Configured with force-dynamic so every CRUD action and Refresh click returns
// instant live database state.
// ============================================================================

import { NextResponse } from 'next/server';
import { getTenantErpData, handleErpAction } from '@/backend/controllers/erpController';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'powercell';
    const data = getTenantErpData(tenantId);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      }
    });
  } catch (err) {
    console.error('GET /api/erp error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = handleErpAction(body);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    // Return updated tenant snapshot right inside the POST response for zero-delay UI sync
    const targetTid = result.tenantId || body.tenantId || 'powercell';
    const freshData = getTenantErpData(targetTid);
    return NextResponse.json({
      ...result,
      freshData
    });
  } catch (err) {
    console.error('POST /api/erp error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
