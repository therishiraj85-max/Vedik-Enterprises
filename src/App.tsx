import React, { useState, useEffect } from 'react';
import { KEYS, seedMockData, getUserKeys, seedMockDataForUser } from './utils';
import { Session, Product, Customer, Invoice, Expense, Staff, Order, ChatMessage, BusinessProfile } from './types';

// Navigation Views
import AuthScreen from './components/AuthScreen';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import BillingView from './components/BillingView';
import CustomersView from './components/CustomersView';
import ExpensesView from './components/ExpensesView';
import StaffView from './components/StaffView';
import OrdersView from './components/OrdersView';
import ReportsView from './components/ReportsView';
import AIAssistantView from './components/AIAssistantView';
import SettingsView from './components/SettingsView';

// Icons
import { 
  Menu, X, Home, Box, Receipt, Users, CreditCard, UserCheck, 
  ShoppingBag, BarChart3, Bot, Settings, LogOut, Star, Bell, Lock, CheckCircle2, ChevronDown 
} from 'lucide-react';

export default function App() {
  // 1. Core App State
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);

  // 2. Database collections
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [profile, setProfile] = useState<BusinessProfile>({
    businessName: 'Vedik Enterprises Kirana Store',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    logo: ''
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // 3. Modals and alerts
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentTab, setPaymentTab] = useState<'upi' | 'card' | 'netbank'>('upi');
  const [upiId, setUpiId] = useState<string>('');
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 3b. Notification states
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Dynamically calculate notifications based on current database state
  const getUnreadNotifications = () => {
    const list: Array<{
      id: string;
      title: string;
      message: string;
      type: 'error' | 'warning' | 'info' | 'success';
      tabLink?: string;
      timestamp: string;
    }> = [];

    // 1. Check stock levels (Out of Stock / Low Stock)
    products.forEach((p) => {
      if (p.quantity === 0) {
        list.push({
          id: `stock-out-${p.id}`,
          title: `❌ Stock Khatam (Out of Stock): ${p.name}`,
          message: `${p.name} poora khatam ho gaya h! Kripya refill karein.`,
          type: 'error',
          tabLink: 'inventory',
          timestamp: 'Abhi'
        });
      } else if (p.quantity <= 5) {
        list.push({
          id: `stock-low-${p.id}`,
          title: `⚠️ Kam Stock (Low Stock): ${p.name}`,
          message: `${p.name} ka stock bohot kam bacha hai (sirf ${p.quantity} ${p.unit} hai).`,
          type: 'warning',
          tabLink: 'inventory',
          timestamp: 'Abhi'
        });
      }
    });

    // 2. Check customer outstanding balances
    customers.forEach((cust) => {
      if (cust.outstandingBalance > 0) {
        list.push({
          id: `cust-outstanding-${cust.id}`,
          title: `👤 Pending Udhaar: ${cust.name}`,
          message: `${cust.name} ke paas ₹${cust.outstandingBalance} ka udhaar bacha hai.`,
          type: 'warning',
          tabLink: 'customers',
          timestamp: 'Udhaar'
        });
      }
    });

    // 3. Unpaid invoices
    invoices.forEach((inv) => {
      if (inv.paymentStatus === 'Unpaid') {
        list.push({
          id: `inv-unpaid-${inv.id}`,
          title: `💸 Unpaid Bill: ${inv.number}`,
          message: `${inv.customerName} ka invoice (${inv.number}) unpaid pada hai (Total: ₹${inv.total}).`,
          type: 'error',
          tabLink: 'billing',
          timestamp: 'Pending'
        });
      }
    });

    // 4. New Orders
    orders.forEach((or) => {
      if (or.status === 'New') {
        list.push({
          id: `order-new-${or.id}`,
          title: `📦 Naya Order: ${or.id}`,
          message: `${or.customerName} ka naya order receipt hua h (₹${or.total}).`,
          type: 'info',
          tabLink: 'orders',
          timestamp: 'Naya'
        });
      }
    });

    // Filter out dismissed notifications
    return list.filter((n) => !dismissedIds.includes(n.id));
  };

  const unreadNotifications = getUnreadNotifications();

  // Load active session and global theme on first mount
  useEffect(() => {
    seedMockData();

    // Load active session if any
    const savedSession = localStorage.getItem(KEYS.SESSION);
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }

    const cachedTheme = localStorage.getItem(KEYS.THEME);
    if (cachedTheme === 'dark') setTheme('dark');
  }, []);

  // Reactively load and seed the user-specific database whenever the session changes
  useEffect(() => {
    if (!session) {
      setProducts([]);
      setCustomers([]);
      setInvoices([]);
      setExpenses([]);
      setStaff([]);
      setOrders([]);
      setChatMessages([]);
      setProfile({
        businessName: 'Vedik Enterprises Kirana Store',
        ownerName: '',
        phone: '',
        email: '',
        address: '',
        gstNumber: '',
        logo: ''
      });
      return;
    }

    // Ensure mock workspace exists for this specific signed-up email
    seedMockDataForUser(session.email);

    // Get user-scoped partition keys
    const uKeys = getUserKeys(session.email);

    // Load user state
    const cachedProducts = localStorage.getItem(uKeys.INVENTORY);
    setProducts(cachedProducts ? JSON.parse(cachedProducts) : []);

    const cachedCustomers = localStorage.getItem(uKeys.CUSTOMERS);
    setCustomers(cachedCustomers ? JSON.parse(cachedCustomers) : []);

    const cachedInvoices = localStorage.getItem(uKeys.INVOICES);
    setInvoices(cachedInvoices ? JSON.parse(cachedInvoices) : []);

    const cachedExpenses = localStorage.getItem(uKeys.EXPENSES);
    setExpenses(cachedExpenses ? JSON.parse(cachedExpenses) : []);

    const cachedStaff = localStorage.getItem(uKeys.STAFF);
    setStaff(cachedStaff ? JSON.parse(cachedStaff) : []);

    const cachedOrders = localStorage.getItem(uKeys.ORDERS);
    setOrders(cachedOrders ? JSON.parse(cachedOrders) : []);

    const cachedChats = localStorage.getItem(uKeys.CHAT);
    setChatMessages(cachedChats ? JSON.parse(cachedChats) : []);

    const cachedProfile = localStorage.getItem(uKeys.PROFILE);
    if (cachedProfile) {
      setProfile(JSON.parse(cachedProfile));
    } else {
      setProfile({
        businessName: 'Vedik Enterprises Kirana Store',
        ownerName: '',
        phone: '',
        email: session.email,
        address: '',
        gstNumber: '',
        logo: ''
      });
    }
  }, [session]);

  // Sync state modifications to localized user-scoped storage
  const handleUpdateInventory = (newList: Product[]) => {
    setProducts(newList);
    if (session) {
      const uKeys = getUserKeys(session.email);
      localStorage.setItem(uKeys.INVENTORY, JSON.stringify(newList));
    }
  };

  const handleUpdateCustomers = (newList: Customer[]) => {
    setCustomers(newList);
    if (session) {
      const uKeys = getUserKeys(session.email);
      localStorage.setItem(uKeys.CUSTOMERS, JSON.stringify(newList));
    }
  };

  const handleUpdateInvoices = (newList: Invoice[]) => {
    setInvoices(newList);
    if (session) {
      const uKeys = getUserKeys(session.email);
      localStorage.setItem(uKeys.INVOICES, JSON.stringify(newList));
    }
  };

  const handleUpdateExpenses = (newList: Expense[]) => {
    setExpenses(newList);
    if (session) {
      const uKeys = getUserKeys(session.email);
      localStorage.setItem(uKeys.EXPENSES, JSON.stringify(newList));
    }
  };

  const handleUpdateStaff = (newList: Staff[]) => {
    setStaff(newList);
    if (session) {
      const uKeys = getUserKeys(session.email);
      localStorage.setItem(uKeys.STAFF, JSON.stringify(newList));
    }
  };

  const handleUpdateOrders = (newList: Order[]) => {
    setOrders(newList);
    if (session) {
      const uKeys = getUserKeys(session.email);
      localStorage.setItem(uKeys.ORDERS, JSON.stringify(newList));
    }
  };

  const handleUpdateChats = (newList: ChatMessage[]) => {
    setChatMessages(newList);
    if (session) {
      const uKeys = getUserKeys(session.email);
      localStorage.setItem(uKeys.CHAT, JSON.stringify(newList));
    }
  };

  const handleUpdateProfile = (updatedProfile: BusinessProfile) => {
    setProfile(updatedProfile);
    if (session) {
      const uKeys = getUserKeys(session.email);
      localStorage.setItem(uKeys.PROFILE, JSON.stringify(updatedProfile));
    }
  };

  const handleUpdateTheme = (selectedTheme: 'light' | 'dark') => {
    setTheme(selectedTheme);
    localStorage.setItem(KEYS.THEME, selectedTheme);
  };

  const handleAuthSuccess = (activeSession: Session) => {
    setSession(activeSession);
    showToast('Swagat Hai! Safalta-purvak log in ho gaye.');
  };

  const handleLogout = () => {
    localStorage.removeItem(KEYS.SESSION);
    setSession(null);
    setIsUserDropdownOpen(false);
    showToast('Log out ho gaya! Kal fir milenge.');
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3000);
  };

  // 4. Keyboard Shortcuts: Ctrl+N (new invoice) / Ctrl+I (add product)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!session) return;
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (session.plan === 'pro') {
          setActiveTab('billing');
          showToast('Billing page khul gaya!');
        } else {
          setShowUpgradeModal(true);
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        if (session.plan === 'pro') {
          setActiveTab('inventory');
          showToast('Inventory page khul gaya!');
        } else {
          setShowUpgradeModal(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session]);

  // 5. Payment flow
  const handlePaymentInitiate = () => {
    setShowUpgradeModal(false);
    setShowPaymentModal(true);
    setPaymentSuccess(false);
    setPaymentLoading(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentLoading(true);
    
    setTimeout(() => {
      setPaymentLoading(false);
      setPaymentSuccess(true);
      
      // Auto close and activate pro state
      setTimeout(() => {
        setShowPaymentModal(false);
        const updatedSession: Session = {
          ...session!,
          plan: 'pro',
          upgradeDate: new Date().toISOString()
        };
        setSession(updatedSession);
        localStorage.setItem(KEYS.SESSION, JSON.stringify(updatedSession));
        
        // Also update matching profile record inside users config array
        const usersStr = localStorage.getItem(KEYS.USERS);
        if (usersStr) {
          const usersList = JSON.parse(usersStr);
          const idx = usersList.findIndex((u: any) => u.email.toLowerCase() === session!.email.toLowerCase());
          if (idx !== -1) {
            usersList[idx].plan = 'pro';
            usersList[idx].upgradeDate = new Date().toISOString();
            localStorage.setItem(KEYS.USERS, JSON.stringify(usersList));
          }
        }

        showToast('Abhi aapka PRO PLAN activate ho gaya hai! 🎉');
      }, 2000);

    }, 1500);
  };

  const handleHardReset = () => {
    localStorage.clear();
    setSession(null);
    showToast('Database reset ho gaya hai!');
    setTimeout(() => window.location.reload(), 1000);
  };

  // Metric sums for Status Bar (today's paid invoices)
  const todayStr = new Date().toISOString().split('T')[0];
  const aajKiBikriTotal = invoices
    .filter(inv => inv.date === todayStr && inv.paymentStatus === 'Paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  if (!session) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const isPro = session.plan === 'pro';

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#1A1A2E] text-gray-100 dark' : 'bg-[#F1EFE8] text-gray-950'} font-sans antialiased flex flex-col`}>
      
      {/* Dynamic Header and Left Panel Container Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* DESKTOP SIDEBAR - static, 240px width */}
        <aside id="main-sidebar" className={`hidden md:flex flex-col w-60 shrink-0 border-r ${
          theme === 'dark' ? 'bg-[#121224] border-gray-800' : 'bg-white border-gray-150'
        } justify-between text-sm shadow`}>
          <div>
            {/* Logo area */}
            <div className="p-6 border-b border-gray-550/10 border-gray-100 flex items-center space-x-3.5">
              <span className="text-xl font-bold bg-[#0F6E56] text-white px-2 py-0.5 rounded shadow">VE</span>
              <div>
                <h1 className="text-base font-black tracking-tight text-[#0F6E56]">Vedik Enterprises</h1>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500 font-mono">वेदिक इंटरप्राइजेज</span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="p-4 space-y-1.5 list-none">
              {[
                { tab: 'dashboard', label: 'Dashboard', icon: Home },
                { tab: 'inventory', label: 'Inventory (स्टॉक)', icon: Box },
                { tab: 'billing', label: 'Billing (पर्ची/GST)', icon: Receipt },
                { tab: 'customers', label: 'Customers (ग्राहक)', icon: Users },
                { tab: 'expenses', label: 'Expenses (खर्च)', icon: CreditCard },
                { tab: 'staff', label: 'Staff (कर्मचारी)', icon: UserCheck },
                { tab: 'orders', label: 'Orders (आर्डर/बुक)', icon: ShoppingBag },
                { tab: 'reports', label: 'Reports (मुनाफा)', icon: BarChart3 },
                { tab: 'ai', label: 'AI Assistant', icon: Bot },
                { tab: 'settings', label: 'Settings', icon: Settings }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.tab;
                return (
                  <li key={item.tab}>
                    <button
                      onClick={() => setActiveTab(item.tab)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg font-bold transition-all ${
                        isActive
                          ? 'bg-[#0F6E56] text-white shadow-md'
                          : 'text-gray-500 hover:bg-[#F1EFE8]/40 hover:text-gray-850'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      
                      {/* Locks for Free plan non-authorized tabs except Settings & Dashboard & Customers */}
                      {!isPro && ['inventory', 'billing', 'expenses', 'staff', 'orders', 'reports', 'ai'].includes(item.tab) && (
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                  </li>
                );
              })}
            </nav>
          </div>

          {/* User profile, badges & Free upgrade CTA inside left panel bottom */}
          <div className="p-4 border-t border-gray-100 space-y-3 shrink-0">
            {/* User credentials */}
            <div className="flex items-center space-x-3 bg-gray-50/50 p-2 rounded-lg">
              <div className="w-9 h-9 rounded-full bg-[#0F6E56] text-white flex items-center justify-center font-bold text-sm">
                {session.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs truncate flex items-center">
                  <span>{session.name}</span>
                  {isPro && <Star className="w-3 h-3 text-[#F5A623] fill-current ml-1" />}
                </p>
                <span className="text-[10px] text-gray-400 block truncate">{session.email}</span>
              </div>
            </div>

            {/* CTA locked badge */}
            {!isPro ? (
              <div className="bg-gradient-to-br from-[#0F6E56]/10 to-emerald-500/5 p-3 rounded-lg border border-[#0F6E56]/20 text-xs">
                <p className="font-bold text-gray-800">Lock Free Plan</p>
                <button
                  id="btn-upgrade-banner"
                  onClick={() => setShowUpgradeModal(true)}
                  className="mt-2 w-full py-1.5 bg-[#0F6E56] hover:bg-[#0c5946] text-white text-[10px] font-black uppercase rounded shadow transition-all text-center"
                >
                  Upgrade karein Rs 199
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 p-2.5 rounded-lg border border-amber-200 text-xxs font-black text-amber-700 uppercase flex items-center space-x-1.5 shadow-sm">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <span>GOLD PRO MEMBER ACTIVE</span>
              </div>
            )}
          </div>
        </aside>

        {/* MOBILE SLIDE-OVER SIDEBAR MENU PANEL */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            {/* Overlay backdrop */}
            <div className="fixed inset-0 bg-black/60" onClick={() => setIsSidebarOpen(false)}></div>
            
            <aside className={`relative flex flex-col w-64 max-w-xs h-full bg-white text-gray-900 shadow-2xl z-50 animate-in slide-in-from-left duration-200 justify-between`}>
              <div>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <span className="text-xl font-bold bg-[#0F6E56] text-white px-2 py-0.5 rounded">VE</span>
                    <h1 className="text-base font-bold text-[#0F6E56]">Vedik Enterprises</h1>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-gray-650">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="p-4 space-y-1">
                  {[
                    { tab: 'dashboard', label: 'Dashboard', icon: Home },
                    { tab: 'inventory', label: 'Inventory (स्टॉक)', icon: Box },
                    { tab: 'billing', label: 'Billing (पर्ची/GST)', icon: Receipt },
                    { tab: 'customers', label: 'Customers (ग्राहक)', icon: Users },
                    { tab: 'expenses', label: 'Expenses (खर्च)', icon: CreditCard },
                    { tab: 'staff', label: 'Staff (कर्मचारी)', icon: UserCheck },
                    { tab: 'orders', label: 'Orders (आर्डर/बुक)', icon: ShoppingBag },
                    { tab: 'reports', label: 'Reports (मुनाफा)', icon: BarChart3 },
                    { tab: 'ai', label: 'AI Assistant', icon: Bot },
                    { tab: 'settings', label: 'Settings', icon: Settings }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.tab;
                    return (
                      <button
                        key={item.tab}
                        onClick={() => { setActiveTab(item.tab); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-[#0F6E56] text-white'
                            : 'text-gray-500 hover:bg-[#F1EFE8]/70'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {!isPro && ['inventory', 'billing', 'expenses', 'staff', 'orders', 'reports', 'ai'].includes(item.tab) && (
                          <Lock className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Sidebar drawer bottom content */}
              <div className="p-4 border-t border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#0F6E56] text-white flex items-center justify-center font-bold text-xs uppercase">
                    {session.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-800">{session.name}</p>
                    <span className="text-[10px] text-gray-400">{isPro ? 'Pro Member' : 'Free Plan'}</span>
                  </div>
                </div>

                <button onClick={handleLogout} className="text-gray-400 hover:text-red-550">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* MAIN PANEL CONTENT STAGE */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          
          {/* TOP FIXED CONTROLLER HEADER */}
          <header className={`no-print flex items-center justify-between px-4 py-4 md:px-6 border-b shrink-0 ${
            theme === 'dark' ? 'bg-[#121224] border-gray-800' : 'bg-white border-gray-100'
          }`}>
            
            {/* Hamburger Title combination */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-sm font-black capitalize tracking-tight text-gray-450 uppercase font-mono">
                {activeTab} Overview
              </h2>
            </div>

            {/* Business name centered */}
            <div className="hidden sm:block text-center select-none">
              <h3 className="font-black text-sm tracking-wide text-[#0F6E56] uppercase">
                {profile.businessName || 'Vedik Enterprises Kirana Outlet'}
              </h3>
            </div>

            {/* Today's calendar notification and profile circle dropdown */}
            <div className="flex items-center space-x-4">
              <span className="hidden lg:inline text-xs font-bold text-gray-400 font-mono">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>

              {/* Interactive Notification Bell */}
              <div className="relative">
                <button
                  id="btn-notification-bell"
                  onClick={() => {
                    setIsNotificationOpen(!isNotificationOpen);
                    setIsUserDropdownOpen(false); // Close user menu
                  }}
                  className={`p-1.5 rounded relative transition-all ${
                    isNotificationOpen 
                      ? (theme === 'dark' ? 'bg-[#2F2F4D] text-white' : 'bg-gray-100 text-[#0F6E56]') 
                      : (theme === 'dark' ? 'hover:bg-gray-850 text-gray-400' : 'hover:bg-gray-100 text-gray-500')
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div 
                    id="notification-dropdown"
                    className={`absolute right-0 mt-2 z-50 w-80 rounded-xl shadow-xl border overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-150 text-xs ${
                      theme === 'dark' 
                        ? 'bg-[#121224] border-gray-800 text-white' 
                        : 'bg-white border-gray-100 text-gray-900'
                    }`}
                  >
                    {/* Header */}
                    <div className={`px-4 py-2 border-b flex items-center justify-between font-sans ${
                      theme === 'dark' ? 'border-gray-800' : 'border-gray-50'
                    }`}>
                      <span className="font-extrabold">Alerts & Alerts ({unreadNotifications.length})</span>
                      {unreadNotifications.length > 0 && (
                        <button
                          id="btn-clear-all-notifications"
                          onClick={() => {
                            setDismissedIds([...dismissedIds, ...unreadNotifications.map(n => n.id)]);
                            showToast('Saare notifications clear kiye gaye!');
                          }}
                          className="text-[10px] text-blue-500 hover:text-blue-700 font-black cursor-pointer bg-transparent p-0"
                        >
                          Clear All (साफ़ करें)
                        </button>
                      )}
                    </div>

                    {/* Scrollable list */}
                    <div className="max-h-72 overflow-y-auto divide-y dark:divide-gray-800 divide-gray-50">
                      {unreadNotifications.length === 0 ? (
                        <div className="p-5 text-center text-gray-400 space-y-1.5">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
                          <p className="font-bold">Aapka store up-to-date hai!</p>
                          <p className="text-[10px] text-gray-450">Stock fully stocked hai aur saare billing transactions accurate hain.</p>
                        </div>
                      ) : (
                        unreadNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3 transition-colors flex flex-col space-y-1 font-sans ${
                              theme === 'dark' ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between space-x-2">
                              <span className="font-bold leading-snug">{notif.title}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDismissedIds([...dismissedIds, notif.id]);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5"
                                title="Dismiss"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className={`text-[11px] leading-relaxed ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`}>{notif.message}</p>
                            
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[9px] font-mono font-bold text-gray-400 tracking-wider">
                                {notif.timestamp}
                              </span>
                              {notif.tabLink && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTab(notif.tabLink!);
                                    setIsNotificationOpen(false);
                                  }}
                                  className="text-[10px] text-[#0F6E56] dark:text-[#2bb390] hover:underline font-bold bg-transparent p-0"
                                >
                                  Go to {notif.tabLink === 'inventory' ? 'Inventory' : notif.tabLink === 'billing' ? 'Billing' : notif.tabLink === 'customers' ? 'Customers' : notif.tabLink} &rarr;
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar details dropper click listener */}
              <div className="relative">
                <button
                  id="header-user-avatar-btn"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-1 p-1 hover:bg-gray-100/50 rounded-lg transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0F6E56]/15 text-[#0F6E56] flex items-center justify-center font-black text-xs uppercase border border-[#0F6E56]/20">
                    {session.name[0]}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 z-30 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
                    <div className="px-4 py-2 border-b border-gray-50 select-none">
                      <p className="font-bold text-gray-950">{session.name}</p>
                      <span className="text-[10px] text-gray-450 block truncate">{session.email}</span>
                    </div>

                    <div className="p-1 space-y-0.5">
                      <button
                        onClick={() => { setActiveTab('settings'); setIsUserDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 font-semibold transition-all flex items-center space-x-2"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Settings</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-700 font-extrabold transition-all flex items-center space-x-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out (निकाले जाएं)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ACTIVE TAB STAGE CONTENT VIEWER */}
          <main className="p-4 md:p-6 flex-1 max-w-7xl w-full mx-auto pb-16">
            
            {activeTab === 'dashboard' && (
              <DashboardView
                products={products}
                customers={customers}
                invoices={invoices}
                isPro={isPro}
                onNavigate={(page) => setActiveTab(page)}
                triggerUpgrade={() => setShowUpgradeModal(true)}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView
                products={products}
                isPro={isPro}
                onUpdateInventory={handleUpdateInventory}
                triggerUpgrade={() => setShowUpgradeModal(true)}
                showToast={showToast}
              />
            )}

            {activeTab === 'billing' && (
              <BillingView
                invoices={invoices}
                products={products}
                customers={customers}
                isPro={isPro}
                onUpdateInvoices={handleUpdateInvoices}
                onUpdateInventory={handleUpdateInventory}
                triggerUpgrade={() => setShowUpgradeModal(true)}
                showToast={showToast}
                businessName={profile.businessName}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersView
                customers={customers}
                invoices={invoices}
                isPro={isPro}
                onUpdateCustomers={handleUpdateCustomers}
                triggerUpgrade={() => setShowUpgradeModal(true)}
                showToast={showToast}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesView
                expenses={expenses}
                invoices={invoices}
                isPro={isPro}
                onUpdateExpenses={handleUpdateExpenses}
                triggerUpgrade={() => setShowUpgradeModal(true)}
                showToast={showToast}
              />
            )}

            {activeTab === 'staff' && (
              <StaffView
                staffList={staff}
                isPro={isPro}
                onUpdateStaff={handleUpdateStaff}
                triggerUpgrade={() => setShowUpgradeModal(true)}
                showToast={showToast}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersView
                orders={orders}
                isPro={isPro}
                onUpdateOrders={handleUpdateOrders}
                triggerUpgrade={() => setShowUpgradeModal(true)}
                showToast={showToast}
                onNavigate={(page) => setActiveTab(page)}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                invoices={invoices}
                expenses={expenses}
                products={products}
                customers={customers}
                isPro={isPro}
                triggerUpgrade={() => setShowUpgradeModal(true)}
                showToast={showToast}
              />
            )}

            {activeTab === 'ai' && (
              <AIAssistantView
                chatMessages={chatMessages}
                products={products}
                customers={customers}
                invoices={invoices}
                expenses={expenses}
                isPro={isPro}
                onUpdateChat={handleUpdateChats}
                triggerUpgrade={() => setShowUpgradeModal(true)}
                showToast={showToast}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                profile={profile}
                isPro={isPro}
                theme={theme}
                onUpdateProfile={handleUpdateProfile}
                onUpdateTheme={handleUpdateTheme}
                triggerUpgrade={() => setShowUpgradeModal(true)}
                showToast={showToast}
                onHardReset={handleHardReset}
              />
            )}

          </main>

        </div>

      </div>

      {/* BOTTOM FIXED SALES STATUS REGISTER LINE */}
      <footer id="bottom-status-bar" className="no-print fixed bottom-0 left-0 right-0 z-10 bg-[#0F6E56] text-white py-2 px-4 shadow-lg text-xs font-black uppercase text-center flex justify-between items-center sm:px-6">
        <span>बिज़ साथी • Aapka Business, Aapka Control</span>
        <span className="font-mono bg-white/20 px-3 py-0.5 rounded tracking-wider">
          Aaj ki Bikri: ₹{aajKiBikriTotal.toLocaleString('en-IN')}
        </span>
      </footer>

      {/* FLOATING SUCCESS TOAST ALERTS */}
      {toastMsg && (
        <div id="toast-success shadow-lg" className="fixed bottom-12 right-4 z-50 bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl border border-emerald-500 shadow-2xl flex items-center space-x-2 animate-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* PRO PLAN UPGRADE PROMPT MODAL */}
      {showUpgradeModal && (
        <div id="upgrade-prompt-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-150 relative text-center">
            
            <button 
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 font-bold"
            >
              &times;
            </button>

            <div className="p-8 space-y-4 text-gray-900">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Star className="w-7 h-7 fill-current" />
              </div>
              
              <div>
                <h3 className="text-base font-black text-[#0F6E56] uppercase tracking-wide">Pro Plan Chahiye?</h3>
                <p className="text-xs text-gray-400 mt-1 font-semibold">Apne business ko aage badhao</p>
              </div>

              {/* Bullet checklist features */}
              <div className="bg-gray-50 p-4 rounded-xl text-left text-xs space-y-2 border border-gray-100 text-gray-700">
                <p className="flex items-center space-x-2 font-semibold">
                  <span className="text-[#0F6E56]">✓</span>
                  <span>Unlimited products add karo</span>
                </p>
                <p className="flex items-center space-x-2 font-semibold">
                  <span className="text-[#0F6E56]">✓</span>
                  <span>Invoices generate karo</span>
                </p>
                <p className="flex items-center space-x-2 font-semibold">
                  <span className="text-[#0F6E56]">✓</span>
                  <span>Staff and salary manage karo</span>
                </p>
                <p className="flex items-center space-x-2 font-semibold">
                  <span className="text-[#0F6E56]">✓</span>
                  <span>Reports export karo</span>
                </p>
                <p className="flex items-center space-x-2 font-semibold">
                  <span className="text-[#0F6E56]">✓</span>
                  <span>AI Assistant full access</span>
                </p>
                <p className="flex items-center space-x-2 font-semibold">
                  <span className="text-[#0F6E56]">✓</span>
                  <span>Priority customer support</span>
                </p>
              </div>

              {/* Price Tag with strike */}
              <div className="pt-2 text-center">
                <span className="text-xs text-gray-450 line-through">₹499</span>
                <span className="text-lg font-black text-gray-900 ml-1.5 underline">₹199 / month</span>
              </div>

              <button
                id="btn-confirm-upgrade"
                onClick={handlePaymentInitiate}
                className="w-full py-3 bg-[#0F6E56] hover:bg-[#0c5946] text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-950/15 transition-all"
              >
                Abhi Upgrade Karein
              </button>

              <button
                onClick={() => setShowUpgradeModal(false)}
                className="block text-xxs text-gray-400 hover:text-gray-650 font-bold mx-auto underline pt-1"
              >
                Baad Mein
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MOCK SECURE PAYMENT GATEWAY MODAL */}
      {showPaymentModal && (
        <div id="payment-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-150 text-gray-900">
            
            {/* Payment Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 text-center relative select-none">
              <h3 className="text-sm font-bold text-gray-800">Secure Payment — Rs 199</h3>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ SSL Encrypted Sandbox Gateway</p>
              
              {!paymentLoading && !paymentSuccess && (
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 font-bold"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Content Switcher logic (Loading vs Success vs Forms) */}
            {paymentLoading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-4 animate-pulse">
                <div className="w-10 h-10 rounded-full border-2 border-t-[#0F6E56] border-gray-200 animate-spin"></div>
                <p className="text-xs font-semibold text-gray-505">Verifying credentials, do not close or back...</p>
              </div>
            ) : paymentSuccess ? (
              <div className="p-10 text-center flex flex-col items-center justify-center space-y-3">
                {/* Vector Green complete Tick */}
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-8 h-8 font-black" />
                </div>
                <h4 className="font-extrabold text-[#0F6E56] text-base">Payment Ho Gaya!</h4>
                <p className="text-xs text-gray-405 font-medium">Aapka Pro Plan activate ho gaya hai.</p>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit}>
                {/* Selector Payment Mode Tab list */}
                <div className="flex border-b border-gray-100 text-xs">
                  {([
                    { tab: 'upi', label: 'UPI ID' },
                    { tab: 'card', label: 'Credit Card' },
                    { tab: 'netbank', label: 'NetBanking' }
                  ] as const).map(p => (
                    <button
                      key={p.tab}
                      type="button"
                      onClick={() => setPaymentTab(p.tab)}
                      className={`flex-1 py-3 text-center font-bold tracking-tight border-b-2 transition-all ${
                        paymentTab === p.tab
                          ? 'border-[#0F6E56] text-[#0F6E56]'
                          : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="p-6 space-y-4 text-xs">
                  {/* UPI Tab */}
                  {paymentTab === 'upi' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">UPI ID *</label>
                        <input
                          type="text"
                          required
                          value={upiId}
                          placeholder="shopowner@ybl, rajesh@oksbi"
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#0F6E56]"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400">BHIM UPI details verifies dynamically.</p>
                    </div>
                  )}

                  {/* Cards Tab */}
                  {paymentTab === 'card' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Card Number *</label>
                        <input
                          type="text"
                          required
                          placeholder="4111 2222 3333 4444"
                          maxLength={19}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#0F6E56] font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Expiration *</label>
                          <input
                            type="text"
                            required
                            placeholder="MM/YY"
                            maxLength={5}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#0F6E56] font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">CVV Security *</label>
                          <input
                            type="password"
                            required
                            placeholder="***"
                            maxLength={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#0F6E56] font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NetBank Tab */}
                  {paymentTab === 'netbank' && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Select Bank *</label>
                      <select
                        required
                        className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg outline-none focus:border-[#0F6E56]"
                      >
                        <option value="sbi">State Bank Of India (SBI)</option>
                        <option value="hdfc">HDFC Bank Limited</option>
                        <option value="icici">ICICI Bank Limited</option>
                        <option value="axis">Axis Bank Ltd</option>
                        <option value="pnb">Punjab National Bank (PNB)</option>
                      </select>
                    </div>
                  )}

                  <button
                    id="btn-submit-payment"
                    type="submit"
                    className="w-full py-3 mt-2 bg-[#0F6E56] hover:bg-[#0c5946] text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>Pay Rs 199 Secured</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
