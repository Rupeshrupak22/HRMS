'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp, ShieldAlert, Users, FileText,
  Send, AlertCircle,
} from 'lucide-react';
import { nitishaApi } from '@/lib/nitisha-api';

interface Stats {
  performanceTotal: number;
  pipCases: number;
  issuesTotal: number;
  disciplineOpen: number;
  relationsTotal: number;
}

export function NitishaDashboard() {
  const [stats, setStats] = useState<Stats>({
    performanceTotal: 0,
    pipCases: 0,
    issuesTotal: 0,
    disciplineOpen: 0,
    relationsTotal: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        const [performances, issues, discipline, relations] = await Promise.all([
          nitishaApi.getPerformances(),
          nitishaApi.getIssues(),
          nitishaApi.getDiscipline(),
          nitishaApi.getRelations(),
        ]);
        setStats({
          performanceTotal: performances.length,
          pipCases: performances.filter((r: any) => r.pipCase === 'Yes').length,
          issuesTotal: issues.length,
          disciplineOpen: discipline.filter((r: any) => r.status !== 'Closed').length,
          relationsTotal: relations.length,
        });
      } catch (e) {}
    }
    load();
  }, []);

  const cards = [
    { label: 'Performance Records', value: stats.performanceTotal, sub: 'Total tracked', icon: TrendingUp, color: 'amber', href: '/employee-performance' },
    { label: 'Employee Issues', value: stats.issuesTotal, sub: 'Logged issues', icon: AlertCircle, color: 'blue', href: '/employee-issues' },
    { label: 'PIP Cases', value: stats.pipCases, sub: 'Active PIPs', icon: AlertCircle, color: 'red', href: '/employee-performance' },
    { label: 'Open Discipline Cases', value: stats.disciplineOpen, sub: 'Require attention', icon: ShieldAlert, color: 'purple', href: '/discipline' },
    { label: 'Employee Relations', value: stats.relationsTotal, sub: 'Records maintained', icon: Users, color: 'emerald', href: '/relations' },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', iconBg: 'bg-amber-100' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', iconBg: 'bg-blue-100' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', iconBg: 'bg-red-100' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', iconBg: 'bg-purple-100' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <span>Nitisha — HR Discipline, POSH & Policy Compliance Office</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
              DISCIPLINE & POSH SPECIALIST
            </span>
          </h1>
          <p className="text-xs text-orange-100 mt-1">
            Employee performance tracking, issues management, PIP cases, discipline, and relations
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/daily-reports"
            className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer hover:bg-orange-50 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Daily Report</span>
          </Link>
          <Link
            href="/employee-issues"
            className="px-4 py-2 rounded-xl bg-black/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1.5 cursor-pointer hover:bg-white/10 transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Employee Issues Hub</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Performance', href: '/employee-performance', icon: TrendingUp, color: 'text-amber-600' },
            { label: 'Employee Issues', href: '/employee-issues', icon: AlertCircle, color: 'text-blue-600' },
            { label: 'Discipline', href: '/discipline', icon: ShieldAlert, color: 'text-purple-600' },
            { label: 'Relations', href: '/relations', icon: Users, color: 'text-emerald-600' },
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

      {/* Alert Row */}
      {stats.disciplineOpen > 0 && (
        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <div className="text-xs text-orange-800 font-semibold">
            {stats.disciplineOpen} open discipline case(s) require attention. <Link href="/discipline" className="underline font-bold">View now</Link>
          </div>
        </div>
      )}
    </div>
  );
}
