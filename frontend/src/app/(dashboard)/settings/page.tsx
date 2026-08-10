'use client';

import React from 'react';
import { Settings, Building, ShieldCheck, Bell, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <span>Organization & Admin Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure company policies, RBAC roles, integrations & AI settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Building className="w-4 h-4 text-blue-400" /> Organization Info
          </div>
          <div className="space-y-2 text-slate-300">
            <div>Company Name: <strong className="text-white">Adyapan Edutech Pvt. Ltd.</strong></div>
            <div>Support Email: <strong className="text-white">hr@adyapan.com</strong></div>
            <div>Currency: <strong className="text-white">INR (₹)</strong></div>
            <div>Timezone: <strong className="text-white">Asia/Kolkata (IST)</strong></div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Security & Policy
          </div>
          <div className="space-y-2 text-slate-300">
            <div>JWT Token Rotation: <span className="text-emerald-400 font-bold">ACTIVE (7 Days Expiry)</span></div>
            <div>2FA / MFA Support: <span className="text-emerald-400 font-bold">ENABLED</span></div>
            <div>Password Lockout: <span className="text-emerald-400 font-bold">5 Failed Attempts</span></div>
            <div>AWS S3 Presigned URLs: <span className="text-emerald-400 font-bold">ENABLED (1 Hr Expiry)</span></div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Sparkles className="w-4 h-4 text-violet-400" /> HR AI Copilot & ATS Settings
          </div>
          <div className="space-y-2 text-slate-300">
            <div>LLM Engine: <strong className="text-white">Gemini 2.5 Flash SDK</strong></div>
            <div>ATS Resume Screening: <strong className="text-white">Automated Match Scoring</strong></div>
            <div>RBAC Data Protection: <strong className="text-emerald-400">Strict Salary Masking</strong></div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Bell className="w-4 h-4 text-amber-400" /> Notifications & Integrations
          </div>
          <div className="space-y-2 text-slate-300">
            <div>Adyapan LMS Integration: <span className="text-blue-400 font-bold">CONNECTED</span></div>
            <div>Email Gateway: <span className="text-blue-400 font-bold">SMTP Active</span></div>
            <div>WhatsApp Alerts: <span className="text-slate-400">Ready</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
