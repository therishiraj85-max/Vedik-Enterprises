import React, { useState, useEffect, useRef } from 'react';
import { Invoice, Expense, Product, Customer } from '../types';
import { Chart } from 'chart.js/auto';
import { Lock, Calendar, FileDown, AreaChart, BarChart3, PieChart, Users, ChevronRight } from 'lucide-react';

interface ReportsViewProps {
  invoices: Invoice[];
  expenses: Expense[];
  products: Product[];
  customers: Customer[];
  isPro: boolean;
  triggerUpgrade: () => void;
  showToast: (msg: string) => void;
}

export default function ReportsView({
  invoices,
  expenses,
  products,
  customers,
  isPro,
  triggerUpgrade,
  showToast
}: ReportsViewProps) {
  // Date range filters: default to past 30 days
  const getPastDateStr = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const [fromDate, setFromDate] = useState<string>(getPastDateStr(30));
  const [toDate, setToDate] = useState<string>(getPastDateStr(0));

  // Chart Canvas Refs
  const salesBarRef = useRef<HTMLCanvasElement | null>(null);
  const expensePieRef = useRef<HTMLCanvasElement | null>(null);
  const profitLineRef = useRef<HTMLCanvasElement | null>(null);

  // Chart Instances
  const salesBarInst = useRef<Chart | null>(null);
  const expensePieInst = useRef<Chart | null>(null);
  const profitLineInst = useRef<Chart | null>(null);

  // Filter lists by date range
  const isWithinRange = (dateStr: string) => {
    return dateStr >= fromDate && dateStr <= toDate;
  };

  const filteredInvoices = invoices.filter(inv => isWithinRange(inv.date));
  const filteredExpenses = expenses.filter(exp => isWithinRange(exp.date));

  // 1. Core Analytics Calculations
  
  // Sales by Product calculations
  const productRevenueMap: { [name: string]: number } = {};
  filteredInvoices.forEach(inv => {
    inv.items.forEach(item => {
      productRevenueMap[item.productName] = (productRevenueMap[item.productName] || 0) + item.subtotal;
    });
  });

  const topProducts = Object.entries(productRevenueMap)
    .sort((a, b) => b[1] - a[1]) // sort revenue descending
    .slice(0, 5); // top 5

  // Expenses categories
  const categories: Expense['category'][] = ['Rent', 'Salary', 'Stock Purchase', 'Utilities', 'Other'];
  const expenseSummary = categories.map(cat => {
    return filteredExpenses
      .filter(exp => exp.category === cat)
      .reduce((sum, exp) => sum + exp.amount, 0);
  });

  // Top Customers leaderboard
  const customerSummaryMap: { [name: string]: number } = {};
  filteredInvoices.forEach(inv => {
    customerSummaryMap[inv.customerName] = (customerSummaryMap[inv.customerName] || 0) + inv.total;
  });

  const topCustomers = Object.entries(customerSummaryMap)
    .sort((a, b) => b[1] - a[1]) // purchases descending
    .slice(0, 5); // top 5

  // 2. Charts rendering
  useEffect(() => {
    if (salesBarRef.current) {
      if (salesBarInst.current) salesBarInst.current.destroy();
      
      const labels = topProducts.map(p => p[0]);
      const data = topProducts.map(p => p[1]);
      
      const ctx = salesBarRef.current.getContext('2d');
      if (ctx) {
        salesBarInst.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels.length > 0 ? labels : ['No sales in range'],
            datasets: [{
              data: data.length > 0 ? data : [0],
              backgroundColor: '#0F6E56',
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }
        });
      }
    }

    if (expensePieRef.current) {
      if (expensePieInst.current) expensePieInst.current.destroy();
      
      const totalSelectedExp = expenseSummary.reduce((acc, v) => acc + v, 0);
      const ctx = expensePieRef.current.getContext('2d');
      
      if (ctx) {
        expensePieInst.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: categories,
            datasets: [{
              data: totalSelectedExp > 0 ? expenseSummary : [1],
              backgroundColor: totalSelectedExp > 0 ? ['#0F6E56', '#F5A623', '#4A90E2', '#D0021B', '#7ED321'] : ['#E2E8F0']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 10 } } }
          }
        });
      }
    }

    if (profitLineRef.current) {
      if (profitLineInst.current) profitLineInst.current.destroy();

      // Gather daily trends
      const dailyMap: { [date: string]: { income: number; expense: number } } = {};
      
      filteredInvoices.forEach(inv => {
        if (!dailyMap[inv.date]) dailyMap[inv.date] = { income: 0, expense: 0 };
        dailyMap[inv.date].income += inv.total;
      });

      filteredExpenses.forEach(exp => {
        if (!dailyMap[exp.date]) dailyMap[exp.date] = { income: 0, expense: 0 };
        dailyMap[exp.date].expense += exp.amount;
      });

      const dates = Object.keys(dailyMap).sort();
      const incomeTrend = dates.map(d => dailyMap[d].income);
      const expenseTrend = dates.map(d => dailyMap[d].expense);

      const ctx = profitLineRef.current.getContext('2d');
      if (ctx) {
        profitLineInst.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: dates.length > 0 ? dates : ['No database records'],
            datasets: [
              {
                label: 'Income (Bikri)',
                data: incomeTrend.length > 0 ? incomeTrend : [0],
                borderColor: '#0F6E56',
                tension: 0.2,
                fill: false
              },
              {
                label: 'Expense (Kharcha)',
                data: expenseTrend.length > 0 ? expenseTrend : [0],
                borderColor: '#D0021B',
                tension: 0.2,
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
          }
        });
      }
    }

    return () => {
      if (salesBarInst.current) salesBarInst.current.destroy();
      if (expensePieInst.current) expensePieInst.current.destroy();
      if (profitLineInst.current) profitLineInst.current.destroy();
    };
  }, [fromDate, toDate, invoices, expenses]);

  // 3. Export CSV trigger with Blob downloading
  const handleExportCSV = (reportType: 'sales' | 'expenses' | 'customers' | 'pnl') => {
    if (!isPro) {
      triggerUpgrade();
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = `Vedik_Enterprises_${reportType}_report.csv`;

    if (reportType === 'sales') {
      csvContent += "Rank,Product Name,Total Revenue (Rs)\n";
      topProducts.forEach((p, idx) => {
        csvContent += `${idx + 1},"${p[0]}",${p[1]}\n`;
      });
    } else if (reportType === 'expenses') {
      csvContent += "Category,Total Expense Amount (Rs)\n";
      categories.forEach((cat, idx) => {
        csvContent += `"${cat}",${expenseSummary[idx]}\n`;
      });
    } else if (reportType === 'customers') {
      csvContent += "Rank,Customer Name,Total Purchased Value (Rs)\n";
      topCustomers.forEach((c, idx) => {
        csvContent += `${idx + 1},"${c[0]}",${c[1]}\n`;
      });
    } else {
      // PnL Summary
      csvContent += "Metric,Value (Rs)\n";
      csvContent += `Total Sells Sourced,${filteredInvoices.reduce((sum, inv) => sum + inv.total, 0)}\n`;
      csvContent += `Total Expenses Logged,${filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)}\n`;
      csvContent += `Net Profit/Loss,${filteredInvoices.reduce((sum, inv) => sum + inv.total, 0) - filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`${reportType.toUpperCase()} file export ho gayi!`);
  };

  return (
    <div className="space-y-6">
      
      {/* Date Range Selectors */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex items-center space-x-2 bg-gray-550/5 bg-[#F1EFE8]/40 border border-gray-150 px-3 py-1.5 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-black uppercase text-gray-500 shrink-0">From (शुरुवात):</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border-none bg-transparent outline-none text-xs font-bold text-[#0F6E56] font-mono shrink-0"
            />
          </div>

          <div className="flex items-center space-x-2 bg-[#F1EFE8]/40 border border-gray-150 px-3 py-1.5 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-black uppercase text-gray-500 shrink-0">To (आखरी):</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border-none bg-transparent outline-none text-xs font-bold text-[#0F6E56] font-mono shrink-0"
            />
          </div>
        </div>

        <span className="text-xxs uppercase tracking-wider bg-[#0F6E56]/10 text-[#0F6E56] px-3 py-1 rounded font-black max-w-max">
          Reports Mode Active
        </span>
      </div>

      {/* Reports Quadrant */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sales report */}
        <div id="section-sales-report" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-96 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center">
                <BarChart3 className="w-4 h-4 mr-1.5 text-[#0F6E56]" />
                <span>Sales Report (Top 5 Products)</span>
              </h4>

              <button
                onClick={() => handleExportCSV('sales')}
                className={`text-xxs font-black text-[#0F6E56] bg-[#0F6E56]/10 hover:bg-[#0F6E56]/20 px-2.5 py-1.5 rounded-lg inline-flex items-center space-x-1 transition-all ${
                  !isPro ? 'opacity-65' : ''
                }`}
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export CSV</span>
                {!isPro && <Lock className="w-3 h-3 ml-0.5 text-[#F5A623]" />}
              </button>
            </div>

            <div className="relative h-64">
              <canvas ref={salesBarRef} id="reports-sales-chart"></canvas>
            </div>
          </div>
        </div>

        {/* Expense report */}
        <div id="section-expense-report" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-96 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center">
                <PieChart className="w-4 h-4 mr-1.5 text-amber-500" />
                <span>Expense Category Report</span>
              </h4>

              <button
                onClick={() => handleExportCSV('expenses')}
                className={`text-xxs font-black text-[#0F6E56] bg-[#0F6E56]/10 hover:bg-[#0F6E56]/20 px-2.5 py-1.5 rounded-lg inline-flex items-center space-x-1 transition-all ${
                  !isPro ? 'opacity-65' : ''
                }`}
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export CSV</span>
                {!isPro && <Lock className="w-3 h-3 ml-0.5 text-[#F5A623]" />}
              </button>
            </div>

            <div className="relative h-64">
              <canvas ref={expensePieRef} id="reports-expense-chart"></canvas>
            </div>
          </div>
        </div>

        {/* Top 5 Customers Leaderboard */}
        <div id="section-customer-report" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-96 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center">
                <Users className="w-4 h-4 mr-1.5 text-blue-500" />
                <span>Customer Report (Top 5 Buyers)</span>
              </h4>

              <button
                onClick={() => handleExportCSV('customers')}
                className={`text-xxs font-black text-[#0F6E56] bg-[#0F6E56]/10 hover:bg-[#0F6E56]/20 px-2.5 py-1.5 rounded-lg inline-flex items-center space-x-1 transition-all ${
                  !isPro ? 'opacity-65' : ''
                }`}
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export CSV</span>
                {!isPro && <Lock className="w-3 h-3 ml-0.5 text-[#F5A623]" />}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap divide-y divide-gray-100">
                <thead>
                  <tr className="text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5">Rank</th>
                    <th className="py-2.5">Grahak (Customer)</th>
                    <th className="py-2.5 text-right">Kharidari (Value)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topCustomers.length > 0 ? (
                    topCustomers.map(([name, val], idx) => (
                      <tr key={idx} className="hover:bg-gray-550/5">
                        <td className="py-2.5 font-bold font-mono text-gray-500">{idx + 1}</td>
                        <td className="py-2.5 font-bold text-gray-800">{name}</td>
                        <td className="py-2.5 text-right font-mono font-black text-[#0F6E56]">₹{val.toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-gray-400 font-medium">Is samay me koi customer orders nahi hain</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Profit and Loss line chart trend */}
        <div id="section-pnl-report" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-96 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center">
                <AreaChart className="w-4 h-4 mr-1.5 text-purple-500" />
                <span>Profit & Loss Trend</span>
              </h4>

              <button
                onClick={() => handleExportCSV('pnl')}
                className={`text-xxs font-black text-[#0F6E56] bg-[#0F6E56]/10 hover:bg-[#0F6E56]/20 px-2.5 py-1.5 rounded-lg inline-flex items-center space-x-1 transition-all ${
                  !isPro ? 'opacity-65' : ''
                }`}
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export CSV</span>
                {!isPro && <Lock className="w-3 h-3 ml-0.5 text-[#F5A623]" />}
              </button>
            </div>

            <div className="relative h-64">
              <canvas ref={profitLineRef} id="reports-pnl-chart"></canvas>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
