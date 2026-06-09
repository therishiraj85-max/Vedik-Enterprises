import React, { useState } from 'react';
import { Customer, Invoice } from '../types';
import { Plus, Search, Lock, UserCheck, Calendar, Phone, Mail, MapPin, X, ArrowUpRight } from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  invoices: Invoice[];
  isPro: boolean;
  onUpdateCustomers: (updatedList: Customer[]) => void;
  triggerUpgrade: () => void;
  showToast: (msg: string) => void;
}

export default function CustomersView({
  customers,
  invoices,
  isPro,
  onUpdateCustomers,
  triggerUpgrade,
  showToast
}: CustomersViewProps) {
  const [search, setSearch] = useState('');
  
  // Selected customer for purchase history panel
  const [selectedInspectClient, setSelectedInspectClient] = useState<Customer | null>(null);

  // Modal State for adding customer
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [businessType, setBusinessType] = useState('End Consumer');
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleOpenAdd = () => {
    if (!isPro) {
      triggerUpgrade();
      return;
    }
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setBusinessType('End Consumer');
    setErrors({});
    setIsAddOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tempErrors: { [key: string]: string } = {};

    if (!name.trim()) tempErrors.name = 'Yeh field zaroori hai';
    if (!phone.trim()) tempErrors.phone = 'Yeh field zaroori hai';
    
    if (email.trim() && !/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Email Sahi nahi hai';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    const newCustomer: Customer = {
      id: 'cust_' + Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      businessType,
      totalPurchases: 0,
      lastVisit: new Date().toISOString().split('T')[0],
      outstandingBalance: 0
    };

    onUpdateCustomers([...customers, newCustomer]);
    showToast('Naya grahak safalta-purvak add ho gaya!');
    setIsAddOpen(false);
  };

  // Live filter list
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  // Extract purchase history invoices for a specific customer name
  const getPurchasesForClient = (clientName: string) => {
    return invoices.filter(inv => inv.customerName.toLowerCase() === clientName.toLowerCase());
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Controller */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            id="customer-search"
            type="text"
            placeholder="Grahak ka naam ya mob number type karein..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56]"
          />
        </div>

        <button
          id="btn-add-customer"
          onClick={handleOpenAdd}
          className={`px-4 py-2 bg-[#0F6E56] hover:bg-[#0c5946] text-white rounded-lg text-sm font-semibold shadow-md inline-flex items-center space-x-2 transition-all ${
            !isPro ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
          {!isPro && <Lock className="w-3.5 h-3.5 ml-1" />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Customer Table Container */}
        <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${
          selectedInspectClient ? 'lg:col-span-8' : 'lg:col-span-12'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-550/5 bg-gray-50 border-b border-gray-100">
                <tr className="text-gray-500 font-semibold text-xs tracking-wider">
                  <th className="px-6 py-4">Name (Naam)</th>
                  <th className="px-6 py-4">Phone No.</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Sum Purchases</th>
                  <th className="px-6 py-4 text-right">Last Visit</th>
                  <th className="px-6 py-4 text-right">Outstanding (उधारी)</th>
                  <th className="px-6 py-4 text-center">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((cust) => {
                    const clientInvoices = getPurchasesForClient(cust.name);
                    const realTotalPurchases = clientInvoices.reduce((sum, inv) => sum + inv.total, 0);
                    const hasOutstanding = cust.outstandingBalance > 0;

                    return (
                      <tr 
                        key={cust.id} 
                        className={`hover:bg-gray-550/5 hover:bg-[#F1EFE8]/25 cursor-pointer transition-all ${
                          selectedInspectClient?.id === cust.id ? 'bg-[#0F6E56]/5' : ''
                        }`}
                        onClick={() => setSelectedInspectClient(cust)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{cust.name}</div>
                          {cust.email && <div className="text-[10px] text-gray-400 font-medium">{cust.email}</div>}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-650">{cust.phone}</td>
                        <td className="px-6 py-4 text-xs font-semibold uppercase text-gray-400">{cust.businessType}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-gray-700">₹{realTotalPurchases || cust.totalPurchases}</td>
                        <td className="px-6 py-4 text-right text-xs font-semibold text-gray-550">{cust.lastVisit}</td>
                        <td className={`px-6 py-4 text-right font-mono font-black ${
                          hasOutstanding ? 'text-red-600 bg-red-50/10' : 'text-gray-500'
                        }`}>
                          ₹{cust.outstandingBalance}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInspectClient(cust);
                            }}
                            className="p-1 hover:bg-gray-100 text-[#0F6E56] rounded transition-all inline-flex items-center"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <UserCheck className="w-10 h-10 text-gray-300" />
                        <p className="font-semibold text-sm">Koi customer details nahi hain</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Customer Inspect slide sidebar panel */}
        {selectedInspectClient && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-lg p-5 lg:col-span-4 animate-in slide-in-from-right duration-200 relative">
            <button
              onClick={() => setSelectedInspectClient(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-650"
            >
              <X className="w-4 h-4" />
            </button>

            <h4 className="font-black text-gray-800 text-sm uppercase tracking-wider pb-3 border-b border-gray-100 mb-4 text-[#0F6E56]">Customer inspect profile</h4>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedInspectClient.name}</h3>
                <span className="text-[10px] uppercase font-bold text-[#F5A623] bg-amber-50/50 px-2 py-0.5 rounded-full mt-1 inline-block border border-amber-100">
                  {selectedInspectClient.businessType}
                </span>
              </div>

              {/* Quick Contacts */}
              <div className="space-y-2 text-xs text-gray-600 pt-2">
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-mono">{selectedInspectClient.phone}</span>
                </div>
                {selectedInspectClient.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>{selectedInspectClient.email}</span>
                  </div>
                )}
                {selectedInspectClient.address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{selectedInspectClient.address}</span>
                  </div>
                )}
              </div>

              {/* Purchases ledger registry list summary */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <h5 className="font-bold text-gray-700 text-xs flex items-center justify-between">
                  <span>Purchase History</span>
                  <span className="font-mono bg-[#0F6E56]/10 text-[#0F6E56] px-2 py-0.5 rounded-full text-xxs font-black">
                    {getPurchasesForClient(selectedInspectClient.name).length} bills
                  </span>
                </h5>

                <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-gray-50 pr-1">
                  {getPurchasesForClient(selectedInspectClient.name).length > 0 ? (
                    getPurchasesForClient(selectedInspectClient.name).map((inv) => (
                      <div key={inv.id} className="pt-2 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold font-mono text-gray-700">{inv.number}</p>
                          <span className="text-[10px] text-gray-400 font-medium">{inv.date}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-[#0F6E56]">₹{inv.total}</p>
                          <span className="text-[9px] uppercase font-bold text-gray-400">{inv.paymentStatus}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xxs text-gray-400 italic text-center py-4">Abhi tak koi purchases nahi hain</p>
                  )}
                </div>
              </div>

              {/* Outstanding balance uhaari badge */}
              <div className="bg-[#F1EFE8]/30 rounded-xl p-3 border border-gray-100 flex justify-between items-center mt-4">
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Outstanding (उधारी):</p>
                  <p className="font-black text-[#0F6E56] text-sm mt-0.5">₹{selectedInspectClient.outstandingBalance}</p>
                </div>
                {selectedInspectClient.outstandingBalance > 0 && (
                  <span className="text-red-600 bg-red-50 text-[10px] font-black border border-red-100 px-2 py-1 rounded">PENDING PAYMENT</span>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddOpen && (
        <div id="customer-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-850">Grahak Add Karein (नया ग्राहक जोड़ें)</h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Grahak Ka Naam (Customer Name) *</label>
                <input
                  id="customer-input-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Rajesh Kumar"
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none ${
                    errors.name ? 'border-red-500' : 'border-gray-200 focus:border-[#0F6E56]'
                  }`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number (मोबाइल नंबर) *</label>
                <input
                  id="customer-input-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., 9823456781"
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none ${
                    errors.phone ? 'border-red-500' : 'border-gray-200 focus:border-[#0F6E56]'
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email (वैकल्पिक)</label>
                <input
                  id="customer-input-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0F6E56]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Business Type</label>
                <select
                  id="customer-input-type"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#0F6E56]"
                >
                  <option value="End Consumer">End Consumer</option>
                  <option value="Retailer">Retailer</option>
                  <option value="Wholesaler">Wholesaler</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Address (grahak ka pata)</label>
                <textarea
                  id="customer-input-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full Address..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0F6E56]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-gray-500 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50"
                >
                  Radd Karein
                </button>
                <button
                  id="btn-customer-save"
                  type="submit"
                  className="px-5 py-2 bg-[#0F6E56] hover:bg-[#0c5946] text-white rounded-lg text-xs font-bold shadow-md"
                >
                  Grahak Save Karein
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
