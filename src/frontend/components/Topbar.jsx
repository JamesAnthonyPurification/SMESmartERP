// ============================================================================
// FILE: src/frontend/components/Topbar.jsx
// PURPOSE: Top Header Bar
// Strict Tenant & Role Isolation:
//   - Regular SME users cannot switch tenants or switch roles from the topbar.
//   - Only SmartERP SaaS Super Admin can inspect different SME tenants.
// ============================================================================

'use client';

import React from 'react';
import { RefreshCw, Award, Shield } from 'lucide-react';

export default function Topbar({
  tenantId,
  tenants = [],
  activeUser,
  isSuperAdmin = false,
  onChangeTenant,
  onRefresh,
  onOpenSmeFeatures
}) {
  const currentTenantName =
    tenantId === 'amarfood' ? 'Amar Food' : 'SMARTERP ELECTRONICS';

  return (
    <header className="erp-topbar">
      <div className="topbar-left">
        <span className="tenant-title">{currentTenantName}</span>
        <span className="tenant-divider">|</span>
        <span className="tenant-sub">POS &amp; ERP Management</span>

        {/* Static Locked Role Badge (Cannot switch to another user's role without logging out) */}
        <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
          Logged in: {activeUser?.role || 'Staff'} ({activeUser?.username || 'admin'})
        </span>

        {/* Only SmartERP SaaS Super Admin can switch between SME Tenants */}
        {isSuperAdmin && (
          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
            <Shield size={14} className="text-[#ef233c]" />
            <span className="text-[11px] font-extrabold text-[#ef233c] uppercase">
              SaaS Super Admin View:
            </span>
            <select
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
              value={tenantId}
              onChange={(e) => onChangeTenant(e.target.value)}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="topbar-right">
        <button className="btn btn-sme-badge" onClick={onOpenSmeFeatures}>
          <Award size={14} /> SME-Only Features
        </button>

        <button className="btn btn-outline" onClick={onRefresh}>
          <RefreshCw size={14} /> Refresh
        </button>

        <div className="date-chip">Oct 01 – 31, 2026</div>
      </div>
    </header>
  );
}
