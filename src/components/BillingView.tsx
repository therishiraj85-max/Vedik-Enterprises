import React, { useState, useEffect } from 'react';
import { Invoice, Product, Customer } from '../types';
import { numberToHinglishWords } from '../utils';
import { Plus, Search, Lock, Ticket, Trash2, Printer, ArrowLeft, Check, AlertCircle } from 'lucide-react';

interface BillingViewProps {
  invoices: Invoice[];
  products: Product[];
  customers: Customer[];
  isPro: boolean;
  onUpdateInvoices: (updatedInvoices: Invoice[]) => void;
  onUpdateInventory: (updatedProducts: Product[]) => void;
  triggerUpgrade: () => void;
  showToast: (msg: string) => void;
  businessName: string;
}

export default function BillingView({
  invoices,
  products,
  customers,
  isPro,
  onUpdateInvoices,
  onUpdateInventory,
  triggerUpgrade,
  showToast,
  businessName
}: BillingViewProps) {
  // Navigation states: 'list' | 'create' | 'view'
  const [viewState, setViewState] = useState<'list' | 'create' | 'view'>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Form states
  const [custSearch, setCustSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomersDropdown, setShowCustomersDropdown] = useState(false);
  
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  // Line items state
  const [lineItems, setLineItems] = useState<{ id: string; product: Product | null; qty: number; price: number; subtotal: number }[]>([
    { id: 'item_1', product: null, qty: 1, price: 0, subtotal: 0 }
  ]);
  
  const [gstToggle, setGstToggle] = useState<number>(0); // 0, 5, 12, 18
  const [paymentStatus, setPaymentStatus] = useState<Invoice['paymentStatus']>('Paid');

  // Search invoice list
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Auto-generate invoice number
  useEffect(() => {
    if (viewState === 'create') {
      const highestNumStr = invoices
        .map(inv => {
          const match = inv.number.match(/BST-(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
        .reduce((max, num) => (num > max ? num : max), 0);
      
      const newNum = 'BST-' + String(highestNumStr + 1).padStart(3, '0');
      setInvoiceNumber(newNum);
    }
  }, [viewState, invoices]);

  const handleOpenCreate = () => {
    if (!isPro) {
      triggerUpgrade();
      return;
    }
    setCustSearch('');
    setSelectedCustomer(null);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setLineItems([{ id: 'item_1', product: null, qty: 1, price: 0, subtotal: 0 }]);
    setGstToggle(0);
    setPaymentStatus('Paid');
    setViewState('create');
  };

  const handleProductSelectInLine = (index: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      product: prod,
      price: prod.sellPrice,
      subtotal: prod.sellPrice * updated[index].qty
    };
    setLineItems(updated);
  };

  const handleQtyChangeInLine = (index: number, qtyStr: string) => {
    const qty = Math.max(1, Number(qtyStr));
    const updated = [...lineItems];
    const price = updated[index].price;
    updated[index] = {
      ...updated[index],
      qty,
      subtotal: price * qty
    };
    setLineItems(updated);
  };

  const handlePriceChangeInLine = (index: number, priceStr: string) => {
    const price = Math.max(0, Number(priceStr));
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      price,
      subtotal: price * updated[index].qty
    };
    setLineItems(updated);
  };

  const addLineItemRow = () => {
    setLineItems([
      ...lineItems,
      { id: 'item_' + Date.now(), product: null, qty: 1, price: 0, subtotal: 0 }
    ]);
  };

  const deleteLineItemRow = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  // Calculations for compiling bill total
  const lineSubtotals = lineItems.reduce((acc, current) => acc + current.subtotal, 0);
  const calculatedGst = Math.round((lineSubtotals * gstToggle) / 100);
  const grandTotal = lineSubtotals + calculatedGst;

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer && !custSearch.trim()) {
      alert('Grahak (Customer) ka naam zaroori hai!');
      return;
    }

    const hasIncompleteLines = lineItems.some(item => !item.product);
    if (hasIncompleteLines) {
      alert('Kripya sabhi rows me product select karein!');
      return;
    }

    // Prepare Invoice items
    const finalItems = lineItems.map((line, idx) => ({
      id: 'invitem_' + idx + '_' + Date.now(),
      productName: line.product ? line.product.name : 'Unknown Product',
      qty: line.qty,
      price: line.price,
      subtotal: line.subtotal
    }));

    const clientName = selectedCustomer ? selectedCustomer.name : custSearch.trim();
    const clientPhone = selectedCustomer ? selectedCustomer.phone : '';

    const newInvoice: Invoice = {
      id: 'inv_' + Date.now(),
      number: invoiceNumber,
      customerName: clientName,
      customerPhone: clientPhone,
      date: invoiceDate,
      items: finalItems,
      subtotal: lineSubtotals,
      gstRate: gstToggle,
      gstAmount: calculatedGst,
      total: grandTotal,
      paymentStatus
    };

    // Deduct inventory items
    const updatedInventoryList = [...products];
    lineItems.forEach(line => {
      if (line.product) {
        const match = updatedInventoryList.find(p => p.id === line.product!.id);
        if (match) {
          match.quantity = Math.max(0, match.quantity - line.qty);
        }
      }
    });

    onUpdateInventory(updatedInventoryList);
    onUpdateInvoices([...invoices, newInvoice]);

    showToast('Invoice safe ho gaya!');
    setSelectedInvoice(newInvoice);
    setViewState('view');
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.number.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* 1. LIST SCREEN */}
      {viewState === 'list' && (
        <>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                id="billing-search"
                type="text"
                placeholder="Invoice number ya grahak ka naam search karein..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56]"
              />
            </div>

            <button
              id="btn-new-invoice"
              onClick={handleOpenCreate}
              className={`px-4 py-2 bg-[#0F6E56] hover:bg-[#0c5946] text-white rounded-lg text-sm font-semibold shadow-md inline-flex items-center space-x-2 transition-all ${
                !isPro ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
              {!isPro && <Lock className="w-3.5 h-3.5 ml-1" />}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-gray-500 font-semibold text-xs tracking-wider">
                    <th className="px-6 py-4">Invoice No.</th>
                    <th className="px-6 py-4">Grahak (Customer)</th>
                    <th className="px-6 py-4">Tarikh (Date)</th>
                    <th className="px-6 py-4 text-right">Amnt (Subtotal)</th>
                    <th className="px-6 py-4 text-right">GST Check</th>
                    <th className="px-6 py-4 text-right">Total Payable</th>
                    <th className="px-6 py-4 text-center">Payment Status</th>
                    <th className="px-6 py-4 text-center">Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/50 transition-all">
                        <td className="px-6 py-4 font-mono font-bold text-[#0F6E56]">{inv.number}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{inv.customerName}</div>
                          {inv.customerPhone && <div className="text-[10px] text-gray-400">{inv.customerPhone}</div>}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500">{inv.date}</td>
                        <td className="px-6 py-4 text-right font-mono text-gray-600">₹{inv.subtotal}</td>
                        <td className="px-6 py-4 text-right text-xs text-gray-500">
                          ₹{inv.gstAmount} <span className="text-[10px] text-gray-400 font-normal">({inv.gstRate}%)</span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-extrabold text-gray-900">₹{inv.total}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xxs font-black uppercase ${
                            inv.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 border' :
                            inv.paymentStatus === 'Unpaid' ? 'bg-red-50 text-red-700 border-red-100 border' :
                            'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {inv.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => { setSelectedInvoice(inv); setViewState('view'); }}
                            className="text-xs bg-[#0F6E56]/15 hover:bg-[#0F6E56]/30 text-[#0F6E56] font-bold px-3 py-1 rounded transition-all"
                          >
                            Bill Dekho
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Ticket className="w-10 h-10 text-gray-300" />
                          <p className="font-medium text-sm">Abhi tak koi invoice nahi banaya hai</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 2. CREATION INVOICE FORM */}
      {viewState === 'create' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setViewState('list')}
                className="text-gray-500 hover:text-gray-800 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-gray-800">Generate New Invoice (नया बिल बनाएं)</h3>
            </div>
            <span className="font-mono text-sm font-bold bg-[#0F6E56]/10 text-[#0F6E56] px-3 py-1 rounded">
              No: {invoiceNumber}
            </span>
          </div>

          <form onSubmit={handleSaveInvoice} className="p-6 space-y-6">
            
            {/* Customer Search Auto-fill Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Customer Selection (गहक चुनें) *</label>
                <input
                  type="text"
                  placeholder="Grahak ka naam ya phone type karein..."
                  value={custSearch}
                  onChange={(e) => {
                    setCustSearch(e.target.value);
                    setShowCustomersDropdown(true);
                  }}
                  onFocus={() => setShowCustomersDropdown(true)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0F6E56]"
                />
                
                {showCustomersDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto divide-y divide-gray-50">
                    <div 
                      onClick={() => {
                        setSelectedCustomer(null);
                        setShowCustomersDropdown(false);
                      }}
                      className="p-2.5 text-xs text-[#0F6E56] font-semibold hover:bg-[#F1EFE8] cursor-pointer"
                    >
                      + Create custom one: "{custSearch}"
                    </div>

                    {customers
                      .filter(c => c.name.toLowerCase().includes(custSearch.toLowerCase()) || c.phone.includes(custSearch))
                      .map(cust => (
                        <div
                          key={cust.id}
                          onClick={() => {
                            setSelectedCustomer(cust);
                            setCustSearch(cust.name);
                            setShowCustomersDropdown(false);
                          }}
                          className="p-2.5 text-sm hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                        >
                          <div>
                            <p className="font-semibold text-gray-800">{cust.name}</p>
                            <span className="text-xxs text-gray-500">{cust.phone}</span>
                          </div>
                          {selectedCustomer?.id === cust.id && <Check className="w-4 h-4 text-[#0F6E56]" />}
                        </div>
                      ))}
                  </div>
                )}
                {selectedCustomer && (
                  <p className="text-xxs text-emerald-600 font-bold mt-1">✓ Verified grahak selected.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date (तारीख)</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0F6E56]"
                />
              </div>
            </div>

            {/* Line Items Builder Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2">Purchase Goods (सामान सूची)</h4>
              
              <div className="space-y-2">
                {lineItems.map((line, index) => (
                  <div key={line.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50/50 p-2 rounded-lg">
                    {/* Catalog Dropper */}
                    <div className="col-span-5 md:col-span-5">
                      <select
                        value={line.product ? line.product.id : ''}
                        onChange={(e) => handleProductSelectInLine(index, e.target.value)}
                        className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded-lg text-xs outline-none focus:border-[#0F6E56]"
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map(prod => (
                          <option key={prod.id} value={prod.id} disabled={prod.quantity <= 0}>
                            {prod.name} ({prod.quantity} left) - ₹{prod.sellPrice}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2 md:col-span-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={line.qty}
                        onChange={(e) => handleQtyChangeInLine(index, e.target.value)}
                        disabled={!line.product}
                        className="w-full px-2 py-2 border border-gray-200 bg-white rounded-lg text-xs font-mono outline-none text-center"
                      />
                    </div>

                    {/* Sell Price */}
                    <div className="col-span-2 md:col-span-2">
                      <input
                        type="number"
                        placeholder="Price"
                        value={line.price}
                        onChange={(e) => handlePriceChangeInLine(index, e.target.value)}
                        disabled={!line.product}
                        className="w-full px-2 py-2 border border-gray-200 bg-white rounded-lg text-xs font-mono outline-none text-right"
                      />
                    </div>

                    {/* Subtotal */}
                    <div className="col-span-2 md:col-span-2 font-mono text-center font-bold text-[#0F6E56] text-xs">
                      ₹{line.subtotal}
                    </div>

                    {/* Trashing */}
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => deleteLineItemRow(index)}
                        disabled={lineItems.length === 1}
                        className="p-1 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded transition-all disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addLineItemRow}
                className="mt-2 text-xs font-bold text-[#0F6E56] hover:underline inline-flex items-center space-x-1"
              >
                <span>+ Ek aur line add karein</span>
              </button>
            </div>

            {/* GST Selector & Payment Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">GST Mode (जीएसटी लागू करें)</label>
                <div className="flex space-x-2">
                  {[0, 5, 12, 18].map(rate => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setGstToggle(rate)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        gstToggle === rate
                          ? 'bg-[#0F6E56] border-[#0F6E56] text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment Status (भुगतान की स्थिति)</label>
                <div className="flex space-x-2">
                  {(['Paid', 'Unpaid', 'Partial'] as Invoice['paymentStatus'][]).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setPaymentStatus(status)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border uppercase ${
                        paymentStatus === status
                          ? status === 'Paid' ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' :
                            status === 'Unpaid' ? 'bg-red-600 border-red-600 text-white shadow-sm' :
                            'bg-amber-500 border-amber-500 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculation Sidebar Block */}
            <div className="p-4 bg-gray-550/5 bg-[#F1EFE8]/40 border border-gray-150 rounded-xl space-y-2">
              <div className="flex justify-between text-xs text-gray-550 font-semibold uppercase">
                <span>Sub-Total:</span>
                <span className="font-mono text-gray-700">₹{lineSubtotals}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-550 font-semibold uppercase">
                <span>GST ({gstToggle}%):</span>
                <span className="font-mono text-gray-700">₹{calculatedGst}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold uppercase border-t border-gray-200 pt-2 text-[#0F6E56]">
                <span>Grand Total:</span>
                <span className="font-mono">₹{grandTotal}</span>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setViewState('list')}
                className="px-5 py-2.5 border border-gray-250 hover:bg-gray-50 text-gray-500 text-sm font-bold rounded-lg transition-all"
              >
                Wapas Jayein
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0F6E56] hover:bg-[#0c5946] text-white text-sm font-bold rounded-lg shadow-md transition-all inline-flex items-center space-x-2"
              >
                <span>Generate Invoice</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* 3. VIEW PRINTABLE INVOICE CARD */}
      {viewState === 'view' && selectedInvoice && (
        <div className="space-y-6">
          {/* Action Header controls */}
          <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <button
              onClick={() => setViewState('list')}
              className="text-xs bg-gray-100 hover:bg-gray-200 font-bold text-gray-600 px-3 py-2 rounded-lg transition-all inline-flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Invoice List</span>
            </button>

            <div className="flex space-x-2">
              <button
                onClick={handlePrint}
                className="text-xs bg-[#0F6E56] hover:bg-[#0c5946] text-white font-bold px-4 py-2 rounded-lg shadow-md transition-all inline-flex items-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>

          {/* PRINTABLE BILL WRAPPER CARD */}
          <div id="printable-bill-invoice-card" className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-2xl mx-auto font-sans relative">
            <div className="border-b-2 border-[#0F6E56] pb-6 mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <span className="text-xs bg-[#0F6E56] text-white font-bold px-2 py-0.5 rounded tracking-wide uppercase">KHARIDDAR RECEIPT</span>
                <h2 className="text-2xl font-black text-[#0F6E56] mt-2 uppercase tracking-wide">{businessName}</h2>
                <p className="text-xs text-gray-550 font-mono mt-1">Authorized Kirana Retailer & Wholesaler</p>
                <p className="text-xs text-gray-400 mt-1">Aapka Business, Aapka Control</p>
              </div>

              <div className="text-right sm:text-right">
                <h3 className="text-lg font-mono font-black text-[#0F6E56]">{selectedInvoice.number}</h3>
                <p className="text-xs text-gray-500 mt-1">Date: <span className="font-semibold">{selectedInvoice.date}</span></p>
                <span className={`mt-2 inline-block px-3 py-1 rounded text-xxs font-black uppercase ${
                  selectedInvoice.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                  selectedInvoice.paymentStatus === 'Unpaid' ? 'bg-red-50 text-red-800 border border-red-200' :
                  'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  Status: {selectedInvoice.paymentStatus}
                </span>
              </div>
            </div>

            {/* Customer Details Row */}
            <div className="grid grid-cols-2 gap-4 bg-[#F1EFE8]/30 p-4 rounded-xl border border-gray-100 mb-6">
              <div>
                <p className="text-xxs uppercase tracking-wider text-gray-400 font-bold">Bill To (बिल भेजा गया):</p>
                <p className="font-bold text-gray-900 mt-1 text-sm">{selectedInvoice.customerName}</p>
                {selectedInvoice.customerPhone && (
                  <p className="text-xs font-mono text-gray-500 mt-0.5">Ph: {selectedInvoice.customerPhone}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xxs uppercase tracking-wider text-gray-400 font-bold">Payment Mode:</p>
                <p className="font-semibold text-gray-800 mt-1 text-xs">Cash/UPI/Outstanding</p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left text-sm mb-6">
              <thead>
                <tr className="border-b border-[#0F6E56] text-gray-700 font-bold text-xs uppercase tracking-wider">
                  <th className="py-2.5">Saman (Product)</th>
                  <th className="py-2.5 text-center">Dar (Price)</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Rupaye (Subtotal)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {selectedInvoice.items && selectedInvoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 text-gray-800 font-bold">{item.productName}</td>
                    <td className="py-3 text-center font-mono text-gray-600">₹{item.price}</td>
                    <td className="py-3 text-center font-mono font-bold">{item.qty}</td>
                    <td className="py-3 text-right font-mono font-extrabold text-[#0F6E56]">₹{item.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals computation block */}
            <div className="border-t border-gray-250 pt-4 flex justify-between items-start gap-4">
              <div>
                <p className="text-xxs uppercase tracking-wider text-gray-400 font-bold">Words Mein (In Words):</p>
                <p className="text-xs text-[#0F6E56] font-bold mt-1 italic">
                  "{numberToHinglishWords(selectedInvoice.total)}"
                </p>
              </div>

              <div className="w-64 space-y-1 text-right text-xs">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{selectedInvoice.subtotal}</span>
                </div>
                {selectedInvoice.gstRate > 0 && (
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>GST ({selectedInvoice.gstRate}%):</span>
                    <span className="font-mono">₹{selectedInvoice.gstAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold border-t border-gray-200 pt-2 text-[#0F6E56]">
                  <span>Total Bill Amount:</span>
                  <span className="font-mono text-lg">₹{selectedInvoice.total}</span>
                </div>
              </div>
            </div>

            {/* Thank you and business sign off */}
            <div className="text-center mt-12 pt-6 border-t border-dashed border-gray-200 text-xxs text-gray-400 font-semibold tracking-wider uppercase">
              <span>*** Dhanyawad! Aapka Business, Aapka Control ***</span>
              <p className="mt-1 lowercase italic">Invoices powered by Vedik Enterprises Software Applet</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
