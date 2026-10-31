// ============================================================================
// FILE: src/database/schema.js
// PURPOSE: Database Table Definitions for SmartERP (PostgreSQL & SQLite)
// ============================================================================

export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    category TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    bin_tin TEXT NOT NULL,
    currency TEXT DEFAULT '৳',
    vat_rate REAL DEFAULT 0.0,
    has_serial_warranty INTEGER DEFAULT 1,
    has_expiry_batch INTEGER DEFAULT 0,
    has_bom_production INTEGER DEFAULT 1,
    monthly_rent REAL DEFAULT 18000,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    username TEXT NOT NULL,
    email TEXT,
    password TEXT DEFAULT '123456',
    role TEXT NOT NULL,
    phone TEXT,
    pin TEXT DEFAULT '1234',
    avatar_color TEXT DEFAULT '#e11d48',
    permissions TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    manager TEXT NOT NULL,
    capacity_units INTEGER DEFAULT 2000,
    status TEXT DEFAULT 'Active'
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    sku TEXT NOT NULL,
    barcode TEXT NOT NULL,
    name TEXT NOT NULL,
    name_bn TEXT,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    purchase_price REAL NOT NULL,
    retail_price REAL NOT NULL,
    wholesale_price REAL NOT NULL,
    min_wholesale_qty INTEGER DEFAULT 5,
    stock_qty INTEGER NOT NULL,
    alert_qty INTEGER DEFAULT 10,
    warranty_months INTEGER DEFAULT 0,
    expiry_date TEXT,
    warehouse_id INTEGER DEFAULT 1,
    supplier_name TEXT
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    shop_name TEXT,
    phone TEXT NOT NULL,
    address TEXT,
    customer_type TEXT DEFAULT 'Wholesale',
    credit_limit REAL DEFAULT 50000,
    current_due REAL DEFAULT 0,
    total_purchased REAL DEFAULT 0,
    last_payment_date TEXT,
    trust_score INTEGER DEFAULT 90,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    invoice_no TEXT NOT NULL,
    customer_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    sale_type TEXT DEFAULT 'Retail',
    subtotal REAL NOT NULL,
    discount REAL DEFAULT 0,
    vat_amount REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    paid_amount REAL NOT NULL,
    due_amount REAL NOT NULL,
    profit_amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    mfs_trx_id TEXT,
    sold_by TEXT DEFAULT 'Admin',
    sale_date TEXT NOT NULL,
    items_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS due_collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    receipt_no TEXT NOT NULL,
    customer_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    reference_note TEXT,
    collected_by TEXT DEFAULT 'Admin',
    collection_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stock_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    batch_code TEXT NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    movement_type TEXT NOT NULL,
    qty INTEGER NOT NULL,
    unit_cost REAL NOT NULL,
    supplier_or_reason TEXT NOT NULL,
    warehouse_name TEXT DEFAULT 'Main Godown',
    created_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS returns_replacements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    claim_no TEXT NOT NULL,
    record_type TEXT NOT NULL,
    invoice_no TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    serial_no TEXT,
    qty INTEGER NOT NULL,
    amount REAL NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'Completed',
    created_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS finance_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    account_number TEXT NOT NULL,
    balance REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS finance_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    trx_code TEXT NOT NULL,
    trx_type TEXT NOT NULL,
    category TEXT NOT NULL,
    account_name TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    trx_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS production_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    batch_no TEXT NOT NULL,
    finished_product_id INTEGER NOT NULL,
    finished_product_name TEXT NOT NULL,
    target_qty INTEGER NOT NULL,
    raw_materials_text TEXT NOT NULL,
    raw_cost REAL NOT NULL,
    labor_packaging_cost REAL NOT NULL,
    unit_production_cost REAL NOT NULL,
    status TEXT DEFAULT 'Completed',
    production_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    emp_code TEXT NOT NULL,
    name TEXT NOT NULL,
    designation TEXT NOT NULL,
    phone TEXT NOT NULL,
    base_salary REAL NOT NULL,
    daily_allowance REAL DEFAULT 100,
    commission_rate REAL DEFAULT 1.0,
    advance_taken REAL DEFAULT 0,
    joining_date TEXT NOT NULL,
    status TEXT DEFAULT 'Active'
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    employee_id INTEGER NOT NULL,
    employee_name TEXT NOT NULL,
    att_date TEXT NOT NULL,
    status TEXT NOT NULL,
    check_in TEXT,
    overtime_hours REAL DEFAULT 0,
    UNIQUE(tenant_id, employee_id, att_date)
  );

  CREATE TABLE IF NOT EXISTS payroll_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    employee_id INTEGER NOT NULL,
    employee_name TEXT NOT NULL,
    designation TEXT NOT NULL,
    month_label TEXT NOT NULL,
    present_days INTEGER NOT NULL,
    base_salary REAL NOT NULL,
    overtime_bonus REAL DEFAULT 0,
    sales_commission REAL DEFAULT 0,
    advance_deduction REAL DEFAULT 0,
    net_payable REAL NOT NULL,
    payment_status TEXT DEFAULT 'Paid',
    paid_date TEXT
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    module TEXT NOT NULL,
    action_text TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS monthly_revenue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    month_key TEXT NOT NULL,
    month_label TEXT NOT NULL,
    revenue REAL NOT NULL,
    cost REAL NOT NULL,
    profit REAL NOT NULL
  );
`;

