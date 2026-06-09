import React, { useState } from 'react';
import { Product } from '../types';
import { Lock, Search, Plus, Edit2, Trash2, HelpCircle } from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  isPro: boolean;
  onUpdateInventory: (updatedList: Product[]) => void;
  triggerUpgrade: () => void;
  showToast: (msg: string) => void;
}

export default function InventoryView({ products, isPro, onUpdateInventory, triggerUpgrade, showToast }: InventoryViewProps) {
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Product['category']>('Grocery');
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState<Product['unit']>('kg');
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  
  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleOpenAdd = () => {
    if (!isPro) {
      triggerUpgrade();
      return;
    }
    setEditingItem(null);
    setName('');
    setCategory('Grocery');
    setQuantity(0);
    setUnit('kg');
    setBuyPrice(0);
    setSellPrice(0);
    setErrors({});
    setIsOpen(true);
  };

  const handleOpenEdit = (item: Product) => {
    if (!isPro) {
      triggerUpgrade();
      return;
    }
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setBuyPrice(item.buyPrice);
    setSellPrice(item.sellPrice);
    setErrors({});
    setIsOpen(true);
  };

  const handleDelete = (id: string, itemName: string) => {
    if (!isPro) {
      triggerUpgrade();
      return;
    }
    const confirmDelete = window.confirm(`Kya aap pakka "${itemName}" delete karna chahte hain?`);
    if (confirmDelete) {
      const newList = products.filter(p => p.id !== id);
      onUpdateInventory(newList);
      showToast('Product delete ho gaya!');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tempErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      tempErrors.name = 'Yeh field zaroori hai';
    }
    if (quantity < 0) {
      tempErrors.quantity = 'Quantity invalid hai';
    }
    if (buyPrice < 0) {
      tempErrors.buyPrice = 'Sahi price likhein';
    }
    if (sellPrice < buyPrice) {
      tempErrors.sellPrice = 'Bechne ka daam khareed daam se zyada hona chahiye';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    if (editingItem) {
      // Edit
      const newList = products.map(p => p.id === editingItem.id ? {
        ...p,
        name,
        category,
        quantity,
        unit,
        buyPrice,
        sellPrice
      } : p);
      onUpdateInventory(newList);
      showToast('Product update ho gaya!');
    } else {
      // Add
      const newProduct: Product = {
        id: 'p_' + Date.now(),
        name,
        category,
        quantity,
        unit,
        buyPrice,
        sellPrice
      };
      onUpdateInventory([...products, newProduct]);
      showToast('Naya product add ho gaya!');
    }

    setIsOpen(false);
  };

  // Filter list live
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Bar Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            id="inventory-search"
            type="text"
            placeholder="Product ya category search karein..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56]"
          />
        </div>

        <button
          id="btn-add-product"
          onClick={handleOpenAdd}
          className={`px-4 py-2 bg-[#0F6E56] hover:bg-[#0c5946] text-white rounded-lg text-sm font-semibold shadow-md inline-flex items-center space-x-2 transition-all ${
            !isPro ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
          {!isPro && <Lock className="w-3.5 h-3.5 ml-1" />}
        </button>
      </div>

      {/* Inventory Table Container */}
      <div id="inventory-table-container" className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-gray-500 font-semibold text-xs tracking-wider">
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Quantity</th>
                <th className="px-6 py-4 text-right">Khareed (Buy Price)</th>
                <th className="px-6 py-4 text-right">Bikri (Sell Price)</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const isLowStock = p.quantity < 5;
                  
                  // Status badge logic
                  let badgeColorStr = '';
                  let statusText = '';
                  if (p.quantity > 10) {
                    badgeColorStr = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    statusText = 'In Stock';
                  } else if (p.quantity >= 1) {
                    badgeColorStr = 'bg-amber-50 text-amber-700 border-amber-100';
                    statusText = 'Low';
                  } else {
                    badgeColorStr = 'bg-red-50 text-red-700 border-red-100';
                    statusText = 'Out of Stock';
                  }

                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-gray-50/50 transition-all ${
                        isLowStock ? 'bg-red-50/40' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{p.name}</div>
                        {isLowStock && (
                          <div className="text-[10px] text-red-500 font-bold mt-0.5">⚠️ Stock dangerously low</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs font-semibold uppercase">{p.category}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-gray-700">
                        {p.quantity} <span className="text-[10px] text-gray-400 font-normal lowercase">{p.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-gray-600">₹{p.buyPrice}</td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-[#0F6E56]">₹{p.sellPrice}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xxs font-black border uppercase ${badgeColorStr}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className={`p-1.5 hover:bg-gray-100 text-gray-500 rounded transition-all inline-flex items-center ${
                              !isPro ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                            {!isPro && <Lock className="w-3 h-3 ml-0.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className={`p-1.5 hover:bg-red-550 hover:text-red-600 text-gray-500 rounded transition-all inline-flex items-center ${
                              !isPro ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                            {!isPro && <Lock className="w-3 h-3 ml-0.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="text-3xl">📦</span>
                      <p className="font-medium text-sm">Koi product nahi mila ya search khali hai</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Inventory Modal */}
      {isOpen && (
        <div id="product-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-800">
                {editingItem ? 'Edit Product (सामान बदलें)' : 'Add New Product (नया सामान जोड़ें)'}
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Product Name *</label>
                  <input
                    id="product-input-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jaise: Chana Dal, Amul Milk..."
                    className={`w-full px-4 py-2 border rounded-lg text-sm outline-none transition-all ${
                      errors.name ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56]'
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                {/* Category & Unit Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                    <select
                      id="product-input-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Product['category'])}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0F6E56]"
                    >
                      <option value="Grocery">Grocery</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Household">Household</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Unit</label>
                    <select
                      id="product-input-unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as Product['unit'])}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0F6E56]"
                    >
                      <option value="kg">kg</option>
                      <option value="piece">piece</option>
                      <option value="litre">litre</option>
                      <option value="packet">packet</option>
                      <option value="box">box</option>
                    </select>
                  </div>
                </div>

                {/* Quantity & Buy Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Quantity *</label>
                    <input
                      id="product-input-qty"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0F6E56]"
                    />
                    {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Buy Price (Khareed Daam)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm text-gray-400">₹</span>
                      <input
                        id="product-input-buy"
                        type="number"
                        value={buyPrice}
                        onChange={(e) => setBuyPrice(Number(e.target.value))}
                        className="w-full pl-7 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0F6E56]"
                      />
                    </div>
                  </div>
                </div>

                {/* Sell Price */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sell Price (Bikri Daam) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-gray-400">₹</span>
                    <input
                      id="product-input-sell"
                      type="number"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(Number(e.target.value))}
                      placeholder="Must be greater than buy price"
                      className={`w-full pl-7 pr-4 py-2 border rounded-lg text-sm outline-none transition-all ${
                        errors.sellPrice ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-[#0F6E56]'
                      }`}
                    />
                  </div>
                  {errors.sellPrice ? (
                    <p className="text-red-500 text-xs mt-1">{errors.sellPrice}</p>
                  ) : (
                    <p className="text-xxs text-gray-400 mt-1">Saman bechne ka daam (Sell Price) hamesha khareed daam (Buy Price) se bada ya barabar hona chahiye.</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-550 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-all font-semibold"
                >
                  Radd Karein
                </button>
                <button
                  id="btn-product-save"
                  type="submit"
                  className="px-5 py-2 bg-[#0F6E56] hover:bg-[#0c5946] text-white rounded-lg text-sm font-semibold shadow-md transition-all"
                >
                  Saman Save Karein
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
