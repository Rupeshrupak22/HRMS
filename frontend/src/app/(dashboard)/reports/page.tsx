'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Users, ShieldAlert, UserPlus, FileText, TrendingUp, Calendar } from 'lucide-react';
import { aravindApi } from '@/lib/aravind-api';
import { nitishaApi } from '@/lib/nitisha-api';
import { veenaApi } from '@/lib/veena-api';
import { useAuth } from '@/context/AuthContext';

export default function OverallReportPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>({
    aravind: { retention: 0, resignation: 0, exit: 0, fnf: 0, complaints: 0, interviews: 0, dailyReports: 0 },
    nitisha: { performance: 0, pipCases: 0, discipline: 0, relations: 0, dailyReports: 0 },
    veena: { onboarding: 0, dropouts: 0, active: 0, joined: 0, dailyReports: 0 },
  });
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittedReports, setSubmittedReports] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [remarks, setRemarks] = useState('');

  // Only allow HR_ADMIN/SUPER_ADMIN/Nandini to view
  const canView = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN' || user?.specialization === 'HR_MANAGER_ALL' || user?.email === 'superadmin@adyapan.com' || user?.email === 'nandini@adyapan.com' || user?.email === 'nandani@adyapan.com';

  useEffect(() => {
    async function load() {
      try {
        const [ret, res, ex, fnf, comp, intv, aDr,
               perf, disc, rel, nDr,
               onb, drop, vDr] = await Promise.all([
          aravindApi.getRetention(),
          aravindApi.getResignation(),
          aravindApi.getExitClearance(),
          aravindApi.getFnF(),
          aravindApi.getComplaints(),
          aravindApi.getExitInterview(),
          aravindApi.getDailyReports(),
          nitishaApi.getPerformances(),
          nitishaApi.getDiscipline(),
          nitishaApi.getRelations(),
          nitishaApi.getDailyReports(),
          veenaApi.getOnboarding(),
          veenaApi.getDropouts(),
          veenaApi.getDailyReports(),
        ]);
        setData({
          aravind: { retention: ret.length, resignation: res.length, exit: ex.length, fnf: fnf.length, complaints: comp.length, interviews: intv.length, dailyReports: aDr.length },
          nitisha: { performance: perf.length, pipCases: perf.filter((r: any) => r.pipCase === 'Yes').length, discipline: disc.length, relations: rel.length, dailyReports: nDr.length },
          veena: { onboarding: onb.length, dropouts: drop.length, active: onb.filter((r: any) => r.status === 'Active').length, joined: onb.filter((r: any) => r.status === 'Joined').length, dailyReports: vDr.length },
        });
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    fetch('http://localhost:4000/api/v1/overall-report')
      .then(res => res.json())
      .then(setSubmittedReports)
      .catch(() => {});
  }, []);

  if (!canView) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-red-600 font-bold">Access Denied. Only HR Manager and Super Admin can view this report.</p>
      </div>
    );
  }

  if (loading) return <div className="p-10 text-center text-slate-400 text-sm">Loading overall report...</div>;

  const totalReports = data.aravind.dailyReports + data.nitisha.dailyReports + data.veena.dailyReports;
  const totalRecords = data.aravind.retention + data.aravind.resignation + data.aravind.exit + data.aravind.fnf + data.aravind.complaints + data.aravind.interviews + data.nitisha.performance + data.nitisha.discipline + data.nitisha.relations + data.veena.onboarding + data.veena.dropouts;

  const handleSubmitToAdmin = async () => {
    if (!filterDate) { alert('Please select a report date'); return; }
    setSubmitting(true);
    try {
      const report = {
        submittedBy: 'Biradar Nandini (HR Manager)',
        reportDate: filterDate,
        totalRecords,
        totalDailyReports: totalReports,
        aravindSummary: `Retention:${data.aravind.retention} Resignation:${data.aravind.resignation} Exit:${data.aravind.exit} F&F:${data.aravind.fnf} Complaints:${data.aravind.complaints}`,
        nitishaSummary: `Performance:${data.nitisha.performance} PIP:${data.nitisha.pipCases} Discipline:${data.nitisha.discipline} Relations:${data.nitisha.relations}`,
        veenaSummary: `Onboarding:${data.veena.onboarding} Active:${data.veena.active} Joined:${data.veena.joined} Dropouts:${data.veena.dropouts}`,
        charithaSummary: 'Portal pending',
        pavitraSummary: 'Portal pending',
        remarks: remarks || 'No additional remarks',
        status: 'SUBMITTED',
      };
      const res = await fetch('http://localhost:4000/api/v1/overall-report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report),
      });
      const saved = await res.json();
      setSubmittedReports([saved, ...submittedReports]);
      setRemarks('');
      alert('Report submitted to Admin successfully!');
    } catch { alert('Failed to submit report'); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          <span>Overall HR Department Report</span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
            FOR ADMIN REVIEW
          </span>
        </h1>
        <p className="text-xs text-orange-100 mt-1">
          Combined performance summary of all HR specialists — Aravind, Nitisha, Veena, Charitha, Pavitra
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Total Records Created</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalRecords}</div>
          <div className="text-[10px] text-slate-500 mt-1">Across all modules</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Daily Reports Submitted</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{totalReports}</div>
          <div className="text-[10px] text-slate-500 mt-1">All specialists combined</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Active Specialists</div>
          <div className="text-2xl font-black text-orange-600 mt-1">5</div>
          <div className="text-[10px] text-slate-500 mt-1">Operational HR team</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">New Candidates</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{data.veena.onboarding}</div>
          <div className="text-[10px] text-slate-500 mt-1">In recruitment pipeline</div>
        </div>
      </div>

      {/* Specialist-wise Breakdown */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Specialist-wise Performance Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-bold text-slate-600">Specialist</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Domain</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Key Metrics</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Daily Reports</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 hover:bg-orange-50/30">
                <td className="px-4 py-3 font-bold text-slate-800">Aravind Madhesh Kumar</td>
                <td className="px-4 py-3 text-orange-600 font-semibold">Exit & Resignation</td>
                <td className="px-4 py-3 text-slate-700">
                  Retention: {data.aravind.retention} | Resignation: {data.aravind.resignation} | Exit: {data.aravind.exit} | F&F: {data.aravind.fnf} | Complaints: {data.aravind.complaints}
                </td>
                <td className="px-4 py-3 font-bold text-slate-800">{data.aravind.dailyReports}</td>
                <td className="px-4 py-3"><span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded">ACTIVE</span></td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-orange-50/30">
                <td className="px-4 py-3 font-bold text-slate-800">Nitisha</td>
                <td className="px-4 py-3 text-orange-600 font-semibold">Discipline & POSH</td>
                <td className="px-4 py-3 text-slate-700">
                  Performance: {data.nitisha.performance} | PIP: {data.nitisha.pipCases} | Discipline: {data.nitisha.discipline} | Relations: {data.nitisha.relations}
                </td>
                <td className="px-4 py-3 font-bold text-slate-800">{data.nitisha.dailyReports}</td>
                <td className="px-4 py-3"><span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded">ACTIVE</span></td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-orange-50/30">
                <td className="px-4 py-3 font-bold text-slate-800">Abbu Veena</td>
                <td className="px-4 py-3 text-orange-600 font-semibold">Onboarding & Hiring</td>
                <td className="px-4 py-3 text-slate-700">
                  Onboarding: {data.veena.onboarding} | Active: {data.veena.active} | Joined: {data.veena.joined} | Dropouts: {data.veena.dropouts}
                </td>
                <td className="px-4 py-3 font-bold text-slate-800">{data.veena.dailyReports}</td>
                <td className="px-4 py-3"><span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded">ACTIVE</span></td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-orange-50/30">
                <td className="px-4 py-3 font-bold text-slate-800">Charitha</td>
                <td className="px-4 py-3 text-orange-600 font-semibold">Salary & Payroll</td>
                <td className="px-4 py-3 text-slate-500">Portal pending setup</td>
                <td className="px-4 py-3 font-bold text-slate-800">—</td>
                <td className="px-4 py-3"><span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded">PENDING</span></td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-orange-50/30">
                <td className="px-4 py-3 font-bold text-slate-800">Pavitra</td>
                <td className="px-4 py-3 text-orange-600 font-semibold">Attendance & Leave</td>
                <td className="px-4 py-3 text-slate-500">Portal pending setup</td>
                <td className="px-4 py-3 font-bold text-slate-800">—</td>
                <td className="px-4 py-3"><span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded">PENDING</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit to Admin */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Submit Report to Admin</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Report Date *</label>
            <input type="date" required value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks / Comments (optional)</label>
            <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add comments for admin..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>
        <button onClick={handleSubmitToAdmin} disabled={submitting || !filterDate}
          className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? 'Submitting...' : '📤 Submit Overall Report to Admin'}
        </button>
        {!filterDate && <p className="text-[10px] text-red-500 font-semibold">Please select a date before submitting</p>}
      </div>

      {/* Previously Submitted Reports */}
      {submittedReports.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Previously Submitted Reports</h2>
          <div className="space-y-2">
            {submittedReports.map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">{r.reportDate}</span>
                  <span className="text-slate-500 ml-3">Records: {r.totalRecords} | Reports: {r.totalDailyReports}</span>
                  {r.remarks && <span className="text-slate-500 ml-3">— {r.remarks}</span>}
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded">{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Footer */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <span>Generated by: Biradar Nandini (HR Manager) | Report Date: {new Date().toISOString().split('T')[0]}</span>
        <span className="font-bold text-orange-600">Adyapan HRMS — For Admin Review Only</span>
      </div>
    </div>
  );
}
