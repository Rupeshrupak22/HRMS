'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Calendar, BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';

export default function HRManagerReportPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);

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
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
              className="text-sm font-semibold text-slate-700 border-none outline-none bg-transparent cursor-pointer" />
          </div>
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="px-3 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer">
              Clear
            </button>
          )}
        </div>
      </div>

      {filterDate && (
        <div className="px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-700">
          Showing reports for: {filterDate}
        </div>
      )}

      {filteredReports.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-white border border-slate-200">
          <p className="text-sm text-slate-400">No reports submitted {filterDate ? `for ${filterDate}` : 'yet'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((r) => (
            <div key={r.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-slate-900">Report Date: {r.reportDate}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Submitted by: {r.submittedBy}</div>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded">{r.status}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
    </div>
  );
}
