'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Calendar, BarChart3, Eye, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';

export default function HRManagerReportPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const canView = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN' || user?.specialization === 'HR_MANAGER_ALL' || user?.email === 'superadmin@adyapan.com' || user?.email === 'nandini@adyapan.com' || user?.email === 'nandani@adyapan.com';

  useEffect(() => {
    apiRequest('/overall-report')
      .catch(() => fetch('http://localhost:4000/api/v1/overall-report').then(res => res.json()))
      .then((data) => { setReports(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (!canView) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-red-600 font-bold">Access Denied. Only Super Admin can view this page.</p>
      </div>
    );
  }

  const filteredReports = filterDate
    ? reports.filter((r) => r.reportDate === filterDate)
    : reports;

  if (loading) return <div className="p-10 text-center text-slate-400 text-sm">Loading HR Manager reports...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            <span>HR Manager Report</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reports submitted by Biradar Nandini (HR Manager) for admin review
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
            <Calendar className="w-4 h-4 text-orange-500" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="text-sm font-semibold text-slate-700 border-none outline-none bg-transparent cursor-pointer"
            />
          </div>
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="px-3 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 text-xs">
          No reports found for {filterDate ? `date ${filterDate}` : 'the selected criteria'}.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((r) => (
            <div key={r.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-sm font-extrabold text-slate-900">{r.submittedBy}</span>
                  <span className="text-xs text-slate-400 ml-3">Date: <strong className="text-slate-700">{r.reportDate}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                    {r.status || 'SUBMITTED'}
                  </span>
                  <button
                    onClick={() => setSelectedReport(r)}
                    className="px-3 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" /> Full Report Preview
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-bold">Total Records</div>
                  <div className="text-lg font-black text-slate-900">{r.totalRecords}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-bold">Daily Reports</div>
                  <div className="text-lg font-black text-emerald-600">{r.totalDailyReports}</div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 py-2 border-b border-slate-100">
                  <span className="text-orange-600 font-bold w-32">Aravind:</span>
                  <span className="text-slate-700">{r.aravindSummary}</span>
                </div>
                <div className="flex items-center gap-2 py-2 border-b border-slate-100">
                  <span className="text-orange-600 font-bold w-32">Nitisha:</span>
                  <span className="text-slate-700">{r.nitishaSummary}</span>
                </div>
                <div className="flex items-center gap-2 py-2 border-b border-slate-100">
                  <span className="text-orange-600 font-bold w-32">Veena:</span>
                  <span className="text-slate-700">{r.veenaSummary}</span>
                </div>
                <div className="flex items-center gap-2 py-2 border-b border-slate-100">
                  <span className="text-orange-600 font-bold w-32">Charitha:</span>
                  <span className="text-slate-700">{r.charithaSummary}</span>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <span className="text-orange-600 font-bold w-32">Pavitra:</span>
                  <span className="text-slate-700">{r.pavitraSummary}</span>
                </div>
              </div>

              {r.remarks && r.remarks !== 'No additional remarks' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                  <span className="font-bold text-amber-700">Remarks:</span> <span className="text-amber-800">{r.remarks}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Admin Overall Report Full Preview Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 text-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between saffron-gradient text-white">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-black">Overall HR Department Report Preview</h3>
                  <p className="text-[10px] text-orange-100">{selectedReport.submittedBy} — {selectedReport.reportDate}</p>
                </div>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Records Created</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{selectedReport.totalRecords}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Daily Reports Submitted</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">{selectedReport.totalDailyReports}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2">Specialist Breakdown Summaries</h4>
                
                <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-200 space-y-1">
                  <div className="font-bold text-orange-700">Aravind Madhesh Kumar (Exit & Resignation)</div>
                  <div className="text-slate-800 font-medium whitespace-pre-wrap">{selectedReport.aravindSummary}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200 space-y-1">
                  <div className="font-bold text-purple-700">Nitisha (Discipline & POSH)</div>
                  <div className="text-slate-800 font-medium whitespace-pre-wrap">{selectedReport.nitishaSummary}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1">
                  <div className="font-bold text-blue-700">Abbu Veena (Onboarding & Hiring)</div>
                  <div className="text-slate-800 font-medium whitespace-pre-wrap">{selectedReport.veenaSummary}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1">
                  <div className="font-bold text-emerald-700">Charitha (Salary & Payroll)</div>
                  <div className="text-slate-800 font-medium whitespace-pre-wrap">{selectedReport.charithaSummary}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1">
                  <div className="font-bold text-amber-700">Pavitra (Attendance & Leave)</div>
                  <div className="text-slate-800 font-medium whitespace-pre-wrap">{selectedReport.pavitraSummary}</div>
                </div>
              </div>

              {selectedReport.remarks && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">HR Manager Remarks</h4>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 whitespace-pre-wrap font-medium">
                    {selectedReport.remarks}
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
