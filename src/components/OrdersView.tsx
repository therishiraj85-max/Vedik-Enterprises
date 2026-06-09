import React, { useState } from 'react';
import { Order } from '../types';
import { Lock, ShoppingBag, ArrowRight, ArrowLeft, Check, ClipboardCopy, Plus } from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  isPro: boolean;
  onUpdateOrders: (updatedList: Order[]) => void;
  triggerUpgrade: () => void;
  showToast: (msg: string) => void;
  onNavigate: (page: string) => void;
}

export default function OrdersView({
  orders,
  isPro,
  onUpdateOrders,
  triggerUpgrade,
  showToast,
  onNavigate
}: OrdersViewProps) {
  // Current active status filter: 'All' | 'New' | 'Processing' | 'Ready' | 'Delivered' | 'Cancelled'
  const [activeFilter, setActiveFilter] = useState<'All' | Order['status']>('All');

  // Status transitions pipeline route
  const statusPipeline: Order['status'][] = ['New', 'Processing', 'Ready', 'Delivered'];

  const getNextStatus = (current: Order['status']): Order['status'] | null => {
    const idx = statusPipeline.indexOf(current);
    if (idx === -1 || idx === statusPipeline.length - 1) return null;
    return statusPipeline[idx + 1];
  };

  const handleUpdateStatus = (orderId: string, isBack = false) => {
    if (!isPro) {
      triggerUpgrade();
      return;
    }

    const updated = orders.map(ord => {
      if (ord.id === orderId) {
        if (isBack) {
          // Go back 1 status
          const idx = statusPipeline.indexOf(ord.status);
          if (idx > 0) {
            return { ...ord, status: statusPipeline[idx - 1] };
          }
        } else {
          // Progress forward
          const next = getNextStatus(ord.status);
          if (next) {
            return { ...ord, status: next };
          }
        }
      }
      return ord;
    });

    onUpdateOrders(updated);
    showToast('Order status update ho gaya!');
  };

  const handleCancelOrder = (orderId: string) => {
    if (!isPro) {
      triggerUpgrade();
      return;
    }
    const confirmCancel = window.confirm('Kya aap pakka is order ko cancel karna chahte hain?');
    if (confirmCancel) {
      const updated = orders.map(ord => {
        if (ord.id === orderId) {
          return { ...ord, status: 'Cancelled' as const };
        }
        return ord;
      });
      onUpdateOrders(updated);
      showToast('Order radd kar diya gaya!');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(ord => {
    if (activeFilter === 'All') return true;
    return ord.status === activeFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Top action header and filter bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Toggle Categories Tabs */}
        <div className="flex bg-gray-150 p-1 rounded-lg overflow-x-auto min-w-0 max-w-full">
          {(['All', 'New', 'Processing', 'Ready', 'Delivered', 'Cancelled'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all shrink-0 ${
                activeFilter === tab
                  ? 'bg-white text-[#0F6E56] shadow-sm'
                  : 'text-gray-400 hover:text-gray-650'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          onClick={() => onNavigate('billing')}
          className="px-4 py-2 bg-[#0F6E56] hover:bg-[#0c5946] text-white rounded-lg text-sm font-semibold shadow-md inline-flex items-center space-x-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Order</span>
        </button>
      </div>

      {/* Orders Grid cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((ord) => {
            const nextStatus = getNextStatus(ord.status);
            
            // Status badges styles map
            let badgeStyle = '';
            if (ord.status === 'New') badgeStyle = 'bg-blue-50 text-blue-700 border-blue-150';
            else if (ord.status === 'Processing') badgeStyle = 'bg-amber-50 text-amber-700 border-amber-150';
            else if (ord.status === 'Ready') badgeStyle = 'bg-purple-50 text-purple-700 border-purple-150';
            else if (ord.status === 'Delivered') badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-150';
            else badgeStyle = 'bg-red-50 text-red-750 border-red-150';

            return (
              <div 
                key={ord.id} 
                className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-50 mb-3 text-xs">
                    <span className="font-mono font-black text-[#0F6E56]">{ord.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${badgeStyle}`}>
                      {ord.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-gray-800 tracking-tight">{ord.customerName}</h4>
                    <p className="text-xxs text-gray-400 font-semibold">{ord.date}</p>
                    <p className="text-xs text-gray-650 font-medium pt-2 italic">“ {ord.items} ”</p>
                  </div>
                </div>

                <div className="border-t border-gray-50 pt-3 mt-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-gray-500 font-bold">Total price:</span>
                    <p className="font-mono text-gray-800 font-black text-sm">₹{ord.total}</p>
                  </div>

                  {/* Operational controls */}
                  <div className="flex space-x-1">
                    {ord.status !== 'Cancelled' && ord.status !== 'Delivered' && (
                      <button
                        onClick={() => handleCancelOrder(ord.id)}
                        className={`px-2.5 py-1.5 border border-red-150 text-red-700 hover:bg-red-50 text-xxs font-black rounded-lg transition-all ${
                          !isPro ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        Cancel
                      </button>
                    )}

                    {nextStatus && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id)}
                        className={`px-2.5 py-1.5 bg-[#0F6E56] hover:bg-[#0c5946] text-white text-xxs font-black rounded-lg transition-all inline-flex items-center space-x-1 ${
                          !isPro ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <span>Move to {nextStatus}</span>
                        <ArrowRight className="w-3 h-3" />
                        {!isPro && <Lock className="w-3 h-3 ml-0.5" />}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 bg-white border border-gray-100 rounded-xl text-center text-gray-400">
            <div className="flex flex-col items-center justify-center space-y-2">
              <ShoppingBag className="w-10 h-10 text-gray-300 animate-pulse" />
              <p className="font-medium text-sm">Is category me koi orders nahi hain</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
