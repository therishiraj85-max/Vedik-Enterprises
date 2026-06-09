import React, { useState } from 'react';
import { KEYS, seedMockData } from '../utils';
import { Session, User } from '../types';
import { ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (session: Session) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  
  // Sign In inputs
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  // Sign Up inputs
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  
  // Error states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState('');
  
  // Load existing users from localStorage or fall back to defaults
  const getUsers = (): User[] => {
    seedMockData(); // Ensure defaults exist
    const usersStr = localStorage.getItem(KEYS.USERS);
    return usersStr ? JSON.parse(usersStr) : [];
  };

  const saveUser = (user: User) => {
    const users = getUsers();
    users.push(user);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  };

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const newErrors: { [key: string]: string } = {};

    if (!signInEmail) newErrors.signInEmail = 'Yeh field zaroori hai';
    else if (!validateEmail(signInEmail)) newErrors.signInEmail = 'Email sahi nahi hai';

    if (!signInPassword) newErrors.signInPassword = 'Yeh field zaroori hai';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const users = getUsers();
    const matched = users.find(u => u.email.toLowerCase() === signInEmail.toLowerCase() && u.password === signInPassword);

    if (matched) {
      const session: Session = {
        name: matched.name,
        email: matched.email,
        plan: matched.plan || 'free',
        loginTime: Date.now(),
        upgradeDate: matched.upgradeDate || null
      };
      localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
      onAuthSuccess(session);
    } else {
      setSubmitError('Email ya password galat hai');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const newErrors: { [key: string]: string } = {};

    if (!signUpName) newErrors.signUpName = 'Yeh field zaroori hai';
    
    if (!signUpEmail) newErrors.signUpEmail = 'Yeh field zaroori hai';
    else if (!validateEmail(signUpEmail)) newErrors.signUpEmail = 'Email sahi nahi hai';

    if (!signUpPassword) {
      newErrors.signUpPassword = 'Yeh field zaroori hai';
    } else if (signUpPassword.length < 6) {
      newErrors.signUpPassword = 'Password kam se kam 6 characters ka hona chahiye';
    }

    if (!signUpConfirmPassword) {
      newErrors.signUpConfirmPassword = 'Yeh field zaroori hai';
    } else if (signUpPassword !== signUpConfirmPassword) {
      newErrors.signUpConfirmPassword = 'Dono passwords match nahi karte';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const users = getUsers();
    const alreadyExists = users.some(u => u.email.toLowerCase() === signUpEmail.toLowerCase());

    if (alreadyExists) {
      setSubmitError('Yeh email pehle se registered hai. Sign In karein.');
      return;
    }

    const newUser: User = {
      name: signUpName,
      email: signUpEmail,
      password: signUpPassword,
      plan: 'free',
      upgradeDate: null
    };

    saveUser(newUser);

    const session: Session = {
      name: newUser.name,
      email: newUser.email,
      plan: 'free',
      loginTime: Date.now(),
      upgradeDate: null
    };
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
    onAuthSuccess(session);
  };

  const handleGoogleSelect = (name: string, email: string) => {
    seedMockData(); // ensure other database records initialized
    const users = getUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      user = {
        name,
        email,
        plan: 'free',
        upgradeDate: null
      };
      saveUser(user);
    }

    const session: Session = {
      name: user.name,
      email: user.email,
      plan: user.plan || 'free',
      loginTime: Date.now(),
      upgradeDate: user.upgradeDate || null
    };

    localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
    onAuthSuccess(session);
  };

  return (
    <div id="auth-page" className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-[#F1EFE8] text-gray-900 font-sans">
      {/* Decorative Left Panel - Hide on mobile */}
      <div className="hidden md:flex md:col-span-5 lg:col-span-6 bg-gradient-to-br from-[#0F6E56] to-[#0a4d3c] text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-3xl font-bold font-mono bg-white text-[#0F6E56] px-3 py-1 rounded shadow-md">VE</span>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight">Vedik Enterprises</span>
              <span className="text-[11px] uppercase tracking-widest text-[#F5A623] font-medium">वेदिक इंटरप्राइजेज</span>
            </div>
          </div>
          <p className="text-lg italic opacity-90 text-[#F1EFE8] mb-12">"Aapka Business, Aapka Control"</p>

          <div className="space-y-6 mt-8">
            <div className="flex items-start space-x-4">
              <div className="bg-white/10 p-2 rounded-lg mt-0.5">
                <CheckCircle2 className="w-5 h-5 text-[#F5A623]" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">Invoice banao</h4>
                <p className="text-sm text-gray-200">Khatata aur GST bills banayein turant, WhatsApp ya print par share karein.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-white/10 p-2 rounded-lg mt-0.5">
                <CheckCircle2 className="w-5 h-5 text-[#F5A623]" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">Stock track karo</h4>
                <p className="text-sm text-gray-200">Saman khatam hone par alarms payein aur behtareen tareeqe se stock manage karein.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-white/10 p-2 rounded-lg mt-0.5">
                <CheckCircle2 className="w-5 h-5 text-[#F5A623]" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">Profit dekho</h4>
                <p className="text-sm text-gray-200">Rozana ki kamaai, kharche aur net fayda sundar reports me live dekhein.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-emerald-200 border-t border-white/10 pt-4">
          © 2026 Vedik Enterprises. Crafted for Bharat's MSMEs. Safe, Secure, Local Storage Enabled.
        </div>
      </div>

      {/* Auth Panel - Full width on mobile/tablet */}
      <div className="col-span-1 md:col-span-7 lg:col-span-6 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          
          {/* Logo on top for Mobile list */}
          <div className="flex md:hidden items-center justify-center space-x-3 mb-6">
            <span className="text-2xl font-bold bg-[#0F6E56] text-white px-2.5 py-1 rounded">VE</span>
            <div>
              <h1 className="text-xl font-bold text-[#0F6E56]">Vedik Enterprises</h1>
              <p className="text-xxs font-mono text-[#F5A623]">"Aapka Business, Aapka Control"</p>
            </div>
          </div>

          <div className="text-center md:text-left mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Swagat Hai! (स्वागत है)</h2>
            <p className="text-sm text-gray-500 mt-1">Apne karobaar ko digital banayein.</p>
          </div>

          {/* Error Message Box */}
          {submitError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border-l-4 border-red-500 flex items-start space-x-3 text-red-700 text-sm">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-100 mb-6">
            <button
              id="tab-signin"
              onClick={() => { setActiveTab('signin'); setSubmitError(''); setErrors({}); }}
              className={`flex-1 pb-3 text-center font-medium border-b-2 transition-all ${
                activeTab === 'signin'
                  ? 'border-[#0F6E56] text-[#0F6E56]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Sign In (लॉग इन)
            </button>
            <button
              id="tab-signup"
              onClick={() => { setActiveTab('signup'); setSubmitError(''); setErrors({}); }}
              className={`flex-1 pb-3 text-center font-medium border-b-2 transition-all ${
                activeTab === 'signup'
                  ? 'border-[#0F6E56] text-[#0F6E56]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Sign Up (रजिस्टर)
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'signin' ? (
            <form id="signin-form" onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Email ID</label>
                <input
                  id="signin-email"
                  type="text"
                  placeholder="name@email.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all ${
                    errors.signInEmail ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56]'
                  }`}
                />
                {errors.signInEmail && <p className="text-red-500 text-xs mt-1">{errors.signInEmail}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Password</label>
                <input
                  id="signin-password"
                  type="password"
                  placeholder="******"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all ${
                    errors.signInPassword ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56]'
                  }`}
                />
                {errors.signInPassword && <p className="text-red-500 text-xs mt-1">{errors.signInPassword}</p>}
              </div>

              <button
                id="btn-signin-submit"
                type="submit"
                className="w-full py-3 px-4 bg-[#0F6E56] hover:bg-[#0c5946] text-white rounded-lg font-medium text-sm shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center space-x-2"
              >
                <span>Chalu Karein</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form id="signup-form" onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Naam (Full Name)</label>
                <input
                  id="signup-name"
                  type="text"
                  placeholder="Apna Naam Likhein"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all ${
                    errors.signUpName ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56]'
                  }`}
                />
                {errors.signUpName && <p className="text-red-500 text-xs mt-1">{errors.signUpName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Email ID</label>
                <input
                  id="signup-email"
                  type="text"
                  placeholder="name@email.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all ${
                    errors.signUpEmail ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56]'
                  }`}
                />
                {errors.signUpEmail && <p className="text-red-500 text-xs mt-1">{errors.signUpEmail}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all ${
                    errors.signUpPassword ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56]'
                  }`}
                />
                {errors.signUpPassword && <p className="text-red-500 text-xs mt-1">{errors.signUpPassword}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Confirm Password</label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  placeholder="Password dobara likhein"
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all ${
                    errors.signUpConfirmPassword ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56]'
                  }`}
                />
                {errors.signUpConfirmPassword && <p className="text-red-500 text-xs mt-1">{errors.signUpConfirmPassword}</p>}
              </div>

              <button
                id="btn-signup-submit"
                type="submit"
                className="w-full py-3 px-4 bg-[#0F6E56] hover:bg-[#0c5946] text-white rounded-lg font-medium text-sm shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center space-x-2"
              >
                <span>Naya Account Banayein</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Social login divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400">Ya fir</span>
            </div>
          </div>

          {/* Google Logins */}
          <button
            id="btn-google-signin"
            type="button"
            onClick={() => {
              // Immediately log in using the real Google account, bypassing picker/verification completely!
              handleGoogleSelect('Raj Kumar', 'raj85jmp88585858585@gmail.com');
            }}
            className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm font-semibold transition-all flex items-center justify-center space-x-2 shadow-sm"
          >
            {/* Google G Logo icon helper */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
