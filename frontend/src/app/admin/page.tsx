'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, LogIn, Shield, User, Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, loading } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(identifier, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-amber-200/30 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-orange-300/20 rounded-full blur-2xl animate-pulse-glow" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-orange-500/10 p-8 sm:p-10 border border-orange-100/50">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 saffron-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25">
            <Shield className="w-9 h-9 text-white" />
          </div>
        </div>

        {/* Brand Name */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-wide">ADYAPAN</h1>
          <p className="text-xs font-bold text-orange-600 tracking-widest uppercase mt-1">
            Admin Panel
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-center text-sm text-slate-500 mb-8">
          Super Admin access only
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 text-center font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Admin Email Field */}
          <div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-orange-300 focus:border-orange-500 focus:outline-none text-xs text-slate-800 placeholder-slate-400 bg-white font-medium transition-colors"
                placeholder="ADMIN EMAIL"
              />
              <label className="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                Admin Email
              </label>
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-4 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:outline-none text-xs text-slate-800 placeholder-slate-400 bg-white font-medium transition-colors"
                placeholder="PASSWORD"
              />
              <label className="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl saffron-gradient hover:opacity-90 text-white font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'SIGNING IN...' : 'ADMIN LOGIN'}</span>
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-6 font-medium">
          © 2026 Adyapan Edutech Pvt. Ltd. All rights reserved.
        </p>
      </div>
    </div>
  );
}
