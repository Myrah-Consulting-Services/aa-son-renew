/**
 * API-shaped list rows for Nablus Road Contracting demo fallbacks.
 * Used when list APIs return empty / error so demos still look filled.
 */

export const NABLUS_PARTIES = [
  {
    id: 9001,
    partyName: 'Dubai Municipality - Roads',
    partyType: 1,
    contact: '+971 4 312 2222',
    email: 'roads@dm.gov.ae',
    trn: '100111222333444',
    billingAddress: 'Dubai Municipality HQ, Deira, Dubai',
    shippingAddress: 'Dubai Municipality HQ, Deira, Dubai',
    openingBalance: 125000,
    creditLimit: 500000,
    creditPeriod: 45,
    country: 'UAE',
    emirates: 'Dubai',
    city: 'Dubai',
  },
  {
    id: 9002,
    partyName: 'RTA Dubai',
    partyType: 1,
    contact: '+971 4 800 9090',
    email: 'procurement@rta.ae',
    trn: '100222333444555',
    billingAddress: 'Roads & Transport Authority, Dubai',
    shippingAddress: 'RTA HQ, Dubai',
    openingBalance: 85000,
    creditLimit: 750000,
    creditPeriod: 60,
    country: 'UAE',
    emirates: 'Dubai',
    city: 'Dubai',
  },
  {
    id: 9003,
    partyName: 'Emaar Properties PJSC',
    partyType: 1,
    contact: '+971 4 366 8888',
    email: 'contracts@emaar.ae',
    trn: '100333444555666',
    billingAddress: 'Emaar Square, Downtown Dubai',
    shippingAddress: 'Emaar Square, Downtown Dubai',
    openingBalance: 42000,
    creditLimit: 300000,
    creditPeriod: 30,
    country: 'UAE',
    emirates: 'Dubai',
    city: 'Dubai',
  },
  {
    id: 9004,
    partyName: 'Nakheel PJSC',
    partyType: 1,
    contact: '+971 4 390 3333',
    email: 'procurement@nakheel.ae',
    trn: '100666777888999',
    billingAddress: 'Nakheel Tower, Dubai Marina',
    shippingAddress: 'Nakheel Tower, Dubai Marina',
    openingBalance: 28000,
    creditLimit: 200000,
    creditPeriod: 30,
    country: 'UAE',
    emirates: 'Dubai',
    city: 'Dubai',
  },
  {
    id: 9005,
    partyName: 'Al Futtaim Building Materials',
    partyType: 2,
    contact: '+971 4 295 5555',
    email: 'sales@afbm.ae',
    trn: '100444555666777',
    billingAddress: 'Al Quoz Industrial Area, Dubai',
    shippingAddress: 'Al Quoz Industrial Area, Dubai',
    openingBalance: 18000,
    creditLimit: 150000,
    creditPeriod: 30,
    country: 'UAE',
    emirates: 'Dubai',
    city: 'Dubai',
  },
  {
    id: 9006,
    partyName: 'National Asphalt Co. LLC',
    partyType: 2,
    contact: '+971 4 332 1000',
    email: 'orders@nationalasphalt.ae',
    trn: '100555666777888',
    billingAddress: 'Jebel Ali Industrial, Dubai',
    shippingAddress: 'Jebel Ali Industrial, Dubai',
    openingBalance: 9500,
    creditLimit: 200000,
    creditPeriod: 21,
    country: 'UAE',
    emirates: 'Dubai',
    city: 'Dubai',
  },
  {
    id: 9007,
    partyName: 'Gulf Safety Supplies LLC',
    partyType: 2,
    contact: '+971 4 347 8800',
    email: 'sales@gulfsafety.ae',
    trn: '100777888999000',
    billingAddress: 'Ras Al Khor Industrial, Dubai',
    shippingAddress: 'Ras Al Khor Industrial, Dubai',
    openingBalance: 3200,
    creditLimit: 50000,
    creditPeriod: 15,
    country: 'UAE',
    emirates: 'Dubai',
    city: 'Dubai',
  },
  {
    id: 9008,
    partyName: 'Emirates Diesel Trading',
    partyType: 2,
    contact: '+971 4 285 4400',
    email: 'fuel@emiratesdiesel.ae',
    trn: '100888999000111',
    billingAddress: 'Al Qusais Industrial, Dubai',
    shippingAddress: 'Al Qusais Industrial, Dubai',
    openingBalance: 5600,
    creditLimit: 80000,
    creditPeriod: 15,
    country: 'UAE',
    emirates: 'Dubai',
    city: 'Dubai',
  },
];

export const NABLUS_ITEMS = [
  {
    id: 9101,
    name: 'Asphalt Mix Hot (Base Course)',
    item_code: 'ASP-BASE-01',
    item_type: 'Product',
    sales_price: 285,
    purchase_price: 220,
    unit: 'TON',
    hsn_code: '27150000',
    item_description: 'Hot mix asphalt for road base course',
    current_stock: 95,
    stock: 95,
    vat_per: 5,
    qty: 95,
  },
  {
    id: 9102,
    name: 'Asphalt Mix Hot (Wearing Course)',
    item_code: 'ASP-WEAR-01',
    item_type: 'Product',
    sales_price: 320,
    purchase_price: 250,
    unit: 'TON',
    hsn_code: '27150000',
    item_description: 'Wearing course asphalt for finished roads',
    current_stock: 120,
    stock: 120,
    vat_per: 5,
    qty: 120,
  },
  {
    id: 9103,
    name: 'Crushed Aggregate 20mm',
    item_code: 'AGG-20MM',
    item_type: 'Product',
    sales_price: 45,
    purchase_price: 32,
    unit: 'TON',
    hsn_code: '25171000',
    item_description: '20mm crushed stone aggregate',
    current_stock: 340,
    stock: 340,
    vat_per: 5,
    qty: 340,
  },
  {
    id: 9104,
    name: 'Bitumen 60/70',
    item_code: 'BIT-6070',
    item_type: 'Product',
    sales_price: 1850,
    purchase_price: 1620,
    unit: 'TON',
    hsn_code: '27132000',
    item_description: 'Penetration grade bitumen 60/70',
    current_stock: 18,
    stock: 18,
    vat_per: 5,
    qty: 18,
  },
  {
    id: 9105,
    name: 'Road Marking Paint - White',
    item_code: 'RMP-WHT',
    item_type: 'Product',
    sales_price: 85,
    purchase_price: 62,
    unit: 'LTR',
    hsn_code: '32089090',
    item_description: 'Thermoplastic road marking paint',
    current_stock: 200,
    stock: 200,
    vat_per: 5,
    qty: 200,
  },
  {
    id: 9106,
    name: 'Concrete Grade C40',
    item_code: 'CON-C40',
    item_type: 'Product',
    sales_price: 280,
    purchase_price: 235,
    unit: 'M3',
    hsn_code: '68109900',
    item_description: 'Ready-mix concrete C40',
    current_stock: 45,
    stock: 45,
    vat_per: 5,
    qty: 45,
  },
  {
    id: 9107,
    name: 'Steel Rebar 16mm',
    item_code: 'STL-16MM',
    item_type: 'Product',
    sales_price: 3200,
    purchase_price: 2850,
    unit: 'TON',
    hsn_code: '72142000',
    item_description: 'Deformed steel reinforcement bars',
    current_stock: 25,
    stock: 25,
    vat_per: 5,
    qty: 25,
  },
  {
    id: 9108,
    name: 'Asphalt Paving Service',
    item_code: 'SVC-PAVE',
    item_type: 'Service',
    sales_price: 18.5,
    purchase_price: 0,
    unit: 'M2',
    hsn_code: '998311',
    item_description: 'Machine asphalt paving per sq.m',
    current_stock: 0,
    stock: 0,
    vat_per: 5,
    qty: 0,
  },
  {
    id: 9109,
    name: 'Site Survey & Setting Out',
    item_code: 'SVC-SURVEY',
    item_type: 'Service',
    sales_price: 2500,
    purchase_price: 0,
    unit: 'JOB',
    hsn_code: '998311',
    item_description: 'Topographic survey and setting out',
    current_stock: 0,
    stock: 0,
    vat_per: 5,
    qty: 0,
  },
  {
    id: 9110,
    name: 'Road Construction Labour',
    item_code: 'SVC-LABOUR',
    item_type: 'Service',
    sales_price: 55,
    purchase_price: 0,
    unit: 'HRS',
    hsn_code: '998311',
    item_description: 'Skilled site labour charge',
    current_stock: 0,
    stock: 0,
    vat_per: 5,
    qty: 0,
  },
];

export const NABLUS_SALES_INVOICES = [
  {
    id: 9201,
    invoice_no: 'NRC-INV-2026-0142',
    invoice_date: '2026-09-05',
    due_date: '2026-10-05',
    party_name: 'RTA Dubai',
    taxable_amt: 235000,
    total_vat: 11750,
    total_discount: 0,
    final_total_amount: 246750,
    payment_status: 'Partial',
  },
  {
    id: 9202,
    invoice_no: 'NRC-INV-2026-0151',
    invoice_date: '2026-09-08',
    due_date: '2026-10-08',
    party_name: 'Dubai Municipality - Roads',
    taxable_amt: 176190.48,
    total_vat: 8809.52,
    total_discount: 0,
    final_total_amount: 185000,
    payment_status: 'Paid',
  },
  {
    id: 9203,
    invoice_no: 'NRC-INV-2026-0158',
    invoice_date: '2026-09-12',
    due_date: '2026-10-12',
    party_name: 'Emaar Properties PJSC',
    taxable_amt: 87619.05,
    total_vat: 4380.95,
    total_discount: 0,
    final_total_amount: 92000,
    payment_status: 'Paid',
  },
  {
    id: 9204,
    invoice_no: 'NRC-INV-2026-0164',
    invoice_date: '2026-09-14',
    due_date: '2026-10-14',
    party_name: 'Nakheel PJSC',
    taxable_amt: 64285.71,
    total_vat: 3214.29,
    total_discount: 0,
    final_total_amount: 67500,
    payment_status: 'Unpaid',
  },
];

export const NABLUS_PURCHASE_INVOICES = [
  {
    id: 9301,
    invoice_no: 'NRC-PUR-2026-041',
    invoice_date: '2026-09-02',
    due_date: '2026-09-23',
    party_name: 'National Asphalt Co. LLC',
    taxable_amt: 46190.48,
    total_vat: 2309.52,
    total_discount: 0,
    final_total_amount: 48500,
    payment_status: 'Paid',
  },
  {
    id: 9302,
    invoice_no: 'NRC-PUR-2026-042',
    invoice_date: '2026-09-06',
    due_date: '2026-10-06',
    party_name: 'Al Futtaim Building Materials',
    taxable_amt: 21428.57,
    total_vat: 1071.43,
    total_discount: 0,
    final_total_amount: 22500,
    payment_status: 'Unpaid',
  },
  {
    id: 9303,
    invoice_no: 'NRC-PUR-2026-043',
    invoice_date: '2026-09-10',
    due_date: '2026-09-25',
    party_name: 'Gulf Safety Supplies LLC',
    taxable_amt: 6095.24,
    total_vat: 304.76,
    total_discount: 0,
    final_total_amount: 6400,
    payment_status: 'Paid',
  },
  {
    id: 9304,
    invoice_no: 'NRC-PUR-2026-044',
    invoice_date: '2026-09-11',
    due_date: '2026-09-26',
    party_name: 'Emirates Diesel Trading',
    taxable_amt: 12190.48,
    total_vat: 609.52,
    total_discount: 0,
    final_total_amount: 12800,
    payment_status: 'Paid',
  },
];

export const NABLUS_EXPENSES = [
  { id: 9401, category: 'Plant Fuel & Diesel', amount: 12800 },
  { id: 9402, category: 'Site Accommodation', amount: 8500 },
  { id: 9403, category: 'Equipment Hire — Paver', amount: 22000 },
  { id: 9404, category: 'Safety PPE & Consumables', amount: 3400 },
  { id: 9405, category: 'Vehicle Maintenance', amount: 5600 },
  { id: 9406, category: 'Office Rent — Al Quoz', amount: 18000 },
];

export const NABLUS_JV = [
  {
    voucher_id: 9501,
    voucher_no: 'NRC-JV-2026-018',
    voucher_date: '2026-09-01',
    debit: 185000,
    credit: 185000,
    amount: 185000,
  },
  {
    voucher_id: 9502,
    voucher_no: 'NRC-JV-2026-019',
    voucher_date: '2026-09-08',
    debit: 48500,
    credit: 48500,
    amount: 48500,
  },
  {
    voucher_id: 9503,
    voucher_no: 'NRC-JV-2026-020',
    voucher_date: '2026-09-12',
    debit: 92000,
    credit: 92000,
    amount: 92000,
  },
];

export const NABLUS_LEDGERS = [
  { id: 9601, as_on_date: '2026-09-15', ledger_name: 'Cash in Hand', current_balance: 18500 },
  { id: 9602, as_on_date: '2026-09-15', ledger_name: 'Emirates NBD — Current', current_balance: 428650.5 },
  { id: 9603, as_on_date: '2026-09-15', ledger_name: 'Accounts Receivable', current_balance: 314250 },
  { id: 9604, as_on_date: '2026-09-15', ledger_name: 'Accounts Payable', current_balance: 71000 },
  { id: 9605, as_on_date: '2026-09-15', ledger_name: 'Sales — Road Works', current_balance: 591250 },
  { id: 9606, as_on_date: '2026-09-15', ledger_name: 'Purchases — Materials', current_balance: 90200 },
  { id: 9607, as_on_date: '2026-09-15', ledger_name: 'VAT Input', current_balance: 4295.23 },
  { id: 9608, as_on_date: '2026-09-15', ledger_name: 'VAT Output', current_balance: 28155.76 },
];

export const NABLUS_BANKS = [
  {
    id: 9701,
    bank_name: 'Emirates NBD',
    account_no: '1015203456789',
    bankTypeCode: 'Current',
    current_balance: 428650.5,
  },
  {
    id: 9702,
    bank_name: 'Mashreq Bank',
    account_no: '0456789012345',
    bankTypeCode: 'Current',
    current_balance: 95600,
  },
];

export const NABLUS_CASH = [
  { id: 9801, ledger_name: 'Petty Cash — Office', cashTypeCode: 'Cash', current_balance: 4500 },
  { id: 9802, ledger_name: 'Site Cash — Al Khail', cashTypeCode: 'Cash', current_balance: 14000 },
];

export const NABLUS_WAREHOUSES = [
  {
    id: 9901,
    name: 'Al Quoz Materials Yard',
    address: 'Warehouse 14, Al Quoz Industrial Area 3, Dubai',
    contactPerson: 'Hassan Mansour',
    contact_person: 'Hassan Mansour',
    phone: '+971 50 612 8840',
    email: 'yard@nablusroad.ae',
    is_active: true,
  },
  {
    id: 9902,
    name: 'Jebel Ali Bitumen Store',
    address: 'Plot 22, Jebel Ali Industrial Zone 1, Dubai',
    contactPerson: 'Mohammed Yousef',
    contact_person: 'Mohammed Yousef',
    phone: '+971 56 445 7788',
    email: 'bitumen@nablusroad.ae',
    is_active: true,
  },
];

export const NABLUS_LOCATIONS = [
  { id: 9911, name: 'Bay A — Aggregate', warehouse: 9901, warehouseId: 9901, warehouseName: 'Al Quoz Materials Yard', description: 'Open bay for crushed aggregate', is_active: true },
  { id: 9912, name: 'Bay B — Asphalt Hot Mix', warehouse: 9901, warehouseId: 9901, warehouseName: 'Al Quoz Materials Yard', description: 'Temperature controlled asphalt bay', is_active: true },
  { id: 9913, name: 'Rack R-12 — Steel', warehouse: 9901, warehouseId: 9901, warehouseName: 'Al Quoz Materials Yard', description: 'Rebar and steel storage', is_active: true },
  { id: 9914, name: 'Rack R-08 — Consumables', warehouse: 9901, warehouseId: 9901, warehouseName: 'Al Quoz Materials Yard', description: 'Paints and PPE', is_active: true },
  { id: 9915, name: 'Tank Farm — Bitumen', warehouse: 9902, warehouseId: 9902, warehouseName: 'Jebel Ali Bitumen Store', description: 'Heated bitumen tanks', is_active: true },
];

export const NABLUS_STOCK = [
  {
    id: 9102,
    name: 'Asphalt Mix Hot (Wearing Course)',
    description: 'Wearing course asphalt',
    item_code: 'ASP-WEAR-01',
    warehouseId: 9901,
    location: 'Bay B — Asphalt Hot Mix',
    locations: [{ name: 'Bay B — Asphalt Hot Mix', quantity: 120 }],
    quantity: 120,
    unit: 'TON',
  },
  {
    id: 9103,
    name: 'Crushed Aggregate 20mm',
    description: '20mm crushed stone',
    item_code: 'AGG-20MM',
    warehouseId: 9901,
    location: 'Bay A — Aggregate',
    locations: [{ name: 'Bay A — Aggregate', quantity: 340 }],
    quantity: 340,
    unit: 'TON',
  },
  {
    id: 9107,
    name: 'Steel Rebar 16mm',
    description: 'Deformed rebar',
    item_code: 'STL-16MM',
    warehouseId: 9901,
    location: 'Rack R-12 — Steel',
    locations: [{ name: 'Rack R-12 — Steel', quantity: 25 }],
    quantity: 25,
    unit: 'TON',
  },
  {
    id: 9104,
    name: 'Bitumen 60/70',
    description: 'Penetration grade bitumen',
    item_code: 'BIT-6070',
    warehouseId: 9902,
    location: 'Tank Farm — Bitumen',
    locations: [{ name: 'Tank Farm — Bitumen', quantity: 18 }],
    quantity: 18,
    unit: 'TON',
  },
  {
    id: 9105,
    name: 'Road Marking Paint - White',
    description: 'Thermoplastic paint',
    item_code: 'RMP-WHT',
    warehouseId: 9901,
    location: 'Rack R-08 — Consumables',
    locations: [{ name: 'Rack R-08 — Consumables', quantity: 200 }],
    quantity: 200,
    unit: 'LTR',
  },
];

export const NABLUS_INWARDS = [
  {
    id: 10001,
    grnNo: 'NRC-GRN-089',
    date: '2026-09-08',
    supplierId: 9006,
    inwardType: 'Purchase',
    poNo: 'PO-NRC-2026-041',
    invoiceNo: 'NRC-PUR-2026-041',
    receivedBy: 'Hassan Mansour',
    totalAmount: 48500,
    items: 2,
    putaway_status_name: 'Completed',
  },
  {
    id: 10002,
    grnNo: 'NRC-GRN-090',
    date: '2026-09-10',
    supplierId: 9005,
    inwardType: 'Purchase',
    poNo: 'PO-NRC-2026-042',
    invoiceNo: 'NRC-PUR-2026-042',
    receivedBy: 'Mohammed Yousef',
    totalAmount: 22500,
    items: 1,
    putaway_status_name: 'In Progress',
  },
  {
    id: 10003,
    grnNo: 'NRC-GRN-091',
    date: '2026-09-12',
    supplierId: 9007,
    inwardType: 'Purchase',
    poNo: 'PO-NRC-2026-043',
    invoiceNo: 'NRC-PUR-2026-043',
    receivedBy: 'Hassan Mansour',
    totalAmount: 6400,
    items: 3,
    putaway_status_name: 'Pending',
  },
];

export const NABLUS_OUTWARDS = [
  {
    id: 10101,
    invoiceNo: 'NRC-DN-078',
    date: '2026-09-09',
    outwardType: 'Site Issue',
    warehouseIdName: 'Al Quoz Materials Yard',
    to_warehouseName: 'Al Khail Rd Site',
    reference_no: 'REQ-NRC-055',
    total_items: 3,
    total_quantity: 45,
    status: 'Dispatched',
    statusName: 'Dispatched',
  },
  {
    id: 10102,
    invoiceNo: 'NRC-DN-089',
    date: '2026-09-12',
    outwardType: 'Site Issue',
    warehouseIdName: 'Al Quoz Materials Yard',
    to_warehouseName: 'Sheikh Zayed Rd Site',
    reference_no: 'REQ-NRC-061',
    total_items: 2,
    total_quantity: 28,
    status: 'Dispatched',
    statusName: 'Dispatched',
  },
  {
    id: 10103,
    invoiceNo: 'NRC-DN-092',
    date: '2026-09-14',
    outwardType: 'Transfer',
    warehouseIdName: 'Jebel Ali Bitumen Store',
    to_warehouseName: 'Al Quoz Materials Yard',
    reference_no: 'TRF-NRC-012',
    total_items: 1,
    total_quantity: 6,
    status: 'Ready',
    statusName: 'Ready',
  },
];

export const NABLUS_REQUISITIONS = [
  {
    id: 10201,
    date: '2026-09-07',
    invoiceNo: 'REQ-NRC-055',
    created_by_user: 'Omar Al Hashimi',
    status: 'Approved',
  },
  {
    id: 10202,
    date: '2026-09-11',
    invoiceNo: 'REQ-NRC-061',
    created_by_user: 'Hassan Mansour',
    status: 'Approved',
  },
  {
    id: 10203,
    date: '2026-09-14',
    invoiceNo: 'REQ-NRC-068',
    created_by_user: 'Priya Nair',
    status: 'Pending',
  },
];

export const NABLUS_PUTAWAY_TASKS = [
  {
    id: 10301,
    date: '2026-09-08',
    grnRef: 'NRC-GRN-089',
    total_items: 2,
    total_quantity: 40,
    assignedWorker: 'Mohammed Yousef',
    statusName: 'Completed',
  },
  {
    id: 10302,
    date: '2026-09-10',
    grnRef: 'NRC-GRN-090',
    total_items: 1,
    total_quantity: 25,
    assignedWorker: 'Carlos Mendoza',
    statusName: 'In Progress',
  },
  {
    id: 10303,
    date: '2026-09-12',
    grnRef: 'NRC-GRN-091',
    total_items: 3,
    total_quantity: 50,
    assignedWorker: 'Anwar Hussain',
    statusName: 'Pending',
  },
];

export const NABLUS_HR_EMPLOYEES = [
  {
    id: 11001,
    first_name: 'Omar',
    last_name: 'Al Hashimi',
    emp_id: 'NRC001',
    department_name: 'Projects',
    designation_name: 'Project Manager',
    joining_date: '2019-03-01',
    work_email: 'omar.hashimi@nablusroad.ae',
  },
  {
    id: 11002,
    first_name: 'Hassan',
    last_name: 'Mansour',
    emp_id: 'NRC002',
    department_name: 'Site Operations',
    designation_name: 'Site Supervisor',
    joining_date: '2021-06-15',
    work_email: 'hassan.mansour@nablusroad.ae',
  },
  {
    id: 11003,
    first_name: 'Priya',
    last_name: 'Nair',
    emp_id: 'NRC003',
    department_name: 'Estimation',
    designation_name: 'Quantity Surveyor',
    joining_date: '2022-02-01',
    work_email: 'priya.nair@nablusroad.ae',
  },
  {
    id: 11004,
    first_name: 'Mohammed',
    last_name: 'Yousef',
    emp_id: 'NRC004',
    department_name: 'Plant & Machinery',
    designation_name: 'Plant Operator',
    joining_date: '2020-09-10',
    work_email: 'mohammed.yousef@nablusroad.ae',
  },
  {
    id: 11005,
    first_name: 'Suresh',
    last_name: 'Kumar',
    emp_id: 'NRC005',
    department_name: 'Site Operations',
    designation_name: 'Site Engineer',
    joining_date: '2023-01-12',
    work_email: 'suresh.kumar@nablusroad.ae',
  },
  {
    id: 11006,
    first_name: 'Anwar',
    last_name: 'Hussain',
    emp_id: 'NRC006',
    department_name: 'Plant & Machinery',
    designation_name: 'Mechanic',
    joining_date: '2022-08-20',
    work_email: 'anwar.hussain@nablusroad.ae',
  },
  {
    id: 11007,
    first_name: 'Layla',
    last_name: 'Hassan',
    emp_id: 'NRC007',
    department_name: 'Accounts',
    designation_name: 'Accounts Officer',
    joining_date: '2021-11-01',
    work_email: 'layla.hassan@nablusroad.ae',
  },
  {
    id: 11008,
    first_name: 'Fatima',
    last_name: 'Al Nuaimi',
    emp_id: 'NRC009',
    department_name: 'HR',
    designation_name: 'HR Officer',
    joining_date: '2020-04-15',
    work_email: 'fatima.nuaimi@nablusroad.ae',
  },
  {
    id: 11009,
    first_name: 'Carlos',
    last_name: 'Mendoza',
    emp_id: 'NRC010',
    department_name: 'Plant & Machinery',
    designation_name: 'Heavy Driver',
    joining_date: '2023-05-08',
    work_email: 'carlos.mendoza@nablusroad.ae',
  },
  {
    id: 11010,
    first_name: 'Ravi',
    last_name: 'Menon',
    emp_id: 'NRC008',
    department_name: 'Site Operations',
    designation_name: 'Lab Technician',
    joining_date: '2024-02-01',
    work_email: 'ravi.menon@nablusroad.ae',
  },
];

export const NABLUS_DEPARTMENTS = [
  { id: 12001, department_name: 'Projects', description: 'Project management & planning', active: true },
  { id: 12002, department_name: 'Site Operations', description: 'Road construction sites', active: true },
  { id: 12003, department_name: 'Plant & Machinery', description: 'Paver, rollers, fleet', active: true },
  { id: 12004, department_name: 'Estimation', description: 'BOQ & quantity surveying', active: true },
  { id: 12005, department_name: 'Accounts', description: 'Finance & payroll support', active: true },
  { id: 12006, department_name: 'HR', description: 'Human resources', active: true },
];

export const NABLUS_DESIGNATIONS = [
  { id: 12101, designation_name: 'Project Manager', department: 12001, company: 1, description: 'Leads project delivery' },
  { id: 12102, designation_name: 'Site Supervisor', department: 12002, company: 1, description: 'Supervises site crews' },
  { id: 12103, designation_name: 'Quantity Surveyor', department: 12004, company: 1, description: 'BOQ and measurement' },
  { id: 12104, designation_name: 'Plant Operator', department: 12003, company: 1, description: 'Operates asphalt paver' },
  { id: 12105, designation_name: 'Site Engineer', department: 12002, company: 1, description: 'Site engineering' },
  { id: 12106, designation_name: 'HR Officer', department: 12006, company: 1, description: 'HR administration' },
];

export const NABLUS_BRANCHES = [
  { id: 12201, company: 1, branchName: 'Head Office — Al Quoz', address: 'Warehouse 14, Al Quoz Industrial Area 3', city: 'Dubai', pincode: '118820' },
  { id: 12202, company: 1, branchName: 'Jebel Ali Yard', address: 'Plot 22, Jebel Ali Industrial Zone 1', city: 'Dubai', pincode: '18644' },
];

export const NABLUS_LEAVE_REQUESTS = [
  {
    id: 13001,
    employee_full_name: 'Omar Al Hashimi',
    department: 'Projects',
    attendance_type_name: 'Annual Leave',
    start_date: '2026-09-20',
    end_date: '2026-09-24',
    total_days: 5,
    status_name: 'Approved',
    created_at: '2026-09-10T10:30:00Z',
  },
  {
    id: 13002,
    employee_full_name: 'Hassan Mansour',
    department: 'Site Operations',
    attendance_type_name: 'Sick Leave',
    start_date: '2026-09-03',
    end_date: '2026-09-03',
    total_days: 1,
    status_name: 'Approved',
    created_at: '2026-09-02T09:15:00Z',
  },
  {
    id: 13003,
    employee_full_name: 'Mohammed Yousef',
    department: 'Plant & Machinery',
    attendance_type_name: 'Unpaid Leave',
    start_date: '2026-09-15',
    end_date: '2026-09-18',
    total_days: 4,
    status_name: 'Pending',
    created_at: '2026-09-12T08:30:00Z',
  },
  {
    id: 13004,
    employee_full_name: 'Carlos Mendoza',
    department: 'Plant & Machinery',
    attendance_type_name: 'Compensatory Off',
    start_date: '2026-09-10',
    end_date: '2026-09-10',
    total_days: 1,
    status_name: 'Approved',
    created_at: '2026-09-08T12:00:00Z',
  },
];

export const NABLUS_PAY_RUNS = [
  {
    payrun_id: 90001,
    payroll_run_id: 90001,
    processing_period: 'September 2026',
    status: '4',
    is_pending: true,
    type: 'regular',
    employees_net_pay: 286400,
    pay_date: '2026-09-28',
    pay_date_formatted: '28 Sep 2026',
    pay_period_start_date: '2026-09-01',
    pay_period_end_date: '2026-09-30',
    no_of_employees: 48,
    skipped_employees_count: 0,
    status_info: 'Ready to process. Overtime is included in net pay.',
  },
];

export const NABLUS_PAYROLL_HISTORY = [
  {
    payrun_id: 90000,
    payroll_run_id: 90000,
    payment_date: '2026-08-28',
    payroll_type: 'Monthly',
    details: 'August 2026 — Site & Office Staff',
    status: 'PAID',
    pay_date: '2026-08-28',
    pay_period_start_date: '2026-08-01',
    pay_period_end_date: '2026-08-31',
    processing_period: 'August 2026',
  },
  {
    payrun_id: 89999,
    payroll_run_id: 89999,
    payment_date: '2026-07-28',
    payroll_type: 'Monthly',
    details: 'July 2026 — Site & Office Staff',
    status: 'PAID',
    pay_date: '2026-07-28',
    pay_period_start_date: '2026-07-01',
    pay_period_end_date: '2026-07-31',
    processing_period: 'July 2026',
  },
];

const DEMO_SALARY_BASE: Record<string, number> = {
  NRC001: 24000,
  NRC002: 9500,
  NRC003: 12000,
  NRC004: 6500,
  NRC005: 11000,
  NRC006: 5800,
  NRC007: 8500,
  NRC008: 7200,
  NRC009: 9000,
  NRC010: 6200,
};

/** Demo month-wise employee payroll rows + payslip payload for Pay Run / History. */
export function buildNablusPayrollEmployees(
  periodLabel: string,
  options?: { status?: string; paymentDate?: string }
): any[] {
  const status = options?.status || 'PAID';
  const paymentDate = options?.paymentDate || '';
  return NABLUS_HR_EMPLOYEES.map((emp, idx) => {
    const basic = DEMO_SALARY_BASE[emp.emp_id] || 7000;
    const hra = Math.round(basic * 0.35);
    const transport = 800;
    const site = idx % 2 === 0 ? 1200 : 600;
    const overtime = idx % 3 === 0 ? 450 : 0;
    const gross = basic + hra + transport + site + overtime;
    const deductions = Math.round(gross * 0.05);
    const benefits = Math.round(basic * 0.05);
    const net = gross - deductions;
    const name = `${emp.first_name} ${emp.last_name}`;
    return {
      employee_id: emp.id,
      emp_id: emp.emp_id,
      employee_name: name,
      designation: emp.designation_name,
      department: emp.department_name,
      joining_date: emp.joining_date,
      paid_days: 30,
      lop_days: 0,
      gross_pay: gross,
      overtime_pay: overtime,
      overtime,
      deductions,
      benefits,
      net_pay: net,
      payment_mode: 'Bank Transfer',
      payment_status: status === 'PAID' || status === '7' ? 'Paid' : 'Pending',
      status,
      payslip: {
        company_info: {
          company_name: 'Nablus Road Contracting',
          address: 'Dubai, United Arab Emirates',
          payslip_month: periodLabel,
        },
        employee_summary: {
          employee_name: name,
          designation: emp.designation_name,
          employee_id: emp.emp_id,
          mol_id: '',
          date_of_joining: emp.joining_date,
          pay_period: periodLabel,
          pay_date: paymentDate,
          bank_account: '••••••••',
        },
        pay_summary: {
          paid_days: 30,
          lop_days: 0,
          total_net_pay: net,
        },
        earnings: {
          items: [
            { component: 'Basic', amount: basic },
            { component: 'HRA', amount: hra },
            { component: 'Transport Allowance', amount: transport },
            { component: 'Site Allowance', amount: site },
            ...(overtime ? [{ component: 'Overtime', amount: overtime }] : []),
          ],
          gross_earnings: gross,
        },
        deductions: {
          items: [{ component: 'Other Deductions', amount: deductions }],
          total_deductions: deductions,
        },
        net_pay: {
          gross_earnings: gross,
          total_deductions: deductions,
          net_pay: net,
          amount_in_words: '',
        },
      },
    };
  });
}

/** Build attendance grid rows for a given YYYY-MM month. */
export function buildNablusAttendance(year: number, month: number): any[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const staff = NABLUS_HR_EMPLOYEES.map((e) => ({
    employee_id: e.emp_id,
    employee_name: `${e.first_name} ${e.last_name}`,
    designation: e.designation_name,
    department: e.department_name,
    id: e.id,
  }));

  return staff.map((emp, idx) => {
    const attendance: Record<string, string> = {};
    let present = 0;
    let absent = 0;
    let weekOff = 0;
    let sick = 0;
    let annual = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = date.getDay(); // 0 Sun
      let status = 'P';
      if (dow === 0) {
        status = 'W';
        weekOff++;
      } else if (idx === 1 && d === 3) {
        status = 'S';
        sick++;
      } else if (idx === 2 && d === 2) {
        status = 'L';
        annual++;
      } else if (idx === 3 && d >= 15 && d <= 18) {
        status = 'A';
        absent++;
      } else {
        present++;
      }
      attendance[key] = status;
    }

    return {
      ...emp,
      attendance,
      totalPresent: present,
      totalAbsent: absent,
      totalLate: 0,
      totalWeekOff: weekOff,
      totalCausalLeave: annual,
      totalSickLeave: sick,
      totalCompensatoryOff: 0,
      totalHalfDay: 0,
    };
  });
}

/** Dubai field-work check-in points for attendance day detail (demo). */
export const NABLUS_DUBAI_FIELD_SITES = [
  { name: 'Head Office — Al Barsha', lat: 25.1125, lng: 55.2005, area: 'Al Barsha' },
  { name: 'Al Quoz Site Yard', lat: 25.1402, lng: 55.2418, area: 'Al Quoz' },
  { name: 'Sheikh Zayed Road — Stretch A', lat: 25.1180, lng: 55.1980, area: 'SZR' },
  { name: 'Business Bay Junction Works', lat: 25.1860, lng: 55.2650, area: 'Business Bay' },
  { name: 'Jebel Ali Free Zone Gate 4', lat: 24.9857, lng: 55.0702, area: 'JAFZA' },
  { name: 'Dubai Investment Park — Plot 12', lat: 24.9810, lng: 55.1620, area: 'DIP' },
  { name: 'Al Maktoum Airport Road Site', lat: 24.9205, lng: 55.1810, area: 'DWCA' },
  { name: 'Marina Promenade Works', lat: 25.0805, lng: 55.1410, area: 'Marina' },
  { name: 'Ras Al Khor Truck Yard', lat: 25.1800, lng: 55.3400, area: 'Ras Al Khor' },
  { name: 'Nad Al Sheba Asphalt Plant', lat: 25.1400, lng: 55.3100, area: 'Nad Al Sheba' },
];

const FIELD_ACTIVITIES = [
  'Site inspection / measurement',
  'Material delivery verify',
  'Plant & machinery check',
  'Supervisor briefing',
  'Asphalt laying supervision',
  'Safety walkthrough',
];

/** Deterministic day location trail for an employee on a date (Dubai field work). */
export function buildNablusDayLocationTrail(employeeId: string, dateKey: string): any[] {
  const seed = Array.from(`${employeeId}-${dateKey}`).reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const count = 4 + (seed % 3); // 4–6 points
  const startHour = 7 + (seed % 2);
  const trail: any[] = [];
  for (let i = 0; i < count; i++) {
    const site = NABLUS_DUBAI_FIELD_SITES[(seed + i * 3) % NABLUS_DUBAI_FIELD_SITES.length];
    const hour = startHour + i * 1 + ((seed + i) % 2);
    const minute = (seed * (i + 1) * 7) % 60;
    const jitterLat = ((seed + i * 13) % 20 - 10) * 0.00015;
    const jitterLng = ((seed + i * 17) % 20 - 10) * 0.00015;
    const isFirst = i === 0;
    const isLast = i === count - 1;
    const eventType = isFirst ? 'login' : isLast ? 'logout' : 'checkin';
    const activity = isFirst
      ? 'Logged in — daily routing started'
      : isLast
        ? 'Logged out — daily routing ended'
        : FIELD_ACTIVITIES[(seed + i) % FIELD_ACTIVITIES.length];
    trail.push({
      time: `${String(Math.min(hour, 18)).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      location: site.name,
      area: site.area,
      activity,
      eventType,
      lat: +(site.lat + jitterLat).toFixed(6),
      lng: +(site.lng + jitterLng).toFixed(6),
    });
  }
  return trail.sort((a, b) => a.time.localeCompare(b.time));
}

/** Helper: use demo rows when API list is empty/missing. */
export function useDemoIfEmpty<T>(apiRows: T[] | null | undefined, demoRows: T[]): T[] {
  if (Array.isArray(apiRows) && apiRows.length > 0) {
    return apiRows;
  }
  return demoRows.map((row) => ({ ...row }));
}
