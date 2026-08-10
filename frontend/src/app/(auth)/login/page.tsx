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
  Sparkles,
  Eye,
  EyeOff,
  UserCheck,
  Zap,
} from 'lucide-react';
import Image from 'next/image';

interface PortalOption {
  id: string;
  name: string;
  roleTag: string;
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
      roleTag: 'SYSTEM MASTER CONTROL',
      defaultEmail: 'superadmin@adyapan.com',
      icon: Shield,
    },
    {
      id: 'hr',
      name: 'HR Portal',
      roleTag: 'TALENT & OPERATIONS',
      defaultEmail: 'nandini@adyapan.com',
      icon: Briefcase,
    },
    {
      id: 'finance',
      name: 'Finance Portal',
      roleTag: 'PAYROLL & AUDIT',
      defaultEmail: 'finance@adyapan.com',
      icon: CreditCard,
    },
  ];

  const hrAccountPills = [
    { name: 'Nandini (HR Manager)', email: 'nandini@adyapan.com' },
    { name: 'Charitha (Payroll)', email: 'charitha@adyapan.com' },
    { name: 'Aravind (Exit/Resignation)', email: 'aravind@adyapan.com' },
    { name: 'Veena (Onboarding)', email: 'veena@adyapan.com' },
    { name: 'Nitisha (POSH/Discipline)', email: 'nitisha@adyapan.com' },
    { name: 'Pavitra (Attendance/Leave)', email: 'pavitra@adyapan.com' },
  ];

  const [activePortal, setActivePortal] = useState<PortalOption>(portals[1]); // HR Portal by default
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

  const ActiveIcon = activePortal.icon;

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden font-sans">
      {/* Background Glowing Lights */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-orange-500/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/20 blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:32px_32px] opacity-40 pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 border border-slate-200">
        
        {/* Left Panel: Deep Saffron Glass Hero */}
        <div className="lg:col-span-5 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
          
          {/* Ambient Lighting */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-black/10 blur-3xl pointer-events-none" />

          {/* Top Brand Pill */}
          <div className="relative z-10 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-black tracking-widest text-orange-100 uppercase">
              Adyapan Edutech Pvt. Ltd.
            </span>
          </div>

          {/* Center Brand Identity */}
          <div className="relative z-10 my-8 space-y-6">
            <div className="w-24 h-24 relative drop-shadow-2xl hover:scale-105 transition-transform duration-300">
              <Image
                src="/adyapan_gloss_logo.png"
                alt="Adyapan Logo"
                fill
                className="object-contain"
                priority
              />
            </div>

            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-widest text-white uppercase drop-shadow-sm">
                ADYAPAN
              </h1>
              <p className="text-xs text-orange-100 mt-2 leading-relaxed font-medium">
                Enterprise Human Resource & Talent Management System
              </p>
            </div>

            {/* Glass Feature Chips */}
            <div className="space-y-2 pt-2">
              <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-xs flex items-center gap-3">
                <Zap className="w-4 h-4 text-amber-200 flex-shrink-0" />
                <span>Automated Payroll & Statutory Taxes</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-xs flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-orange-200 flex-shrink-0" />
                <span>AI ATS Resume Screening & Matching</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-xs flex items-center gap-3">
                <Shield className="w-4 h-4 text-emerald-200 flex-shrink-0" />
                <span>Role-Based Access Control (RBAC)</span>
              </div>
            </div>
          </div>

          {/* Bottom Version */}
          <div className="relative z-10 text-[10px] text-orange-200/90 font-bold uppercase tracking-wider">
            Protected Enterprise Portal v2.5
          </div>
        </div>

        {/* Right Panel: Ultra-Modern Portal Switcher & Login Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign In to Portal</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Select your authorization workspace below
                </p>
              </div>
            </div>

            {/* 1. SLEEK SEGMENTED PORTAL SWITCHER BAR */}
            <div className="p-1.5 rounded-2xl bg-slate-100 border border-slate-200 grid grid-cols-3 gap-1 mb-6">
              {portals.map((p) => {
                const Icon = p.icon;
                const isSelected = activePortal.id === p.id;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePortalSwitch(p)}
                    className={`py-3 px-2 rounded-xl text-xs font-extrabold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'saffron-gradient text-white shadow-md shadow-orange-500/30 scale-[1.02]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Role Indicator Badge */}
            <div className="p-3.5 rounded-2xl bg-orange-50/80 border border-orange-200 flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl saffron-gradient flex items-center justify-center text-white font-bold shadow-xs">
                  <ActiveIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">
                    {activePortal.name} Active
                  </div>
                  <div className="text-[10px] text-orange-600 font-bold tracking-wider uppercase">
                    {activePortal.roleTag}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white text-orange-600 border border-orange-200 text-[10px] font-extrabold shadow-2xs">
                READY
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 text-center font-medium">
                {error}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Corporate Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 text-xs text-slate-900 pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 transition-all font-medium shadow-2xs"
                    placeholder="name@adyapan.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 text-xs text-slate-900 pl-10 pr-10 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 transition-all font-medium shadow-2xs"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl saffron-gradient hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <span>{loading ? 'Authenticating Workspace...' : `Sign In to ${activePortal.name}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* QUICK HR SPECIALIST SELECTION CHIPS */}
            {activePortal.id === 'hr' && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Quick Switch HR Account:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {hrAccountPills.map((pill) => (
                    <button
                      key={pill.email}
                      type="button"
                      onClick={() => handleSelectHRPill(pill.email)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                        email === pill.email
                          ? 'saffron-gradient text-white border-orange-500 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300'
                      }`}
                    >
                      {pill.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Notice */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-1">
            <div className="text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1">
              <span>🔒 Encrypted TLS 1.3 Enterprise Security</span>
            </div>
            <div className="text-[10px] text-slate-400">
              © 2026 SR's Adyapan Edutech Pvt. Ltd. All rights reserved.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
