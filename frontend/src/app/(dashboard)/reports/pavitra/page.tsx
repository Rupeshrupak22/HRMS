'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function PavithraReportPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest('/reports/daily?userEmail=pavitra@adyapan.com');
        setReports(Array.isArray(data) ? data : []);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await apiRequest(`/reports/daily/${id}/approve`, { method: 'PUT' });
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'APPROVED' } : r));
    } catch (err: any) {
      alert(err.message || 'Failed');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiRequest(`/reports/daily/${id}/reject`, { method: 'PUT' });
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'REJECTED' } : r));
    } catch (err: any) {
      alert(err.message || 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl saffron-gradient text-white">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <span>Pavitra — Attendance & Leave Reports</span>
        </h1>
        <p className="text-xs text-orange-100 mt-1">
          Daily reports submitted by Pavitra (Attendance & Leave Specialist). Review and approve/reject.
        </p>
      </div>

      {loading ? (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-slate-400">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-slate-400">
          No reports submitted yet by Pavitra.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((rep) => (
            <div key={rep.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900">{rep.date}</span>
                  <span className="text-xs text-slate-500">{rep.employeeName}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  rep.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : rep.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {rep.status}
                </span>
              </div>

              {rep.keyUpdates && (
                <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {rep.keyUpdates}
                </div>
              )}

              {rep.status === 'SUBMITTED' && (
                <div className="flex gap-2 justify-end">
                  <button onClick={() => handleApprove(rep.id)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => handleReject(rep.id)} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
