import React, { useState } from 'react';
import { KEYS, seedMockData } from '../utils';
import { BusinessProfile } from '../types';
import { Lock, FileUp, FileDown, RotateCcw, Building2, Eye, ShieldCheck, Sun, Moon, HelpCircle } from 'lucide-react';

interface SettingsViewProps {
  profile: BusinessProfile;
  isPro: boolean;
  theme: 'light' | 'dark';
  onUpdateProfile: (updatedProfile: BusinessProfile) => void;
  onUpdateTheme: (theme: 'light' | 'dark') => void;
  triggerUpgrade: () => void;
  showToast: (msg: string) => void;
  onHardReset: () => void;
}

export default function SettingsView({
  profile,
  isPro,
  theme,
  onUpdateProfile,
  onUpdateTheme,
  triggerUpgrade,
  showToast,
  onHardReset
}: SettingsViewProps) {
  // Profile forms
  const [businessName, setBusinessName] = useState(profile.businessName || '');
  const [ownerName, setOwnerName] = useState(profile.ownerName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [email, setEmail] = useState(profile.email || '');
  const [address, setAddress] = useState(profile.address || '');
  const [gstNumber, setGstNumber] = useState(profile.gstNumber || '');
  const [logoBase64, setLogoBase64] = useState(profile.logo || '');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPro) {
      triggerUpgrade();
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPro) {
      triggerUpgrade();
      return;
    }

    const updated: BusinessProfile = {
      businessName,
      ownerName,
      phone,
      email,
      address,
      gstNumber,
      logo: logoBase64
    };

    onUpdateProfile(updated);
    showToast('Business details update ho gaya!');
  };

  // Data management helpers
  const handleExportAll = () => {
    if (!isPro) {
      triggerUpgrade();
      return;
    }
    
    // Aggregate all DB keys
    const backup: { [key: string]: string | null } = {};
    Object.values(KEYS).forEach(k => {
      backup[k] = localStorage.getItem(k);
    });

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Vedik_Enterprises_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Full backup json file export ho gayi!');
  };

  const handleImportAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPro) {
      triggerUpgrade();
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          Object.keys(parsed).forEach(k => {
            if (parsed[k]) {
              localStorage.setItem(k, parsed[k]);
            }
          });
          showToast('Data completely restore ho gaya! Refreshing...');
          setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
          alert('Incorrect format. File read fails!');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetApp = () => {
    if (!isPro) {
      triggerUpgrade();
      return;
    }
    const confirmReset = window.confirm('Kya aap pakka reset karna chahte hain? Saara data delete ho jaayega');
    if (confirmReset) {
      onHardReset();
    }
  };

  // Renewal date mock: today + 30 days
  const getRenewalDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      
      {/* Three grid configurations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Business Profile form */}
        <div id="settings-profile-section" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-8 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider pb-3 border-b border-gray-100 mb-4 flex items-center">
              <Building2 className="w-4 h-4 mr-1.5 text-[#0F6E56]" />
              <span>Business Profile Details</span>
              {!isPro && <Lock className="w-3.5 h-3.5 ml-2 text-amber-500 shrink-0" />}
            </h4>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Business Name (दुकान का नाम)</label>
                  <input
                    type="text"
                    disabled={!isPro}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none bg-white focus:border-[#0F6E56] disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Owner Name (मालिक का नाम)</label>
                  <input
                    type="text"
                    disabled={!isPro}
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none bg-white focus:border-[#0F6E56] disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Phone Number (मोबाइल नंबर)</label>
                  <input
                    type="text"
                    disabled={!isPro}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none bg-white focus:border-[#0F6E56] disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Email ID</label>
                  <input
                    type="text"
                    disabled={!isPro}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none bg-white focus:border-[#0F6E56] disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">GST Number (जीएसटी संख्या)</label>
                <input
                  type="text"
                  disabled={!isPro}
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none bg-white focus:border-[#0F6E56] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Business Shop Address (दुकान का पता)</label>
                <textarea
                  disabled={!isPro}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none bg-white focus:border-[#0F6E56] disabled:opacity-60"
                />
              </div>

              {/* Logo upload base64 container */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Upload Business Logo (logo-upload)</label>
                <div className="flex items-center space-x-3 mt-1.5">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                    {logoBase64 ? (
                      <img src={logoBase64} alt="Shop logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-gray-400">No logo</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!isPro}
                    onChange={handleLogoUpload}
                    className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#0F6E56]/10 file:text-[#0F6E56]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id="btn-settings-profile-save"
                  type="submit"
                  disabled={!isPro}
                  className={`px-5 py-2.5 bg-[#0F6E56] hover:bg-[#0c5946] text-white text-xs font-bold rounded-lg shadow-md transition-all ${
                    !isPro ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Save Business Details
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Preferences and Data admin tools */}
        <div className="space-y-6 lg:col-span-4">
          
          {/* Subscription details card */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider pb-3 border-b border-gray-100 mb-3">Subscription (योजना)</h4>
            
            <div className="space-y-3 mt-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-bold uppercase text-[10px]">Your Current Plan:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xxs font-black tracking-wider uppercase border ${
                  isPro 
                    ? 'bg-amber-50 text-amber-700 border-amber-100' 
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}>
                  {isPro ? 'PRO PLAN • Rs 199' : 'FREE PLAN'}
                </span>
              </div>

              {isPro ? (
                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-xs">
                  <p className="text-emerald-800 font-bold flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1 inline" />
                    <span>Plan active (चालू है)</span>
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1font-medium">Automatic renewal date: <span className="font-semibold">{getRenewalDateStr()}</span></p>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <p className="text-xxs text-gray-400">Unlock invoice generations, reports, AI, and staff payrolls at bargain prices of Rs 199!</p>
                  <button
                    onClick={triggerUpgrade}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 font-black text-white rounded-lg text-xs shadow-md shadow-amber-900/15 transition-all text-center"
                  >
                    Upgrade to Pro — Rs 199/month
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider pb-3 border-b border-gray-100 mb-3">Preferences</h4>
            
            <div className="space-y-4 pt-1.5 text-xs text-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Base Currency Unit:</span>
                <span className="font-bold border border-gray-200 px-3 py-1 rounded bg-gray-50/50">INR (₹) Rupees</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">App Mode Theme:</span>
                <div className="flex p-0.5 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => onUpdateTheme('light')}
                    className={`p-1.5 rounded-md transition-all ${
                      theme === 'light' ? 'bg-white shadow-sm text-[#0F6E56]' : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title="Light Mode"
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onUpdateTheme('dark')}
                    className={`p-1.5 rounded-md transition-all ${
                      theme === 'dark' ? 'bg-white shadow-sm text-[#0F6E56]' : 'text-gray-400 hover:text-gray-650'
                    }`}
                    title="Dark Mode"
                  >
                    <Moon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Data Management tools */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider pb-3 border-b border-gray-100 mb-3">Data Management Tools</h4>
            
            <div className="space-y-2.5 pt-1 text-xs">
              
              <button
                onClick={handleExportAll}
                disabled={!isPro}
                className={`w-full py-2 border border-gray-200 hover:bg-gray-50 rounded-lg inline-flex items-center justify-center space-x-1 font-bold text-gray-600 transition-all ${
                  !isPro ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <FileDown className="w-4 h-4 text-emerald-600" />
                <span>Export All Data (Backup JSON)</span>
                {!isPro && <Lock className="w-3.5 h-3.5 ml-1 text-amber-500" />}
              </button>

              <div className="relative">
                <input
                  type="file"
                  id="import-backup-filepicker"
                  accept=".json"
                  disabled={!isPro}
                  onChange={handleImportAll}
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <button
                  disabled={!isPro}
                  className={`w-full py-2 border border-gray-200 hover:bg-gray-50 rounded-lg inline-flex items-center justify-center space-x-1 font-bold text-gray-600 transition-all ${
                    !isPro ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FileUp className="w-4 h-4 text-blue-500" />
                  <span>Import Data (Restore JSON)</span>
                  {!isPro && <Lock className="w-3.5 h-3.5 ml-1 text-amber-500" />}
                </button>
              </div>

              <button
                onClick={handleResetApp}
                disabled={!isPro}
                className={`w-full py-2 border border-red-150 bg-red-50/10 hover:bg-red-50 text-red-700 rounded-lg inline-flex items-center justify-center space-x-1 font-extrabold transition-all border ${
                  !isPro ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset App database</span>
                {!isPro && <Lock className="w-3.5 h-3.5 ml-1 text-amber-500" />}
              </button>

            </div>
          </div>

          {/* About metadata panel info */}
          <div className="text-center p-3 text-xxs text-gray-400 font-semibold uppercase tracking-widest leading-relaxed">
            <p>Vedik Enterprises (वेदिक इंटरप्राइजेज) Version 1.0.0</p>
            <p className="mt-0.5 lowercase italic tracking-normal">Aapka Business, Aapka Control</p>
          </div>

        </div>

      </div>

    </div>
  );
}
