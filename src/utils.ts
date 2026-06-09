import { Product, Customer, Invoice, Expense, Staff, BusinessProfile } from './types';

// Helper to get formatted dates
export function getOffsetDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().split('T')[0];
}

export function getFirstOfMonthDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// Convert numbers into transliterated Hinglish words (e.g. 500 -> Paanch Sau, 380 -> Teen Sau Assi)
export function numberToHinglishWords(num: number): string {
  if (num === 0) return 'Zero';
  
  const units = ['', 'Ek', 'Do', 'Teen', 'Chaar', 'Paanch', 'Chhah', 'Saat', 'Aath', 'Nau'];
  const teens = ['Das', 'Gyarah', 'Barah', 'Terah', 'Chaudah', 'Pandrah', 'Solah', 'Satrah', 'Atharah', 'Unnis'];
  const tens = ['', 'Das', 'Bees', 'Tees', 'Chalees', 'Pachaas', 'Saath', 'Sattar', 'Assi', 'Nabbae'];

  const exactHinglish: { [key: number]: string } = {
    21: 'Ikkees', 22: 'Baees', 23: 'Teis', 24: 'Chaubees', 25: 'Pachees', 26: 'Chhabbees', 27: 'Sattaees', 28: 'Atthaees', 29: 'Untees',
    31: 'Iktees', 32: 'Battees', 33: 'Taintees', 34: 'Chauntees', 35: 'Paintees', 36: 'Chhattees', 37: 'Saithees', 38: 'Arthees', 39: 'Untalees',
    41: 'Iktalees', 42: 'Bayalees', 43: 'Saintalees', 44: 'Chauvalees', 45: 'Paintalees', 46: 'Chhiyalees', 47: 'Saintalees', 48: 'Adtalees', 49: 'Unchaas',
    51: 'Ikavan', 52: 'Bavan', 53: 'Tirpan', 54: 'Chauvan', 55: 'Pachpan', 56: 'Chhappan', 57: 'Sattavan', 58: 'Atthavan', 59: 'Unsath',
    61: 'Iksath', 62: 'Basath', 63: 'Tirsath', 64: 'Chausath', 65: 'Painsath', 66: 'Chhiyasath', 67: 'Sarsath', 68: 'Arthsath', 69: 'Unhattar',
    71: 'Ikhattar', 72: 'Bahattar', 73: 'Tihattar', 74: 'Chauhattar', 75: 'Pachhattar', 76: 'Chhihattar', 77: 'Satattar', 78: 'Athattar', 79: 'Unasi',
    81: 'Ikasi', 82: 'Bayasi', 83: 'Tiyasi', 84: 'Chaurasi', 85: 'Pachasi', 86: 'Chhiyasi', 87: 'Satasi', 88: 'Atthasi', 89: 'Nauasi',
    91: 'Ikyaanve', 92: 'Baanve', 93: 'Tiraanve', 94: 'Chauranve', 95: 'Pachaanve', 96: 'Chhiyaanve', 97: 'Sataanve', 98: 'Atthaanve', 99: 'Nanyaanve'
  };

  function convertLessThanThousand(n: number): string {
    let result = '';
    
    if (n >= 100) {
      const h = Math.floor(n / 100);
      result += units[h] + ' Sau ';
      n %= 100;
    }
    
    if (n > 0) {
      if (exactHinglish[n]) {
        result += exactHinglish[n];
      } else if (n < 10) {
        result += units[n];
      } else if (n >= 10 && n < 20) {
        result += teens[n - 10];
      } else {
        const t = Math.floor(n / 10);
        const u = n % 10;
        result += tens[t] + (u > 0 ? ' ' + units[u] : '');
      }
    }
    
    return result.trim();
  }

  let words = '';
  let tempNum = Math.floor(num);

  if (tempNum >= 100000) {
    const lakh = Math.floor(tempNum / 100000);
    words += convertLessThanThousand(lakh) + ' Lakh ';
    tempNum %= 100000;
  }

  if (tempNum >= 1000) {
    const thousand = Math.floor(tempNum / 1000);
    words += convertLessThanThousand(thousand) + ' Hazaar ';
    tempNum %= 1000;
  }

  if (tempNum > 0) {
    words += convertLessThanThousand(tempNum);
  }

  return words.trim() + ' Rupaye';
}

// Initial Sample Data seeding keys
export const KEYS = {
  INVENTORY: 'bizsaathi_inventory',
  CUSTOMERS: 'bizsaathi_customers',
  INVOICES: 'bizsaathi_invoices',
  EXPENSES: 'bizsaathi_expenses',
  STAFF: 'bizsaathi_staff',
  USERS: 'bizsaathi_users',
  SESSION: 'bizsaathi_session',
  ORDERS: 'bizsaathi_orders',
  CHAT: 'bizsaathi_chat',
  PROFILE: 'bizsaathi_profile',
  THEME: 'bizsaathi_theme'
};

export function getUserKeys(email: string) {
  const userPrefix = `u_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}_`;
  return {
    INVENTORY: `${userPrefix}inventory`,
    CUSTOMERS: `${userPrefix}customers`,
    INVOICES: `${userPrefix}invoices`,
    EXPENSES: `${userPrefix}expenses`,
    STAFF: `${userPrefix}staff`,
    ORDERS: `${userPrefix}orders`,
    CHAT: `${userPrefix}chat`,
    PROFILE: `${userPrefix}profile`
  };
}

export function seedMockDataForUser(email: string, force = false) {
  const keys = getUserKeys(email);
  const hasInventory = localStorage.getItem(keys.INVENTORY);
  if (hasInventory && !force) return;

  // 1. Seed Products
  const products: Product[] = [
    { id: 'p1', name: 'Dal', category: 'Grocery', quantity: 45, unit: 'kg', buyPrice: 85, sellPrice: 100 },
    { id: 'p2', name: 'Chawal', category: 'Grocery', quantity: 8, unit: 'kg', buyPrice: 40, sellPrice: 55 },
    { id: 'p3', name: 'Tel', category: 'Grocery', quantity: 3, unit: 'litre', buyPrice: 120, sellPrice: 145 },
    { id: 'p4', name: 'Sabun', category: 'Household', quantity: 20, unit: 'piece', buyPrice: 25, sellPrice: 35 },
    { id: 'p5', name: 'Biscuit', category: 'Snacks', quantity: 0, unit: 'packet', buyPrice: 10, sellPrice: 15 }
  ];
  localStorage.setItem(keys.INVENTORY, JSON.stringify(products));

  // 2. Seed Customers
  const customers: Customer[] = [
    { id: 'c1', name: 'Ramesh Sharma', phone: '9876543210', email: 'ramesh@gmail.com', address: '12, Gandhi Nagar, Delhi', businessType: 'Retailer', totalPurchases: 200, lastVisit: getOffsetDate(3), outstandingBalance: 0 },
    { id: 'c2', name: 'Priya Patel', phone: '9812345678', email: 'priya@gmail.com', address: 'B-405, Shanti Sadan, Mumbai', businessType: 'Wholesaler', totalPurchases: 380, lastVisit: getOffsetDate(2), outstandingBalance: 500 },
    { id: 'c3', name: 'Mohd. Aslam', phone: '9898989898', email: 'aslam@gmail.com', address: '78/A, Chowk, Lucknow', businessType: 'End Consumer', totalPurchases: 290, lastVisit: getOffsetDate(0), outstandingBalance: 0 }
  ];
  localStorage.setItem(keys.CUSTOMERS, JSON.stringify(customers));

  // 3. Seed Invoices
  const invoices: Invoice[] = [
    {
      id: 'i1',
      number: 'BST-001',
      customerName: 'Ramesh Sharma',
      customerPhone: '9876543210',
      date: getOffsetDate(3),
      items: [{ id: 'item1', productName: 'Dal', qty: 2, price: 100, subtotal: 200 }],
      subtotal: 200,
      gstRate: 0,
      gstAmount: 0,
      total: 200,
      paymentStatus: 'Paid'
    },
    {
      id: 'i2',
      number: 'BST-002',
      customerName: 'Priya Patel',
      customerPhone: '9812345678',
      date: getOffsetDate(2),
      items: [
        { id: 'item2', productName: 'Chawal', qty: 5, price: 55, subtotal: 275 },
        { id: 'item3', productName: 'Sabun', qty: 3, price: 35, subtotal: 105 }
      ],
      subtotal: 380,
      gstRate: 0,
      gstAmount: 0,
      total: 380,
      paymentStatus: 'Unpaid'
    },
    {
      id: 'i3',
      number: 'BST-003',
      customerName: 'Mohd. Aslam',
      customerPhone: '9898989898',
      date: getOffsetDate(0),
      items: [{ id: 'item4', productName: 'Tel', qty: 2, price: 145, subtotal: 290 }],
      subtotal: 290,
      gstRate: 0,
      gstAmount: 0,
      total: 290,
      paymentStatus: 'Partial'
    }
  ];
  localStorage.setItem(keys.INVOICES, JSON.stringify(invoices));

  // 4. Seed Expenses
  const expenses: Expense[] = [
    { id: 'e1', amount: 8000, category: 'Rent', date: getFirstOfMonthDate(), note: 'Monthly shop rent' },
    { id: 'e2', amount: 1200, category: 'Utilities', date: getOffsetDate(5), note: 'Electricity bill for past month' }
  ];
  localStorage.setItem(keys.EXPENSES, JSON.stringify(expenses));

  // 5. Seed Staff
  const staff: Staff[] = [
    {
      id: 's1',
      name: 'Suresh Kumar',
      role: 'Manager',
      phone: '9871234567',
      salary: 15000,
      joiningDate: getOffsetDate(365),
      status: 'Active',
      attendance: {}
    },
    {
      id: 's2',
      name: 'Meena Devi',
      role: 'Sales Staff',
      phone: '9845678901',
      salary: 10000,
      joiningDate: getOffsetDate(180),
      status: 'Active',
      attendance: {}
    }
  ];
  localStorage.setItem(keys.STAFF, JSON.stringify(staff));

  // 6. Seed Orders
  const orders = [
    { id: 'O-001', customerName: 'Ramesh Sharma', items: 'Dal (2 kg)', total: 200, date: getOffsetDate(3), status: 'Delivered' },
    { id: 'O-002', customerName: 'Priya Patel', items: 'Chawal (5 kg), Sabun (3 pcs)', total: 380, date: getOffsetDate(2), status: 'New' },
    { id: 'O-003', customerName: 'Mohd. Aslam', items: 'Tel (2 litres)', total: 290, date: getOffsetDate(0), status: 'Processing' }
  ];
  localStorage.setItem(keys.ORDERS, JSON.stringify(orders));

  // 7. Seed Business Profile
  const profile: BusinessProfile = {
    businessName: 'Vedik Enterprises Kirana Store',
    ownerName: '',
    phone: '',
    email: email,
    address: '',
    gstNumber: '',
    logo: ''
  };
  localStorage.setItem(keys.PROFILE, JSON.stringify(profile));
}

export function seedMockData(force = false) {
  // Check if inventory is empty
  const hasInventory = localStorage.getItem(KEYS.INVENTORY);
  if (hasInventory && !force) return;

  // 1. Seed Products
  const products: Product[] = [
    { id: 'p1', name: 'Dal', category: 'Grocery', quantity: 45, unit: 'kg', buyPrice: 85, sellPrice: 100 },
    { id: 'p2', name: 'Chawal', category: 'Grocery', quantity: 8, unit: 'kg', buyPrice: 40, sellPrice: 55 },
    { id: 'p3', name: 'Tel', category: 'Grocery', quantity: 3, unit: 'litre', buyPrice: 120, sellPrice: 145 },
    { id: 'p4', name: 'Sabun', category: 'Household', quantity: 20, unit: 'piece', buyPrice: 25, sellPrice: 35 },
    { id: 'p5', name: 'Biscuit', category: 'Snacks', quantity: 0, unit: 'packet', buyPrice: 10, sellPrice: 15 }
  ];
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(products));

  // 2. Seed Customers
  const customers: Customer[] = [
    { id: 'c1', name: 'Ramesh Sharma', phone: '9876543210', email: 'ramesh@gmail.com', address: '12, Gandhi Nagar, Delhi', businessType: 'Retailer', totalPurchases: 200, lastVisit: getOffsetDate(3), outstandingBalance: 0 },
    { id: 'c2', name: 'Priya Patel', phone: '9812345678', email: 'priya@gmail.com', address: 'B-405, Shanti Sadan, Mumbai', businessType: 'Wholesaler', totalPurchases: 380, lastVisit: getOffsetDate(2), outstandingBalance: 500 },
    { id: 'c3', name: 'Mohd. Aslam', phone: '9898989898', email: 'aslam@gmail.com', address: '78/A, Chowk, Lucknow', businessType: 'End Consumer', totalPurchases: 290, lastVisit: getOffsetDate(0), outstandingBalance: 0 }
  ];
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));

  // 3. Seed Invoices
  const invoices: Invoice[] = [
    {
      id: 'i1',
      number: 'BST-001',
      customerName: 'Ramesh Sharma',
      customerPhone: '9876543210',
      date: getOffsetDate(3),
      items: [{ id: 'item1', productName: 'Dal', qty: 2, price: 100, subtotal: 200 }],
      subtotal: 200,
      gstRate: 0,
      gstAmount: 0,
      total: 200,
      paymentStatus: 'Paid'
    },
    {
      id: 'i2',
      number: 'BST-002',
      customerName: 'Priya Patel',
      customerPhone: '9812345678',
      date: getOffsetDate(2),
      items: [
        { id: 'item2', productName: 'Chawal', qty: 5, price: 55, subtotal: 275 },
        { id: 'item3', productName: 'Sabun', qty: 3, price: 35, subtotal: 105 }
      ],
      subtotal: 380,
      gstRate: 0,
      gstAmount: 0,
      total: 380,
      paymentStatus: 'Unpaid'
    },
    {
      id: 'i3',
      number: 'BST-003',
      customerName: 'Mohd. Aslam',
      customerPhone: '9898989898',
      date: getOffsetDate(0),
      items: [{ id: 'item4', productName: 'Tel', qty: 2, price: 145, subtotal: 290 }],
      subtotal: 290,
      gstRate: 0,
      gstAmount: 0,
      total: 290,
      paymentStatus: 'Partial'
    }
  ];
  localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));

  // 4. Seed Expenses
  const expenses: Expense[] = [
    { id: 'e1', amount: 8000, category: 'Rent', date: getFirstOfMonthDate(), note: 'Monthly shop rent' },
    { id: 'e2', amount: 1200, category: 'Utilities', date: getOffsetDate(5), note: 'Electricity bill for past month' }
  ];
  localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));

  // 5. Seed Staff
  const staff: Staff[] = [
    {
      id: 's1',
      name: 'Suresh Kumar',
      role: 'Manager',
      phone: '9871234567',
      salary: 15000,
      joiningDate: getOffsetDate(365),
      status: 'Active',
      attendance: {}
    },
    {
      id: 's2',
      name: 'Meena Devi',
      role: 'Sales Staff',
      phone: '9845678901',
      salary: 10000,
      joiningDate: getOffsetDate(180),
      status: 'Active',
      attendance: {}
    }
  ];
  localStorage.setItem(KEYS.STAFF, JSON.stringify(staff));

  // 6. Seed Orders
  const orders = [
    { id: 'O-001', customerName: 'Ramesh Sharma', items: 'Dal (2 kg)', total: 200, date: getOffsetDate(3), status: 'Delivered' },
    { id: 'O-002', customerName: 'Priya Patel', items: 'Chawal (5 kg), Sabun (3 pcs)', total: 380, date: getOffsetDate(2), status: 'New' },
    { id: 'O-003', customerName: 'Mohd. Aslam', items: 'Tel (2 litres)', total: 290, date: getOffsetDate(0), status: 'Processing' }
  ];
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));

  // 7. Seed Business Profile
  const profile: BusinessProfile = {
    businessName: 'Vedik Enterprises Kirana Store',
    ownerName: 'Ramesh Kumar',
    phone: '9876543210',
    email: 'ramesh@gmail.com',
    address: '12, Gandhi Nagar, Central Delhi, Delhi - 110001',
    gstNumber: '07AAAAA1111A1Z1',
    logo: ''
  };
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));

  // 8. Default users if none present
  const defaultUsers = [
    { name: 'Ramesh Kumar', email: 'ramesh@gmail.com', password: 'password123', plan: 'free', upgradeDate: null },
    { name: 'Priya Business', email: 'priya@gmail.com', password: 'password123', plan: 'free', upgradeDate: null }
  ];
  if (!localStorage.getItem(KEYS.USERS)) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(defaultUsers));
  }
}
