'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Shield,
  Briefcase,
  CreditCard,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
} from 'lucide-react';
import Image from 'next/image';

interface PortalOption {
  id: string;
  name: string;
  defaultEmail: string;
  icon: any;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuth();

  const portals: PortalOption[] = [
    {
      id: 'admin',
      name: 'Super Admin',
      defaultEmail: 'superadmin@adyapan.com',
      icon: Shield,
    },
    {
      id: 'hr',
      name: 'HR Portal',
      defaultEmail: 'nandini@adyapan.com',
      icon: Briefcase,
    },
    {
      id: 'finance',
      name: 'Finance Portal',
      defaultEmail: 'finance@adyapan.com',
      icon: CreditCard,
    },
  ];

  const hrAccountPills = [
    { name: 'Nandini (HR Manager)', email: 'nandini@adyapan.com' },
    { name: 'Charitha (Payroll)', email: 'charitha@adyapan.com' },
    { name: 'Aravind (Exit)', email: 'aravind@adyapan.com' },
    { name: 'Veena (Hiring)', email: 'veena@adyapan.com' },
    { name: 'Nitisha (POSH)', email: 'nitisha@adyapan.com' },
    { name: 'Pavitra (Leaves)', email: 'pavitra@adyapan.com' },
  ];

  const [activePortal, setActivePortal] = useState<PortalOption>(portals[1]); // HR Portal default
  const [email, setEmail] = useState(portals[1].defaultEmail);
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handlePortalSwitch = (portal: PortalOption) => {
    setActivePortal(portal);
    setEmail(portal.defaultEmail);
    setPassword('Password123!');
    setError('');
  };

  const handleSelectHRPill = (accEmail: string) => {
    setEmail(accEmail);
    setPassword('Password123!');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full bg-orange-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

      {/* Login Box */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200 relative z-10">
        
        {/* Left Side: Clean Brand Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 text-white p-8 flex flex-col justify-between relative overflow-hidden">
          
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[11px] font-bold tracking-widest text-orange-100 uppercase">
              Adyapan Edutech Pvt. Ltd.
            </span>
          </div>

          <div className="my-8 space-y-4">
            <div className="w-20 h-20 relative drop-shadow-xl">
              <Image
                src="/adyapan_gloss_logo.png"
                alt="Adyapan Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-widest text-white uppercase">
                ADYAPAN HRMS
              </h1>
              <p className="text-xs text-orange-100 mt-1 font-medium">
                Enterprise Human Resource & Payroll System
              </p>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center gap-2 text-orange-100">
                <Zap className="w-4 h-4 text-amber-200" />
                <span>Automated Payroll & Statutory Tax</span>
              </div>
              <div className="flex items-center gap-2 text-orange-100">
                <Sparkles className="w-4 h-4 text-orange-200" />
                <span>AI ATS Resume Screening & Hiring</span>
              </div>
              <div className="flex items-center gap-2 text-orange-100">
                <Shield className="w-4 h-4 text-emerald-200" />
                <span>Role-Based Access Control</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-orange-200 font-semibold">
            Secure Enterprise System
          </div>
        </div>

        {/* Right Side: Clean Smart Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
          
          <div>
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign In</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Select portal and enter your corporate credentials
              </p>
            </div>

            {/* 3-Tab Portal Switcher */}
            <div className="p-1 rounded-2xl bg-slate-100 border border-slate-200 grid grid-cols-3 gap-1 mb-6">
              {portals.map((p) => {
                const Icon = p.icon;
                const isSelected = activePortal.id === p.id;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePortalSwitch(p)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'saffron-gradient text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 text-center font-medium">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 text-xs text-slate-900 pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 transition-all font-medium"
                    placeholder="name@adyapan.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 text-xs text-slate-900 pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 transition-all font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl saffron-gradient hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>{loading ? 'Signing in...' : `Sign In to ${activePortal.name}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Accounts Pills (Clean Minimalist) */}
            {activePortal.id === 'hr' && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 mb-2">
                  Select HR Account:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {hrAccountPills.map((pill) => (
                    <button
                      key={pill.email}
                      type="button"
                      onClick={() => handleSelectHRPill(pill.email)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                        email === pill.email
                          ? 'saffron-gradient text-white border-orange-500'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-orange-300'
                      }`}
                    >
                      {pill.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 text-center text-[10px] text-slate-400">
            © 2026 Adyapan Edutech Pvt. Ltd. All rights reserved.
          </div>

        </div>
      </div>
    </div>
  );
}
