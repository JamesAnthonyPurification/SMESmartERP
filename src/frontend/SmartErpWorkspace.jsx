// ============================================================================
// FILE: src/frontend/SmartErpWorkspace.jsx
// PURPOSE: Main Frontend Application (React.js + Tailwind CSS + Chart.js)
// Features: Sign In/Register, Dashboard, POS, Inventory, Baki/Khata, Finance,
//           Production, Warehouse, HR/Payroll, Full Add/Edit/Update/Delete
// ============================================================================

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  ShoppingCart,
  PackagePlus,
  ShieldCheck,
  HandCoins,
  Wallet,
  BarChart3,
  Factory,
  Warehouse as WarehouseIcon,
  CalendarCheck,
  Settings,
  AlertTriangle,
  X,
  Plus,
  Trash2,
  Pencil,
  Printer,
  MessageSquare,
  CheckCircle2,
  Award,
  Search
} from 'lucide-react';

import { fetchWorkspaceData, postWorkspaceAction } from '@/frontend/services/apiClient';
import AuthScreen from '@/frontend/components/AuthScreen';
import Sidebar from '@/frontend/components/Sidebar';
import Topbar from '@/frontend/components/Topbar';
import RevenueChart from '@/frontend/components/RevenueChart';

export default function SmartErpWorkspace() {
  // Authentication State (Strictly isolated per tenant & role)
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [tenantId, setTenantId] = useState('powercell');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // SME Comparison Modal
  const [showSmeFeaturesModal, setShowSmeFeaturesModal] = useState(false);

  // Invoice Print Modal
  const [printInvoice, setPrintInvoice] = useState(null);

  // Edit Modals State (For Live Update of Products, Customers, Employees)
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // POS State
  const [posSaleType, setPosSaleType] = useState('Wholesale');
  const [posCustomerId, setPosCustomerId] = useState('');
  const [posSearch, setPosSearch] = useState('');
  const [posCart, setPosCart] = useState([]);
  const [posDiscount, setPosDiscount] = useState(0);
  const [posPaymentMethod, setPosPaymentMethod] = useState('Cash');
  const [posMfsTrxId, setPosMfsTrxId] = useState('');
  const [posPaidAmount, setPosPaidAmount] = useState('');

  // Form States for Creating Records
  const [newProduct, setNewProduct] = useState({
    sku: '',
    barcode: '',
    name: '',
    nameBn: '',
    category: 'UPS/IPS Battery',
    unit: 'Pcs',
    purchasePrice: '',
    retailPrice: '',
    wholesalePrice: '',
    minWholesaleQty: 5,
    stockQty: '',
    alertQty: 10,
    warrantyMonths: 12,
    expiryDate: '',
    supplierName: ''
  });

  const [stockMoveForm, setStockMoveForm] = useState({
    productId: '',
    movementType: 'STOCK_IN',
    qty: 20,
    unitCost: '',
    supplierOrReason: 'Primary Factory Restock Challan',
    warehouseName: 'Nawabpur Main Showroom & Counter'
  });

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    shopName: '',
    phone: '',
    address: '',
    customerType: 'Wholesale',
    creditLimit: 50000,
    openingDue: 0,
    notes: ''
  });

  const [dueCollectionForm, setDueCollectionForm] = useState({
    customerId: '',
    amount: '',
    paymentMethod: 'bKash',
    referenceNote: 'Weekly Baki Khata Installment'
  });

  const [returnForm, setReturnForm] = useState({
    recordType: 'RETURN',
    invoiceNo: 'INV-2026-1001',
    customerName: 'Mayer Doa Electronics & IPS',
    productId: '',
    serialNo: '',
    qty: 1,
    reason: 'Defective cell / Under warranty replacement'
  });

  const [financeForm, setFinanceForm] = useState({
    trxType: 'EXPENSE',
    category: 'Transport & Van Fare',
    accountName: '',
    amount: '',
    description: ''
  });

  const [productionForm, setProductionForm] = useState({
    finishedProductId: '',
    targetQty: 50,
    rawMaterialsText: 'Lead-Acid Plates + Electrolyte + ABS Casing & Brand Label',
    rawCost: 4250,
    laborPackagingCost: 500
  });

  const [newEmployee, setNewEmployee] = useState({
    name: '',
    designation: 'Sales & POS Executive',
    phone: '',
    baseSalary: 15000,
    dailyAllowance: 100,
    commissionRate: 1.0
  });

  const showNotice = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadErpData = async (tid = tenantId) => {
    try {
      setLoading(true);
                    const json = await fetchWorkspaceData(tid);
      setData(json);

      if (json.products && json.products.length > 0) {
        setStockMoveForm((prev) => ({
          ...prev,
          productId: json.products[0].id,
          unitCost: json.products[0].purchase_price
        }));
        setReturnForm((prev) => ({
          ...prev,
          productId: json.products[0].id
        }));
        setProductionForm((prev) => ({
          ...prev,
          finishedProductId: json.products[0].id
        }));
      }
      setNewProduct((prev) => ({
        ...prev,
        category: tid === 'amarfood' ? 'Fish & Seafood' : 'UPS/IPS Battery',
        unit: tid === 'amarfood' ? 'Kg' : 'Pcs'
      }));
      if (json.customers && json.customers.length > 0) {
        setPosCustomerId(String(json.customers[0].id));
        setDueCollectionForm((prev) => ({
          ...prev,
          customerId: json.customers[0].id
        }));
      }
      if (json.financeAccounts && json.financeAccounts.length > 0) {
        setFinanceForm((prev) => ({
          ...prev,
          accountName: json.financeAccounts[0].account_name
        }));
      }
    } catch (err) {
      console.error('Failed to load ERP data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadErpData(tenantId);
  }, [tenantId]);

  const activeUser = useMemo(() => {
    if (loggedInUser) return loggedInUser;
    return { name: 'Admin', username: 'admin', role: 'Owner / Admin', permissions: 'ALL' };
  }, [loggedInUser]);

  const canAccess = (permKey) => {
    if (!activeUser || activeUser.permissions === 'ALL' || permKey === 'ALL') return true;
    const allowed = activeUser.permissions.split(',');
    return allowed.includes(permKey);
  };

  const runAction = async (action, payload, successMessage) => {
    try {
      const json = await postWorkspaceAction({
        action,
        tenantId,
        actorName: activeUser.name,
        actorRole: activeUser.role,
        payload
      });
      if (json.ok) {
        showNotice(successMessage || 'Saved & synced across all modules!');
        if (json.freshData) {
          setData(json.freshData);
        } else {
          await loadErpData(tenantId);
        }
      } else {
        showNotice(`Error: ${json.error || 'Operation failed'}`);
      }
      return json;
    } catch (e) {
      showNotice(`Request error: ${e.message}`);
      return { ok: false };
    }
  };

  // POS Cart Logic
  const addToPosCart = (product) => {
    if (product.stock_qty <= 0) {
      showNotice(`"${product.name}" is Out of Stock! Please restock in Stock In module.`);
      return;
    }
    setPosCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        const nextQty = Math.min(product.stock_qty, existing.qty + 1);
        const unitPrice =
          posSaleType === 'Wholesale' || nextQty >= product.min_wholesale_qty
            ? product.wholesale_price
            : product.retail_price;
        return prev.map((item) =>
          item.productId === product.id ? { ...item, qty: nextQty, price: unitPrice } : item
        );
      }
      const initialQty =
        posSaleType === 'Wholesale'
          ? Math.min(product.stock_qty, product.min_wholesale_qty || 1)
          : 1;
      const unitPrice =
        posSaleType === 'Wholesale' ? product.wholesale_price : product.retail_price;
      return [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          nameBn: product.name_bn,
          qty: initialQty,
          maxStock: product.stock_qty,
          price: unitPrice,
          cost: product.purchase_price,
          warrantyMonths: product.warranty_months
        }
      ];
    });
  };

  const posSubtotal = posCart.reduce((s, item) => s + item.qty * item.price, 0);
  const posVatRate = Number(data?.activeTenant?.vat_rate || 0);
  const posVatAmount = Math.round(((posSubtotal - Number(posDiscount || 0)) * posVatRate) / 100);
  const posGrandTotal = Math.max(0, posSubtotal - Number(posDiscount || 0) + posVatAmount);
  const effectivePosPaid = posPaidAmount === '' ? posGrandTotal : Number(posPaidAmount);
  const posDueRemaining = Math.max(0, posGrandTotal - effectivePosPaid);

  const handleCheckoutSale = async () => {
    if (posCart.length === 0) {
      showNotice('Please add at least one product to the POS cart.');
      return;
    }
    const cust = data?.customers?.find((c) => String(c.id) === String(posCustomerId));
    const result = await runAction(
      'CREATE_SALE',
      {
        customerId: cust ? cust.id : null,
        customerName: cust ? `${cust.shop_name || cust.name}` : 'Walk-in Retail Customer',
        customerPhone: cust ? cust.phone : '',
        saleType: posSaleType,
        items: posCart,
        discount: Number(posDiscount || 0),
        vatAmount: posVatAmount,
        paidAmount: effectivePosPaid,
        paymentMethod: posPaymentMethod,
        mfsTrxId: posMfsTrxId
      },
      `Sale Invoice created! Total: ৳${posGrandTotal.toLocaleString()}`
    );

    if (result?.ok) {
      setPrintInvoice({
        invoiceNo: result.invoiceNo,
        date: new Date().toISOString().slice(0, 10),
        customerName: cust ? `${cust.shop_name || cust.name}` : 'Walk-in Retail Customer',
        customerPhone: cust ? cust.phone : '',
        saleType: posSaleType,
        items: posCart,
        subtotal: posSubtotal,
        discount: Number(posDiscount || 0),
        vatAmount: posVatAmount,
        totalAmount: posGrandTotal,
        paidAmount: effectivePosPaid,
        dueAmount: posDueRemaining,
        paymentMethod: posPaymentMethod
      });
      setPosCart([]);
      setPosDiscount(0);
      setPosPaidAmount('');
      setPosMfsTrxId('');
    }
  };

  // WhatsApp / SMS Baki Reminder
  const sendWhatsAppBakiReminder = (customer) => {
    const tenantName = data?.activeTenant?.name || 'SmartERP';
    const msg = `আসসালামু আলাইকুম ${customer.name} (${customer.shop_name || ''}), ${tenantName} থেকে জানাচ্ছি আপনার বর্তমান বকেয়া (Baki Balance) ৳${Number(customer.current_due).toLocaleString()} টাকা। অনুগ্রহ করে বিকাশ/নগদ (${data?.activeTenant?.phone}) অথবা ক্যাশে পরিশোধ করার অনুরোধ করা হলো। ধন্যবাদ!`;
    showNotice(`Payment reminder prepared for ${customer.shop_name || customer.name}`);
    if (typeof window !== 'undefined') {
      const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/88${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Show Login / Sign Up screen if not logged in yet
  if (!loggedInUser) {
    return (
      <AuthScreen
        onLoginSuccess={(user, selectedTid, superFlag) => {
          setLoggedInUser(user);
          setIsSuperAdmin(Boolean(superFlag));
          // Jump to first allowed tab for this role
          if (user.permissions === 'ALL' || superFlag) {
            setActiveTab('dashboard');
          } else if (user.permissions.includes('POS')) {
            setActiveTab('pos');
          } else if (user.permissions.includes('PRODUCTS')) {
            setActiveTab('products');
          } else if (user.permissions.includes('FINANCE')) {
            setActiveTab('finance');
          }
          if (selectedTid && selectedTid !== tenantId) {
            setTenantId(selectedTid);
          } else {
            loadErpData(selectedTid || tenantId);
          }
          showNotice(`Signed in as ${user.name} (${user.role})`);
        }}
      />
    );
  }

  if (loading && !data) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-3">
        <div className="brand-logo-box w-12 h-12">
          <Zap size={26} />
        </div>
        <div className="font-extrabold text-lg">Loading SmartERP System...</div>
      </div>
    );
  }

  const s = data?.summary || {};
  const activeTenant = data?.activeTenant || {};
  const monthlyRev = data?.monthlyRevenue || [];

  return (
    <div className="erp-shell">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border-l-4 border-emerald-500">
          <CheckCircle2 size={17} color="#22c55e" />
          <span>{toast}</span>
        </div>
      )}

      {/* Left Sidebar Component */}
      <Sidebar
        tenantId={tenantId}
        activeTab={activeTab}
        activeUser={activeUser}
        canAccess={canAccess}
        onSelectTab={(item, hasPerm) => {
          if (!hasPerm) {
            showNotice(`Role "${activeUser.role}" does not have access to ${item.label}.`);
            return;
          }
          if (item.id === 'replacements') {
            setReturnForm((p) => ({ ...p, recordType: 'REPLACEMENT' }));
          } else if (item.id === 'returns') {
            setReturnForm((p) => ({ ...p, recordType: 'RETURN' }));
          }
          if (item.id === 'bank_deposit') {
            setFinanceForm((p) => ({ ...p, trxType: 'BANK_DEPOSIT', category: 'Cash to Bank Transfer' }));
          }
          setActiveTab(item.id);
        }}
        onLogout={() => setLoggedInUser(null)}
      />

      {/* Main Content Area */}
      <div className="erp-main">
        {/* Topbar Component */}
        <Topbar
          tenantId={tenantId}
          tenants={data?.tenants || []}
          activeUser={activeUser}
          isSuperAdmin={isSuperAdmin}
          onChangeTenant={(newTid) => {
            if (!isSuperAdmin) return;
            setTenantId(newTid);
            setPosCart([]);
            showNotice(`Super Admin inspecting tenant: ${newTid.toUpperCase()}`);
          }}
          onRefresh={() => {
            loadErpData(tenantId);
            showNotice('All sections refreshed & synced with SQLite database!');
          }}
          onOpenSmeFeatures={() => setShowSmeFeaturesModal(true)}
        />

        {/* Workspace Content */}
        <main className="erp-content">
          {/* ================= 1. DASHBOARD VIEW ================= */}
          {activeTab === 'dashboard' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">DASHBOARD</h1>
                  <div className="page-subtitle">
                    {activeTenant.subtitle || 'PowerCell Battery Wholesale — Live Overview'}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button className="btn btn-red" onClick={() => setActiveTab('pos')}>
                    <ShoppingCart size={15} /> + Quick POS Sale
                  </button>
                  <button className="btn btn-green" onClick={() => setActiveTab('collect_due')}>
                    <HandCoins size={15} /> Baki / Due Khata (৳{Number(s.totalCustomerDue || 0).toLocaleString()})
                  </button>
                </div>
              </div>

              {/* Row 1: 4 Sales KPI Cards */}
              <div className="kpi-grid-4">
                <div className="kpi-card hero-red">
                  <div className="kpi-top">
                    <span className="kpi-label">TODAY&apos;S SALES</span>
                    <Zap size={18} color="#fde047" fill="#fde047" />
                  </div>
                  <div className="kpi-value">৳{Number(s.todaySalesTotal || 0).toLocaleString()}</div>
                  <div className="kpi-sub">{s.todayInvoicesCount || 0} invoices today</div>
                  <div className="kpi-badge-green">▲ N/A vs last period</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-label">THIS WEEK</span>
                    <CalendarCheck size={18} color="#3b82f6" />
                  </div>
                  <div className="kpi-value">৳{Number(s.weekSalesTotal || 0).toLocaleString()}</div>
                  <div className="kpi-sub">Current week total</div>
                  <div className="kpi-badge-green">▲ N/A vs last period</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-label">THIS MONTH</span>
                    <BarChart3 size={18} color="#6366f1" />
                  </div>
                  <div className="kpi-value">৳{Number(s.monthSalesTotal || 0).toLocaleString()}</div>
                  <div className="kpi-sub">VAT: ৳{Number(s.monthVatTotal || 0).toLocaleString()}</div>
                  <div className="kpi-badge-green">▲ N/A vs last period</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-label">THIS YEAR</span>
                    <Award size={18} color="#f59e0b" />
                  </div>
                  <div className="kpi-value">৳{Number(s.yearSalesTotal || 0).toLocaleString()}</div>
                  <div className="kpi-sub">Total: {s.yearInvoicesCount || 0} invoices</div>
                </div>
              </div>

              {/* Row 2: 4 Inventory KPI Cards */}
              <div className="kpi-grid-4">
                <div className="kpi-card cursor-pointer" onClick={() => setActiveTab('products')}>
                  <div className="kpi-top">
                    <span className="kpi-label">TOTAL PRODUCTS</span>
                    <span className="text-lg">🔋</span>
                  </div>
                  <div className="kpi-value">{s.activeProductsCount || 0}</div>
                  <div className="kpi-sub">Active products</div>
                </div>

                <div className="kpi-card cursor-pointer" onClick={() => setActiveTab('warehouse')}>
                  <div className="kpi-top">
                    <span className="kpi-label">UNITS IN STOCK</span>
                    <span className="text-lg">📦</span>
                  </div>
                  <div className="kpi-value">{Number(s.totalUnitsInStock || 0).toLocaleString()}</div>
                  <div className="kpi-sub">Total inventory</div>
                </div>

                <div className="kpi-card cursor-pointer" onClick={() => setActiveTab('products')}>
                  <div className="kpi-top">
                    <span className="kpi-label">STOCK VALUE</span>
                    <span className="text-lg">💰</span>
                  </div>
                  <div className="kpi-value">৳{Number(s.totalStockValue || 0).toLocaleString()}</div>
                  <div className="kpi-sub">At purchase price</div>
                </div>

                <div className="kpi-card alert-red cursor-pointer" onClick={() => setActiveTab('stock_in')}>
                  <div className="kpi-top">
                    <span className="kpi-label">OUT OF STOCK</span>
                    <AlertTriangle size={18} color="#fde047" />
                  </div>
                  <div className="kpi-value">{s.outOfStockCount || 0}</div>
                  <div className="kpi-sub">Needs restocking</div>
                </div>
              </div>

              {/* Row 3: PROFIT OVERVIEW */}
              <div className="profit-overview-panel">
                <div className="profit-header">
                  <div className="profit-title">
                    <span>🔥</span>
                    <span>PROFIT OVERVIEW</span>
                  </div>
                  <div className="profit-margin-box">
                    <div className="profit-margin-label">Profit Margin</div>
                    <div className="profit-margin-val">{s.profitMarginPct || '13.3'}%</div>
                  </div>
                </div>

                <div className="kpi-grid-4" style={{ marginBottom: 0 }}>
                  <div className="profit-subcard">
                    <div className="kpi-top">
                      <span>📊</span>
                      <span className="profit-tag today">TODAY</span>
                    </div>
                    <div className="text-xl font-extrabold my-1">
                      ৳{Number(s.todayProfitTotal || 0).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-500">Daily Profit</div>
                    <div className="profit-card-meta">
                      <span>Sales: ৳{Number(s.todaySalesTotal || 0).toFixed(2)}</span>
                      <span>Cost: ৳{Number(s.todayCostTotal || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="profit-subcard">
                    <div className="kpi-top">
                      <span>📈</span>
                      <span className="profit-tag month">THIS MONTH</span>
                    </div>
                    <div className="text-xl font-extrabold my-1">
                      ৳{Number(s.monthProfitTotal || 0).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-500">Monthly Profit</div>
                    <div className="profit-card-meta">
                      <span>Sales: ৳{Number(s.monthSalesTotal || 0).toFixed(2)}</span>
                      <span>Cost: ৳{Number(s.monthCostTotal || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="profit-subcard">
                    <div className="kpi-top">
                      <span>🎯</span>
                      <span className="profit-tag year">THIS YEAR</span>
                    </div>
                    <div className="text-xl font-extrabold my-1">
                      ৳{Number(s.yearProfitTotal || 0).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-500">Yearly Profit</div>
                    <div className="profit-card-meta">
                      <span>Sales: ৳{Number(s.yearSalesTotal || 0).toFixed(2)}</span>
                      <span>Cost: ৳{Number(s.yearCostTotal || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="profit-subcard">
                    <div className="kpi-top">
                      <span>🏆</span>
                      <span className="profit-tag life">LIFETIME</span>
                    </div>
                    <div className="text-xl font-extrabold my-1">
                      ৳{Number(s.yearProfitTotal || 0).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-500">All-time Profit</div>
                    <div className="profit-card-meta">
                      <span>Sales: ৳{Number(s.yearSalesTotal || 0).toFixed(2)}</span>
                      <span>Cost: ৳{Number(s.yearCostTotal || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Chart.js Monthly Revenue Chart + Top Products Panel */}
              <div className="analytics-row">
                <div className="section-card">
                  <div className="section-card-title">
                    <span>MONTHLY REVENUE (Last 12 Months)</span>
                    <span className="text-[11px] text-emerald-600 font-bold">Chart.js Analytics</span>
                  </div>
                  <RevenueChart monthlyRevenue={monthlyRev} />
                </div>

                {/* TOP PRODUCTS (30d) Panel */}
                <div className="section-card flex flex-col justify-between">
                  <div className="section-card-title">
                    <span>TOP PRODUCTS (30d)</span>
                    <span className="status-pill green">Fast Moving</span>
                  </div>
                  <div className="flex flex-col items-center text-center my-2">
                    <div className="text-4xl leading-none">🔋</div>
                    <div className="text-xs text-slate-500 mt-1">Appears after first sales</div>
                  </div>
                  <div className="space-y-2">
                    {(data?.products || []).slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div>
                          <div className="font-bold text-xs">{p.name}</div>
                          <div className="text-[10.5px] text-slate-500">
                            Wholesale: ৳{p.wholesale_price} | Retail: ৳{p.retail_price}
                          </div>
                        </div>
                        <span className={`status-pill ${p.stock_qty > 0 ? 'green' : 'red'}`}>
                          {p.stock_qty} {p.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 5: QUICK ACTIONS */}
              <div className="section-card mb-4">
                <div className="section-card-title">
                  <span>QUICK ACTIONS</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Common tasks in one click for faster workflow
                  </span>
                </div>
                <div className="quick-actions-grid">
                  <button className="quick-action-btn" onClick={() => setActiveTab('pos')}>
                    <span className="text-2xl">🛒</span>
                    <span className="qa-title">New Sale</span>
                    <span className="qa-sub">Open POS terminal</span>
                  </button>

                  <button className="quick-action-btn" onClick={() => setActiveTab('stock_in')}>
                    <span className="text-2xl">📦</span>
                    <span className="qa-title">Stock In</span>
                    <span className="qa-sub">Add inventory batch</span>
                  </button>

                  <button className="quick-action-btn" onClick={() => setActiveTab('returns')}>
                    <span className="text-2xl">🔄</span>
                    <span className="qa-title">Returns</span>
                    <span className="qa-sub">Add Returns batch</span>
                  </button>

                  <button className="quick-action-btn" onClick={() => setActiveTab('customers')}>
                    <span className="text-2xl">👥</span>
                    <span className="qa-title">Customers</span>
                    <span className="qa-sub">Add Customers batch</span>
                  </button>

                  <button className="quick-action-btn" onClick={() => setActiveTab('reports')}>
                    <span className="text-2xl">📊</span>
                    <span className="qa-title">Reports</span>
                    <span className="qa-sub">View &amp; print reports</span>
                  </button>

                  <button className="quick-action-btn" onClick={() => setActiveTab('attendance')}>
                    <span className="text-2xl">📅</span>
                    <span className="qa-title">Attendance</span>
                    <span className="qa-sub">Mark today</span>
                  </button>

                  <button className="quick-action-btn" onClick={() => setActiveTab('collect_due')}>
                    <span className="text-2xl">📒</span>
                    <span className="qa-title">Collect Due</span>
                    <span className="qa-sub">৳{Number(s.totalCustomerDue || 0).toLocaleString()} receivable</span>
                  </button>

                  <button className="quick-action-btn" onClick={() => setShowSmeFeaturesModal(true)}>
                    <span className="text-2xl">💡</span>
                    <span className="qa-title">SME Model Info</span>
                    <span className="qa-sub">Why built for SMEs only</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ================= 2. POS SALES TERMINAL ================= */}
          {activeTab === 'pos' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">POS SALES TERMINAL (RETAIL &amp; WHOLESALE)</h1>
                  <div className="page-subtitle">
                    Barcode/search billing, automatic Wholesale tier pricing, and partial Baki (Due) + bKash/Nagad checkout
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className={`btn ${posSaleType === 'Retail' ? 'btn-red' : 'btn-outline'}`}
                    onClick={() => setPosSaleType('Retail')}
                  >
                    Retail Counter Rate
                  </button>
                  <button
                    className={`btn ${posSaleType === 'Wholesale' ? 'btn-green' : 'btn-outline'}`}
                    onClick={() => setPosSaleType('Wholesale')}
                  >
                    Wholesale / Dealer Rate (Paikari)
                  </button>
                </div>
              </div>

              <div className="pos-grid">
                {/* Left: Product Catalog Selector */}
                <div className="section-card">
                  <div className="flex gap-2.5 mb-3">
                    <div className="relative flex-1">
                      <input
                        className="form-input w-full pl-9"
                        placeholder="Scan Barcode or Search by Product Name / SKU / Bangla Name..."
                        value={posSearch}
                        onChange={(e) => setPosSearch(e.target.value)}
                      />
                      <Search size={15} color="#94a3b8" className="absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div className="pos-product-grid">
                    {(data?.products || [])
                      .filter(
                        (p) =>
                          p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
                          p.sku.toLowerCase().includes(posSearch.toLowerCase()) ||
                          (p.barcode || '').includes(posSearch) ||
                          (p.name_bn || '').includes(posSearch)
                      )
                      .map((p) => {
                        const activePrice = posSaleType === 'Wholesale' ? p.wholesale_price : p.retail_price;
                        return (
                          <div
                            key={p.id}
                            className={`pos-item-card ${p.stock_qty <= 0 ? 'out-of-stock' : ''}`}
                            onClick={() => addToPosCart(p)}
                          >
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10.5px] font-bold text-slate-500">{p.sku}</span>
                                <span className={`status-pill ${p.stock_qty > 0 ? 'green' : 'red'}`}>
                                  {p.stock_qty > 0 ? `${p.stock_qty} ${p.unit}` : 'Out of Stock'}
                                </span>
                              </div>
                              <div className="font-bold text-xs text-slate-900 mb-0.5">{p.name}</div>
                              {p.name_bn && <div className="text-[11px] text-slate-600 mb-1.5">{p.name_bn}</div>}
                            </div>
                            <div className="border-t border-dashed border-slate-200 pt-2 mt-1.5 flex justify-between items-end">
                              <div>
                                <div className="text-[10px] text-slate-500">{posSaleType} Price</div>
                                <div className="text-base font-extrabold text-[#0f7a43]">৳{activePrice}</div>
                              </div>
                              {p.warranty_months > 0 && (
                                <span className="status-pill blue">{p.warranty_months}m Warranty</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Right: Cart & Baki/MFS Checkout */}
                <div className="section-card flex flex-col justify-between">
                  <div>
                    <div className="section-card-title">
                      <span>CURRENT INVOICE CART ({posSaleType.toUpperCase()})</span>
                      {posCart.length > 0 && (
                        <button className="btn btn-outline py-1 px-2 text-xs" onClick={() => setPosCart([])}>
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">Select Customer (For Baki / Khata Credit Tracking)</label>
                      <select
                        className="form-select"
                        value={posCustomerId}
                        onChange={(e) => setPosCustomerId(e.target.value)}
                      >
                        {(data?.customers || []).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.shop_name || c.name} ({c.phone}) — Current Baki: ৳{c.current_due}
                          </option>
                        ))}
                      </select>
                    </div>

                    {posCart.length === 0 ? (
                      <div className="py-9 px-4 text-center text-slate-400 border border-dashed border-slate-300 rounded-xl mb-3">
                        Click any product card on the left to add to invoice
                      </div>
                    ) : (
                      <div className="table-wrap mb-3 max-h-60 overflow-y-auto">
                        <table className="erp-table">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Qty</th>
                              <th>Rate (৳)</th>
                              <th>Total</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {posCart.map((item) => (
                              <tr key={item.productId}>
                                <td>
                                  <div className="font-bold text-xs">{item.name}</div>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    min="1"
                                    max={item.maxStock}
                                    className="form-input w-16 py-1 px-1.5"
                                    value={item.qty}
                                    onChange={(e) => {
                                      const q = Math.max(1, Math.min(item.maxStock, Number(e.target.value || 1)));
                                      setPosCart((prev) =>
                                        prev.map((x) => (x.productId === item.productId ? { ...x, qty: q } : x))
                                      );
                                    }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-input w-20 py-1 px-1.5"
                                    value={item.price}
                                    onChange={(e) => {
                                      const pr = Math.max(0, Number(e.target.value || 0));
                                      setPosCart((prev) =>
                                        prev.map((x) => (x.productId === item.productId ? { ...x, price: pr } : x))
                                      );
                                    }}
                                  />
                                </td>
                                <td className="font-bold">৳{(item.qty * item.price).toLocaleString()}</td>
                                <td>
                                  <button
                                    className="text-rose-600 hover:text-rose-800"
                                    onClick={() => setPosCart((prev) => prev.filter((x) => x.productId !== item.productId))}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-slate-500">Subtotal:</span>
                        <span className="font-bold">৳{posSubtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-slate-500">Discount (৳):</span>
                        <input
                          type="number"
                          className="form-input w-24 py-1 px-2 text-right"
                          value={posDiscount}
                          onChange={(e) => setPosDiscount(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-500">VAT ({posVatRate}%):</span>
                        <span className="font-semibold">৳{posVatAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-300 pt-2 mb-2.5">
                        <span>Net Payable:</span>
                        <span className="text-[#0f7a43]">৳{posGrandTotal.toLocaleString()}</span>
                      </div>

                      <div className="form-grid mb-2">
                        <div className="form-group">
                          <label className="form-label">Payment Channel</label>
                          <select
                            className="form-select"
                            value={posPaymentMethod}
                            onChange={(e) => setPosPaymentMethod(e.target.value)}
                          >
                            <option value="Cash">💵 Cash (Showroom Galla)</option>
                            <option value="bKash">📱 bKash Merchant</option>
                            <option value="Nagad">📱 Nagad Uddokta</option>
                            <option value="Bank">🏦 Bank Transfer / Cheque</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Paid Now (Blank = Full Paid)</label>
                          <input
                            type="number"
                            className="form-input"
                            placeholder={`৳${posGrandTotal} (Full)`}
                            value={posPaidAmount}
                            onChange={(e) => setPosPaidAmount(e.target.value)}
                          />
                        </div>
                      </div>

                      {(posPaymentMethod === 'bKash' || posPaymentMethod === 'Nagad') && (
                        <div className="form-group mb-2">
                          <label className="form-label">{posPaymentMethod} TrxID / Reference</label>
                          <input
                            className="form-input"
                            placeholder="e.g. BK98231M"
                            value={posMfsTrxId}
                            onChange={(e) => setPosMfsTrxId(e.target.value)}
                          />
                        </div>
                      )}

                      {posDueRemaining > 0 && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-600 p-2 rounded-lg text-xs font-bold mb-2">
                          📒 Baki / Credit Added to Customer Khata: ৳{posDueRemaining.toLocaleString()}
                        </div>
                      )}

                      <button
                        className="btn btn-green w-full py-2.5 text-sm"
                        onClick={handleCheckoutSale}
                      >
                        <Printer size={16} /> Complete Sale &amp; Print Receipt
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= 3. PRODUCTS CATALOG (ADD, EDIT/UPDATE, DELETE) ================= */}
          {activeTab === 'products' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">PRODUCTS CATALOG (ADD, EDIT/UPDATE &amp; DELETE)</h1>
                  <div className="page-subtitle">
                    Manage SME inventory, wholesale vs. retail rates, stock quantities, and warranty months
                  </div>
                </div>
              </div>

              <div className="section-card mb-4">
                <div className="section-card-title">ADD NEW SME PRODUCT</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Product Name (English)</label>
                    <input
                      className="form-input"
                      placeholder={tenantId === 'amarfood' ? 'e.g. Fresh Hilsha Fish 1kg' : 'e.g. PowerCell 12V 9Ah Battery'}
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bangla Name (বাংলা নাম)</label>
                    <input
                      className="form-input"
                      placeholder={tenantId === 'amarfood' ? 'পদ্মার ইলিশ মাছ ১ কেজি' : 'পাওয়ারসেল ১২ভোল্ট ব্যাটারি'}
                      value={newProduct.nameBn}
                      onChange={(e) => setNewProduct({ ...newProduct, nameBn: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category / Product Type</label>
                    <select
                      className="form-select"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    >
                      {tenantId === 'amarfood' ? (
                        <>
                          <option value="Fish & Seafood">Fish &amp; Seafood (মাছ)</option>
                          <option value="Meat & Poultry">Meat &amp; Poultry (মাংস)</option>
                          <option value="Rice & Grains">Rice &amp; Grains (চাল)</option>
                          <option value="Dal & Pulses">Dal &amp; Pulses (ডাল)</option>
                          <option value="Cooking Oil">Cooking Oil (ভোজ্য তেল)</option>
                          <option value="Spices & Masala">Spices &amp; Masala (মসলা)</option>
                          <option value="Dairy & Ghee">Dairy &amp; Ghee (ঘি ও দুগ্ধজাত)</option>
                          <option value="Kitchen Essentials">Kitchen Essentials (রান্নাঘরের পণ্য)</option>
                          <option value="Tea & Beverage">Tea &amp; Beverage (চা ও পানীয়)</option>
                        </>
                      ) : (
                        <>
                          <option value="UPS/IPS Battery">UPS/IPS Battery</option>
                          <option value="Tubular Battery">Tubular Battery</option>
                          <option value="Lithium Cell">Lithium Cell</option>
                          <option value="IPS & Inverter">IPS &amp; Inverter</option>
                          <option value="Solar Panel">Solar Panel</option>
                          <option value="Chargers">Chargers</option>
                          <option value="LED & Lighting">LED &amp; Lighting</option>
                          <option value="Cables & Wire">Cables &amp; Wire</option>
                          <option value="Voltage Stabilizer">Voltage Stabilizer</option>
                          <option value="Cooling & Fan">Cooling &amp; Fan</option>
                          <option value="Switch & Socket">Switch &amp; Socket</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <select
                      className="form-select"
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    >
                      <option value="Kg">Kg</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Pack">Pack</option>
                      <option value="Bag">Bag</option>
                      <option value="Sack">Sack</option>
                      <option value="Jar">Jar</option>
                      <option value="Bottle">Bottle</option>
                      <option value="Pouch">Pouch</option>
                      <option value="Tin">Tin</option>
                      <option value="Unit">Unit</option>
                      <option value="Coil">Coil</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU / Code</label>
                    <input
                      className="form-input"
                      placeholder={tenantId === 'amarfood' ? 'AF-FSH-01' : 'PC-BAT-9AH'}
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purchase Cost (৳)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="110"
                      value={newProduct.purchasePrice}
                      onChange={(e) => setNewProduct({ ...newProduct, purchasePrice: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Wholesale Price (৳)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="135"
                      value={newProduct.wholesalePrice}
                      onChange={(e) => setNewProduct({ ...newProduct, wholesalePrice: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Retail Counter Price (৳)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="150"
                      value={newProduct.retailPrice}
                      onChange={(e) => setNewProduct({ ...newProduct, retailPrice: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Opening Stock Qty (0 = Out of Stock)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="50"
                      value={newProduct.stockQty}
                      onChange={(e) => setNewProduct({ ...newProduct, stockQty: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  className="btn btn-green"
                  onClick={() => {
                    if (!newProduct.name) return showNotice('Enter product name first');
                    runAction('ADD_PRODUCT', newProduct, `Added "${newProduct.name}" to catalog!`);
                    setNewProduct({ ...newProduct, name: '', nameBn: '', sku: '', purchasePrice: '', retailPrice: '', wholesalePrice: '', stockQty: '' });
                  }}
                >
                  <Plus size={15} /> Save Product to Catalog
                </button>
              </div>

              <div className="section-card">
                <div className="section-card-title">LIVE PRODUCT INVENTORY ({data?.products?.length || 0} ITEMS)</div>
                <div className="table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Purchase Cost</th>
                        <th>Wholesale Rate</th>
                        <th>Retail Rate</th>
                        <th>In Stock</th>
                        <th>Stock Value</th>
                        <th>Actions (Edit / Delete)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.products || []).map((p) => (
                        <tr key={p.id}>
                          <td className="font-bold">{p.sku}</td>
                          <td>
                            <div className="font-bold">{p.name}</div>
                            {p.name_bn && <div className="text-[11px] text-slate-500">{p.name_bn}</div>}
                          </td>
                          <td>{p.category}</td>
                          <td>৳{Number(p.purchase_price).toLocaleString()}</td>
                          <td className="font-bold text-[#0f7a43]">
                            ৳{Number(p.wholesale_price).toLocaleString()}
                          </td>
                          <td className="font-bold">৳{Number(p.retail_price).toLocaleString()}</td>
                          <td>
                            <span className={`status-pill ${p.stock_qty <= 0 ? 'red' : p.stock_qty <= p.alert_qty ? 'amber' : 'green'}`}>
                              {p.stock_qty} {p.unit}
                            </span>
                          </td>
                          <td className="font-bold">৳{(p.stock_qty * p.purchase_price).toLocaleString()}</td>
                          <td>
                            <div className="flex gap-1.5">
                              <button
                                className="btn btn-outline py-1 px-2 text-xs"
                                onClick={() =>
                                  setEditingProduct({
                                    id: p.id,
                                    sku: p.sku,
                                    name: p.name,
                                    nameBn: p.name_bn || '',
                                    category: p.category,
                                    unit: p.unit,
                                    purchasePrice: p.purchase_price,
                                    wholesalePrice: p.wholesale_price,
                                    retailPrice: p.retail_price,
                                    stockQty: p.stock_qty,
                                    warrantyMonths: p.warranty_months || 0
                                  })
                                }
                              >
                                <Pencil size={12} /> Edit
                              </button>
                              <button
                                className="btn btn-outline py-1 px-2 text-xs text-rose-600"
                                onClick={() => runAction('DELETE_PRODUCT', { id: p.id }, `Deleted ${p.name}`)}
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ================= 4. STOCK IN & 5. STOCK ADJUST ================= */}
          {(activeTab === 'stock_in' || activeTab === 'stock_adjust') && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">
                    {activeTab === 'stock_in' ? 'STOCK IN (SUPPLIER CHALLAN & BATCH ENTRY)' : 'STOCK ADJUSTMENT (DAMAGE / AUDIT)'}
                  </h1>
                  <div className="page-subtitle">Real-time inventory batch tracking with automatic purchase valuation update</div>
                </div>
              </div>

              <div className="section-card mb-4">
                <div className="section-card-title">
                  {activeTab === 'stock_in' ? 'RECEIVE NEW INVENTORY BATCH' : 'RECORD STOCK ADJUSTMENT / DAMAGE'}
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Select Product</label>
                    <select
                      className="form-select"
                      value={stockMoveForm.productId}
                      onChange={(e) => {
                        const prod = data?.products?.find((x) => String(x.id) === e.target.value);
                        setStockMoveForm({
                          ...stockMoveForm,
                          productId: e.target.value,
                          unitCost: prod ? prod.purchase_price : ''
                        });
                      }}
                    >
                      {(data?.products || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock_qty} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Movement Type</label>
                    <select
                      className="form-select"
                      value={activeTab === 'stock_in' ? 'STOCK_IN' : stockMoveForm.movementType}
                      onChange={(e) => setStockMoveForm({ ...stockMoveForm, movementType: e.target.value })}
                    >
                      <option value="STOCK_IN">📦 Stock In (Supplier Purchase Challan)</option>
                      <option value="ADJUST_ADD">➕ Stock Adjust (Found / Surplus Stock)</option>
                      <option value="ADJUST_DAMAGE">➖ Stock Adjust (Broken / Transit Damage)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      className="form-input"
                      value={stockMoveForm.qty}
                      onChange={(e) => setStockMoveForm({ ...stockMoveForm, qty: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit Purchase Cost (৳)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={stockMoveForm.unitCost}
                      onChange={(e) => setStockMoveForm({ ...stockMoveForm, unitCost: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Supplier Challan / Adjustment Note</label>
                    <input
                      className="form-input"
                      value={stockMoveForm.supplierOrReason}
                      onChange={(e) => setStockMoveForm({ ...stockMoveForm, supplierOrReason: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  className="btn btn-green"
                  onClick={() =>
                    runAction(
                      'STOCK_MOVEMENT',
                      {
                        ...stockMoveForm,
                        movementType: activeTab === 'stock_in' ? 'STOCK_IN' : stockMoveForm.movementType
                      },
                      'Stock batch movement recorded!'
                    )
                  }
                >
                  <PackagePlus size={15} /> Confirm Stock Movement
                </button>
              </div>

              <div className="section-card">
                <div className="section-card-title">STOCK BATCH &amp; ADJUSTMENT HISTORY</div>
                <div className="table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Batch Code</th>
                        <th>Date</th>
                        <th>Product</th>
                        <th>Type</th>
                        <th>Qty</th>
                        <th>Unit Cost</th>
                        <th>Supplier Challan / Reason</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.stockBatches || []).map((b) => (
                        <tr key={b.id}>
                          <td className="font-bold">{b.batch_code}</td>
                          <td>{b.created_date}</td>
                          <td className="font-semibold">{b.product_name}</td>
                          <td>
                            <span className={`status-pill ${b.qty < 0 ? 'red' : 'green'}`}>{b.movement_type}</span>
                          </td>
                          <td className={`font-extrabold ${b.qty < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {b.qty > 0 ? `+${b.qty}` : b.qty}
                          </td>
                          <td>৳{b.unit_cost}</td>
                          <td>{b.supplier_or_reason}</td>
                          <td>
                            <button
                              className="btn btn-outline py-1 px-2 text-xs text-rose-600"
                              onClick={() => runAction('DELETE_STOCK_BATCH', { id: b.id }, `Deleted batch ${b.batch_code}`)}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ================= 6. CUSTOMERS & 11. COLLECT DUE (BAKI / KHATA) ================= */}
          {(activeTab === 'customers' || activeTab === 'collect_due') && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">
                    {activeTab === 'collect_due'
                      ? 'COLLECT DUE — SME BAKI / KHATA CREDIT RECOVERY'
                      : 'CUSTOMERS & DEALER BAKI KHATA (ADD, EDIT & DELETE)'}
                  </h1>
                  <div className="page-subtitle">
                    SME Relationship Credit Management with Credit Limits, Partial Installments &amp; WhatsApp Reminders
                  </div>
                </div>
                <div className="status-pill red text-xs py-1.5 px-3">
                  Total Market Baki Receivable: ৳{Number(s.totalCustomerDue || 0).toLocaleString()}
                </div>
              </div>

              <div className="analytics-row">
                {/* Collect Baki Payment Form */}
                <div className="section-card">
                  <div className="section-card-title">
                    <span>📒 RECORD BAKI / DUE INSTALLMENT COLLECTION</span>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Select Customer</label>
                      <select
                        className="form-select"
                        value={dueCollectionForm.customerId}
                        onChange={(e) => setDueCollectionForm({ ...dueCollectionForm, customerId: e.target.value })}
                      >
                        {(data?.customers || []).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.shop_name || c.name} — Current Due: ৳{Number(c.current_due).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Collection Amount (৳)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="5000"
                        value={dueCollectionForm.amount}
                        onChange={(e) => setDueCollectionForm({ ...dueCollectionForm, amount: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Payment Method</label>
                      <select
                        className="form-select"
                        value={dueCollectionForm.paymentMethod}
                        onChange={(e) => setDueCollectionForm({ ...dueCollectionForm, paymentMethod: e.target.value })}
                      >
                        <option value="bKash">📱 bKash Merchant</option>
                        <option value="Nagad">📱 Nagad Uddokta</option>
                        <option value="Cash">💵 Cash (Showroom Galla)</option>
                        <option value="Bank">🏦 Bank Deposit</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Reference Note</label>
                      <input
                        className="form-input"
                        value={dueCollectionForm.referenceNote}
                        onChange={(e) => setDueCollectionForm({ ...dueCollectionForm, referenceNote: e.target.value })}
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-green"
                    onClick={() => {
                      if (!dueCollectionForm.amount) return showNotice('Enter collection amount');
                      runAction('COLLECT_DUE', dueCollectionForm, 'Baki installment collected!');
                      setDueCollectionForm({ ...dueCollectionForm, amount: '' });
                    }}
                  >
                    <HandCoins size={15} /> Collect Due &amp; Update Khata
                  </button>
                </div>

                {/* Add New Customer */}
                <div className="section-card">
                  <div className="section-card-title">ADD NEW WHOLESALE / RETAIL CUSTOMER</div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Shop / Business Name</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Padma Battery & IPS"
                        value={newCustomer.shopName}
                        onChange={(e) => setNewCustomer({ ...newCustomer, shopName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Proprietor Name</label>
                      <input
                        className="form-input"
                        placeholder="Md. Harun"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        className="form-input"
                        placeholder="01711-XXXXXX"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Opening Due / Baki (৳)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={newCustomer.openingDue}
                        onChange={(e) => setNewCustomer({ ...newCustomer, openingDue: e.target.value })}
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-red"
                    onClick={() => {
                      if (!newCustomer.name || !newCustomer.phone) return showNotice('Enter customer name and phone');
                      runAction('ADD_CUSTOMER', newCustomer, 'Customer added to directory!');
                      setNewCustomer({ ...newCustomer, name: '', shopName: '', phone: '', openingDue: 0 });
                    }}
                  >
                    <Plus size={15} /> Register Customer
                  </button>
                </div>
              </div>

              {/* Customer Directory Table with Edit & Delete */}
              <div className="section-card mb-4">
                <div className="section-card-title">CUSTOMER BAKI KHATA DIRECTORY</div>
                <div className="table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Shop / Customer Name</th>
                        <th>Type</th>
                        <th>Phone</th>
                        <th>Credit Limit</th>
                        <th>Current Baki (Due)</th>
                        <th>Reminder</th>
                        <th>Actions (Edit / Delete)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.customers || []).map((c) => (
                        <tr key={c.id}>
                          <td>
                            <div className="font-bold">{c.shop_name || c.name}</div>
                            <div className="text-[11px] text-slate-500">Prop: {c.name} • {c.address}</div>
                          </td>
                          <td>
                            <span className="status-pill blue">{c.customer_type}</span>
                          </td>
                          <td className="font-semibold">{c.phone}</td>
                          <td>৳{Number(c.credit_limit).toLocaleString()}</td>
                          <td className={`font-extrabold text-sm ${c.current_due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            ৳{Number(c.current_due).toLocaleString()}
                          </td>
                          <td>
                            {c.current_due > 0 ? (
                              <button
                                className="btn btn-sme-badge py-1 px-2.5 text-xs"
                                onClick={() => sendWhatsAppBakiReminder(c)}
                              >
                                <MessageSquare size={12} /> Reminder
                              </button>
                            ) : (
                              <span className="text-xs text-emerald-600 font-bold">✓ Clear</span>
                            )}
                          </td>
                          <td>
                            <div className="flex gap-1.5">
                              <button
                                className="btn btn-outline py-1 px-2 text-xs"
                                onClick={() =>
                                  setEditingCustomer({
                                    id: c.id,
                                    name: c.name,
                                    shopName: c.shop_name || '',
                                    phone: c.phone,
                                    address: c.address || '',
                                    customerType: c.customer_type,
                                    creditLimit: c.credit_limit,
                                    currentDue: c.current_due
                                  })
                                }
                              >
                                <Pencil size={12} /> Edit
                              </button>
                              <button
                                className="btn btn-outline py-1 px-2 text-xs text-rose-600"
                                onClick={() => runAction('DELETE_CUSTOMER', { id: c.id }, 'Customer removed')}
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Money Receipts History */}
              <div className="section-card">
                <div className="section-card-title">RECENT DUE COLLECTION MONEY RECEIPTS (BAKI RECOVERY)</div>
                <div className="table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Receipt No</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Collected Amount</th>
                        <th>Channel</th>
                        <th>Reference Note</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.dueCollections || []).map((d) => (
                        <tr key={d.id}>
                          <td className="font-bold">{d.receipt_no}</td>
                          <td>{d.collection_date}</td>
                          <td className="font-bold">{d.customer_name}</td>
                          <td className="font-extrabold text-emerald-600">+৳{Number(d.amount).toLocaleString()}</td>
                          <td><span className="status-pill green">{d.payment_method}</span></td>
                          <td>{d.reference_note}</td>
                          <td>
                            <button
                              className="btn btn-outline py-1 px-2 text-xs text-rose-600"
                              onClick={() => runAction('DELETE_DUE_COLLECTION', { id: d.id }, `Deleted money receipt ${d.receipt_no}`)}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ================= 7. RETURNS & 8. REPLACEMENTS ================= */}
          {(activeTab === 'returns' || activeTab === 'replacements') && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">
                    {activeTab === 'replacements'
                      ? 'WARRANTY REPLACEMENTS & SERIAL CLAIM TRACKER'
                      : 'SALES RETURNS & DAMAGED GOODS RETURN'}
                  </h1>
                  <div className="page-subtitle">
                    Verify serial numbers and warranty periods before issuing replacements
                  </div>
                </div>
              </div>

              <div className="section-card mb-4">
                <div className="section-card-title">
                  LOG NEW {activeTab === 'replacements' ? 'WARRANTY REPLACEMENT CLAIM' : 'SALES RETURN'}
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Record Type</label>
                    <select
                      className="form-select"
                      value={returnForm.recordType}
                      onChange={(e) => setReturnForm({ ...returnForm, recordType: e.target.value })}
                    >
                      <option value="RETURN">🔄 Sales Return</option>
                      <option value="REPLACEMENT">🛡️ Warranty Replacement</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Invoice No</label>
                    <input
                      className="form-input"
                      value={returnForm.invoiceNo}
                      onChange={(e) => setReturnForm({ ...returnForm, invoiceNo: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Customer Name</label>
                    <input
                      className="form-input"
                      value={returnForm.customerName}
                      onChange={(e) => setReturnForm({ ...returnForm, customerName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Product</label>
                    <select
                      className="form-select"
                      value={returnForm.productId}
                      onChange={(e) => setReturnForm({ ...returnForm, productId: e.target.value })}
                    >
                      {(data?.products || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Serial / Batch No</label>
                    <input
                      className="form-input"
                      placeholder="SN-PC12V-99812"
                      value={returnForm.serialNo}
                      onChange={(e) => setReturnForm({ ...returnForm, serialNo: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      className="form-input"
                      value={returnForm.qty}
                      onChange={(e) => setReturnForm({ ...returnForm, qty: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reason</label>
                    <input
                      className="form-input"
                      value={returnForm.reason}
                      onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  className="btn btn-red"
                  onClick={() =>
                    runAction('CREATE_RETURN_OR_REPLACEMENT', returnForm, 'Claim recorded and stock updated!')
                  }
                >
                  <ShieldCheck size={15} /> Submit Claim
                </button>
              </div>

              <div className="section-card">
                <div className="section-card-title">RETURNS &amp; REPLACEMENTS REGISTER</div>
                <div className="table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Claim No</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Invoice</th>
                        <th>Customer</th>
                        <th>Product</th>
                        <th>Serial No</th>
                        <th>Qty</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.returnsReplacements || []).map((r) => (
                        <tr key={r.id}>
                          <td className="font-bold">{r.claim_no}</td>
                          <td>{r.created_date}</td>
                          <td>
                            <span className={`status-pill ${r.record_type === 'REPLACEMENT' ? 'purple' : 'amber'}`}>
                              {r.record_type}
                            </span>
                          </td>
                          <td>{r.invoice_no}</td>
                          <td className="font-semibold">{r.customer_name}</td>
                          <td>{r.product_name}</td>
                          <td className="font-mono font-bold">{r.serial_no}</td>
                          <td>{r.qty}</td>
                          <td>
                            <button
                              className="btn btn-outline py-1 px-2 text-xs text-rose-600"
                              onClick={() => runAction('DELETE_RETURN', { id: r.id }, 'Deleted claim record')}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ================= 9. SALES HISTORY & 10. MANAGE SALES ================= */}
          {(activeTab === 'sales_history' || activeTab === 'manage_sales') && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">
                    {activeTab === 'manage_sales' ? 'MANAGE SALES & INVOICE RECORDS' : 'SALES HISTORY & RECEIPTS'}
                  </h1>
                  <div className="page-subtitle">
                    View, print bilingual receipts, or delete sales invoices
                  </div>
                </div>
                <button className="btn btn-red" onClick={() => setActiveTab('pos')}>
                  <ShoppingCart size={15} /> + Create New POS Invoice
                </button>
              </div>

              <div className="section-card">
                <div className="section-card-title">ALL RECORDED INVOICES ({data?.sales?.length || 0})</div>
                <div className="table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Invoice No</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Tier</th>
                        <th>Total Bill</th>
                        <th>Paid</th>
                        <th>Baki (Due)</th>
                        <th>Profit</th>
                        <th>Payment</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.sales || []).map((sale) => (
                        <tr key={sale.id}>
                          <td className="font-extrabold">{sale.invoice_no}</td>
                          <td>{sale.sale_date}</td>
                          <td className="font-semibold">{sale.customer_name}</td>
                          <td>
                            <span className={`status-pill ${sale.sale_type === 'Wholesale' ? 'purple' : 'blue'}`}>
                              {sale.sale_type}
                            </span>
                          </td>
                          <td className="font-extrabold">৳{Number(sale.total_amount).toLocaleString()}</td>
                          <td className="text-emerald-600 font-bold">৳{Number(sale.paid_amount).toLocaleString()}</td>
                          <td className={`font-bold ${sale.due_amount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            ৳{Number(sale.due_amount).toLocaleString()}
                          </td>
                          <td className="text-[#0f7a43] font-bold">+৳{Number(sale.profit_amount).toLocaleString()}</td>
                          <td>
                            <span className="status-pill green">{sale.payment_method}</span>
                          </td>
                          <td>
                            <div className="flex gap-1.5">
                              <button
                                className="btn btn-outline py-1 px-2 text-xs"
                                onClick={() => {
                                  let parsedItems = [];
                                  try {
                                    parsedItems = JSON.parse(sale.items_json || '[]');
                                  } catch (_) {}
                                  setPrintInvoice({
                                    invoiceNo: sale.invoice_no,
                                    date: sale.sale_date,
                                    customerName: sale.customer_name,
                                    customerPhone: sale.customer_phone,
                                    saleType: sale.sale_type,
                                    items: parsedItems,
                                    subtotal: sale.subtotal,
                                    discount: sale.discount,
                                    vatAmount: sale.vat_amount,
                                    totalAmount: sale.total_amount,
                                    paidAmount: sale.paid_amount,
                                    dueAmount: sale.due_amount,
                                    paymentMethod: sale.payment_method
                                  });
                                }}
                              >
                                <Printer size={12} /> Print
                              </button>
                              <button
                                className="btn btn-outline py-1 px-2 text-xs text-rose-600"
                                onClick={() => runAction('DELETE_SALE', { id: sale.id }, `Deleted invoice ${sale.invoice_no}`)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ================= 12. FINANCE, 13. BANK DEPOSIT & 16. ACCOUNTS ================= */}
          {(activeTab === 'finance' || activeTab === 'bank_deposit' || activeTab === 'accounts') && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">
                    {activeTab === 'bank_deposit'
                      ? 'BANK DEPOSIT & GALLA-TO-BANK TRANSFER'
                      : activeTab === 'accounts'
                        ? 'SME ACCOUNTS (CASH GALLA, BKASH, NAGAD & BANK)'
                        : 'FINANCE & SME CASHBOOK'}
                  </h1>
                  <div className="page-subtitle">
                    Track Showroom Cash Drawer (Galla), bKash/Nagad Merchant &amp; Bank balances live
                  </div>
                </div>
              </div>

              <div className="kpi-grid-4">
                {(data?.financeAccounts || []).map((acc) => (
                  <div key={acc.id} className="kpi-card">
                    <div className="kpi-top">
                      <span className="kpi-label">{acc.account_type}</span>
                      <Wallet size={17} color="#0f7a43" />
                    </div>
                    <div className="kpi-value">৳{Number(acc.balance).toLocaleString()}</div>
                    <div className="font-bold text-xs text-slate-900">{acc.account_name}</div>
                    <div className="kpi-sub">{acc.account_number}</div>
                  </div>
                ))}
              </div>

              <div className="section-card mb-4">
                <div className="section-card-title">RECORD DAILY EXPENSE, INCOME OR BANK DEPOSIT</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Transaction Type</label>
                    <select
                      className="form-select"
                      value={financeForm.trxType}
                      onChange={(e) => setFinanceForm({ ...financeForm, trxType: e.target.value })}
                    >
                      <option value="EXPENSE">➖ Daily Shop Expense</option>
                      <option value="BANK_DEPOSIT">🏦 Bank Deposit (Galla to Bank)</option>
                      <option value="INCOME">➕ Other Income</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      className="form-input"
                      value={financeForm.category}
                      onChange={(e) => setFinanceForm({ ...financeForm, category: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Account / Wallet</label>
                    <select
                      className="form-select"
                      value={financeForm.accountName}
                      onChange={(e) => setFinanceForm({ ...financeForm, accountName: e.target.value })}
                    >
                      {(data?.financeAccounts || []).map((a) => (
                        <option key={a.id} value={a.account_name}>
                          {a.account_name} (৳{Number(a.balance).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount (৳)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="2500"
                      value={financeForm.amount}
                      onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input
                      className="form-input"
                      placeholder="Voucher details"
                      value={financeForm.description}
                      onChange={(e) => setFinanceForm({ ...financeForm, description: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  className="btn btn-green"
                  onClick={() => {
                    if (!financeForm.amount) return showNotice('Enter amount');
                    runAction('ADD_FINANCE_TRX', financeForm, 'Cashbook transaction saved!');
                    setFinanceForm({ ...financeForm, amount: '', description: '' });
                  }}
                >
                  <Plus size={15} /> Post to Cashbook
                </button>
              </div>

              <div className="section-card">
                <div className="section-card-title">DAILY CASHBOOK LEDGER</div>
                <div className="table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Voucher</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Account</th>
                        <th>Amount</th>
                        <th>Description</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.financeTransactions || []).map((t) => {
                        const isPos = t.trx_type === 'INCOME' || t.trx_type === 'DUE_COLLECTION' || t.trx_type === 'BANK_DEPOSIT';
                        return (
                          <tr key={t.id}>
                            <td className="font-bold">{t.trx_code}</td>
                            <td>{t.trx_date}</td>
                            <td>
                              <span className={`status-pill ${isPos ? 'green' : 'red'}`}>{t.trx_type}</span>
                            </td>
                            <td className="font-semibold">{t.category}</td>
                            <td>{t.account_name}</td>
                            <td className={`font-extrabold ${isPos ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {isPos ? '+' : '-'}৳{Number(t.amount).toLocaleString()}
                            </td>
                            <td>{t.description}</td>
                            <td>
                              <button
                                className="btn btn-outline py-1 px-2 text-xs text-rose-600"
                                onClick={() => runAction('DELETE_FINANCE_TRX', { id: t.id }, 'Deleted transaction')}
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ================= 14. REPORTS & 15. STATEMENTS ================= */}
          {(activeTab === 'reports' || activeTab === 'statements') && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">
                    {activeTab === 'statements' ? 'FINANCIAL STATEMENTS & PROFIT/LOSS' : 'BUSINESS ANALYTICS & REPORTS'}
                  </h1>
                  <div className="page-subtitle">Real-time profitability, inventory valuation, and receivable summary</div>
                </div>
                <button className="btn btn-outline" onClick={() => window.print()}>
                  <Printer size={14} /> Print Report
                </button>
              </div>

              <div className="section-card mb-4">
                <div className="section-card-title">MONTHLY REVENUE &amp; PROFIT CHART (CHART.JS)</div>
                <RevenueChart monthlyRevenue={monthlyRev} />
              </div>

              <div className="section-card">
                <div className="section-card-title">12-MONTH REVENUE, COST &amp; PROFIT STATEMENT</div>
                <div className="table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Gross Sales Revenue</th>
                        <th>Cost of Goods (COGS)</th>
                        <th>Gross Profit</th>
                        <th>Margin (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyRev.map((m) => (
                        <tr key={m.month_key}>
                          <td className="font-bold">{m.month_label} ({m.month_key})</td>
                          <td className="font-bold">৳{Number(m.revenue).toLocaleString()}</td>
                          <td>৳{Number(m.cost).toLocaleString()}</td>
                          <td className="font-extrabold text-emerald-600">৳{Number(m.profit).toLocaleString()}</td>
                          <td>
                            <span className="status-pill green">
                              {((Number(m.profit) / Number(m.revenue || 1)) * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ================= 17. PRODUCTION & LIGHT ASSEMBLY ================= */}
          {activeTab === 'production' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">SME LIGHT PRODUCTION &amp; REPACKAGING</h1>
                  <div className="page-subtitle">
                    Convert bulk raw materials into packaged finished units with automatic unit costing
                  </div>
                </div>
              </div>

              <div className="section-card mb-4">
                <div className="section-card-title">CREATE NEW PRODUCTION / PACKAGING BATCH</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Finished Output Product</label>
                    <select
                      className="form-select"
                      value={productionForm.finishedProductId}
                      onChange={(e) => setProductionForm({ ...productionForm, finishedProductId: e.target.value })}
                    >
                      {(data?.products || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Output Quantity</label>
                    <input
                      type="number"
                      className="form-input"
                      value={productionForm.targetQty}
                      onChange={(e) => setProductionForm({ ...productionForm, targetQty: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Raw Materials Cost (৳)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={productionForm.rawCost}
                      onChange={(e) => setProductionForm({ ...productionForm, rawCost: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Labor &amp; Packaging Cost (৳)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={productionForm.laborPackagingCost}
                      onChange={(e) => setProductionForm({ ...productionForm, laborPackagingCost: e.target.value })}
                    />
                  </div>
                  <div className="form-group col-span-2">
                    <label className="form-label">Raw Materials Used</label>
                    <input
                      className="form-input"
                      value={productionForm.rawMaterialsText}
                      onChange={(e) => setProductionForm({ ...productionForm, rawMaterialsText: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  className="btn btn-green"
                  onClick={() =>
                    runAction('CREATE_PRODUCTION', productionForm, 'Production batch completed & stock added!')
                  }
                >
                  <Factory size={15} /> Complete Batch &amp; Add Stock
                </button>
              </div>

              <div className="section-card">
                <div className="section-card-title">PRODUCTION BATCH HISTORY</div>
                <div className="table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Batch No</th>
                        <th>Date</th>
                        <th>Finished Product</th>
                        <th>Output Qty</th>
                        <th>Raw Materials</th>
                        <th>Unit Cost</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.productionOrders || []).map((po) => (
                        <tr key={po.id}>
                          <td className="font-bold">{po.batch_no}</td>
                          <td>{po.production_date}</td>
                          <td className="font-bold">{po.finished_product_name}</td>
                          <td className="font-extrabold text-emerald-600">+{po.target_qty}</td>
                          <td>{po.raw_materials_text}</td>
                          <td className="font-bold">৳{po.unit_production_cost}/unit</td>
                          <td><span className="status-pill green">{po.status}</span></td>
                          <td>
                            <button
                              className="btn btn-outline py-1 px-2 text-xs text-rose-600"
                              onClick={() => runAction('DELETE_PRODUCTION', { id: po.id }, `Deleted production batch ${po.batch_no}`)}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ================= 18. WAREHOUSE / GODOWN ================= */}
          {activeTab === 'warehouse' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">SHOWROOM &amp; GODOWN (WAREHOUSE) LOCATIONS</h1>
                  <div className="page-subtitle">Front Sales Counter + Storage Godown Inventory Allocation</div>
                </div>
              </div>

              <div className="kpi-grid-4">
                {(data?.warehouses || []).map((w) => (
                  <div key={w.id} className="kpi-card">
                    <div className="kpi-top">
                      <span className="kpi-label">{w.status} GODOWN</span>
                      <WarehouseIcon size={18} color="#0f7a43" />
                    </div>
                    <div className="font-extrabold text-base my-1.5">{w.name}</div>
                    <div className="kpi-sub">📍 {w.location}</div>
                    <div className="kpi-sub mt-1">👤 Manager: <b>{w.manager}</b></div>
                  </div>
                ))}
              </div>

              <div className="section-card">
                <div className="section-card-title">STOCK ALLOCATION</div>
                <div className="table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Available Qty</th>
                        <th>Valuation (Purchase Cost)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.products || []).map((p) => (
                        <tr key={p.id}>
                          <td className="font-bold">{p.sku}</td>
                          <td className="font-semibold">{p.name}</td>
                          <td className="font-extrabold">{p.stock_qty} {p.unit}</td>
                          <td>৳{(p.stock_qty * p.purchase_price).toLocaleString()}</td>
                          <td>
                            <span className={`status-pill ${p.stock_qty > 0 ? 'green' : 'red'}`}>
                              {p.stock_qty > 0 ? 'Available' : 'Out of Stock'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ================= 19. EMPLOYEES, 20. ATTENDANCE & 21. PAYROLL ================= */}
          {(activeTab === 'employees' || activeTab === 'attendance' || activeTab === 'payroll') && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">
                    {activeTab === 'attendance'
                      ? 'DAILY STAFF ATTENDANCE'
                      : activeTab === 'payroll'
                        ? 'SME PAYROLL & ADVANCE DEDUCTION'
                        : 'EMPLOYEES & STAFF MANAGEMENT (ADD, EDIT & DELETE)'}
                  </h1>
                  <div className="page-subtitle">
                    Manage staff salaries, daily attendance, overtime, and mid-month salary advances
                  </div>
                </div>
              </div>

              {activeTab === 'employees' && (
                <div className="section-card mb-4">
                  <div className="section-card-title">ADD NEW SME STAFF MEMBER</div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Rakibul Hasan"
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Designation</label>
                      <input
                        className="form-input"
                        value={newEmployee.designation}
                        onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        className="form-input"
                        placeholder="017XX-XXXXXX"
                        value={newEmployee.phone}
                        onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Monthly Base Salary (৳)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={newEmployee.baseSalary}
                        onChange={(e) => setNewEmployee({ ...newEmployee, baseSalary: e.target.value })}
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-green"
                    onClick={() => {
                      if (!newEmployee.name) return showNotice('Enter employee name');
                      runAction('ADD_EMPLOYEE', newEmployee, 'Employee registered!');
                      setNewEmployee({ ...newEmployee, name: '', phone: '' });
                    }}
                  >
                    <Plus size={15} /> Register Staff Member
                  </button>
                </div>
              )}

              <div className="section-card mb-4">
                <div className="section-card-title">STAFF ROSTER &amp; TODAY&apos;S ATTENDANCE</div>
                <div className="table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Employee Name</th>
                        <th>Designation</th>
                        <th>Phone</th>
                        <th>Base Salary</th>
                        <th>Advance Taken</th>
                        <th>Attendance</th>
                        <th>Actions (Edit / Delete)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.employees || []).map((emp) => {
                        const attRecord = (data?.attendance || []).find((a) => a.employee_id === emp.id);
                        return (
                          <tr key={emp.id}>
                            <td className="font-bold">{emp.emp_code}</td>
                            <td className="font-bold">{emp.name}</td>
                            <td>{emp.designation}</td>
                            <td>{emp.phone}</td>
                            <td className="font-bold">৳{Number(emp.base_salary).toLocaleString()}</td>
                            <td className={`font-semibold ${emp.advance_taken > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                              ৳{Number(emp.advance_taken).toLocaleString()}
                            </td>
                            <td>
                              <div className="flex gap-1.5 items-center">
                                {attRecord && (
                                  <span className={`status-pill ${attRecord.status === 'Present' ? 'green' : 'amber'}`}>
                                    {attRecord.status}
                                  </span>
                                )}
                                <button
                                  className="btn btn-outline py-1 px-2 text-xs"
                                  onClick={() =>
                                    runAction(
                                      'MARK_ATTENDANCE',
                                      { employeeId: emp.id, status: 'Present', checkIn: '09:00 AM', overtimeHours: 1 },
                                      `Marked ${emp.name} Present!`
                                    )
                                  }
                                >
                                  ✓ Present
                                </button>
                                <button
                                  className="btn btn-outline py-1 px-2 text-xs"
                                  onClick={() =>
                                    runAction(
                                      'MARK_ATTENDANCE',
                                      { employeeId: emp.id, status: 'Late', checkIn: '09:45 AM', overtimeHours: 0 },
                                      `Marked ${emp.name} Late!`
                                    )
                                  }
                                >
                                  Late
                                </button>
                              </div>
                            </td>
                            <td>
                              <div className="flex gap-1.5">
                                <button
                                  className="btn btn-outline py-1 px-2 text-xs"
                                  onClick={() =>
                                    setEditingEmployee({
                                      id: emp.id,
                                      name: emp.name,
                                      designation: emp.designation,
                                      phone: emp.phone,
                                      baseSalary: emp.base_salary,
                                      advanceTaken: emp.advance_taken
                                    })
                                  }
                                >
                                  <Pencil size={12} /> Edit
                                </button>
                                <button
                                  className="btn btn-outline py-1 px-2 text-xs text-rose-600"
                                  onClick={() => runAction('DELETE_EMPLOYEE', { id: emp.id }, 'Removed employee')}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="section-card">
                <div className="section-card-title">MONTHLY SALARY &amp; PAYROLL SHEET</div>
                <div className="table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Month</th>
                        <th>Days</th>
                        <th>Base Salary</th>
                        <th>Overtime + Comm.</th>
                        <th>Less: Advance</th>
                        <th>Net Payable</th>
                        <th>Status / Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.payrollRecords || []).map((pr) => (
                        <tr key={pr.id}>
                          <td className="font-bold">{pr.employee_name}</td>
                          <td>{pr.month_label}</td>
                          <td>{pr.present_days} days</td>
                          <td>৳{Number(pr.base_salary).toLocaleString()}</td>
                          <td className="text-emerald-600 font-semibold">
                            +৳{(Number(pr.overtime_bonus) + Number(pr.sales_commission)).toLocaleString()}
                          </td>
                          <td className="text-rose-600 font-semibold">
                            -৳{Number(pr.advance_deduction).toLocaleString()}
                          </td>
                          <td className="font-extrabold text-sm">৳{Number(pr.net_payable).toLocaleString()}</td>
                          <td>
                            {pr.payment_status === 'Paid' ? (
                              <span className="status-pill green">✓ Paid ({pr.paid_date})</span>
                            ) : (
                              <button
                                className="btn btn-green py-1 px-2.5 text-xs"
                                onClick={() => runAction('PAY_SALARY', { payrollId: pr.id }, `Salary paid to ${pr.employee_name}!`)}
                              >
                                Disburse Salary
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ================= 22. ACTIVITY LOGS ================= */}
          {activeTab === 'activity_logs' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">SYSTEM ACTIVITY LOGS</h1>
                  <div className="page-subtitle">Audit trail of all staff operations</div>
                </div>
              </div>

              <div className="section-card">
                <div className="section-card-title">CHRONOLOGICAL AUDIT TRAIL</div>
                <div className="table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Staff Actor</th>
                        <th>Role</th>
                        <th>Module</th>
                        <th>Action Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.activityLogs || []).map((log) => (
                        <tr key={log.id}>
                          <td className="text-xs text-slate-500">{log.created_at}</td>
                          <td className="font-bold">{log.actor_name}</td>
                          <td><span className="status-pill blue">{log.actor_role}</span></td>
                          <td className="font-bold">{log.module}</td>
                          <td>{log.action_text}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ================= 23. CONFIGURATION ================= */}
          {activeTab === 'configuration' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">SME TENANT CONFIGURATION</h1>
                  <div className="page-subtitle">Update business name, VAT rate, and contact details</div>
                </div>
              </div>

              <div className="section-card">
                <div className="section-card-title">BUSINESS PROFILE SETTINGS ({activeTenant.name})</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Business Brand Name</label>
                    <input className="form-input" defaultValue={activeTenant.name} id="cfg_name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dashboard Subtitle</label>
                    <input className="form-input" defaultValue={activeTenant.subtitle} id="cfg_sub" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proprietor / Owner Name</label>
                    <input className="form-input" defaultValue={activeTenant.owner_name} id="cfg_owner" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input className="form-input" defaultValue={activeTenant.phone} id="cfg_phone" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Showroom Address</label>
                    <input className="form-input" defaultValue={activeTenant.address} id="cfg_addr" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">VAT Rate (%)</label>
                    <input type="number" step="0.5" className="form-input" defaultValue={activeTenant.vat_rate} id="cfg_vat" />
                  </div>
                </div>
                <button
                  className="btn btn-green"
                  onClick={() => {
                    const name = document.getElementById('cfg_name')?.value;
                    const subtitle = document.getElementById('cfg_sub')?.value;
                    const ownerName = document.getElementById('cfg_owner')?.value;
                    const phone = document.getElementById('cfg_phone')?.value;
                    const address = document.getElementById('cfg_addr')?.value;
                    const vatRate = document.getElementById('cfg_vat')?.value;
                    runAction('UPDATE_TENANT_CONFIG', { name, subtitle, ownerName, phone, address, vatRate }, 'Configuration updated!');
                  }}
                >
                  <Settings size={15} /> Save Configuration
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ================= EDIT PRODUCT MODAL ================= */}
      {editingProduct && (
        <div className="modal-backdrop" onClick={() => setEditingProduct(null)}>
          <div className="modal-card max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-base">Edit Product Details</h3>
              <button className="btn btn-outline py-1 px-2" onClick={() => setEditingProduct(null)}>
                <X size={15} />
              </button>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  className="form-input"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bangla Name</label>
                <input
                  className="form-input"
                  value={editingProduct.nameBn}
                  onChange={(e) => setEditingProduct({ ...editingProduct, nameBn: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">SKU</label>
                <input
                  className="form-input"
                  value={editingProduct.sku}
                  onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Purchase Cost (৳)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingProduct.purchasePrice}
                  onChange={(e) => setEditingProduct({ ...editingProduct, purchasePrice: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Wholesale Rate (৳)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingProduct.wholesalePrice}
                  onChange={(e) => setEditingProduct({ ...editingProduct, wholesalePrice: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Retail Rate (৳)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingProduct.retailPrice}
                  onChange={(e) => setEditingProduct({ ...editingProduct, retailPrice: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Stock Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingProduct.stockQty}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stockQty: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Warranty (Months)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingProduct.warrantyMonths}
                  onChange={(e) => setEditingProduct({ ...editingProduct, warrantyMonths: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-outline" onClick={() => setEditingProduct(null)}>Cancel</button>
              <button
                className="btn btn-green"
                onClick={async () => {
                  await runAction('UPDATE_PRODUCT', editingProduct, 'Product updated!');
                  setEditingProduct(null);
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT CUSTOMER MODAL ================= */}
      {editingCustomer && (
        <div className="modal-backdrop" onClick={() => setEditingCustomer(null)}>
          <div className="modal-card max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-base">Edit Customer &amp; Baki Balance</h3>
              <button className="btn btn-outline py-1 px-2" onClick={() => setEditingCustomer(null)}>
                <X size={15} />
              </button>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Shop Name</label>
                <input
                  className="form-input"
                  value={editingCustomer.shopName}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, shopName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Proprietor Name</label>
                <input
                  className="form-input"
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  className="form-input"
                  value={editingCustomer.phone}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  className="form-input"
                  value={editingCustomer.address}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Credit Limit (৳)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingCustomer.creditLimit}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, creditLimit: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Current Due / Baki (৳)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingCustomer.currentDue}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, currentDue: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-outline" onClick={() => setEditingCustomer(null)}>Cancel</button>
              <button
                className="btn btn-green"
                onClick={async () => {
                  await runAction('UPDATE_CUSTOMER', editingCustomer, 'Customer updated!');
                  setEditingCustomer(null);
                }}
              >
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT EMPLOYEE MODAL ================= */}
      {editingEmployee && (
        <div className="modal-backdrop" onClick={() => setEditingEmployee(null)}>
          <div className="modal-card max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-base">Edit Employee Record</h3>
              <button className="btn btn-outline py-1 px-2" onClick={() => setEditingEmployee(null)}>
                <X size={15} />
              </button>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Employee Name</label>
                <input
                  className="form-input"
                  value={editingEmployee.name}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input
                  className="form-input"
                  value={editingEmployee.designation}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, designation: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  className="form-input"
                  value={editingEmployee.phone}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Base Salary (৳)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingEmployee.baseSalary}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, baseSalary: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Advance Taken (৳)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingEmployee.advanceTaken}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, advanceTaken: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-outline" onClick={() => setEditingEmployee(null)}>Cancel</button>
              <button
                className="btn btn-green"
                onClick={async () => {
                  await runAction('UPDATE_EMPLOYEE', editingEmployee, 'Employee updated!');
                  setEditingEmployee(null);
                }}
              >
                Save Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SME-ONLY MODEL COMPARISON MODAL ================= */}
      {showSmeFeaturesModal && (
        <div className="modal-backdrop" onClick={() => setShowSmeFeaturesModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3.5">
              <div>
                <span className="status-pill green mb-1">SME System Architecture</span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  How SmartERP is Purpose-Built for SMEs Only (vs. Large Enterprise ERPs)
                </h2>
              </div>
              <button className="btn btn-outline" onClick={() => setShowSmeFeaturesModal(false)}>
                <X size={16} /> Close
              </button>
            </div>

            <div className="table-wrap mb-4">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Operational Area</th>
                    <th>Large Corporate ERP (SAP / Oracle)</th>
                    <th>SmartERP (Built Exclusively for SMEs)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-extrabold">1. Credit &amp; Due Tracking</td>
                    <td>Complex Accounts Receivable (AR) aging journals &amp; credit memos</td>
                    <td className="text-[#0f7a43] font-bold">
                      Digital &quot;Baki / Khata&quot; Ledger with Credit Limits, Partial Mobile-Money Installments &amp; WhatsApp Reminders
                    </td>
                  </tr>
                  <tr>
                    <td className="font-extrabold">2. Sales &amp; Pricing Model</td>
                    <td>Separate B2B Wholesale Order Portal and B2C Retail POS systems</td>
                    <td className="text-[#0f7a43] font-bold">
                      Hybrid Counter POS: Switches instantly between Walk-In Retail Rate and Wholesale/Dealer Rate on one screen
                    </td>
                  </tr>
                  <tr>
                    <td className="font-extrabold">3. Accounting &amp; Cashflow</td>
                    <td>Requires certified accountants for Double-Entry Journal Vouchers</td>
                    <td className="text-[#0f7a43] font-bold">
                      Direct &quot;Galla&quot; (Cash Drawer) + bKash/Nagad Merchant Wallet + Galla-to-Bank Deposit Sync
                    </td>
                  </tr>
                  <tr>
                    <td className="font-extrabold">4. Light Production</td>
                    <td>Multi-stage MRP II and complex shop-floor routing</td>
                    <td className="text-[#0f7a43] font-bold">
                      1-Step SME Assembly &amp; Repackaging with automatic unit production costing
                    </td>
                  </tr>
                  <tr>
                    <td className="font-extrabold">5. HR &amp; Payroll</td>
                    <td>Corporate tax slabs, provident funds, multi-tier approvals</td>
                    <td className="text-[#0f7a43] font-bold">
                      Practical SME Staff Roster: Daily Attendance, Overtime, Commission &amp; Salary Advance Deduction
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= BILINGUAL INVOICE RECEIPT MODAL ================= */}
      {printInvoice && (
        <div className="modal-backdrop" onClick={() => setPrintInvoice(null)}>
          <div className="modal-card max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="text-center border-b-2 border-dashed border-slate-300 pb-3 mb-3">
              <div className="font-black text-lg">{activeTenant.name}</div>
              <div className="text-xs text-slate-600">{activeTenant.address}</div>
              <div className="text-xs text-slate-600">Phone: {activeTenant.phone} | {activeTenant.bin_tin}</div>
              <div className="status-pill green mt-1.5">
                Cash Memo / ক্যাশ মেমো ({printInvoice.saleType})
              </div>
            </div>

            <div className="flex justify-between text-xs mb-3">
              <div>
                <div><b>Invoice:</b> {printInvoice.invoiceNo}</div>
                <div><b>Customer:</b> {printInvoice.customerName}</div>
              </div>
              <div className="text-right">
                <div><b>Date:</b> {printInvoice.date}</div>
                <div><b>Payment:</b> {printInvoice.paymentMethod}</div>
              </div>
            </div>

            <table className="erp-table mb-3">
              <thead>
                <tr>
                  <th>Item / বিবরণ</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {(printInvoice.items || []).map((it, i) => (
                  <tr key={i}>
                    <td>
                      <div className="font-bold text-xs">{it.name}</div>
                      {it.nameBn && <div className="text-[11px] text-slate-500">{it.nameBn}</div>}
                    </td>
                    <td>{it.qty}</td>
                    <td>৳{it.price}</td>
                    <td className="font-bold">৳{(it.qty * it.price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-slate-300 pt-2.5 text-xs">
              <div className="flex justify-between mb-1">
                <span>Net Bill (মোট বিল):</span>
                <b>৳{Number(printInvoice.totalAmount).toLocaleString()}</b>
              </div>
              <div className="flex justify-between mb-1 text-emerald-600">
                <span>Paid (জমা):</span>
                <b>৳{Number(printInvoice.paidAmount).toLocaleString()}</b>
              </div>
              <div className="flex justify-between text-sm text-rose-600 font-extrabold">
                <span>Current Baki / Due (বকেয়া):</span>
                <span>৳{Number(printInvoice.dueAmount).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-outline" onClick={() => setPrintInvoice(null)}>
                Close
              </button>
              <button className="btn btn-green" onClick={() => window.print()}>
                <Printer size={14} /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

