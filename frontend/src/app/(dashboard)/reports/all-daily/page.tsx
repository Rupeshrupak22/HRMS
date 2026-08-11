'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { aravindApi } from '@/lib/aravind-api';
import { nitishaApi } from '@/lib/nitisha-api';
import { veenaApi } from '@/lib/veena-api';

export default function AllDailyReportsPage() {
  const [aravindReports, setAravindReports] = useState<any[]>([]);
  const [nitishaReports, setNitishaReports] = useState<any[]>([]);
  const [veenaReports, setVeenaReports] = useState<any[]>([]);

  useEffect(() => {
    aravindApi.getDailyReports().then(setAravindReports).catch(() => {});
    nitishaApi.getDailyReports().then(setNitishaReports).catch(() => {});
    veenaApi.getDailyReports().then(setVeenaReports).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-orange-500" />
          <span>All Daily Reports</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Combined view of all HR specialists&apos; daily reports
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { name: 'Aravind', count: aravindReports.length, href: '/reports/aravind', role: 'Exit & Resignation' },
          { name: 'Nitisha', count: nitishaReports.length, href: '/reports/nitisha', role: 'Discipline & POSH' },
          { name: 'Pavitra', count: 0, href: '/reports/pavitra', role: 'Attendance & Leave' },
          { name: 'Charitha', count: 0, href: '/reports/charitha', role: 'Payroll & Salary' },
          { name: 'Veena', count: veenaReports.length, href: '/reports/veena', role: 'Onboarding & Hiring' },
        ].map((s) => (
          <Link key={s.name} href={s.href}
            className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-xs text-slate-500 font-semibold">{s.name}</div>
            <div className="text-2xl font-black text-orange-600 mt-1">{s.count}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{s.role}</div>
          </Link>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Recent Submissions</h3>
        <div className="space-y-2">
          {aravindReports.slice(0, 3).map((r) => (
            <div key={r.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800">Aravind</span>
                <span className="text-slate-500 ml-2">{r.reportDate}</span>
                <span className="text-slate-500 ml-2 truncate max-w-[300px] inline-block align-bottom">{r.keyActions}</span>
              </div>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">Submitted</span>
            </div>
          ))}
          {nitishaReports.slice(0, 3).map((r) => (
            <div key={r.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800">Nitisha</span>
                <span className="text-slate-500 ml-2">{r.employeeName}</span>
                <span className="text-slate-500 ml-2">{r.disciplineCases}</span>
              </div>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">Submitted</span>
            </div>
          ))}
          {veenaReports.slice(0, 3).map((r) => (
            <div key={r.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800">Veena</span>
                <span className="text-slate-500 ml-2">{r.date}</span>
                <span className="text-slate-500 ml-2">{r.role} - Sourced: {r.candidateSourced}</span>
              </div>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">Submitted</span>
            </div>
          ))}
          {aravindReports.length === 0 && nitishaReports.length === 0 && veenaReports.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No daily reports submitted yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
