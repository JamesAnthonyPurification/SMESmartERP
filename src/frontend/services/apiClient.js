// ============================================================================
// FILE: src/frontend/services/apiClient.js
// PURPOSE: Frontend HTTP Client for communicating with the Node.js Backend API
// Enforces cache: 'no-store' and timestamp query so every CRUD & Refresh click
// instantly updates all sections across every user role.
// ============================================================================

export async function fetchWorkspaceData(tenantId = 'powercell') {
  const ts = Date.now();
  const response = await fetch(`/api/erp?tenantId=${encodeURIComponent(tenantId)}&_t=${ts}`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to load workspace data from server.');
  }
  return response.json();
}

export async function postWorkspaceAction({ action, tenantId, actorName, actorRole, payload }) {
  const response = await fetch('/api/erp', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    },
    body: JSON.stringify({
      action,
      tenantId,
      actorName,
      actorRole,
      payload
    })
  });
  return response.json();
}
