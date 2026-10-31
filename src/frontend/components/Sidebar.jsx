// ============================================================================
// FILE: src/frontend/components/Sidebar.jsx
// PURPOSE: Left Navigation Menu for SmartERP
// ============================================================================

'use client';

import React from 'react';
import {
  Zap,
  LayoutDashboard,
  ShoppingCart,
  Package,
  PackagePlus,
  SlidersHorizontal,
  Users,
  RotateCcw,
  ShieldCheck,
  History,
  FileSpreadsheet,
  HandCoins,
  Wallet,
  Landmark,
  BarChart3,
  ReceiptText,
  BookOpen,
  Factory,
  Warehouse as WarehouseIcon,
  CalendarCheck,
  Banknote,
  Activity,
  Settings,
  LogOut
} from 'lucide-react';

export const NAV_GROUPS = [
  {
    title: 'MAIN MENU',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'ALL' },
      { id: 'pos', label: 'POS Sales', icon: ShoppingCart, perm: 'POS', badge: 'Fast' },
      { id: 'products', label: 'Products', icon: Package, perm: 'PRODUCTS' },
      { id: 'stock_in', label: 'Stock In', icon: PackagePlus, perm: 'STOCK_IN' },
      { id: 'stock_adjust', label: 'Stock Adjust', icon: SlidersHorizontal, perm: 'STOCK_ADJUST' },
      { id: 'customers', label: 'Customers', icon: Users, perm: 'CUSTOMERS' },
      { id: 'returns', label: 'Returns', icon: RotateCcw, perm: 'RETURNS' },
      { id: 'replacements', label: 'Replacements', icon: ShieldCheck, perm: 'RETURNS' },
      { id: 'sales_history', label: 'Sales History', icon: History, perm: 'SALES_HISTORY' },
      { id: 'manage_sales', label: 'Manage Sales', icon: FileSpreadsheet, perm: 'SALES_HISTORY' },
      { id: 'collect_due', label: 'Collect Due', icon: HandCoins, perm: 'DUE', badge: 'Baki' },
      { id: 'finance', label: 'Finance', icon: Wallet, perm: 'FINANCE' },
      { id: 'bank_deposit', label: 'Bank Deposit', icon: Landmark, perm: 'BANK' },
      { id: 'reports', label: 'Reports', icon: BarChart3, perm: 'REPORTS' },
      { id: 'statements', label: 'Statements', icon: ReceiptText, perm: 'REPORTS' }
    ]
  },
  {
    title: 'ADMIN',
    items: [
      { id: 'accounts', label: 'Accounts', icon: BookOpen, perm: 'ACCOUNTS' },
      { id: 'production', label: 'Production', icon: Factory, perm: 'PRODUCTION' },
      { id: 'warehouse', label: 'Warehouse', icon: WarehouseIcon, perm: 'WAREHOUSE' },
      { id: 'employees', label: 'Employees', icon: Users, perm: 'EMPLOYEES' },
      { id: 'attendance', label: 'Attendance', icon: CalendarCheck, perm: 'ATTENDANCE' },
      { id: 'payroll', label: 'Payroll', icon: Banknote, perm: 'PAYROLL' },
      { id: 'activity_logs', label: 'Activity Logs', icon: Activity, perm: 'ALL' },
      { id: 'configuration', label: 'Configuration', icon: Settings, perm: 'ALL' }
    ]
  }
];

export default function Sidebar({
  tenantId,
  activeTab,
  activeUser,
  canAccess,
  onSelectTab,
  onLogout
}) {
  return (
    <aside className="erp-sidebar">
      <div className="brand-header">
        <div className="brand-logo-box">
          <Zap size={20} fill="#ffffff" />
        </div>
        <div>
          <div className="brand-title">SMARTERP</div>
          <div className="brand-subtitle">
            {tenantId === 'amarfood'
              ? 'AGRO & FOOD SME'
              : tenantId === 'smarttech'
                ? 'GADGETS & IT'
                : 'ELECTRONICS'}
          </div>
        </div>
      </div>

      <div className="sidebar-scroll">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="nav-section-title">{group.title}</div>
            {group.items.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              const hasPerm = canAccess(item.perm);
              return (
                <button
                  key={item.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  style={{ opacity: hasPerm ? 1 : 0.45 }}
                  onClick={() => onSelectTab(item, hasPerm)}
                >
                  <span className="nav-item-left">
                    <IconComp size={16} color={isActive ? '#e11d48' : '#64748b'} />
                    <span>{item.label}</span>
                  </span>
                  {item.badge && (
                    <span className={`nav-badge ${item.badge === 'Baki' ? '' : 'green'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="online-pill">
          <span className="online-dot" />
          <span>Online</span>
        </div>
        <div className="user-mini-card">
          <div className="flex items-center gap-2">
            <div className="user-avatar">{(activeUser.name || 'A')[0]}</div>
            <div>
              <div className="font-bold text-xs text-slate-900">
                {activeUser.name.split(' ')[0]}
              </div>
              <div className="text-[11px] text-slate-500">{activeUser.role}</div>
            </div>
          </div>
          <button
            className="btn btn-outline"
            style={{ padding: '4px 8px', fontSize: 11, color: '#e11d48' }}
            onClick={onLogout}
            title="Sign Out"
          >
            <LogOut size={13} /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

