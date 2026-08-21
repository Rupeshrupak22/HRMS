'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, LogIn, User, Lock, AlertTriangle, Info } from 'lucide-react';
import { SessionConfirmationPopup } from '@/components/SessionConfirmationPopup';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, sessionConfirmation, user } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [logoutReason, setLogoutReason] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  // Show logout reason toast (force-logout, idle timeout, etc.)
  useEffect(() => {
    const reason = sessionStorage.getItem('adyapan_logout_reason');
    if (reason) {
      setLogoutReason(reason);
      sessionStorage.removeItem('adyapan_logout_reason');
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => setLogoutReason(''), 8000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(identifier, password);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please check your credentials.';
      if (msg === 'FORCE_LOGOUT') return; // handled by context
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 p-4 relative overflow-hidden">
      {/* Session Confirmation Popup */}
      <SessionConfirmationPopup />

      {/* Logout Reason Toast */}
      {logoutReason && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-amber-50 border border-amber-200 shadow-lg flex items-center gap-3 max-w-md">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800 font-medium">{logoutReason}</p>
          <button onClick={() => setLogoutReason('')} className="text-amber-500 hover:text-amber-700 ml-2 text-lg leading-none">&times;</button>
        </div>
      )}
      {/* Decorative Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large top-left circle */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-white/60 to-transparent shadow-[inset_8px_8px_16px_rgba(0,0,0,0.05),inset_-8px_-8px_16px_rgba(255,255,255,0.9)]" />
        {/* Large bottom-right circle */}
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-white/60 to-transparent shadow-[inset_8px_8px_16px_rgba(0,0,0,0.05),inset_-8px_-8px_16px_rgba(255,255,255,0.9)]" />
        {/* Medium circle */}
        <div className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full bg-gradient-to-br from-orange-50/40 to-transparent shadow-[4px_4px_8px_rgba(0,0,0,0.05),-4px_-4px_8px_rgba(255,255,255,0.8)]" />
        {/* Small accent circles */}
        <div className="absolute bottom-1/4 left-1/5 w-24 h-24 rounded-full bg-gradient-to-br from-orange-100/30 to-transparent shadow-[2px_2px_4px_rgba(0,0,0,0.04),-2px_-2px_4px_rgba(255,255,255,0.7)]" />
      </div>

      {/* Main Neumorphic Circle Container */}
      <div className="relative">
        {/* Outer Circle - Neumorphic with solid border */}
        <div className="w-[460px] h-[460px] sm:w-[540px] sm:h-[540px] rounded-full bg-gradient-to-br from-slate-100 to-gray-200 border-2 border-orange-400/60 shadow-[20px_20px_60px_#b8b8b8,-20px_-20px_60px_#ffffff,inset_2px_2px_4px_rgba(255,255,255,0.6)] flex items-center justify-center p-10">
          {/* Inner Content Area */}
          <div className="w-full max-w-[300px] flex flex-col items-center">
            {/* Logo */}
            <div className="mb-3">
              <img
                src="/icon-192x192.png"
                alt="Adyapan"
                className="w-14 h-14 rounded-2xl shadow-md shadow-orange-500/20"
              />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-black text-slate-800 tracking-wide mb-0.5">
              Login
            </h1>
            <p className="text-xs text-slate-500 mb-5">Sign in to your account</p>

            {/* Error Message */}
            {error && (
              <div className="w-full mb-3 p-2 rounded-lg bg-red-50 border border-red-200 text-[10px] text-red-600 text-center font-medium">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-3">
              {/* Username/Email Field */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.08),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] focus:shadow-[inset_3px_3px_6px_rgba(234,88,12,0.1),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] focus:outline-none text-xs text-slate-700 placeholder-slate-400 font-medium transition-all"
                  placeholder="Username"
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-100 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.08),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] focus:shadow-[inset_3px_3px_6px_rgba(234,88,12,0.1),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] focus:outline-none text-xs text-slate-700 placeholder-slate-400 font-medium transition-all"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-[11px] text-slate-500 cursor-pointer select-none">
                  Remember me
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-slate-200 shadow-[5px_5px_10px_#b8b8b8,-5px_-5px_10px_#ffffff] hover:shadow-[2px_2px_5px_#b8b8b8,-2px_-2px_5px_#ffffff] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.1),inset_-3px_-3px_6px_rgba(255,255,255,0.7)] text-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                <span>{loading ? 'SIGNING IN...' : 'SIGN IN'}</span>
              </button>
            </form>


          </div>
        </div>
      </div>
    </div>
  );
}
