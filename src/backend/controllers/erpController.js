// ============================================================================
// FILE: src/backend/controllers/erpController.js
// PURPOSE: Node.js Backend Business Logic & Full CRUD Operations for SmartERP
// Includes: Sign In, Sign Up, Create, Read, Update (Edit), and Delete
// ============================================================================

import { getDb } from '@/database/dbConnection';

function nowFormatted() {
  return new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function todayISO() {
  const now = new Date().toISOString().slice(0, 10);
  return now.startsWith('2026-10') ? now : '2026-10-31';
}

// ----------------------------------------------------------------------------
// 1. FETCH ALL ERP DATA & LIVE DASHBOARD SUMMARY FOR A TENANT
// ----------------------------------------------------------------------------
export function getTenantErpData(tenantId = 'powercell') {
  const db = getDb();

  const tenants = db.prepare('SELECT * FROM tenants').all();
  const activeTenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId) || tenants[0];
  const tid = activeTenant.id;

  const users = db.prepare('SELECT * FROM users WHERE tenant_id = ?').all(tid);
  const warehouses = db.prepare('SELECT * FROM warehouses WHERE tenant_id = ?').all(tid);
  const products = db.prepare('SELECT * FROM products WHERE tenant_id = ? ORDER BY id ASC').all(tid);
  const customers = db.prepare('SELECT * FROM customers WHERE tenant_id = ? ORDER BY current_due DESC').all(tid);
  const sales = db.prepare('SELECT * FROM sales WHERE tenant_id = ? ORDER BY id DESC').all(tid);
  const dueCollections = db.prepare('SELECT * FROM due_collections WHERE tenant_id = ? ORDER BY id DESC').all(tid);
  const stockBatches = db.prepare('SELECT * FROM stock_batches WHERE tenant_id = ? ORDER BY id DESC').all(tid);
  const returnsReplacements = db.prepare('SELECT * FROM returns_replacements WHERE tenant_id = ? ORDER BY id DESC').all(tid);
  const financeAccounts = db.prepare('SELECT * FROM finance_accounts WHERE tenant_id = ? ORDER BY id ASC').all(tid);
  const financeTransactions = db.prepare('SELECT * FROM finance_transactions WHERE tenant_id = ? ORDER BY id DESC').all(tid);
  const productionOrders = db.prepare('SELECT * FROM production_orders WHERE tenant_id = ? ORDER BY id DESC').all(tid);
  const employees = db.prepare('SELECT * FROM employees WHERE tenant_id = ? ORDER BY id ASC').all(tid);
  const attendance = db.prepare('SELECT * FROM attendance WHERE tenant_id = ? ORDER BY id DESC').all(tid);
  const payrollRecords = db.prepare('SELECT * FROM payroll_records WHERE tenant_id = ? ORDER BY id DESC').all(tid);
  const activityLogs = db.prepare('SELECT * FROM activity_logs WHERE tenant_id = ? ORDER BY id DESC LIMIT 50').all(tid);
  const monthlyRevenue = db.prepare('SELECT * FROM monthly_revenue WHERE tenant_id = ? ORDER BY month_key ASC').all(tid);

  const today = todayISO();
  const todaySalesRows = sales.filter((s) => s.sale_date === today);
  const todaySalesTotal = todaySalesRows.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const todayProfitTotal = todaySalesRows.reduce((sum, s) => sum + Number(s.profit_amount || 0), 0);
  const todayCostTotal = todaySalesTotal - todayProfitTotal;

  const currentMonthPrefix = today.slice(0, 7);
  const monthSalesRows = sales.filter((s) => (s.sale_date || '').startsWith(currentMonthPrefix));
  const monthSalesTotal = monthSalesRows.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const monthVatTotal = monthSalesRows.reduce((sum, s) => sum + Number(s.vat_amount || 0), 0);
  const monthProfitTotal = monthSalesRows.reduce((sum, s) => sum + Number(s.profit_amount || 0), 0);
  const monthCostTotal = monthSalesTotal - monthProfitTotal;

  const yearSalesTotal = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const yearProfitTotal = sales.reduce((sum, s) => sum + Number(s.profit_amount || 0), 0);
  const yearCostTotal = yearSalesTotal - yearProfitTotal;

  const activeProducts = products.filter((p) => p.stock_qty > 0);
  const outOfStockProducts = products.filter((p) => p.stock_qty <= 0);
  const lowStockProducts = products.filter((p) => p.stock_qty > 0 && p.stock_qty <= p.alert_qty);
  const totalUnitsInStock = products.reduce((sum, p) => sum + Number(p.stock_qty || 0), 0);
  const totalStockValue = products.reduce((sum, p) => sum + Number(p.stock_qty || 0) * Number(p.purchase_price || 0), 0);

  const totalCustomerDue = customers.reduce((sum, c) => sum + Number(c.current_due || 0), 0);
  const totalCashAndBank = financeAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const profitMarginPct = yearSalesTotal > 0 ? ((yearProfitTotal / yearSalesTotal) * 100).toFixed(1) : '0.0';

  return {
    tenants,
    activeTenant,
    users,
    warehouses,
    products,
    customers,
    sales,
    dueCollections,
    stockBatches,
    returnsReplacements,
    financeAccounts,
    financeTransactions,
    productionOrders,
    employees,
    attendance,
    payrollRecords,
    activityLogs,
    monthlyRevenue,
    summary: {
      todaySalesTotal,
      todayInvoicesCount: todaySalesRows.length,
      todayProfitTotal,
      todayCostTotal,
      weekSalesTotal: todaySalesTotal,
      monthSalesTotal,
      monthVatTotal,
      monthProfitTotal,
      monthCostTotal,
      yearSalesTotal,
      yearInvoicesCount: sales.length,
      yearProfitTotal,
      yearCostTotal,
      activeProductsCount: activeProducts.length,
      totalProductsCount: products.length,
      totalUnitsInStock,
      totalStockValue,
      outOfStockCount: outOfStockProducts.length,
      lowStockCount: lowStockProducts.length,
      profitMarginPct,
      totalCustomerDue,
      totalCashAndBank
    }
  };
}

// ----------------------------------------------------------------------------
// 2. EXECUTE ALL MUTATIONS (AUTH, CREATE, UPDATE/EDIT, DELETE)
// ----------------------------------------------------------------------------
export function handleErpAction(body) {
  const db = getDb();
  const {
    action,
    tenantId = 'powercell',
    actorName = 'Admin',
    actorRole = 'Owner/Admin',
    payload = {}
  } = body;

  const logAction = (moduleName, text, severity = 'info') => {
    db.prepare(`
      INSERT INTO activity_logs (tenant_id, actor_name, actor_role, module, action_text, severity, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(tenantId, actorName, actorRole, moduleName, text, severity, nowFormatted());
  };

  // ==================== AUTH: LOGIN & REGISTER ====================
  if (action === 'AUTH_LOGIN') {
    const { usernameOrEmail = '', password = '', selectedTenant = 'powercell' } = payload;
    const cleanId = usernameOrEmail.trim().toLowerCase();

    // Check if Super Admin login
    if (selectedTenant === 'superadmin' || cleanId === 'superadmin') {
      const superUser = db.prepare(`
        SELECT * FROM users
        WHERE tenant_id = 'superadmin' AND (LOWER(username) = ? OR LOWER(email) = ?)
        LIMIT 1
      `).get(cleanId, cleanId);

      if (!superUser) {
        return { ok: false, error: 'Super Admin account not found. Use username: superadmin' };
      }
      if (superUser.password && superUser.password !== password) {
        return { ok: false, error: 'Invalid Super Admin password. Default password is: 123456' };
      }
      logAction('Authentication', `${superUser.name} logged into SmartERP SaaS Super Admin Portal`, 'info');
      return { ok: true, user: superUser, tenantId: 'powercell', isSuperAdmin: true };
    }

    const user = db.prepare(`
      SELECT * FROM users
      WHERE tenant_id = ?
        AND (LOWER(username) = ? OR LOWER(email) = ?)
      LIMIT 1
    `).get(selectedTenant, cleanId, cleanId);

    if (!user) {
      return { ok: false, error: 'User not found for this SME workspace. Check username or role.' };
    }
    if (user.password && user.password !== password && user.pin !== password) {
      return { ok: false, error: 'Invalid password. Default demo password is: 123456' };
    }

    logAction('Authentication', `${user.name} (${user.role}) signed in to ${selectedTenant}`, 'info');
    return { ok: true, user, tenantId: selectedTenant, isSuperAdmin: false };
  }

  if (action === 'AUTH_REGISTER') {
    const {
      name,
      username,
      email,
      password = '123456',
      phone = '',
      role = 'Owner/Admin',
      selectedTenant = 'powercell',
      newBusinessName = ''
    } = payload;

    let targetTenant = selectedTenant;

    // If user entered a new SME Business Name during registration, create a new Tenant
    if (newBusinessName && newBusinessName.trim().length > 1) {
      targetTenant = newBusinessName.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || `sme${Date.now()}`;
      const exists = db.prepare('SELECT id FROM tenants WHERE id = ?').get(targetTenant);
      if (!exists) {
        db.prepare(`
          INSERT INTO tenants (id, name, subtitle, category, owner_name, phone, address, bin_tin, currency, vat_rate, monthly_rent)
          VALUES (?, ?, ?, 'Retail & Wholesale SME', ?, ?, 'Dhaka, Bangladesh', 'BIN-NEW-SME', '৳', 0.0, 15000)
        `).run(targetTenant, newBusinessName.trim(), `${newBusinessName.trim()} — POS & ERP Management`, name || 'Owner', phone || '01700-000000');

        db.prepare(`
          INSERT INTO finance_accounts (tenant_id, account_name, account_type, account_number, balance)
          VALUES (?, 'Showroom Cash Drawer (Galla)', 'Cash Drawer', 'COUNTER-01', 25000),
                 (?, 'bKash Merchant Account', 'bKash Merchant', ?, 10000)
        `).run(targetTenant, targetTenant, phone || '01700-000000');
      }
    }

    const perms =
      role === 'Owner/Admin'
        ? 'ALL'
        : role === 'Cashier/Sales'
          ? 'POS,CUSTOMERS,DUE,RETURNS,SALES_HISTORY'
          : role === 'Inventory/Warehouse'
            ? 'PRODUCTS,STOCK_IN,STOCK_ADJUST,WAREHOUSE,PRODUCTION'
            : 'FINANCE,BANK,ACCOUNTS,EMPLOYEES,ATTENDANCE,PAYROLL,REPORTS';

    const info = db.prepare(`
      INSERT INTO users (tenant_id, name, username, email, password, role, phone, pin, avatar_color, permissions)
      VALUES (?, ?, ?, ?, ?, ?, ?, '1234', '#0f7a43', ?)
    `).run(targetTenant, name, username.trim().toLowerCase(), email || `${username}@smarterp.com`, password, role, phone, perms);

    const createdUser = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    logAction('Authentication', `Registered new user account "${name}" (${role})`, 'success');
    return { ok: true, user: createdUser, tenantId: targetTenant };
  }

  // ==================== PRODUCTS (ADD, UPDATE/EDIT, DELETE) ====================
  if (action === 'ADD_PRODUCT') {
    const {
      sku,
      barcode,
      name,
      nameBn,
      category,
      unit = 'Pcs',
      purchasePrice,
      retailPrice,
      wholesalePrice,
      minWholesaleQty = 5,
      stockQty = 0,
      alertQty = 10,
      warrantyMonths = 0,
      expiryDate = null,
      supplierName = 'Direct Supplier'
    } = payload;

    db.prepare(`
      INSERT INTO products (tenant_id, sku, barcode, name, name_bn, category, unit, purchase_price, retail_price, wholesale_price, min_wholesale_qty, stock_qty, alert_qty, warranty_months, expiry_date, warehouse_id, supplier_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      tenantId,
      sku || `SKU-${Math.floor(100 + Math.random() * 900)}`,
      barcode || `894${Math.floor(1000000 + Math.random() * 9000000)}`,
      name,
      nameBn || '',
      category || 'General',
      unit,
      Number(purchasePrice || 0),
      Number(retailPrice || 0),
      Number(wholesalePrice || retailPrice || 0),
      Number(minWholesaleQty || 5),
      Number(stockQty || 0),
      Number(alertQty || 10),
      Number(warrantyMonths || 0),
      expiryDate || null,
      supplierName
    );

    logAction('Products', `Added product "${name}" (Stock: ${stockQty} ${unit})`, 'success');
    return { ok: true };
  }

  if (action === 'UPDATE_PRODUCT') {
    const {
      id,
      sku,
      name,
      nameBn,
      category,
      unit,
      purchasePrice,
      wholesalePrice,
      retailPrice,
      stockQty,
      warrantyMonths
    } = payload;

    db.prepare(`
      UPDATE products
      SET sku = ?,
          name = ?,
          name_bn = ?,
          category = ?,
          unit = ?,
          purchase_price = ?,
          wholesale_price = ?,
          retail_price = ?,
          stock_qty = ?,
          warranty_months = ?
      WHERE id = ? AND tenant_id = ?
    `).run(
      sku,
      name,
      nameBn || '',
      category || 'General',
      unit || 'Pcs',
      Number(purchasePrice || 0),
      Number(wholesalePrice || 0),
      Number(retailPrice || 0),
      Number(stockQty || 0),
      Number(warrantyMonths || 0),
      Number(id),
      tenantId
    );

    logAction('Products', `Updated product "${name}" (Stock: ${stockQty}, Wholesale: ৳${wholesalePrice}, Retail: ৳${retailPrice})`, 'info');
    return { ok: true };
  }

  if (action === 'DELETE_PRODUCT') {
    const { id } = payload;
    const prod = db.prepare('SELECT name FROM products WHERE id = ? AND tenant_id = ?').get(id, tenantId);
    db.prepare('DELETE FROM products WHERE id = ? AND tenant_id = ?').run(id, tenantId);
    logAction('Products', `Deleted product "${prod?.name || id}" from catalog`, 'warning');
    return { ok: true };
  }

  // ==================== CUSTOMERS (ADD, UPDATE/EDIT, DELETE) ====================
  if (action === 'ADD_CUSTOMER') {
    const { name, shopName, phone, address, customerType = 'Wholesale', creditLimit = 50000, openingDue = 0, notes = '' } = payload;
    db.prepare(`
      INSERT INTO customers (tenant_id, name, shop_name, phone, address, customer_type, credit_limit, current_due, total_purchased, last_payment_date, trust_score, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 90, ?)
    `).run(tenantId, name, shopName || name, phone, address || 'Dhaka', customerType, Number(creditLimit), Number(openingDue), todayISO(), notes);

    logAction('Customers', `Registered ${customerType} customer "${shopName || name}"`, 'info');
    return { ok: true };
  }

  if (action === 'UPDATE_CUSTOMER') {
    const { id, name, shopName, phone, address, customerType, creditLimit, currentDue } = payload;
    db.prepare(`
      UPDATE customers
      SET name = ?,
          shop_name = ?,
          phone = ?,
          address = ?,
          customer_type = ?,
          credit_limit = ?,
          current_due = ?
      WHERE id = ? AND tenant_id = ?
    `).run(
      name,
      shopName || name,
      phone,
      address || '',
      customerType || 'Wholesale',
      Number(creditLimit || 0),
      Number(currentDue || 0),
      Number(id),
      tenantId
    );
    logAction('Customers', `Updated customer "${shopName || name}" (Due: ৳${currentDue})`, 'info');
    return { ok: true };
  }

  if (action === 'DELETE_CUSTOMER') {
    const { id } = payload;
    const cust = db.prepare('SELECT shop_name, name FROM customers WHERE id = ? AND tenant_id = ?').get(id, tenantId);
    db.prepare('DELETE FROM customers WHERE id = ? AND tenant_id = ?').run(id, tenantId);
    logAction('Customers', `Deleted customer "${cust?.shop_name || cust?.name || id}"`, 'warning');
    return { ok: true };
  }

  // ==================== POS SALES (CREATE, DELETE) ====================
  if (action === 'CREATE_SALE') {
    const {
      customerId,
      customerName,
      customerPhone,
      saleType = 'Retail',
      items = [],
      discount = 0,
      vatAmount = 0,
      paidAmount = 0,
      paymentMethod = 'Cash',
      mfsTrxId = ''
    } = payload;

    let subtotal = 0;
    let totalCost = 0;
    for (const item of items) {
      const qty = Number(item.qty || 1);
      const price = Number(item.price || 0);
      const cost = Number(item.cost || 0);
      subtotal += qty * price;
      totalCost += qty * cost;

      db.prepare('UPDATE products SET stock_qty = MAX(0, stock_qty - ?) WHERE id = ? AND tenant_id = ?')
        .run(qty, item.productId, tenantId);
    }

    const totalAmount = Math.max(0, subtotal - Number(discount || 0) + Number(vatAmount || 0));
    const actualPaid = Math.min(totalAmount, Number(paidAmount || 0));
    const dueAmount = Math.max(0, totalAmount - actualPaid);
    const profitAmount = totalAmount - totalCost;
    const invoiceNo = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const saleDate = todayISO();

    db.prepare(`
      INSERT INTO sales (tenant_id, invoice_no, customer_id, customer_name, customer_phone, sale_type, subtotal, discount, vat_amount, total_amount, paid_amount, due_amount, profit_amount, payment_method, mfs_trx_id, sold_by, sale_date, items_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tenantId,
      invoiceNo,
      customerId || null,
      customerName || 'Walk-in Retail Customer',
      customerPhone || '',
      saleType,
      subtotal,
      Number(discount || 0),
      Number(vatAmount || 0),
      totalAmount,
      actualPaid,
      dueAmount,
      profitAmount,
      paymentMethod,
      mfsTrxId,
      actorName,
      saleDate,
      JSON.stringify(items)
    );

    if (customerId) {
      db.prepare(`
        UPDATE customers
        SET current_due = current_due + ?,
            total_purchased = total_purchased + ?,
            last_payment_date = ?
        WHERE id = ? AND tenant_id = ?
      `).run(dueAmount, totalAmount, saleDate, customerId, tenantId);
    }

    if (actualPaid > 0) {
      const targetType = paymentMethod === 'bKash' ? 'bKash' : paymentMethod === 'Nagad' ? 'Nagad' : paymentMethod === 'Bank' ? 'Bank' : 'Cash';
      const acc = db.prepare('SELECT * FROM finance_accounts WHERE tenant_id = ? AND account_name LIKE ? LIMIT 1').get(tenantId, `%${targetType}%`)
        || db.prepare('SELECT * FROM finance_accounts WHERE tenant_id = ? LIMIT 1').get(tenantId);

      if (acc) {
        db.prepare('UPDATE finance_accounts SET balance = balance + ? WHERE id = ?').run(actualPaid, acc.id);
        db.prepare(`
          INSERT INTO finance_transactions (tenant_id, trx_code, trx_type, category, account_name, amount, description, trx_date)
          VALUES (?, ?, 'INCOME', 'POS & Wholesale Sales', ?, ?, ?, ?)
        `).run(
          tenantId,
          `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
          acc.account_name,
          actualPaid,
          `Sale Invoice ${invoiceNo} (${saleType}) - ${customerName}`,
          saleDate
        );
      }
    }

    logAction('POS Sales', `Created ${saleType} Invoice ${invoiceNo} for ${customerName} (Total: ৳${totalAmount})`, 'success');
    return { ok: true, invoiceNo };
  }

  if (action === 'DELETE_SALE') {
    const { id } = payload;
    const sale = db.prepare('SELECT invoice_no FROM sales WHERE id = ? AND tenant_id = ?').get(id, tenantId);
    db.prepare('DELETE FROM sales WHERE id = ? AND tenant_id = ?').run(id, tenantId);
    logAction('Manage Sales', `Deleted invoice record ${sale?.invoice_no || id}`, 'warning');
    return { ok: true };
  }

  // ==================== STOCK MOVEMENT & DUE COLLECTION ====================
  if (action === 'STOCK_MOVEMENT') {
    const {
      productId,
      movementType = 'STOCK_IN',
      qty = 1,
      unitCost = 0,
      supplierOrReason = 'Regular Supplier Restock',
      warehouseName = 'Main Showroom & Godown'
    } = payload;

    const product = db.prepare('SELECT * FROM products WHERE id = ? AND tenant_id = ?').get(productId, tenantId);
    if (!product) return { ok: false, error: 'Product not found' };

    const numericQty = Number(qty || 0);
    const signedQty = movementType === 'ADJUST_DAMAGE' ? -Math.abs(numericQty) : Math.abs(numericQty);

    db.prepare('UPDATE products SET stock_qty = MAX(0, stock_qty + ?), purchase_price = ? WHERE id = ?')
      .run(signedQty, Number(unitCost || product.purchase_price), product.id);

    const batchCode = `${movementType === 'STOCK_IN' ? 'BATCH' : 'ADJ'}-${Math.floor(1000 + Math.random() * 9000)}`;
    db.prepare(`
      INSERT INTO stock_batches (tenant_id, batch_code, product_id, product_name, movement_type, qty, unit_cost, supplier_or_reason, warehouse_name, created_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tenantId, batchCode, product.id, product.name, movementType, signedQty, Number(unitCost || product.purchase_price), supplierOrReason, warehouseName, todayISO());

    logAction('Stock Management', `${movementType}: ${signedQty > 0 ? '+' : ''}${signedQty} units of "${product.name}"`, 'success');
    return { ok: true, batchCode };
  }

  if (action === 'COLLECT_DUE') {
    const { customerId, amount, paymentMethod = 'Cash', referenceNote = 'Baki Khata Installment' } = payload;
    const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND tenant_id = ?').get(customerId, tenantId);
    if (!customer) return { ok: false, error: 'Customer not found' };

    const paidAmt = Number(amount || 0);
    const receiptNo = `MR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const dateStr = todayISO();

    db.prepare('UPDATE customers SET current_due = MAX(0, current_due - ?), last_payment_date = ? WHERE id = ?')
      .run(paidAmt, dateStr, customer.id);

    db.prepare(`
      INSERT INTO due_collections (tenant_id, receipt_no, customer_id, customer_name, amount, payment_method, reference_note, collected_by, collection_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tenantId, receiptNo, customer.id, `${customer.shop_name || customer.name}`, paidAmt, paymentMethod, referenceNote, actorName, dateStr);

    const acc = db.prepare('SELECT * FROM finance_accounts WHERE tenant_id = ? AND account_name LIKE ? LIMIT 1').get(tenantId, `%${paymentMethod === 'Cash' ? 'Cash' : paymentMethod}%`)
      || db.prepare('SELECT * FROM finance_accounts WHERE tenant_id = ? LIMIT 1').get(tenantId);

    if (acc) {
      db.prepare('UPDATE finance_accounts SET balance = balance + ? WHERE id = ?').run(paidAmt, acc.id);
      db.prepare(`
        INSERT INTO finance_transactions (tenant_id, trx_code, trx_type, category, account_name, amount, description, trx_date)
        VALUES (?, ?, 'DUE_COLLECTION', 'Customer Baki Recovery', ?, ?, ?, ?)
      `).run(tenantId, `TRX-${Math.floor(1000 + Math.random() * 9000)}`, acc.account_name, paidAmt, `Baki collected from ${customer.shop_name || customer.name} (${receiptNo})`, dateStr);
    }

    logAction('Collect Due', `Collected ৳${paidAmt} due from ${customer.shop_name || customer.name} via ${paymentMethod}`, 'success');
    return { ok: true, receiptNo };
  }

  if (action === 'DELETE_DUE_COLLECTION') {
    const { id } = payload;
    db.prepare('DELETE FROM due_collections WHERE id = ? AND tenant_id = ?').run(id, tenantId);
    logAction('Collect Due', `Deleted money receipt record #${id}`, 'warning');
    return { ok: true };
  }

  // ==================== RETURNS, FINANCE, PRODUCTION ====================
  if (action === 'CREATE_RETURN_OR_REPLACEMENT') {
    const {
      recordType = 'RETURN',
      invoiceNo = 'INV-2026-1001',
      customerName = 'Walk-in Customer',
      productId,
      serialNo = '',
      qty = 1,
      reason = 'Defective / Warranty Claim'
    } = payload;

    const product = db.prepare('SELECT * FROM products WHERE id = ? AND tenant_id = ?').get(productId, tenantId);
    const itemName = product ? product.name : 'Catalog Item';
    const itemPrice = product ? product.wholesale_price : 100;
    const claimNo = `${recordType === 'REPLACEMENT' ? 'WR' : 'RT'}-2026-${Math.floor(10 + Math.random() * 89)}`;

    db.prepare(`
      INSERT INTO returns_replacements (tenant_id, claim_no, record_type, invoice_no, customer_name, product_id, product_name, serial_no, qty, amount, reason, status, created_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tenantId, claimNo, recordType, invoiceNo, customerName, productId || 1, itemName, serialNo || `SN-${Math.floor(10000 + Math.random() * 89999)}`, Number(qty || 1), Number(qty || 1) * Number(itemPrice), reason, recordType === 'REPLACEMENT' ? 'Replaced from Warranty' : 'Completed', todayISO());

    if (product) {
      if (recordType === 'RETURN') {
        db.prepare('UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?').run(Number(qty || 1), product.id);
      } else {
        db.prepare('UPDATE products SET stock_qty = MAX(0, stock_qty - ?) WHERE id = ?').run(Number(qty || 1), product.id);
      }
    }

    logAction(recordType === 'REPLACEMENT' ? 'Replacements' : 'Returns', `Logged ${recordType} ${claimNo} for ${itemName}`, 'warning');
    return { ok: true, claimNo };
  }

  if (action === 'DELETE_RETURN') {
    const { id } = payload;
    db.prepare('DELETE FROM returns_replacements WHERE id = ? AND tenant_id = ?').run(id, tenantId);
    logAction('Returns', `Deleted return/replacement record #${id}`, 'warning');
    return { ok: true };
  }

  if (action === 'ADD_FINANCE_TRX') {
    const { trxType = 'EXPENSE', category = 'Daily Shop Expense', accountName, amount = 0, description = '' } = payload;
    const amt = Number(amount || 0);
    const trxCode = `TRX-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = todayISO();

    const acc = db.prepare('SELECT * FROM finance_accounts WHERE tenant_id = ? AND account_name = ?').get(tenantId, accountName)
      || db.prepare('SELECT * FROM finance_accounts WHERE tenant_id = ? LIMIT 1').get(tenantId);

    if (acc) {
      if (trxType === 'INCOME' || trxType === 'BANK_DEPOSIT') {
        db.prepare('UPDATE finance_accounts SET balance = balance + ? WHERE id = ?').run(amt, acc.id);
      } else {
        db.prepare('UPDATE finance_accounts SET balance = MAX(0, balance - ?) WHERE id = ?').run(amt, acc.id);
      }
      if (trxType === 'BANK_DEPOSIT') {
        const cashAcc = db.prepare("SELECT * FROM finance_accounts WHERE tenant_id = ? AND account_type = 'Cash Drawer' LIMIT 1").get(tenantId);
        if (cashAcc && cashAcc.id !== acc.id) {
          db.prepare('UPDATE finance_accounts SET balance = MAX(0, balance - ?) WHERE id = ?').run(amt, cashAcc.id);
        }
      }
    }

    db.prepare(`
      INSERT INTO finance_transactions (tenant_id, trx_code, trx_type, category, account_name, amount, description, trx_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tenantId, trxCode, trxType, category, acc ? acc.account_name : accountName, amt, description, dateStr);

    logAction('Finance & Accounts', `Recorded ${trxType} (${category}) of ৳${amt}`, 'info');
    return { ok: true, trxCode };
  }

  if (action === 'DELETE_FINANCE_TRX') {
    const { id } = payload;
    db.prepare('DELETE FROM finance_transactions WHERE id = ? AND tenant_id = ?').run(id, tenantId);
    logAction('Finance & Accounts', `Deleted cashbook voucher #${id}`, 'warning');
    return { ok: true };
  }

  if (action === 'CREATE_PRODUCTION') {
    const { finishedProductId, targetQty = 20, rawMaterialsText = '', rawCost = 1000, laborPackagingCost = 200 } = payload;
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND tenant_id = ?').get(finishedProductId, tenantId);
    if (!product) return { ok: false, error: 'Target product not found' };

    const qty = Number(targetQty || 1);
    const totalProdCost = Number(rawCost || 0) + Number(laborPackagingCost || 0);
    const unitCost = Number((totalProdCost / qty).toFixed(2));
    const batchNo = `MFG-2026-${Math.floor(10 + Math.random() * 89)}`;

    db.prepare(`
      INSERT INTO production_orders (tenant_id, batch_no, finished_product_id, finished_product_name, target_qty, raw_materials_text, raw_cost, labor_packaging_cost, unit_production_cost, status, production_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Completed', ?)
    `).run(tenantId, batchNo, product.id, product.name, qty, rawMaterialsText, Number(rawCost), Number(laborPackagingCost), unitCost, todayISO());

    db.prepare('UPDATE products SET stock_qty = stock_qty + ?, purchase_price = ? WHERE id = ?')
      .run(qty, unitCost, product.id);

    db.prepare(`
      INSERT INTO stock_batches (tenant_id, batch_code, product_id, product_name, movement_type, qty, unit_cost, supplier_or_reason, warehouse_name, created_date)
      VALUES (?, ?, ?, ?, 'PRODUCTION_IN', ?, ?, ?, 'In-House Production Unit', ?)
    `).run(tenantId, batchNo, product.id, product.name, qty, unitCost, `Manufactured (${rawMaterialsText})`, todayISO());

    logAction('Production', `Completed batch ${batchNo}: +${qty} units of "${product.name}"`, 'success');
    return { ok: true, batchNo };
  }

  if (action === 'DELETE_PRODUCTION') {
    const { id } = payload;
    db.prepare('DELETE FROM production_orders WHERE id = ? AND tenant_id = ?').run(id, tenantId);
    logAction('Production', `Deleted production batch record #${id}`, 'warning');
    return { ok: true };
  }

  if (action === 'DELETE_STOCK_BATCH') {
    const { id } = payload;
    db.prepare('DELETE FROM stock_batches WHERE id = ? AND tenant_id = ?').run(id, tenantId);
    logAction('Stock Management', `Deleted stock batch record #${id}`, 'warning');
    return { ok: true };
  }

  // ==================== EMPLOYEES, ATTENDANCE, PAYROLL (ADD, EDIT, DELETE) ====================
  if (action === 'ADD_EMPLOYEE') {
    const { name, designation, phone, baseSalary = 15000, dailyAllowance = 100, commissionRate = 1.0 } = payload;
    const empCode = `EMP-${Math.floor(105 + Math.random() * 890)}`;
    const info = db.prepare(`
      INSERT INTO employees (tenant_id, emp_code, name, designation, phone, base_salary, daily_allowance, commission_rate, advance_taken, joining_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'Active')
    `).run(tenantId, empCode, name, designation, phone, Number(baseSalary), Number(dailyAllowance), Number(commissionRate), todayISO());

    // Also create an October 2026 Payroll row automatically so Payroll sheet updates immediately
    db.prepare(`
      INSERT INTO payroll_records (tenant_id, employee_id, employee_name, designation, month_label, present_days, base_salary, overtime_bonus, sales_commission, advance_deduction, net_payable, payment_status, paid_date)
      VALUES (?, ?, ?, ?, 'October 2026', 26, ?, 0, 0, 0, ?, 'Pending', null)
    `).run(tenantId, info.lastInsertRowid, name, designation, Number(baseSalary), Number(baseSalary));

    logAction('Employees', `Added staff member ${name} (${designation})`, 'success');
    return { ok: true };
  }

  if (action === 'UPDATE_EMPLOYEE') {
    const { id, name, designation, phone, baseSalary, advanceTaken } = payload;
    db.prepare(`
      UPDATE employees
      SET name = ?, designation = ?, phone = ?, base_salary = ?, advance_taken = ?
      WHERE id = ? AND tenant_id = ?
    `).run(name, designation, phone, Number(baseSalary || 0), Number(advanceTaken || 0), Number(id), tenantId);

    // Sync Payroll sheet row for this employee
    db.prepare(`
      UPDATE payroll_records
      SET employee_name = ?,
          designation = ?,
          base_salary = ?,
          advance_deduction = ?,
          net_payable = MAX(0, ? + overtime_bonus + sales_commission - ?)
      WHERE employee_id = ? AND tenant_id = ?
    `).run(name, designation, Number(baseSalary || 0), Number(advanceTaken || 0), Number(baseSalary || 0), Number(advanceTaken || 0), Number(id), tenantId);

    logAction('Employees', `Updated employee ${name} (Salary: ৳${baseSalary}, Advance: ৳${advanceTaken})`, 'info');
    return { ok: true };
  }

  if (action === 'DELETE_EMPLOYEE') {
    const { id } = payload;
    db.prepare('DELETE FROM employees WHERE id = ? AND tenant_id = ?').run(id, tenantId);
    db.prepare('DELETE FROM payroll_records WHERE employee_id = ? AND tenant_id = ?').run(id, tenantId);
    db.prepare('DELETE FROM attendance WHERE employee_id = ? AND tenant_id = ?').run(id, tenantId);
    logAction('Employees', `Removed employee record #${id}`, 'warning');
    return { ok: true };
  }

  if (action === 'MARK_ATTENDANCE') {
    const { employeeId, status = 'Present', checkIn = '09:00 AM', overtimeHours = 0 } = payload;
    const emp = db.prepare('SELECT * FROM employees WHERE id = ? AND tenant_id = ?').get(employeeId, tenantId);
    if (!emp) return { ok: false, error: 'Employee not found' };

    const attDate = todayISO();
    db.prepare(`
      INSERT INTO attendance (tenant_id, employee_id, employee_name, att_date, status, check_in, overtime_hours)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(tenant_id, employee_id, att_date)
      DO UPDATE SET status = excluded.status, check_in = excluded.check_in, overtime_hours = excluded.overtime_hours
    `).run(tenantId, emp.id, emp.name, attDate, status, checkIn, Number(overtimeHours || 0));

    logAction('Attendance', `Marked ${emp.name} as ${status}`, 'info');
    return { ok: true };
  }

  if (action === 'PAY_SALARY') {
    const { payrollId } = payload;
    const rec = db.prepare('SELECT * FROM payroll_records WHERE id = ? AND tenant_id = ?').get(payrollId, tenantId);
    if (rec && rec.payment_status !== 'Paid') {
      const dateStr = todayISO();
      db.prepare("UPDATE payroll_records SET payment_status = 'Paid', paid_date = ? WHERE id = ?").run(dateStr, rec.id);

      // Deduct from Cash Drawer or Bank and post Expense Voucher in Finance Cashbook
      const acc = db.prepare('SELECT * FROM finance_accounts WHERE tenant_id = ? ORDER BY balance DESC LIMIT 1').get(tenantId);
      if (acc) {
        db.prepare('UPDATE finance_accounts SET balance = MAX(0, balance - ?) WHERE id = ?').run(Number(rec.net_payable), acc.id);
        db.prepare(`
          INSERT INTO finance_transactions (tenant_id, trx_code, trx_type, category, account_name, amount, description, trx_date)
          VALUES (?, ?, 'EXPENSE', 'Staff Salary & Payroll', ?, ?, ?, ?)
        `).run(
          tenantId,
          `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
          acc.account_name,
          Number(rec.net_payable),
          `Paid October 2026 Salary to ${rec.employee_name} (${rec.designation})`,
          dateStr
        );
      }

      logAction('Payroll', `Disbursed salary ৳${rec.net_payable} to ${rec.employee_name}`, 'success');
    }
    return { ok: true };
  }

  if (action === 'UPDATE_TENANT_CONFIG') {
    const { name, subtitle, ownerName, phone, address, vatRate, monthlyRent } = payload;
    db.prepare(`
      UPDATE tenants
      SET name = COALESCE(?, name),
          subtitle = COALESCE(?, subtitle),
          owner_name = COALESCE(?, owner_name),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          vat_rate = COALESCE(?, vat_rate),
          monthly_rent = COALESCE(?, monthly_rent)
      WHERE id = ?
    `).run(name, subtitle, ownerName, phone, address, Number(vatRate ?? 0), Number(monthlyRent ?? 18000), tenantId);

    logAction('Configuration', `Updated SME profile settings for ${name || tenantId}`, 'info');
    return { ok: true };
  }

  return { ok: false, error: 'Unknown action' };
}

