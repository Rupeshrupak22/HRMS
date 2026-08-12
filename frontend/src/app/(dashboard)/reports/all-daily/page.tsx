'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClipboardList, FileText, Eye, X } from 'lucide-react';
import { aravindApi } from '@/lib/aravind-api';
import { nitishaApi } from '@/lib/nitisha-api';
import { veenaApi } from '@/lib/veena-api';
import { apiRequest } from '@/lib/api';

export default function AllDailyReportsPage() {
  const [aravindReports, setAravindReports] = useState<any[]>([]);
  const [nitishaReports, setNitishaReports] = useState<any[]>([]);
  const [veenaReports, setVeenaReports] = useState<any[]>([]);
  const [pavitraReports, setPavitraReports] = useState<any[]>([]);
  const [charithaReports, setCharithaReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  useEffect(() => {
    aravindApi.getDailyReports().then(setAravindReports).catch(() => {});
    nitishaApi.getDailyReports().then(setNitishaReports).catch(() => {});
    veenaApi.getDailyReports().then(setVeenaReports).catch(() => {});

    apiRequest('/reports/daily')
      .then((d) => {
        const arr = Array.isArray(d) ? d : [];
        setPavitraReports(arr.filter((r: any) => r.userEmail === 'pavitra@adyapan.com' || r.specialization === 'ATTENDANCE_LEAVE'));
        setCharithaReports(arr.filter((r: any) => r.userEmail === 'charitha@adyapan.com' || r.specialization === 'SALARY_PAYROLL'));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-orange-500" />
          <span>All Daily Reports Hub</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Combined live view of all 5 HR specialists&apos; daily reports — Aravind, Nitisha, Veena, Charitha, Pavitra
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { name: 'Aravind', count: aravindReports.length, href: '/reports/aravind', role: 'Exit & Resignation' },
          { name: 'Nitisha', count: nitishaReports.length, href: '/reports/nitisha', role: 'Discipline & POSH' },
          { name: 'Pavitra', count: pavitraReports.length, href: '/reports/pavitra', role: 'Attendance & Leave' },
          { name: 'Charitha', count: charithaReports.length, href: '/reports/charitha', role: 'Payroll & Salary' },
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

      {/* Recent Submissions */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Recent Submissions (Click any row to preview full)</h3>
        <div className="space-y-2">
          {pavitraReports.map((r) => (
            <div key={r.id} onClick={() => setSelectedReport({ ...r, specialistName: 'Pavitra (Attendance & Leave)' })}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:bg-orange-50/40 cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-slate-800">Pavitra</span>
                <span className="text-slate-500 ml-2 font-mono">{r.date || r.createdAt?.split('T')[0]}</span>
                <span className="text-slate-700 ml-3 truncate max-w-[400px] inline-block align-bottom font-medium">{r.keyUpdates || r.tasksCompleted}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                  {r.status || 'SUBMITTED'}
                </span>
                <button className="p-1 text-slate-400 hover:text-slate-700">
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {charithaReports.map((r) => (
            <div key={r.id} onClick={() => setSelectedReport({ ...r, specialistName: 'Charitha (Salary & Payroll)' })}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:bg-orange-50/40 cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-slate-800">Charitha</span>
                <span className="text-slate-500 ml-2 font-mono">{r.date || r.createdAt?.split('T')[0]}</span>
                <span className="text-slate-700 ml-3 truncate max-w-[400px] inline-block align-bottom font-medium">{r.keyUpdates || r.tasksCompleted}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                  {r.status || 'SUBMITTED'}
                </span>
                <button className="p-1 text-slate-400 hover:text-slate-700">
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {aravindReports.map((r) => (
            <div key={r.id} onClick={() => setSelectedReport({ ...r, specialistName: 'Aravind Madhesh Kumar', keyUpdates: r.keyActions })}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:bg-orange-50/40 cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-slate-800">Aravind</span>
                <span className="text-slate-500 ml-2 font-mono">{r.reportDate}</span>
                <span className="text-slate-700 ml-3 truncate max-w-[400px] inline-block align-bottom font-medium">{r.keyActions}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                  SUBMITTED
                </span>
                <button className="p-1 text-slate-400 hover:text-slate-700">
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {nitishaReports.map((r) => (
            <div key={r.id} onClick={() => setSelectedReport({ ...r, specialistName: 'Nitisha', keyUpdates: r.employeeIssue })}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:bg-orange-50/40 cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-slate-800">Nitisha</span>
                <span className="text-slate-500 ml-2">{r.employeeName}</span>
                <span className="text-slate-700 ml-3 truncate max-w-[400px] inline-block align-bottom font-medium">{r.employeeIssue}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                  SUBMITTED
                </span>
                <button className="p-1 text-slate-400 hover:text-slate-700">
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {veenaReports.map((r) => (
            <div key={r.id} onClick={() => setSelectedReport({ ...r, specialistName: 'Abbu Veena', keyUpdates: `Role: ${r.role} — Candidate Sourced: ${r.candidateSourced}, Screening: ${r.screeningDone}, Selected: ${r.selected}` })}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:bg-orange-50/40 cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-slate-800">Veena</span>
                <span className="text-slate-500 ml-2 font-mono">{r.date}</span>
                <span className="text-slate-700 ml-3 truncate max-w-[400px] inline-block align-bottom font-medium">{r.role} — Sourced: {r.candidateSourced}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                  SUBMITTED
                </span>
                <button className="p-1 text-slate-400 hover:text-slate-700">
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {aravindReports.length === 0 && nitishaReports.length === 0 && veenaReports.length === 0 && pavitraReports.length === 0 && charithaReports.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No daily reports submitted yet</p>
          )}
        </div>
      </div>

      {/* Full Preview Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 text-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between saffron-gradient text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-black">Daily Report Full Preview</h3>
                  <p className="text-[10px] text-orange-100">{selectedReport.specialistName || selectedReport.employeeName} — {selectedReport.date || selectedReport.reportDate || selectedReport.createdAt?.split('T')[0]}</p>
                </div>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Complete Key Updates & Work Summary</label>
                <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                  {selectedReport.keyUpdates || selectedReport.keyActions || selectedReport.employeeIssue || selectedReport.tasksCompleted || 'No key updates provided.'}
                </div>
              </div>
              {selectedReport.blockers && (
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Blockers / Issues</label>
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-800 font-medium whitespace-pre-wrap">
                    {selectedReport.blockers}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setSelectedReport(null)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
