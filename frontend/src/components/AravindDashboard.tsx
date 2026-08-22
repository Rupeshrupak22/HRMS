'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert, UserX, LogOut, CreditCard,
  MessageSquareWarning, ClipboardList, FileText,
  Send, TrendingUp, AlertCircle, UserMinus,
} from 'lucide-react';
import { aravindApi } from '@/lib/aravind-api';

interface Stats {
  retentionTotal: number;
  retentionOpen: number;
  retentionRetained: number;
  resignationTotal: number;
  resignationPending: number;
  abscondTotal: number;
  abscondPending: number;
  exitTotal: number;
  exitPending: number;
  fnfTotal: number;
  fnfPending: number;
  complaintsTotal: number;
  complaintsOpen: number;
  interviewsTotal: number;
  reportsTotal: number;
}

export function AravindDashboard() {
  const [stats, setStats] = useState<Stats>({
    retentionTotal: 0, retentionOpen: 0, retentionRetained: 0,
    resignationTotal: 0, resignationPending: 0,
    abscondTotal: 0, abscondPending: 0,
    exitTotal: 0, exitPending: 0,
    fnfTotal: 0, fnfPending: 0,
    complaintsTotal: 0, complaintsOpen: 0,
    interviewsTotal: 0, reportsTotal: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        const statsData = await aravindApi.getStats().catch(() => null);
        if (statsData) {
          setStats({
            retentionTotal: statsData.retentionTotal ?? 0,
            retentionOpen: statsData.retentionOpen ?? 0,
            retentionRetained: statsData.retentionRetained ?? 0,
            resignationTotal: statsData.resignationTotal ?? 0,
            resignationPending: statsData.resignationPending ?? 0,
            abscondTotal: statsData.abscondTotal ?? 0,
            abscondPending: statsData.abscondPending ?? 0,
            exitTotal: statsData.exitTotal ?? 0,
            exitPending: statsData.exitPending ?? 0,
            fnfTotal: statsData.fnfTotal ?? 0,
            fnfPending: statsData.fnfPending ?? 0,
            complaintsTotal: statsData.complaintsTotal ?? 0,
            complaintsOpen: statsData.complaintsOpen ?? 0,
            interviewsTotal: statsData.interviewsTotal ?? 0,
            reportsTotal: statsData.reportsTotal ?? 0,
          });
        } else {
          const [retention, resignation, abscond, exit, fnf, complaints, interviews, reports] = await Promise.all([
            aravindApi.getRetention().catch(() => []),
            aravindApi.getResignation().catch(() => []),
            aravindApi.getAbscond().catch(() => []),
            aravindApi.getExitClearance().catch(() => []),
            aravindApi.getFnF().catch(() => []),
            aravindApi.getComplaints().catch(() => []),
            aravindApi.getExitInterview().catch(() => []),
            aravindApi.getDailyReports().catch(() => []),
          ]);

          setStats({
            retentionTotal: retention.length,
            retentionOpen: retention.filter((r: any) => r.status !== 'Closed').length,
            retentionRetained: retention.filter((r: any) => r.retentionOutcome === 'Retained').length,
            resignationTotal: resignation.length,
            resignationPending: resignation.filter((r: any) => r.overall !== 'Completed').length,
            abscondTotal: abscond.length,
            abscondPending: abscond.length,
            exitTotal: exit.length,
            exitPending: exit.filter((r: any) => r.overallClearance !== 'Completed').length,
            fnfTotal: fnf.length,
            fnfPending: fnf.filter((r: any) => r.paymentStatus !== 'Processed' && r.paymentStatus !== 'COMPLETED').length,
            complaintsTotal: complaints.length,
            complaintsOpen: complaints.filter((r: any) => r.status === 'Open' || r.status === 'Under Investigation').length,
            interviewsTotal: interviews.length,
            reportsTotal: reports.length,
          });
        }
      } catch (e) {}
    }
    load();
  }, []);

  const cards = [
    { label: 'Retention Cases', value: stats.retentionTotal, sub: `${stats.retentionOpen} Open · ${stats.retentionRetained} Retained`, icon: ShieldAlert, color: 'amber', href: '/retention' },
    { label: 'Active Resignations', value: stats.resignationTotal, sub: `${stats.resignationPending} In Progress`, icon: UserX, color: 'red', href: '/resignation' },
    { label: 'Abscond Cases', value: stats.abscondTotal, sub: `${stats.abscondTotal} Recorded Cases`, icon: UserMinus, color: 'rose', href: '/abscond' },
    { label: 'Exit Clearances', value: stats.exitTotal, sub: `${stats.exitPending} Pending`, icon: LogOut, color: 'blue', href: '/exit' },
    { label: 'F&F Settlements', value: stats.fnfTotal, sub: `${stats.fnfPending} Payment Pending`, icon: CreditCard, color: 'emerald', href: '/fnf' },
    { label: 'Employee Complaints', value: stats.complaintsTotal, sub: `${stats.complaintsOpen} Open`, icon: MessageSquareWarning, color: 'purple', href: '/employee-complaints' },
    { label: 'Exit Interviews', value: stats.interviewsTotal, sub: 'Feedback Recorded', icon: ClipboardList, color: 'sky', href: '/exit-interview' },
    { label: 'Daily Reports', value: stats.reportsTotal, sub: 'Reports Submitted', icon: FileText, color: 'slate', href: '/daily-reports' },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', iconBg: 'bg-amber-100' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', iconBg: 'bg-red-100' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', iconBg: 'bg-rose-100' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', iconBg: 'bg-blue-100' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', iconBg: 'bg-purple-100' },
    sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-600', iconBg: 'bg-sky-100' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', iconBg: 'bg-slate-100' },
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <span>Aravind — HR Resignations & Exit Clearances System</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
              EXIT SPECIALIST
            </span>
          </h1>
          <p className="text-xs text-orange-100 mt-1">
            Notice period tracking, abscond management, exit interview reviews, department no-dues & Full & Final (F&F) settlement
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/abscond" className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md">
            Abscond Tracker
          </Link>
          <Link href="/exit" className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs border border-white/30">
            Process Exit Form
          </Link>
          <Link href="/daily-reports" className="px-4 py-2 rounded-xl bg-black/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1">
            <Send className="w-3.5 h-3.5" /> Submit Daily Report
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const c = colorMap[card.color];
          return (
            <Link key={card.label} href={card.href}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="text-xs text-slate-500 font-semibold">{card.label}</div>
                <div className={`text-2xl font-black mt-1 ${c.text}`}>{card.value}</div>
                <div className="text-[10px] text-slate-500 mt-1">{card.sub}</div>
              </div>
              <div className={`w-11 h-11 rounded-2xl ${c.iconBg} border ${c.border} flex items-center justify-center ${c.text}`}>
                <Icon className="w-5 h-5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Retention', href: '/retention', icon: ShieldAlert, color: 'text-amber-600' },
            { label: 'Resignation', href: '/resignation', icon: UserX, color: 'text-red-600' },
            { label: 'Abscond', href: '/abscond', icon: UserMinus, color: 'text-rose-600' },
            { label: 'Exit', href: '/exit', icon: LogOut, color: 'text-blue-600' },
            { label: 'F&F', href: '/fnf', icon: CreditCard, color: 'text-emerald-600' },
            { label: 'Complaints', href: '/employee-complaints', icon: MessageSquareWarning, color: 'text-purple-600' },
            { label: 'Exit Interview', href: '/exit-interview', icon: ClipboardList, color: 'text-sky-600' },
            { label: 'Daily Reports', href: '/daily-reports', icon: FileText, color: 'text-slate-600' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-orange-50 transition-colors text-center">
                <Icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-[10px] font-semibold text-slate-700">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Summary Row */}
      {stats.complaintsOpen > 0 && (
        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <div className="text-xs text-orange-800 font-semibold">
            {stats.complaintsOpen} open complaint(s) require attention. <Link href="/employee-complaints" className="underline font-bold">View now</Link>
          </div>
        </div>
      )}
    </div>
  );
}
