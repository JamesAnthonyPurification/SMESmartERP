// ============================================================================
// FILE: src/frontend/components/AuthScreen.jsx
// PURPOSE: Sign In (Login) & Register Page for SmartERP
// Strictly enforces Tenant-Wise Login (SMARTERP ELECTRONICS, Amar Food, or
// SmartERP SaaS Super Admin)
// ============================================================================

'use client';

import React, { useState } from 'react';
import { Zap, Lock, User, ArrowRight } from 'lucide-react';
import { postWorkspaceAction } from '@/frontend/services/apiClient';

export default function AuthScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [selectedTenant, setSelectedTenant] = useState('powercell');
  const [usernameOrEmail, setUsernameOrEmail] = useState('admin');
  const [password, setPassword] = useState('123456');

  // Registration state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('Owner / Admin');

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleQuickRoleSelect = (uname, isSuper = false) => {
    setMode('login');
    if (isSuper) {
      setSelectedTenant('superadmin');
    } else if (selectedTenant === 'superadmin') {
      setSelectedTenant('powercell');
    }
    setUsernameOrEmail(uname);
    setPassword('123456');
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await postWorkspaceAction({
          action: 'AUTH_LOGIN',
          tenantId: selectedTenant,
          payload: {
            usernameOrEmail,
            password,
            selectedTenant
          }
        });

        if (res.ok && res.user) {
          onLoginSuccess(res.user, res.tenantId || selectedTenant, Boolean(res.isSuperAdmin));
        } else {
          setErrorMsg(res.error || 'Invalid login credentials.');
        }
      } else {
        if (!regName.trim() || !regUsername.trim()) {
          setErrorMsg('Please enter your Full Name and Username.');
          setSubmitting(false);
          return;
        }
        const targetTenant = selectedTenant === 'superadmin' ? 'powercell' : selectedTenant;
        const res = await postWorkspaceAction({
          action: 'AUTH_REGISTER',
          tenantId: targetTenant,
          payload: {
            name: regName,
            username: regUsername,
            password: password || '123456',
            phone: regPhone,
            role: regRole,
            selectedTenant: targetTenant
          }
        });

        if (res.ok && res.user) {
          onLoginSuccess(res.user, res.tenantId || targetTenant, false);
        } else {
          setErrorMsg(res.error || 'Could not create account.');
        }
      }
    } catch (err) {
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Banner: Brand & SME Highlights */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#0f7a43] to-[#064e3b] text-white p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-[#ef233c] flex items-center justify-center shadow-lg">
                <Zap size={24} fill="#ffffff" />
              </div>
              <div>
                <div className="font-extrabold text-xl tracking-wide">SMARTERP</div>
                <div className="text-xs uppercase tracking-widest text-emerald-200 font-semibold">
                  SME Cloud ERP Platform
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold leading-snug mb-3">
              Multi-Tenant POS &amp; ERP System for SMEs
            </h2>
            <p className="text-emerald-100 text-xs leading-relaxed mb-6">
              Each SME business logs into its own isolated workspace and role. Only the SmartERP SaaS Super Admin can oversee multiple SME tenants.
            </p>

            <div className="space-y-3 text-xs">
              <div className="bg-white/10 rounded-lg p-3 border border-white/15">
                <div className="font-bold text-white">1. SMARTERP ELECTRONICS</div>
                <div className="text-emerald-100 mt-0.5">Battery, IPS, Solar Panel &amp; Electrical Wholesale</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 border border-white/15">
                <div className="font-bold text-white">2. Amar Food</div>
                <div className="text-emerald-100 mt-0.5">Fresh Fish, Meat, Rice, Oil, Spices &amp; Kitchen Grocery</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 border border-white/15">
                <div className="font-bold text-white">★ SmartERP SaaS Super Admin</div>
                <div className="text-emerald-100 mt-0.5">Central SaaS company oversight for all SME clients</div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/15 text-xs text-emerald-200 flex items-center justify-between">
            <span>React.js • Tailwind • Chart.js</span>
            <span>Node.js • SQLite</span>
          </div>
        </div>

        {/* Right Form: Sign In / Register */}
        <div className="md:col-span-7 p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">
                  {mode === 'login' ? 'Sign In to SME Workspace' : 'Register Staff Account'}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your SME Business Profile and login with your assigned role
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    mode === 'login'
                      ? 'bg-[#ef233c] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMsg(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    mode === 'register'
                      ? 'bg-[#0f7a43] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select SME Business Profile (Tenant)
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 focus:border-[#0f7a43] focus:outline-none"
                  value={selectedTenant}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTenant(val);
                    if (val === 'superadmin') {
                      setUsernameOrEmail('superadmin');
                    } else if (usernameOrEmail === 'superadmin') {
                      setUsernameOrEmail('admin');
                    }
                  }}
                >
                  <option value="powercell">1. SMARTERP ELECTRONICS (Battery, IPS &amp; Electronics)</option>
                  <option value="amarfood">2. Amar Food (Fish, Meat, Grocery &amp; Kitchen Items)</option>
                  <option value="superadmin">★ SmartERP SaaS Company (Super Admin Only)</option>
                </select>
              </div>

              {mode === 'register' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Md. Hasan"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#0f7a43] focus:outline-none"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. hasan"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#0f7a43] focus:outline-none"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="01711-XXXXXX"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#0f7a43] focus:outline-none"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Assign Role</label>
                      <select
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#0f7a43] focus:outline-none"
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value)}
                      >
                        <option value="Owner/Admin">Owner / Admin</option>
                        <option value="Cashier/Sales">Cashier / POS</option>
                        <option value="Inventory/Warehouse">Godown / Store</option>
                        <option value="Accountant/HR">Accounts / HR</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {mode === 'login' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="admin"
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs focus:border-[#0f7a43] focus:outline-none"
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                    />
                    <User size={15} className="text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="123456"
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs focus:border-[#0f7a43] focus:outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock size={15} className="text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-lg bg-[#0f7a43] hover:bg-[#0b5e33] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                <span>{submitting ? 'Signing In...' : mode === 'login' ? 'Sign In to Workspace' : 'Register & Sign In'}</span>
                <ArrowRight size={15} />
              </button>
            </form>
          </div>

          {/* Quick Demo Role Credentials Table (Exact match to User Screenshot) */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                QUICK DEMO ROLE CREDENTIALS
              </span>
              <span className="text-xs font-bold text-slate-600">Password: 123456</span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-1.5 px-3 font-bold">Role</th>
                    <th className="py-1.5 px-3 font-bold">Username</th>
                    <th className="py-1.5 px-3 text-right font-bold">Quick Fill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-medium text-slate-800">Owner / Admin</td>
                    <td className="py-1.5 px-3 font-mono font-bold text-slate-900">admin</td>
                    <td className="py-1.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleQuickRoleSelect('admin', false)}
                        className="text-[11px] font-bold text-[#0f7a43] hover:underline"
                      >
                        Use admin
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-medium text-slate-800">Cashier / POS</td>
                    <td className="py-1.5 px-3 font-mono font-bold text-slate-900">cashier</td>
                    <td className="py-1.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleQuickRoleSelect('cashier', false)}
                        className="text-[11px] font-bold text-[#0f7a43] hover:underline"
                      >
                        Use cashier
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-medium text-slate-800">Godown / Store</td>
                    <td className="py-1.5 px-3 font-mono font-bold text-slate-900">store</td>
                    <td className="py-1.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleQuickRoleSelect('store', false)}
                        className="text-[11px] font-bold text-[#0f7a43] hover:underline"
                      >
                        Use store
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-medium text-slate-800">Accounts / HR</td>
                    <td className="py-1.5 px-3 font-mono font-bold text-slate-900">accounts</td>
                    <td className="py-1.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleQuickRoleSelect('accounts', false)}
                        className="text-[11px] font-bold text-[#0f7a43] hover:underline"
                      >
                        Use accounts
                      </button>
                    </td>
                  </tr>
                  <tr className="bg-slate-50/70 hover:bg-slate-100">
                    <td className="py-1.5 px-3 font-bold text-slate-900">★ SmartERP Super Admin (SaaS)</td>
                    <td className="py-1.5 px-3 font-mono font-bold text-[#ef233c]">superadmin</td>
                    <td className="py-1.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleQuickRoleSelect('superadmin', true)}
                        className="text-[11px] font-bold text-[#ef233c] hover:underline"
                      >
                        Use superadmin
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
