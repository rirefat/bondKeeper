import React, { useState, useEffect } from 'react';
import { UserAccount, UserSession } from '../types';
import { Shield, ShieldAlert, User, Mail, Lock, Sparkles, LogIn, ArrowRight, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthGatewayProps {
  onLogin: (session: UserSession) => void;
}

const DEFAULT_USERS: UserAccount[] = [
  {
    email: 'user@bondkeeper.com',
    name: 'Rafiul Islam',
    role: 'general',
    passwordHash: 'user123',
    createdAt: new Date().toISOString()
  },
  {
    email: 'admin@bondkeeper.com',
    name: 'Administrator',
    role: 'admin',
    passwordHash: 'admin123',
    createdAt: new Date().toISOString()
  }
];

export default function AuthGateway({ onLogin }: AuthGatewayProps) {
  const [isRegister, setIsRegister] = useState(false);
  
  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'general' | 'admin'>('general');
  const [adminKey, setAdminKey] = useState('');

  // Status & UI
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing accounts or seed defaults
  const getAccounts = (): UserAccount[] => {
    const saved = localStorage.getItem('bondkeeper_accounts');
    if (!saved) {
      localStorage.setItem('bondkeeper_accounts', JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_USERS;
    }
  };

  const handleQuickLogin = (roleType: 'general' | 'admin') => {
    setError(null);
    setSuccess(null);
    if (roleType === 'admin') {
      setEmail('admin@bondkeeper.com');
      setPassword('admin123');
    } else {
      setEmail('user@bondkeeper.com');
      setPassword('user123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('Please fill in all required credentials.');
      return;
    }

    if (isRegister && !name) {
      setError('Please provide your full name.');
      return;
    }

    setIsLoading(true);

    // Simulate network delay for smooth polished feeling
    setTimeout(() => {
      const accounts = getAccounts();

      if (isRegister) {
        // REGISTER FLOW
        const emailLower = email.toLowerCase().trim();
        const emailExists = accounts.some(acc => acc.email.toLowerCase() === emailLower);

        if (emailExists) {
          setError('An account with this email address already exists.');
          setIsLoading(false);
          return;
        }

        // Verify Admin Security Passkey
        if (role === 'admin') {
          if (adminKey !== 'admin123') {
            setError('Invalid Admin Security Passkey. Contact systems administrator.');
            setIsLoading(false);
            return;
          }
        }

        const newAccount: UserAccount = {
          email: emailLower,
          name: name.trim(),
          role,
          passwordHash: password, // Simple plain text check for this client-side demo
          createdAt: new Date().toISOString()
        };

        const updated = [...accounts, newAccount];
        localStorage.setItem('bondkeeper_accounts', JSON.stringify(updated));

        setSuccess('Account created successfully! Switching to sign in...');
        setIsLoading(false);
        
        // Auto-switch to sign-in or auto-login after 1.5s
        setTimeout(() => {
          setIsRegister(false);
          setSuccess(null);
        }, 1500);

      } else {
        // LOGIN FLOW
        const emailLower = email.toLowerCase().trim();
        const matched = accounts.find(
          acc => acc.email.toLowerCase() === emailLower && acc.passwordHash === password
        );

        if (!matched) {
          setError('Invalid email address or password combination.');
          setIsLoading(false);
          return;
        }

        // Successful Login
        const session: UserSession = {
          email: matched.email,
          name: matched.name,
          role: matched.role,
          createdAt: matched.createdAt
        };

        setSuccess(`Welcome back, ${matched.name}! Connecting...`);
        
        setTimeout(() => {
          setIsLoading(false);
          onLogin(session);
        }, 800);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-[#f3f5f8] antialiased relative overflow-hidden select-none"
      style={{
        backgroundImage: 'radial-gradient(circle at 10% 20%, #e0f2fe 0%, transparent 40%), radial-gradient(circle at 90% 80%, #e0e7ff 0%, transparent 45%)'
      }}
    >
      <div className="w-full max-w-md bg-white/40 backdrop-blur-3xl border border-white/60 shadow-2xl rounded-3xl p-6 sm:p-8 relative z-10 flex flex-col justify-between">
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl text-white shadow-md shadow-indigo-500/10 mb-3.5">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">BondKeeper</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Bangladesh Prize Bond Portfolio
          </p>
        </div>

        {/* Sliding Tabs */}
        <div className="grid grid-cols-2 bg-slate-200/50 p-1 rounded-xl mb-5 border border-slate-300/10">
          <button
            onClick={() => {
              setIsRegister(false);
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !isRegister 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsRegister(true);
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isRegister 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Status Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl mb-4 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs px-3.5 py-2.5 rounded-xl mb-4 flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
              <span className="font-semibold">{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rafiul Islam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/80 border border-slate-200 py-2.5 pl-10 pr-4 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-2xs font-medium"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/80 border border-slate-200 py-2.5 pl-10 pr-4 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-2xs font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/80 border border-slate-200 py-2.5 pl-10 pr-4 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-2xs font-medium"
              />
            </div>
          </div>

          {isRegister && (
            <div className="space-y-3.5 pt-1 border-t border-slate-200/50 mt-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1">
                  User Privilege Level
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setRole('general')}
                    className={`text-center py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      role === 'general' 
                        ? 'bg-white text-sky-600 shadow-2xs font-extrabold' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    General User
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`text-center py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      role === 'admin' 
                        ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    System Admin
                  </button>
                </div>
              </div>

              {role === 'admin' && (
                <div className="space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block ml-1">
                      Admin Security Passkey
                    </label>
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                      Demo: admin123
                    </span>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Enter security key to confirm authority"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="w-full bg-white/80 border border-slate-200 py-2 pl-3.5 pr-4 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-2xs font-medium"
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-slate-950/5 mt-5"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Authenticating...
              </>
            ) : (
              <>
                {isRegister ? 'Register Account' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Quick login details */}
        <div className="mt-8 pt-5 border-t border-slate-200/60">
          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-3.5">
            <h4 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Demo accounts quick login
            </h4>
            <div className="grid grid-cols-2 gap-2 mt-2.5">
              <button
                onClick={() => handleQuickLogin('general')}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold py-1.5 px-2 rounded-lg transition-all text-center flex flex-col items-center justify-center cursor-pointer shadow-3xs"
              >
                <span className="text-sky-500 font-extrabold text-[8px] tracking-wider uppercase mb-0.5">General User</span>
                <span>user123</span>
              </button>
              <button
                onClick={() => handleQuickLogin('admin')}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold py-1.5 px-2 rounded-lg transition-all text-center flex flex-col items-center justify-center cursor-pointer shadow-3xs"
              >
                <span className="text-indigo-600 font-extrabold text-[8px] tracking-wider uppercase mb-0.5">Admin Role</span>
                <span>admin123</span>
              </button>
            </div>
            <p className="text-[9px] text-slate-400 mt-2 text-center">
              Click either box to fill credentials, then hit Sign In!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
