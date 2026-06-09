/**
 * Types for Vedik Enterprises
 */

export interface Session {
  name: string;
  email: string;
  plan: 'free' | 'pro';
  loginTime: number;
  upgradeDate: string | null;
}

export interface User {
  name: string;
  email: string;
  password?: string;
  plan: 'free' | 'pro';
  upgradeDate: string | null;
}

export interface Product {
  id: string;
  name: string;
  category: 'Grocery' | 'Dairy' | 'Beverages' | 'Snacks' | 'Household' | 'Other';
  quantity: number;
  unit: 'kg' | 'piece' | 'litre' | 'packet' | 'box';
  buyPrice: number;
  sellPrice: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  businessType: string;
  totalPurchases: number;
  lastVisit: string;
  outstandingBalance: number;
}

export interface InvoiceItem {
  id: string;
  productName: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  number: string;
  customerName: string;
  customerPhone: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  gstRate: number; // 0, 5, 12, 18
  gstAmount: number;
  total: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
}

export interface Expense {
  id: string;
  amount: number;
  category: 'Rent' | 'Salary' | 'Stock Purchase' | 'Utilities' | 'Other';
  date: string;
  note: string;
  photo?: string;
}

export interface AttendanceRecord {
  [date: string]: 'P' | 'A' | 'H'; // Present, Absent, Half-Day
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number;
  joiningDate: string;
  status: 'Active' | 'Inactive';
  attendance: AttendanceRecord;
}

export interface Order {
  id: string;
  customerName: string;
  items: string; // e.g., "Dal 2kg, Sabun 3pcs"
  total: number;
  date: string;
  status: 'New' | 'Processing' | 'Ready' | 'Delivered' | 'Cancelled';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface BusinessProfile {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  logo: string; // base64
}
