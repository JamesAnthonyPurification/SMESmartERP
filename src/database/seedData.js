// ============================================================================
// FILE: src/database/seedData.js
// PURPOSE: Real-Life SME Dataset for SmartERP (October 01–31, 2026)
// Tenants:
//   1. powercell -> SMARTERP ELECTRONICS (Battery, IPS, Solar & Electronics)
//   2. amarfood  -> Amar Food (Fish, Meat, Rice, Oil, Spices, Grocery & Kitchen)
//   + Super Admin (SmartERP SaaS Company Platform Owner)
// ============================================================================

export function seedInitialData(db) {
  try {
    db.exec("ALTER TABLE users ADD COLUMN email TEXT DEFAULT 'admin@smarterp.com';");
  } catch (_) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN password TEXT DEFAULT '123456';");
  } catch (_) {}

  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM tenants').get();
  if (countRow && countRow.cnt > 0) return;

  // --------------------------------------------------------------------------
  // 1. TWO SME TENANTS (Under SmartERP SaaS Platform)
  // --------------------------------------------------------------------------
  const insertTenant = db.prepare(`
    INSERT INTO tenants (id, name, subtitle, category, owner_name, phone, address, bin_tin, currency, vat_rate, has_serial_warranty, has_expiry_batch, has_bom_production, monthly_rent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTenant.run(
    'powercell',
    'SMARTERP ELECTRONICS',
    'PowerCell Battery, IPS & Electronics Wholesale — Live Overview',
    'Electronics, Battery & IPS SME',
    'Alhaj Md. Rafiqul Islam',
    '01711-889900',
    '42/A Nawabpur Road, Gulistan, Dhaka-1100',
    'BIN-004918273-0101',
    '৳',
    0.0,
    1,
    0,
    1,
    22000
  );

  insertTenant.run(
    'amarfood',
    'Amar Food',
    'Fish, Meat, Grocery & Kitchen Essentials — POS & ERP Management',
    'Food, Fish, Grocery & Kitchen SME',
    'Saeed Siddique',
    '01819-334455',
    'House 14, Chawk Bazar Wholesale Hub, Dhaka',
    'BIN-009182731-0204',
    '৳',
    2.5,
    0,
    1,
    1,
    18000
  );

  // --------------------------------------------------------------------------
  // 2. USERS & ROLES (Strict Tenant Isolation + 1 SaaS Super Admin)
  // --------------------------------------------------------------------------
  const insertUser = db.prepare(`
    INSERT INTO users (tenant_id, name, username, email, password, role, phone, pin, avatar_color, permissions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // SmartERP SaaS Super Admin (Company Owner - Can monitor both tenants)
  insertUser.run(
    'superadmin',
    'SmartERP Super Admin',
    'superadmin',
    'superadmin@smarterp.com',
    '123456',
    'Super Admin (SmartERP SaaS)',
    '01700-999999',
    '1234',
    '#0f172a',
    'ALL'
  );

  // Tenant 1: SMARTERP ELECTRONICS Roles
  const pcUsers = [
    ['Owner / Admin', 'Rafiqul Islam (Admin)', 'admin', 'admin@electronics.com', '123456', '01711-889900', '#e11d48', 'ALL'],
    ['Cashier / POS', 'Kamrul Hasan (Cashier)', 'cashier', 'cashier@electronics.com', '123456', '01722-112233', '#16a34a', 'POS,CUSTOMERS,DUE,RETURNS,SALES_HISTORY'],
    ['Godown / Store', 'Mizanur Rahman (Store)', 'store', 'store@electronics.com', '123456', '01833-445566', '#2563eb', 'PRODUCTS,STOCK_IN,STOCK_ADJUST,WAREHOUSE,PRODUCTION'],
    ['Accounts / HR', 'Farhana Yasmin (Accounts)', 'accounts', 'accounts@electronics.com', '123456', '01944-778899', '#9333ea', 'FINANCE,BANK,ACCOUNTS,EMPLOYEES,ATTENDANCE,PAYROLL,REPORTS']
  ];
  for (const u of pcUsers) {
    insertUser.run('powercell', u[1], u[2], u[3], u[4], u[0], u[5], '1234', u[6], u[7]);
  }

  // Tenant 2: Amar Food Roles
  const afUsers = [
    ['Owner / Admin', 'Saeed Siddique (Admin)', 'admin', 'admin@amarfood.com', '123456', '01819-334455', '#e11d48', 'ALL'],
    ['Cashier / POS', 'Rubel Mia (Cashier)', 'cashier', 'cashier@amarfood.com', '123456', '01815-112200', '#16a34a', 'POS,CUSTOMERS,DUE,RETURNS,SALES_HISTORY'],
    ['Godown / Store', 'Babul Hossain (Store)', 'store', 'store@amarfood.com', '123456', '01822-334411', '#2563eb', 'PRODUCTS,STOCK_IN,STOCK_ADJUST,WAREHOUSE,PRODUCTION'],
    ['Accounts / HR', 'Nusrat Jahan (Accounts)', 'accounts', 'accounts@amarfood.com', '123456', '01755-667788', '#9333ea', 'FINANCE,BANK,ACCOUNTS,EMPLOYEES,ATTENDANCE,PAYROLL,REPORTS']
  ];
  for (const u of afUsers) {
    insertUser.run('amarfood', u[1], u[2], u[3], u[4], u[0], u[5], '1234', u[6], u[7]);
  }

  // --------------------------------------------------------------------------
  // 3. WAREHOUSES / GODOWNS
  // --------------------------------------------------------------------------
  const insertWarehouse = db.prepare(`
    INSERT INTO warehouses (tenant_id, name, location, manager, capacity_units, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertWarehouse.run('powercell', 'Nawabpur Main Showroom & Counter', '42/A Nawabpur Road, Dhaka', 'Kamrul Hasan', 2500, 'Active');
  insertWarehouse.run('powercell', 'Keraniganj Battery & Solar Godown', 'Kadamtoli Industrial Area', 'Mizanur Rahman', 6000, 'Active');

  insertWarehouse.run('amarfood', 'Chawk Bazar Main Food & Fish Outlet', 'House 14, Chawk Bazar, Dhaka', 'Rubel Mia', 4000, 'Active');
  insertWarehouse.run('amarfood', 'Cold Storage & Spice Packaging Unit', 'Tejgaon Industrial Area, Dhaka', 'Babul Hossain', 8000, 'Active');

  // --------------------------------------------------------------------------
  // 4. RICH PRODUCT DATASETS FOR BOTH TENANTS (Available & Out of Stock)
  // --------------------------------------------------------------------------
  const insertProduct = db.prepare(`
    INSERT INTO products (tenant_id, sku, barcode, name, name_bn, category, unit, purchase_price, retail_price, wholesale_price, min_wholesale_qty, stock_qty, alert_qty, warranty_months, expiry_date, warehouse_id, supplier_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // === TENANT 1: SMARTERP ELECTRONICS (16 Products across Battery, IPS, Solar, Cables, Lighting, Stabilizer) ===
  const electronicsCatalog = [
    ['PC-BAT-12V7A', '8941100101', 'PowerCell 12V 7.5Ah UPS/IPS Dry Battery', 'পাওয়ারসেল ১২ভোল্ট ৭.৫এম্পিয়ার ব্যাটারি', 'UPS/IPS Battery', 'Pcs', 950, 1250, 1120, 5, 165, 25, 12, null, 1, 'PowerCell Energy BD'],
    ['PC-LI-18650', '8941100102', 'Lithium-Ion 18650 3200mAh High-Drain Cell', 'লিথিয়াম আয়ন ১৮৬৫০ ব্যাটারি সেল', 'Lithium Cell', 'Pcs', 140, 220, 180, 20, 320, 40, 6, null, 1, 'Shenzhen LiTech Import'],
    ['PC-SOL-150AH', '8941100103', 'Hamko 150Ah Tubular IPS Deep-Cycle Battery', 'হামকো ১৫০এম্পিয়ার টিউবুলার ব্যাটারি', 'Tubular Battery', 'Pcs', 14200, 16800, 15900, 2, 18, 5, 24, null, 2, 'Hamko Corporation'],
    ['PC-INV-1000VA', '8941100104', 'Luminous Eco Volt 1050VA Pure Sine Wave IPS', 'লুমিনাস ১০৫০ভিএ পিওর সাইন ওয়েভ আইপিএস', 'IPS & Inverter', 'Unit', 7200, 9200, 8400, 2, 14, 4, 24, null, 1, 'Rahimafrooz Distribution'],
    ['PC-SOL-200W', '8941100105', 'Mono-Crystalline 200W 12V Solar Panel', 'মনো ২০০ ওয়াট সোলার প্যানেল', 'Solar Panel', 'Pcs', 6400, 7900, 7200, 3, 25, 5, 60, null, 2, 'SolarTech Bangladesh'],
    ['PC-CHG-12V10A', '8941100106', 'Smart Auto-Cut 12V 10A Digital Battery Charger', 'স্মার্ট অটো-কাট ১২ভোল্ট চার্জার', 'Chargers', 'Pcs', 480, 690, 580, 5, 42, 10, 6, null, 1, 'Nawabpur Electronics'],
    ['PC-LED-18W', '8941100107', 'SuperStar 18W AC/DC Rechargeable Emergency LED Bulb', 'সুপারস্টার ১৮ওয়াট এসি/ডিসি চার্জার বাল্ব', 'LED & Lighting', 'Pcs', 210, 320, 265, 12, 140, 20, 12, null, 1, 'SuperStar Group'],
    ['PC-CAB-25RM', '8941100108', 'BRB 2.5rm Flame Retardant House Wiring Cable (Coil)', 'বিআরবি ২.৫ আরএম ক্যাবল কয়েল', 'Cables & Wire', 'Coil', 3150, 3650, 3420, 3, 22, 5, 0, null, 2, 'BRB Cable Industries'],
    ['PC-STB-2000VA', '8941100109', 'Walton 2000VA Servo Voltage Stabilizer (Refrigerator/AC)', 'ওয়ালটন ২০০০ভিএ ভোল্টেজ স্ট্যাবিলইজার', 'Voltage Stabilizer', 'Unit', 3800, 4650, 4250, 2, 12, 4, 18, null, 1, 'Walton Plaza Wholesale'],
    ['PC-MCB-32A', '8941100110', 'Havells 32A Double Pole Circuit Breaker (MCB)', 'হ্যাভেলস ৩২এম্পিয়ার সার্কিট ব্রেকার', 'Switch & Socket', 'Pcs', 340, 480, 410, 10, 65, 15, 12, null, 1, 'Nawabpur Electric Hub'],
    ['PC-FAN-16IN', '8941100111', 'AC/DC Rechargeable 16-Inch Table Fan with Battery', 'এসি/ডিসি চার্জার টেবিল ফ্যান ১৬ ইঞ্চি', 'Cooling & Fan', 'Unit', 2650, 3350, 2980, 3, 19, 5, 12, null, 1, ' Walton Electrical'],
    ['PC-EXT-5M', '8941100112', 'Heavy Duty 5-Socket Surge Protector Multiplug (5m)', 'হেভি ডিউটি ৫-সকেট মাল্টিপ্লাগ', 'Accessories', 'Pcs', 290, 450, 360, 10, 85, 15, 6, null, 1, 'Smart Electro Import'],
    ['PC-WAT-5L', '8941100113', 'De-Ionized Battery Distilled Water (5 Liter Jar)', 'ব্যাটারির ডিস্টিল্ড ওয়াটার ৫ লিটার', 'Maintenance', 'Jar', 65, 110, 85, 10, 90, 20, 0, '2027-12-31', 2, 'In-House Production'],
    // Out of Stock Electronics Items (Stock = 0)
    ['PC-SOL-CTRL', '8941100114', 'MPPT 40A Solar Charge Controller 12V/24V Auto', 'এমপিপিটি ৪০এম্পিয়ার সোলার চার্জ কন্ট্রোলার', 'Solar Panel', 'Unit', 3200, 4100, 3700, 3, 0, 5, 12, null, 1, 'SolarTech Bangladesh'],
    ['PC-BAT-200AH', '8941100115', 'Lucas 200Ah Heavy Duty Tall Tubular IPS Battery', 'লুকাস ২০০এম্পিয়ার টিউবুলার ব্যাটারি', 'Tubular Battery', 'Pcs', 18500, 21500, 20200, 2, 0, 4, 24, null, 2, 'Rahimafrooz Distribution'],
    ['PC-INV-2000VA', '8941100116', 'Sukam Falcon+ 2000VA Sine Wave Double Battery IPS', 'সুকাম ২০০০ভিএ ডাবল ব্যাটারি আইপিএস', 'IPS & Inverter', 'Unit', 12500, 15200, 14100, 2, 0, 3, 24, null, 1, 'PowerCell Energy BD']
  ];

  for (const p of electronicsCatalog) {
    insertProduct.run('powercell', ...p);
  }

  // === TENANT 2: AMAR FOOD (18 Products: Fish, Meat, Rice, Oil, Spices, Dal, Dairy, Kitchen Items) ===
  const amarFoodCatalog = [
    // Fish & Seafood Items
    ['AF-FSH-HIL1K', '8942200101', 'Padma River Fresh Hilsa Fish (Ilish 1kg+ Size)', 'পদ্মার তাজা ইলিশ মাছ (১ কেজি+ সাইজ)', 'Fish & Seafood', 'Kg', 1350, 1650, 1520, 5, 45, 10, 0, '2026-11-15', 3, 'Chandpur Meghna Matsya Arat'],
    ['AF-FSH-ROH2K', '8942200102', 'Fresh Deshi Rui Fish Whole (2kg–2.5kg Size)', 'দেশি তাজা রুই মাছ ( প্রতি কেজি )', 'Fish & Seafood', 'Kg', 310, 390, 355, 10, 80, 15, 0, '2026-11-10', 3, 'Rajshahi Fish Hatchery'],
    ['AF-FSH-KATLA', '8942200103', 'River Katla Fish Large Cut Ready (Per Kg)', 'বড় কাতলা মাছ (প্রতি কেজি)', 'Fish & Seafood', 'Kg', 330, 420, 380, 10, 60, 15, 0, '2026-11-10', 3, 'Aricha Ghat Fish Depot'],
    ['AF-FSH-CHING', '8942200104', 'Khulna Golda Chingri / Jumbo Prawn (500g Pack)', 'খুলনার গলদা চিংড়ি ৫০০ গ্রাম প্যাক', 'Fish & Seafood', 'Pack', 460, 590, 530, 6, 35, 8, 0, '2026-12-05', 4, 'Khulna Frozen Foods'],
    ['AF-FSH-RUPCH', '8942200105', 'Coxs Bazar Sea Rupchanda Fish (Medium Per Kg)', 'কক্সবাজারের সামুদ্রিক রূপচাঁদা মাছ', 'Fish & Seafood', 'Kg', 780, 980, 890, 5, 0, 8, 0, '2026-11-20', 4, 'Chattogram Fishery Ghat'],

    // Rice, Dal & Grains
    ['AF-RIC-CHIN1K', '8942200106', 'Amar Premium Chinigura Aromatic Polao Rice (1kg)', 'প্রিমিয়াম চিনিগুঁড়া পোলাও চাল ১ কেজি', 'Rice & Grains', 'Pack', 115, 145, 132, 12, 160, 25, 0, '2027-06-30', 3, 'Dinajpur Auto Rice Mills'],
    ['AF-RIC-MINI5K', '8942200107', 'Kushtia Super Miniket Parboiled Rice (5kg Bag)', 'কুষ্টিয়ার সুপার মিনিকেট চাল ৫ কেজি বস্তা', 'Rice & Grains', 'Bag', 335, 395, 368, 5, 95, 20, 0, '2027-08-15', 3, 'Kushtia Khazana Mill'],
    ['AF-RIC-NAZ25K', '8942200108', 'Premium Najirshail Steam Rice (25kg Wholesale Sack)', 'প্রিমিয়াম নাজিরশাইল চাল ২৫ কেজি বস্তা', 'Rice & Grains', 'Sack', 1720, 1980, 1860, 2, 40, 10, 0, '2027-09-30', 4, 'Naogaon Agro Rice Mill'],
    ['AF-DAL-MOS1K', '8942200109', 'Deshi Fine Red Lentil / Moshur Dal (1kg Pack)', 'দেশি চিকন মসুর ডাল ১ কেজি', 'Dal & Pulses', 'Pack', 112, 138, 126, 12, 130, 25, 0, '2027-05-20', 3, 'Faridpur Pulse Mill'],

    // Cooking Oil & Kitchen Spices
    ['AF-OIL-SOY5L', '8942200110', 'Fortified Vitamin-A Soybean Cooking Oil (5 Liter Jar)', 'ফর্টিফাইড সয়াবিন তেল ৫ লিটার জার', 'Cooking Oil', 'Jar', 760, 845, 810, 4, 75, 15, 0, '2027-07-30', 3, 'Meghna Edible Oils'],
    ['AF-OIL-MUST500', '8942200111', 'Ghani Bhanga Pure Mustard Oil (500ml Bottle)', 'ঘানি ভাঙা খাঁটি সরিষার তেল ৫০০ মি.লি.', 'Cooking Oil', 'Bottle', 120, 160, 142, 12, 88, 15, 0, '2027-04-15', 4, 'In-House Packaging'],
    ['AF-SPC-TURM200', '8942200112', 'Organic Sylheti Turmeric / Holud Powder (200g)', 'খাঁটি হলুদের গুঁড়া ২০০ গ্রাম', 'Spices & Masala', 'Pouch', 52, 75, 64, 20, 140, 30, 0, '2027-03-20', 4, 'In-House Grinding Mill'],
    ['AF-SPC-CHIL200', '8942200113', 'Bogra Hot Red Chilli / Morich Powder (200g)', 'বগুড়ার লাল মরিচের গুঁড়া ২০০ গ্রাম', 'Spices & Masala', 'Pouch', 68, 95, 82, 20, 115, 25, 0, '2027-03-20', 4, 'In-House Grinding Mill'],
    ['AF-SPC-GAR1K', '8942200114', 'Imported Fresh Onion & Garlic Combo (1kg Net Bag)', 'পেঁয়াজ ও রসুন কম্বো ১ কেজি ব্যাগ', 'Kitchen Essentials', 'Bag', 95, 125, 110, 10, 70, 15, 0, '2026-11-25', 3, 'Shyambazar Wholesale Arat'],

    // Meat, Poultry, Dairy & Beverages (Includes Out of Stock items)
    ['AF-MET-CHIK1K', '8942200115', 'Fresh Halal Broiler Chicken Skinless (1kg Dressed)', 'হালাল ড্রেসড ব্রয়লার চিকেন ১ কেজি', 'Meat & Poultry', 'Kg', 185, 230, 210, 10, 50, 12, 0, '2026-11-05', 3, 'Kazi Agro Poultry'],
    ['AF-MET-BEEF1K', '8942200116', 'Premium Bone-In Deshi Beef / Gorur Mangsho (1kg)', 'দেশি গরুর মাংস ১ কেজি প্যাক', 'Meat & Poultry', 'Kg', 680, 780, 740, 5, 0, 10, 0, '2026-11-05', 4, 'Bengal Meat Supply'],
    ['AF-DRY-GHEE400', '8942200117', 'Pabna Pure Danadar Cow Ghee (400g Tin)', 'পাবনার খাঁটি দানাদার গাওয়া ঘি ৪০০ গ্রাম', 'Dairy & Ghee', 'Tin', 490, 620, 560, 6, 0, 10, 0, '2027-02-15', 3, 'Pabna Dairy Co-op'],
    ['AF-BEV-TEA400', '8942200118', 'Srimangal Sylhet Special Gold Leaf Tea (400g Pack)', 'শ্রীমঙ্গলের স্পেশাল গোল্ড চাপাতা ৪০০ গ্রাম', 'Tea & Beverage', 'Pack', 165, 215, 192, 12, 90, 15, 0, '2027-08-01', 3, 'Sylhet Tea Estates']
  ];

  for (const p of amarFoodCatalog) {
    insertProduct.run('amarfood', ...p);
  }

  // --------------------------------------------------------------------------
  // 5. CUSTOMERS & DEALER BAKI KHATA LEDGER (Oct 2026 Dates)
  // --------------------------------------------------------------------------
  const insertCustomer = db.prepare(`
    INSERT INTO customers (tenant_id, name, shop_name, phone, address, customer_type, credit_limit, current_due, total_purchased, last_payment_date, trust_score, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCustomer.run('powercell', 'Md. Abdul Kader', 'Mayer Doa Electronics & IPS', '01715-223344', 'Sadar Road, Narayanganj', 'Wholesale', 60000, 14500, 92400, '2026-10-18', 92, 'Regular weekly battery dealer');
  insertCustomer.run('powercell', 'Jahangir Alam', 'Bismillah Battery House', '01817-998877', 'Tongi Station Road, Gazipur', 'Dealer', 80000, 28200, 164000, '2026-10-09', 78, 'Pending due from 12V battery & IPS batch');
  insertCustomer.run('powercell', 'Shahin Mia', 'Al-Madina Auto & Solar', '01911-443322', 'Savar Bazar Bus Stand', 'Wholesale', 40000, 4800, 49500, '2026-10-25', 96, 'Prompt payer, buys solar panels & chargers');
  insertCustomer.run('powercell', 'Walk-in Retail Customer', 'Counter Cash Sale', '01700-000000', 'Nawabpur Counter', 'Retail', 0, 0, 24800, '2026-10-30', 100, 'Direct walk-in customer');

  insertCustomer.run('amarfood', 'Haji Nurul Islam', 'Janani General Store & Grocery', '01812-665544', 'Mohammadpur Krishi Market, Dhaka', 'Wholesale', 50000, 9400, 74500, '2026-10-21', 91, 'Orders Chinigura rice, oil & spices weekly');
  insertCustomer.run('amarfood', 'Chef Monirul Haque', 'Sultan Dine & Kacchi Kitchen', '01716-554433', 'Dhanmondi Satmasjid Road, Dhaka', 'Wholesale', 60000, 15200, 118000, '2026-10-16', 88, 'Orders Padma Hilsa, Rui fish, Chinigura rice & Ghee');
  insertCustomer.run('amarfood', 'abdul Malek', 'Bhai Bhai Fish & Sobji Mart', '01922-887766', 'Mirpur-11 Kitchen Market', 'Wholesale', 35000, 6250, 48200, '2026-10-24', 85, 'Buys fresh fish & poultry wholesale');
  insertCustomer.run('amarfood', 'Mrs. Salma Begum', 'Family Kitchen Retail Buyer', '01611-223399', 'Lalbagh Road, Dhaka', 'Retail', 10000, 850, 12400, '2026-10-28', 95, 'Monthly home kitchen grocery & fish buyer');

  // --------------------------------------------------------------------------
  // 6. SALES INVOICES (All dated strictly 01–31 Oct 2026)
  // --------------------------------------------------------------------------
  const insertSale = db.prepare(`
    INSERT INTO sales (tenant_id, invoice_no, customer_id, customer_name, customer_phone, sale_type, subtotal, discount, vat_amount, total_amount, paid_amount, due_amount, profit_amount, payment_method, mfs_trx_id, sold_by, sale_date, items_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Electronics Sales (01-31 Oct 2026)
  const pcSales = [
    ['INV-2026-1001', 1, 'Mayer Doa Electronics & IPS', '01715-223344', 'Wholesale', 11200, 0, 0, 11200, 9000, 2200, 1700, 'bKash', 'BK981273A', 'Admin', '2026-10-03', JSON.stringify([{ name: 'PowerCell 12V 7.5Ah UPS/IPS Dry Battery', qty: 10, price: 1120, cost: 950 }])],
    ['INV-2026-1002', 2, 'Bismillah Battery House', '01817-998877', 'Wholesale', 15900, 0, 0, 15900, 12000, 3900, 1700, 'Cash', '', 'Admin', '2026-10-08', JSON.stringify([{ name: 'Hamko 150Ah Tubular IPS Deep-Cycle Battery', qty: 1, price: 15900, cost: 14200 }])],
    ['INV-2026-1003', 3, 'Al-Madina Auto & Solar', '01911-443322', 'Wholesale', 7200, 0, 0, 7200, 7200, 0, 800, 'Nagad', 'NG772190X', 'Kamrul Hasan', '2026-10-12', JSON.stringify([{ name: 'Mono-Crystalline 200W 12V Solar Panel', qty: 1, price: 7200, cost: 6400 }])],
    ['INV-2026-1004', 4, 'Walk-in Retail Customer', '01700-000000', 'Retail', 2650, 0, 0, 2650, 2650, 0, 550, 'Cash', '', 'Kamrul Hasan', '2026-10-17', JSON.stringify([{ name: 'SuperStar 18W AC/DC Rechargeable Emergency LED Bulb', qty: 10, price: 265, cost: 210 }])],
    ['INV-2026-1005', 1, 'Mayer Doa Electronics & IPS', '01715-223344', 'Wholesale', 8400, 0, 0, 8400, 8400, 0, 1200, 'Bank', 'DBBL-8821', 'Admin', '2026-10-21', JSON.stringify([{ name: 'Luminous Eco Volt 1050VA Pure Sine Wave IPS', qty: 1, price: 8400, cost: 7200 }])],
    ['INV-2026-1006', 3, 'Al-Madina Auto & Solar', '01911-443322', 'Wholesale', 3420, 0, 0, 3420, 3000, 420, 270, 'bKash', 'BK661209M', 'Admin', '2026-10-26', JSON.stringify([{ name: 'BRB 2.5rm Flame Retardant House Wiring Cable (Coil)', qty: 1, price: 3420, cost: 3150 }])],
    ['INV-2026-1007', 4, 'Walk-in Retail Customer', '01700-000000', 'Retail', 1380, 0, 0, 1380, 1380, 0, 420, 'Cash', '', 'Admin', '2026-10-30', JSON.stringify([{ name: 'Smart Auto-Cut 12V 10A Digital Battery Charger', qty: 2, price: 690, cost: 480 }])]
  ];
  for (const s of pcSales) {
    insertSale.run('powercell', ...s);
  }

  // Amar Food Sales (01-31 Oct 2026)
  const afSales = [
    ['AF-2026-2001', 5, 'Janani General Store & Grocery', '01812-665544', 'Wholesale', 4824, 0, 0, 4824, 4000, 824, 544, 'Cash', '', 'Admin', '2026-10-04', JSON.stringify([{ name: 'Amar Premium Chinigura Aromatic Polao Rice (1kg)', qty: 12, price: 132, cost: 115 }, { name: 'Fortified Vitamin-A Soybean Cooking Oil (5 Liter Jar)', qty: 4, price: 810, cost: 760 }])],
    ['AF-2026-2002', 6, 'Sultan Dine & Kacchi Kitchen', '01716-554433', 'Wholesale', 7600, 0, 0, 7600, 6000, 1600, 850, 'bKash', 'BK449182K', 'Admin', '2026-10-10', JSON.stringify([{ name: 'Padma River Fresh Hilsa Fish (Ilish 1kg+ Size)', qty: 5, price: 1520, cost: 1350 }])],
    ['AF-2026-2003', 7, 'Bhai Bhai Fish & Sobji Mart', '01922-887766', 'Wholesale', 6230, 0, 0, 6230, 5000, 1230, 730, 'Nagad', 'NG918231P', 'Rubel Mia', '2026-10-16', JSON.stringify([{ name: 'Fresh Deshi Rui Fish Whole (2kg–2.5kg Size)', qty: 10, price: 355, cost: 310 }, { name: 'Khulna Golda Chingri / Jumbo Prawn (500g Pack)', qty: 5, price: 536, cost: 460 }])],
    ['AF-2026-2004', 8, 'Mrs. Salma Begum', '01611-223399', 'Retail', 1845, 0, 0, 1845, 1845, 0, 295, 'Cash', '', 'Rubel Mia', '2026-10-23', JSON.stringify([{ name: 'Kushtia Super Miniket Parboiled Rice (5kg Bag)', qty: 2, price: 395, cost: 335 }, { name: 'Fresh Halal Broiler Chicken Skinless (1kg Dressed)', qty: 3, price: 230, cost: 185 }, { name: 'Ghani Bhanga Pure Mustard Oil (500ml Bottle)', qty: 2, price: 182.5, cost: 120 }])],
    ['AF-2026-2005', 5, 'Janani General Store & Grocery', '01812-665544', 'Wholesale', 4440, 0, 0, 4440, 4440, 0, 520, 'Bank', 'IBBL-3391', 'Admin', '2026-10-29', JSON.stringify([{ name: 'Deshi Fine Red Lentil / Moshur Dal (1kg Pack)', qty: 20, price: 126, cost: 112 }, { name: 'Srimangal Sylhet Special Gold Leaf Tea (400g Pack)', qty: 10, price: 192, cost: 165 }])]
  ];
  for (const s of afSales) {
    insertSale.run('amarfood', ...s);
  }

  // --------------------------------------------------------------------------
  // 7. DUE COLLECTIONS (01–31 Oct 2026)
  // --------------------------------------------------------------------------
  const insertDueCol = db.prepare(`
    INSERT INTO due_collections (tenant_id, receipt_no, customer_id, customer_name, amount, payment_method, reference_note, collected_by, collection_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertDueCol.run('powercell', 'MR-2026-501', 1, 'Mayer Doa Electronics & IPS', 5000, 'bKash', 'Oct Weekly Khata Installment (Trx: BK88712A)', 'Admin', '2026-10-18');
  insertDueCol.run('powercell', 'MR-2026-502', 2, 'Bismillah Battery House', 8000, 'Cash', 'Collected at Tongi Bazar', 'Kamrul Hasan', '2026-10-09');
  insertDueCol.run('powercell', 'MR-2026-503', 3, 'Al-Madina Auto & Solar', 3500, 'Nagad', 'Solar panel due settled', 'Admin', '2026-10-25');

  insertDueCol.run('amarfood', 'MR-2026-601', 5, 'Janani General Store & Grocery', 4500, 'Nagad', 'Chawk Bazar Due Khata Settlement', 'Admin', '2026-10-21');
  insertDueCol.run('amarfood', 'MR-2026-602', 6, 'Sultan Dine & Kacchi Kitchen', 10000, 'Bank', 'Restaurant Fish & Rice Supply Bill', 'Admin', '2026-10-16');

  // --------------------------------------------------------------------------
  // 8. STOCK BATCH & ADJUSTMENT HISTORY (Rich Product Types, 01–31 Oct 2026)
  // --------------------------------------------------------------------------
  const insertBatch = db.prepare(`
    INSERT INTO stock_batches (tenant_id, batch_code, product_id, product_name, movement_type, qty, unit_cost, supplier_or_reason, warehouse_name, created_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Electronics Stock Batches (Oct 2026)
  insertBatch.run('powercell', 'BATCH-2610-01', 1, 'PowerCell 12V 7.5Ah UPS/IPS Dry Battery', 'STOCK_IN', 180, 950, 'PowerCell Energy BD (Challan #409)', 'Nawabpur Main Showroom & Counter', '2026-10-02');
  insertBatch.run('powercell', 'BATCH-2610-02', 2, 'Lithium-Ion 18650 3200mAh High-Drain Cell', 'STOCK_IN', 200, 140, 'Shenzhen LiTech Import Lot #12', 'Nawabpur Main Showroom & Counter', '2026-10-05');
  insertBatch.run('powercell', 'BATCH-2610-03', 3, 'Hamko 150Ah Tubular IPS Deep-Cycle Battery', 'STOCK_IN', 20, 14200, 'Hamko Corporation Factory Truck #08', 'Keraniganj Battery & Solar Godown', '2026-10-09');
  insertBatch.run('powercell', 'BATCH-2610-04', 5, 'Mono-Crystalline 200W 12V Solar Panel', 'STOCK_IN', 25, 6400, 'SolarTech Bangladesh Shipment #19', 'Keraniganj Battery & Solar Godown', '2026-10-12');
  insertBatch.run('powercell', 'ADJ-2610-05', 1, 'PowerCell 12V 7.5Ah UPS/IPS Dry Battery', 'ADJUST_DAMAGE', -2, 950, 'Transit terminal damage during unloading', 'Keraniganj Battery & Solar Godown', '2026-10-14');
  insertBatch.run('powercell', 'BATCH-2610-06', 7, 'SuperStar 18W AC/DC Rechargeable Emergency LED Bulb', 'STOCK_IN', 150, 210, 'SuperStar Group Wholesale Carton #55', 'Nawabpur Main Showroom & Counter', '2026-10-19');
  insertBatch.run('powercell', 'BATCH-2610-07', 8, 'BRB 2.5rm Flame Retardant House Wiring Cable (Coil)', 'STOCK_IN', 25, 3150, 'BRB Cable Kushtia Depot Challan #812', 'Keraniganj Battery & Solar Godown', '2026-10-23');
  insertBatch.run('powercell', 'ADJ-2610-08', 7, 'SuperStar 18W AC/DC Rechargeable Emergency LED Bulb', 'ADJUST_DAMAGE', -3, 210, 'Glass diffuser cracked in carton', 'Nawabpur Main Showroom & Counter', '2026-10-27');

  // Amar Food Stock Batches (Oct 2026 - Fish, Rice, Oil, Spices, Meat)
  insertBatch.run('amarfood', 'BATCH-AF-101', 17, 'Padma River Fresh Hilsa Fish (Ilish 1kg+ Size)', 'STOCK_IN', 50, 1350, 'Chandpur Meghna Ghat Ice Van #04', 'Chawk Bazar Main Food & Fish Outlet', '2026-10-03');
  insertBatch.run('amarfood', 'BATCH-AF-102', 18, 'Fresh Deshi Rui Fish Whole (2kg–2.5kg Size)', 'STOCK_IN', 90, 310, 'Rajshahi Hatchery Morning Truck', 'Chawk Bazar Main Food & Fish Outlet', '2026-10-06');
  insertBatch.run('amarfood', 'BATCH-AF-103', 22, 'Amar Premium Chinigura Aromatic Polao Rice (1kg)', 'STOCK_IN', 180, 115, 'Dinajpur Auto Rice Mills Challan #302', 'Chawk Bazar Main Food & Fish Outlet', '2026-10-10');
  insertBatch.run('amarfood', 'BATCH-AF-104', 26, 'Fortified Vitamin-A Soybean Cooking Oil (5 Liter Jar)', 'STOCK_IN', 80, 760, 'Meghna Edible Oils Distributor', 'Cold Storage & Spice Packaging Unit', '2026-10-14');
  insertBatch.run('amarfood', 'ADJ-AF-105', 18, 'Fresh Deshi Rui Fish Whole (2kg–2.5kg Size)', 'ADJUST_DAMAGE', -2, 310, 'Cold storage ice box temperature loss', 'Cold Storage & Spice Packaging Unit', '2026-10-18');
  insertBatch.run('amarfood', 'BATCH-AF-106', 20, 'Khulna Golda Chingri / Jumbo Prawn (500g Pack)', 'STOCK_IN', 40, 460, 'Khulna Frozen Seafood Challan #19', 'Cold Storage & Spice Packaging Unit', '2026-10-22');
  insertBatch.run('amarfood', 'BATCH-AF-107', 28, 'Organic Sylheti Turmeric / Holud Powder (200g)', 'STOCK_IN', 150, 52, 'In-House Spice Grinding & Packaging Unit', 'Cold Storage & Spice Packaging Unit', '2026-10-26');
  insertBatch.run('amarfood', 'BATCH-AF-108', 31, 'Fresh Halal Broiler Chicken Skinless (1kg Dressed)', 'STOCK_IN', 60, 185, 'Kazi Agro Cold Chain Delivery', 'Chawk Bazar Main Food & Fish Outlet', '2026-10-29');

  // --------------------------------------------------------------------------
  // 9. RETURNS & REPLACEMENTS (01–31 Oct 2026)
  // --------------------------------------------------------------------------
  const insertReturn = db.prepare(`
    INSERT INTO returns_replacements (tenant_id, claim_no, record_type, invoice_no, customer_name, product_id, product_name, serial_no, qty, amount, reason, status, created_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertReturn.run('powercell', 'WR-2026-01', 'REPLACEMENT', 'INV-2026-1001', 'Mayer Doa Electronics & IPS', 1, 'PowerCell 12V 7.5Ah UPS/IPS Dry Battery', 'SN-PC12V-99812', 1, 1120, 'Voltage drop under 12-month warranty card', 'Replaced from Warranty', '2026-10-19');
  insertReturn.run('powercell', 'RT-2026-02', 'RETURN', 'INV-2026-1004', 'Walk-in Retail Customer', 7, 'SuperStar 18W AC/DC Rechargeable Emergency LED Bulb', 'LOT-SS18W-09', 1, 265, 'Customer exchanged pin-type holder for B22 holder', 'Completed', '2026-10-22');

  insertReturn.run('amarfood', 'RT-AF-01', 'RETURN', 'AF-2026-2001', 'Janani General Store & Grocery', 22, 'Amar Premium Chinigura Aromatic Polao Rice (1kg)', 'BATCH-OCT-22', 2, 264, 'Outer poly pouch seal opened during transport', 'Completed', '2026-10-15');
  insertReturn.run('amarfood', 'WR-AF-02', 'REPLACEMENT', 'AF-2026-2003', 'Bhai Bhai Fish & Sobji Mart', 20, 'Khulna Golda Chingri / Jumbo Prawn (500g Pack)', 'LOT-CHING-04', 1, 530, 'Replaced torn vacuum pack with fresh frozen pack', 'Completed', '2026-10-24');

  // --------------------------------------------------------------------------
  // 10. FINANCE ACCOUNTS & OCT 2026 TRANSACTIONS
  // --------------------------------------------------------------------------
  const insertAccount = db.prepare(`
    INSERT INTO finance_accounts (tenant_id, account_name, account_type, account_number, balance)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertAccount.run('powercell', 'Galla / Cash Drawer (Showroom)', 'Cash Drawer', 'COUNTER-01', 48500);
  insertAccount.run('powercell', 'bKash Merchant Account', 'bKash Merchant', '01711-889900', 32400);
  insertAccount.run('powercell', 'Nagad Uddokta / Merchant', 'Nagad Merchant', '01819-001122', 18600);
  insertAccount.run('powercell', 'Dutch-Bangla Bank (DBBL SME A/C)', 'Bank Account', 'A/C 105.110.0049182', 195000);

  insertAccount.run('amarfood', 'Chawk Bazar Cash Drawer (Galla)', 'Cash Drawer', 'COUNTER-AF', 38200);
  insertAccount.run('amarfood', 'bKash Merchant Account', 'bKash Merchant', '01819-334455', 24500);
  insertAccount.run('amarfood', 'Nagad Merchant Account', 'Nagad Merchant', '01819-334455', 14800);
  insertAccount.run('amarfood', 'Islami Bank PLC (SME A/C)', 'Bank Account', 'A/C 2050119020192', 162000);

  const insertFinTrx = db.prepare(`
    INSERT INTO finance_transactions (tenant_id, trx_code, trx_type, category, account_name, amount, description, trx_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertFinTrx.run('powercell', 'TRX-1001', 'EXPENSE', 'Showroom Rent & Electricity', 'Dutch-Bangla Bank (DBBL SME A/C)', 22000, 'October 2026 Nawabpur Showroom Rent & DESCO Bill', '2026-10-05');
  insertFinTrx.run('powercell', 'TRX-1002', 'DUE_COLLECTION', 'Customer Baki Recovery', 'bKash Merchant Account', 5000, 'Due collected from Mayer Doa Electronics (MR-2026-501)', '2026-10-18');
  insertFinTrx.run('powercell', 'TRX-1003', 'BANK_DEPOSIT', 'Cash to Bank Transfer', 'Dutch-Bangla Bank (DBBL SME A/C)', 25000, 'Excess cash deposited from Showroom Galla to DBBL', '2026-10-24');
  insertFinTrx.run('powercell', 'TRX-1004', 'INCOME', 'POS & Wholesale Sales', 'Galla / Cash Drawer (Showroom)', 15230, 'October Cash Counter Sales Collection', '2026-10-30');

  insertFinTrx.run('amarfood', 'TRX-AF01', 'EXPENSE', 'Cold Storage & Ice Block Cost', 'Chawk Bazar Cash Drawer (Galla)', 4200, 'October Fish Cold Storage & Ice Van Preservation', '2026-10-07');
  insertFinTrx.run('amarfood', 'TRX-AF02', 'DUE_COLLECTION', 'Customer Baki Recovery', 'Islami Bank PLC (SME A/C)', 10000, 'Collected due from Sultan Dine & Kacchi Kitchen', '2026-10-16');
  insertFinTrx.run('amarfood', 'TRX-AF03', 'INCOME', 'Fish & Grocery Sales', 'Chawk Bazar Cash Drawer (Galla)', 21285, 'October Wholesale & Retail Food Sales', '2026-10-29');

  // --------------------------------------------------------------------------
  // 11. PRODUCTION & PACKAGING ORDERS (01–31 Oct 2026)
  // --------------------------------------------------------------------------
  const insertProd = db.prepare(`
    INSERT INTO production_orders (tenant_id, batch_no, finished_product_id, finished_product_name, target_qty, raw_materials_text, raw_cost, labor_packaging_cost, unit_production_cost, status, production_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertProd.run('powercell', 'MFG-2026-101', 1, 'PowerCell 12V 7.5Ah UPS/IPS Dry Battery', 50, '50x Lead-Acid Plates + 25L Electrolyte + ABS Casing', 44000, 3500, 950, 'Completed', '2026-10-11');
  insertProd.run('powercell', 'MFG-2026-102', 13, 'De-Ionized Battery Distilled Water (5 Liter Jar)', 100, '500L RO Water + 100x HDPE 5L Jars + Labels', 5500, 1000, 65, 'Completed', '2026-10-20');

  insertProd.run('amarfood', 'MFG-AF-201', 22, 'Amar Premium Chinigura Aromatic Polao Rice (1kg)', 100, '2x 50kg Dinajpur Bulk Rice Sack + 100x Printed Pouches', 11000, 500, 115, 'Completed', '2026-10-12');
  insertProd.run('amarfood', 'MFG-AF-202', 28, 'Organic Sylheti Turmeric / Holud Powder (200g)', 150, '30kg Whole Dry Turmeric + Grinding & 150 Pouches', 7000, 800, 52, 'Completed', '2026-10-25');

  // --------------------------------------------------------------------------
  // 12. EMPLOYEES, ATTENDANCE & PAYROLL (01–31 Oct 2026)
  // --------------------------------------------------------------------------
  const insertEmp = db.prepare(`
    INSERT INTO employees (tenant_id, emp_code, name, designation, phone, base_salary, daily_allowance, commission_rate, advance_taken, joining_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertEmp.run('powercell', 'EMP-101', 'Kamrul Hasan', 'Sr. Sales & POS Executive', '01722-112233', 16500, 120, 1.5, 2000, '2025-10-01', 'Active');
  insertEmp.run('powercell', 'EMP-102', 'Mizanur Rahman', 'Godown & Battery Technician', '01833-445566', 15000, 100, 0.5, 1000, '2025-10-01', 'Active');
  insertEmp.run('powercell', 'EMP-103', 'Farhana Yasmin', 'Accounts & Khata Executive', '01944-778899', 18000, 100, 0.0, 0, '2025-10-01', 'Active');
  insertEmp.run('powercell', 'EMP-104', 'Sohag Mia', 'Delivery & Van Helper', '01688-990011', 11500, 80, 0.5, 1500, '2025-10-01', 'Active');

  insertEmp.run('amarfood', 'EMP-201', 'Rubel Mia', 'Food Counter & POS In-Charge', '01815-112200', 16000, 100, 1.0, 1000, '2025-10-01', 'Active');
  insertEmp.run('amarfood', 'EMP-202', 'Babul Hossain', 'Fish Cold Storage & Spice Supervisor', '01822-334411', 15000, 100, 0.5, 500, '2025-10-01', 'Active');
  insertEmp.run('amarfood', 'EMP-203', 'Nusrat Jahan', 'Accounts & Supplier Billing', '01755-667788', 17500, 100, 0.0, 0, '2025-10-01', 'Active');

  const insertAtt = db.prepare(`
    INSERT OR IGNORE INTO attendance (tenant_id, employee_id, employee_name, att_date, status, check_in, overtime_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const octDate = '2026-10-31';
  insertAtt.run('powercell', 1, 'Kamrul Hasan', octDate, 'Present', '09:02 AM', 1.5);
  insertAtt.run('powercell', 2, 'Mizanur Rahman', octDate, 'Present', '09:10 AM', 2.0);
  insertAtt.run('powercell', 3, 'Farhana Yasmin', octDate, 'Present', '09:00 AM', 0.0);
  insertAtt.run('powercell', 4, 'Sohag Mia', octDate, 'Late', '09:42 AM', 1.0);

  insertAtt.run('amarfood', 5, 'Rubel Mia', octDate, 'Present', '08:55 AM', 1.0);
  insertAtt.run('amarfood', 6, 'Babul Hossain', octDate, 'Present', '08:45 AM', 2.0);
  insertAtt.run('amarfood', 7, 'Nusrat Jahan', octDate, 'Present', '09:05 AM', 0.0);

  const insertPayroll = db.prepare(`
    INSERT INTO payroll_records (tenant_id, employee_id, employee_name, designation, month_label, present_days, base_salary, overtime_bonus, sales_commission, advance_deduction, net_payable, payment_status, paid_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPayroll.run('powercell', 1, 'Kamrul Hasan', 'Sr. Sales & POS Executive', 'October 2026', 27, 16500, 1200, 850, 2000, 16550, 'Paid', '2026-10-30');
  insertPayroll.run('powercell', 2, 'Mizanur Rahman', 'Godown & Battery Technician', 'October 2026', 26, 15000, 950, 300, 1000, 15250, 'Paid', '2026-10-30');
  insertPayroll.run('powercell', 3, 'Farhana Yasmin', 'Accounts & Khata Executive', 'October 2026', 27, 18000, 500, 0, 0, 18500, 'Paid', '2026-10-30');
  insertPayroll.run('powercell', 4, 'Sohag Mia', 'Delivery & Van Helper', 'October 2026', 25, 11500, 600, 200, 1500, 10800, 'Pending', null);

  insertPayroll.run('amarfood', 5, 'Rubel Mia', 'Food Counter & POS In-Charge', 'October 2026', 27, 16000, 900, 600, 1000, 16500, 'Paid', '2026-10-30');
  insertPayroll.run('amarfood', 6, 'Babul Hossain', 'Fish Cold Storage & Spice Supervisor', 'October 2026', 26, 15000, 1100, 300, 500, 15900, 'Paid', '2026-10-30');
  insertPayroll.run('amarfood', 7, 'Nusrat Jahan', 'Accounts & Supplier Billing', 'October 2026', 27, 17500, 400, 0, 0, 17900, 'Pending', null);

  // --------------------------------------------------------------------------
  // 13. MONTHLY REVENUE (Chart.js Analytics)
  // --------------------------------------------------------------------------
  const insertRev = db.prepare(`
    INSERT INTO monthly_revenue (tenant_id, month_key, month_label, revenue, cost, profit)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const months = [
    ['2026-10-W1', 'Oct 01-07', 12400, 10200, 2200],
    ['2026-10-W2', 'Oct 08-14', 15800, 13100, 2700],
    ['2026-10-W3', 'Oct 15-21', 14200, 11850, 2350],
    ['2026-10-W4', 'Oct 22-31', 18900, 15400, 3500]
  ];
  for (const tid of ['powercell', 'amarfood']) {
    for (const m of months) {
      insertRev.run(tid, m[0], m[1], m[2], m[3], m[4]);
    }
  }

  // --------------------------------------------------------------------------
  // 14. ACTIVITY LOGS (01–31 Oct 2026)
  // --------------------------------------------------------------------------
  const insertLog = db.prepare(`
    INSERT INTO activity_logs (tenant_id, actor_name, actor_role, module, action_text, severity, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertLog.run('powercell', 'Rafiqul Islam (Admin)', 'Owner / Admin', 'POS Sales', 'Generated wholesale invoice INV-2026-1007 with stock deduction', 'success', '2026-10-30 10:15 AM');
  insertLog.run('powercell', 'Kamrul Hasan (Cashier)', 'Cashier / POS', 'Collect Due', 'Collected ৳5,000 Baki installment from Mayer Doa Electronics via bKash', 'info', '2026-10-18 11:30 AM');
  insertLog.run('powercell', 'Mizanur Rahman (Store)', 'Godown / Store', 'Stock In', 'Received 180 pcs PowerCell 12V Battery (BATCH-2610-01)', 'success', '2026-10-02 01:20 PM');

  insertLog.run('amarfood', 'Saeed Siddique (Admin)', 'Owner / Admin', 'Stock In', 'Received 50 Kg Padma River Fresh Hilsa Fish (BATCH-AF-101)', 'success', '2026-10-03 09:30 AM');
  insertLog.run('amarfood', 'Rubel Mia (Cashier)', 'Cashier / POS', 'POS Sales', 'Generated wholesale invoice AF-2026-2003 for Bhai Bhai Fish & Sobji Mart', 'success', '2026-10-16 12:10 PM');
}
