import React, { useEffect, useRef } from 'react';
import { Product, Customer, Invoice } from '../types';
import { KEYS } from '../utils';
import { Chart } from 'chart.js/auto';
import { IndianRupee, Box, AlertCircle, Users, ReceiptIndianRupee, TrendingUp } from 'lucide-react';

interface DashboardViewProps {
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  isPro: boolean;
  onNavigate: (page: string) => void;
  triggerUpgrade: () => void;
}

export default function DashboardView({ products, customers, invoices, isPro, onNavigate, triggerUpgrade }: DashboardViewProps) {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  // 1. Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Sum of today's invoices
  const todayInvoices = invoices.filter(inv => inv.date === todayStr);
  const aajKiBikri = todayInvoices.reduce((sum, inv) => sum + inv.total, 0);

  // Total products count
  const totalStockItems = products.length;

  // Unpaid or Partial invoices amount outstanding
  const pendingPayments = invoices
    .filter(inv => inv.paymentStatus === 'Unpaid' || inv.paymentStatus === 'Partial')
    .reduce((sum, inv) => {
      if (inv.paymentStatus === 'Unpaid') return sum + inv.total;
      // Partial defaults to 50% outstanding for simplicity or we can check customer totals
      return sum + (inv.total * 0.5); 
    }, 0);

  // Total active customers
  const activeCustomers = customers.length;

  // Recent 5 Invoices
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Low Stock Items (quantity < 5)
  const lowStockItems = products.filter(p => p.quantity < 5);

  // 2. Chart Rendering (7 Days Sales)
  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart if any
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Get last 7 days list
    const last7Days: string[] = [];
    const salesData: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }); // e.g. Mon, Tue
      last7Days.push(dayLabel);

      // Sum sales for this day
      const daySales = invoices
        .filter(inv => inv.date === dateStr)
        .reduce((sum, inv) => sum + inv.total, 0);
      salesData.push(daySales);
    }

    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: last7Days,
          datasets: [{
            label: 'Sales (Rs.)',
            data: salesData,
            backgroundColor: '#0F6E56',
            borderRadius: 6,
            barThickness: 24,
            hoverBackgroundColor: '#0c5946',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                callback: function(value) {
                  return '₹' + value;
                }
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    }

    // Cleanup
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [invoices]);

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Aaj ki Bikri */}
        <div id="metric-today-sales" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4 border-l-4 border-l-[#0F6E56]">
          <div className="p-3 bg-emerald-50 rounded-full text-[#0F6E56]">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Aaj ki Bikri</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">₹{aajKiBikri.toLocaleString('en-IN')}</h3>
            <p className="text-[11px] text-[#0F6E56] font-medium mt-0.5 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              <span>{todayInvoices.length} invoices generated</span>
            </p>
          </div>
        </div>

        {/* Total Stock Items */}
        <div id="metric-total-stock" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4 border-l-4 border-l-[#F5A623]">
          <div className="p-3 bg-amber-50 rounded-full text-[#F5A623]">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Stock Items</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">{totalStockItems}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {lowStockItems.length > 0 ? (
                <span className="text-red-500 font-semibold">{lowStockItems.length} Low stock alerts</span>
              ) : (
                'All items healthy'
              )}
            </p>
          </div>
        </div>

        {/* Pending Payments */}
        <div id="metric-pending-payment" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4 border-l-4 border-l-red-500">
          <div className="p-3 bg-red-50 rounded-full text-red-500">
            <ReceiptIndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Payments</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">₹{pendingPayments.toLocaleString('en-IN')}</h3>
            <p className="text-[11px] text-red-500 font-medium mt-0.5">Udaari outstanding balance</p>
          </div>
        </div>

        {/* Active Customers */}
        <div id="metric-active-customers" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4 border-l-4 border-l-blue-500">
          <div className="p-3 bg-blue-50 rounded-full text-blue-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Customers</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">{activeCustomers}</h3>
            <p className="text-[11px] text-blue-500 font-medium mt-0.5">Connected business accounts</p>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-base">Pichle Tabadtor 7 Dino ki Bikri (sales)</h3>
          <span className="text-xs uppercase bg-emerald-50 text-[#0F6E56] font-semibold px-2.5 py-1 rounded">Live State</span>
        </div>
        <div className="h-64 relative">
          <canvas ref={chartRef} id="dashboard-sales-chart"></canvas>
        </div>
      </div>

      {/* Two Columns: Recent Transactions & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Transactions */}
        <div id="recent-transactions-panel" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Recent Transactions (हाल ही में बिक्री)</h4>
              <button 
                onClick={() => onNavigate('billing')}
                className="text-xs font-semibold text-[#0F6E56] hover:underline"
              >
                Billing dekhein
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-50 text-gray-400 text-xxs uppercase tracking-wider">
                    <th className="py-2">Receipt</th>
                    <th className="py-2">Grahak</th>
                    <th className="py-2">Bikri</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentInvoices.length > 0 ? (
                    recentInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/50 transition-all">
                        <td className="py-2 font-mono font-bold text-gray-600 text-xs">{inv.number}</td>
                        <td className="py-2 font-medium text-gray-800 truncate max-w-[120px]">{inv.customerName}</td>
                        <td className="py-2 font-semibold">₹{inv.total}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            inv.paymentStatus === 'Unpaid' ? 'bg-red-50 text-red-700 border border-red-100' :
                            'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {inv.paymentStatus === 'Paid' ? 'Paid' : inv.paymentStatus === 'Unpaid' ? 'Unpaid' : 'Partial'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-400 text-xs font-medium">Koi transaction nahi hai</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div id="low-stock-alerts-panel" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider flex items-center">
                <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
                <span>Low Stock Alerts (खत्म होने वाला माल)</span>
              </h4>
              <button 
                onClick={() => onNavigate('inventory')}
                className="text-xs font-semibold text-[#0F6E56] hover:underline"
              >
                Inventory dekhein
              </button>
            </div>

            <div className="space-y-3">
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg animate-pulse-slow">
                    <div className="flex items-center space-x-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                        <p className="text-xxs text-gray-400 uppercase font-mono tracking-wider">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-red-600 font-mono">{item.quantity} {item.unit}</span>
                      <p className="text-[10px] text-red-500 font-bold mt-0.5">Saman khatam ho raha hai!</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 text-xs font-medium flex flex-col items-center justify-center space-y-2">
                  <span className="text-2xl">🎉</span>
                  <span>Sabhi saman filhal stock me hai!</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
