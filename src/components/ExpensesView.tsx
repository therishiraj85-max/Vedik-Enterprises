import React, { useState, useEffect, useRef } from 'react';
import { Expense, Invoice } from '../types';
import { Chart } from 'chart.js/auto';
import { Plus, ToggleLeft, ToggleRight, Lock, HelpCircle, Receipt, ArrowUpCircle, ArrowDownCircle, DollarSign } from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
  invoices: Invoice[];
  isPro: boolean;
  onUpdateExpenses: (updatedList: Expense[]) => void;
  triggerUpgrade: () => void;
  showToast: (msg: string) => void;
}

export default function ExpensesView({
  expenses,
  invoices,
  isPro,
  onUpdateExpenses,
  triggerUpgrade,
  showToast
}: ExpensesViewProps) {
  // Filters: 'weekly' | 'monthly' | 'yearly'
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  // Chart ref
  const pieRef = useRef<HTMLCanvasElement | null>(null);
  const pieInstance = useRef<Chart | null>(null);

  // Modal forms
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<Expense['category']>('Rent');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [photo, setPhoto] = useState<string>('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleOpenAdd = () => {
    if (!isPro) {
      triggerUpgrade();
      return;
    }
    setAmount(0);
    setCategory('Rent');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setPhoto('');
    setErrors({});
    setIsOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tempErrors: { [key: string]: string } = {};

    if (amount <= 0) {
      tempErrors.amount = 'Sahi amount likhein (Rs. 1 se badha)';
    }
    if (!date) {
      tempErrors.date = 'Tarikh zaroori hai';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    const newExpense: Expense = {
      id: 'exp_' + Date.now(),
      amount,
      category,
      date,
      note,
      photo: photo || undefined
    };

    onUpdateExpenses([...expenses, newExpense]);
    showToast('Kharcha safe ho gaya!');
    setIsOpen(false);
  };

  // Helper date parsing filters
  const isInTimeframe = (dateStr: string) => {
    const recordDate = new Date(dateStr);
    const today = new Date();
    
    if (timeframe === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      return recordDate >= oneWeekAgo && recordDate <= today;
    } else if (timeframe === 'monthly') {
      return (
        recordDate.getMonth() === today.getMonth() &&
        recordDate.getFullYear() === today.getFullYear()
      );
    } else {
      // Yearly
      return recordDate.getFullYear() === today.getFullYear();
    }
  };

  // 1. Calculations
  const filteredExpenses = expenses.filter(exp => isInTimeframe(exp.date));
  const totalExpenseAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Income from invoices inside timeframe
  const filteredInvoices = invoices.filter(inv => isInTimeframe(inv.date));
  const totalIncomeAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);

  const netResult = totalIncomeAmount - totalExpenseAmount; // Positive = profit, Negative = loss

  // 2. Render Pie Chart Category-wise breakdown
  useEffect(() => {
    if (!pieRef.current) return;

    if (pieInstance.current) {
      pieInstance.current.destroy();
    }

    // Accumulate amounts dynamically by category: Rent, Salary, Stock Purchase, Utilities, Other
    const categories: Expense['category'][] = ['Rent', 'Salary', 'Stock Purchase', 'Utilities', 'Other'];
    const sums = categories.map(cat => {
      return filteredExpenses
        .filter(exp => exp.category === cat)
        .reduce((sum, exp) => sum + exp.amount, 0);
    });

    // Check if any non-zero expenses to show
    const totalSelected = sums.reduce((acc, v) => acc + v, 0);

    const ctx = pieRef.current.getContext('2d');
    if (ctx) {
      pieInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: categories,
          datasets: [{
            data: totalSelected > 0 ? sums : [1], // fallback placeholder
            backgroundColor: totalSelected > 0 ? ['#0F6E56', '#F5A623', '#4A90E2', '#D0021B', '#7ED321'] : ['#E2E8F0'],
            borderWidth: 1,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: { size: 10 }
              }
            },
            tooltip: {
              enabled: totalSelected > 0
            }
          }
        }
      });
    }

    return () => {
      if (pieInstance.current) {
        pieInstance.current.destroy();
      }
    };
  }, [filteredExpenses]);

  return (
    <div className="space-y-6">
      
      {/* Timeframe Controls and CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        
        {/* Toggle Weeks / Month / Year */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {(['weekly', 'monthly', 'yearly'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                timeframe === tf
                  ? 'bg-white text-[#0F6E56] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tf === 'weekly' ? 'Hafta' : tf === 'monthly' ? 'Mahina' : 'Saal'}
            </button>
          ))}
        </div>

        <button
          id="btn-add-expense"
          onClick={handleOpenAdd}
          className={`px-4 py-2 bg-[#0F6E56] hover:bg-[#0c5946] text-white rounded-lg text-sm font-semibold shadow-md inline-flex items-center space-x-2 transition-all ${
            !isPro ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
          {!isPro && <Lock className="w-3.5 h-3.5 ml-1" />}
        </button>
      </div>

      {/* Monthly Summary Strip Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-xxs font-semibold uppercase tracking-wider text-gray-400">Total Income (Sells)</p>
            <h4 className="text-xl font-bold font-mono text-gray-900 mt-1">₹{totalIncomeAmount.toLocaleString('en-IN')}</h4>
          </div>
          <ArrowUpCircle className="w-8 h-8 text-emerald-500" />
        </div>

        {/* Expenses */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between border-l-4 border-l-red-500">
          <div>
            <p className="text-xxs font-semibold uppercase tracking-wider text-gray-400">Total Expenses (Kharche)</p>
            <h4 className="text-xl font-bold font-mono text-gray-900 mt-1">₹{totalExpenseAmount.toLocaleString('en-IN')}</h4>
          </div>
          <ArrowDownCircle className="w-8 h-8 text-red-500" />
        </div>

        {/* Net Profit */}
        <div className={`bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between border-l-4 ${
          netResult >= 0 ? 'border-l-emerald-600' : 'border-l-red-650'
        }`}>
          <div>
            <p className="text-xxs font-semibold uppercase tracking-wider text-gray-400">Net Profit (मुनाफा/नुकसान)</p>
            <h4 className={`text-xl font-bold font-mono mt-1 ${netResult >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              ₹{netResult.toLocaleString('en-IN')}
            </h4>
          </div>
          <div className={`p-2.5 rounded-full ${netResult >= 0 ? 'bg-emerald-50 text-emerald-750' : 'bg-red-50 text-red-750'}`}>
            <span className="text-xs font-black">{netResult >= 0 ? 'PROFIT' : 'LOSS'}</span>
          </div>
        </div>
      </div>

      {/* Grid: Pie Chart & Expense ledger list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Pie Canvas */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-5 h-80 flex flex-col justify-between">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-3 border-b border-gray-100">Category-wise Kharche</h4>
          <div className="relative h-56 pt-2">
            <canvas ref={pieRef} id="expense-pie-chart"></canvas>
          </div>
        </div>

        {/* Chronicling List Feed */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Expenses Ledger List (खर्चों की सूची)</h4>
              <span className="text-[10px] bg-red-50 text-red-700 font-mono font-bold px-2.5 py-0.5 rounded-full">
                {filteredExpenses.length} Records
              </span>
            </div>

            <div className="divide-y divide-gray-100 max-h-[360px] overflow-y-auto">
              {filteredExpenses.length > 0 ? (
                // Sorted Decending
                [...filteredExpenses]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((exp) => (
                    <div key={exp.id} className="p-4 hover:bg-gray-50 flex items-center justify-between text-sm transition-all">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2.5 rounded-lg text-xs font-bold font-mono tracking-wide ${
                          exp.category === 'Rent' ? 'bg-[#0F6E56]/10 text-[#0F6E56]' :
                          exp.category === 'Salary' ? 'bg-[#F5A623]/10 text-[#F5A623]' :
                          exp.category === 'Stock Purchase' ? 'bg-blue-50 text-blue-700' :
                          exp.category === 'Utilities' ? 'bg-red-50 text-red-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {exp.category[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{exp.note || 'No Note Provided'}</p>
                          <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-gray-400 font-semibold">
                            <span>{exp.date}</span>
                            <span>•</span>
                            <span className="uppercase text-xxs tracking-wider font-mono font-bold">{exp.category}</span>
                            {exp.photo && (
                              <>
                                <span>•</span>
                                <span className="text-blue-500 underline font-normal italic truncate max-w-[100px]" title={exp.photo}>📎 {exp.photo}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono font-bold text-red-600 text-base">
                        -₹{exp.amount}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="p-12 text-center text-gray-450 text-xs font-semibold flex flex-col items-center justify-center space-y-2">
                  <Receipt className="w-8 h-8 text-gray-300 animate-pulse-slow" />
                  <span>Is timeframe me koi karcha nahi hua hai!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isOpen && (
        <div id="expense-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">Add Shop Expense (नया खर्च जोड़ें)</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Amount (कितने पैसे दिए?) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-gray-400">₹</span>
                  <input
                    id="expense-input-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className={`w-full pl-7 pr-4 py-2 border rounded-lg text-sm outline-none transition-all ${
                      errors.amount ? 'border-red-500' : 'border-gray-200 focus:border-[#0F6E56]'
                    }`}
                  />
                </div>
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Category (श्रेणी kharcha kisliye?)</label>
                <select
                  id="expense-input-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Expense['category'])}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#0F6E56]"
                >
                  <option value="Rent">Rent (किराया)</option>
                  <option value="Salary">Salary (स्टाफ तनख्वाह)</option>
                  <option value="Stock Purchase">Stock Purchase (दुकान का माल)</option>
                  <option value="Utilities">Utilities (बिजली, पानी, आदि)</option>
                  <option value="Other">Other (अन्य)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date (तारीख) *</label>
                <input
                  id="expense-input-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#0F6E56]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Note (विवरण - kharcha details)</label>
                <input
                  id="expense-input-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Jaise: Light bill pad kiya..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#0F6E56]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Receipt Attachment (बिल की फोटो संलग्न - optional)</label>
                <input
                  id="expense-input-photo"
                  type="text"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  placeholder="e.g., electricity_receipt_june.png"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#0F6E56]"
                />
                <p className="text-[10px] text-gray-400 mt-1">Receipt file name likhein aur download JSON karke backup karein.</p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-500 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50"
                >
                  Radd Karein
                </button>
                <button
                  id="btn-expense-save"
                  type="submit"
                  className="px-5 py-2 bg-[#0F6E56] hover:bg-[#0c5946] text-white rounded-lg text-xs font-bold shadow-md"
                >
                  Save Karein
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
