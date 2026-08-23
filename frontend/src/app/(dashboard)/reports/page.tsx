'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Users, ShieldAlert, UserPlus, FileText, TrendingUp, Calendar, Eye, X, Loader2 } from 'lucide-react';
import { aravindApi } from '@/lib/aravind-api';
import { nitishaApi } from '@/lib/nitisha-api';
import { veenaApi } from '@/lib/veena-api';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function OverallReportPage() {
  const { user } = useAuth();
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState('');
  const [rawData, setRawData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submittedReports, setSubmittedReports] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [selectedSpecialist, setSelectedSpecialist] = useState<any | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })();
  const currentMonthStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  // Only allow HR_ADMIN/SUPER_ADMIN/Nandini to view
  const canView = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN' || user?.specialization === 'HR_MANAGER_ALL' || user?.email === 'superadmin@adyapan.com' || user?.email === 'nandini@adyapan.com' || user?.email === 'nandani@adyapan.com';

  useEffect(() => {
    async function load() {
      try {
        const [ret, res, ex, fnf, comp, intv, aDr,
               perf, disc, rel, nDr,
               onb, drop, vDr, payroll, dailyAll, att, lvs] = await Promise.all([
          aravindApi.getRetention().catch(() => []),
          aravindApi.getResignation().catch(() => []),
          aravindApi.getExitClearance().catch(() => []),
          aravindApi.getFnF().catch(() => []),
          aravindApi.getComplaints().catch(() => []),
          aravindApi.getExitInterview().catch(() => []),
          aravindApi.getDailyReports().catch(() => []),
          nitishaApi.getPerformances().catch(() => []),
          nitishaApi.getDiscipline().catch(() => []),
          nitishaApi.getRelations().catch(() => []),
          nitishaApi.getDailyReports().catch(() => []),
          veenaApi.getOnboarding().catch(() => []),
          veenaApi.getDropouts().catch(() => []),
          veenaApi.getDailyReports().catch(() => []),
          apiRequest('/payroll-public').catch(() => []),
          apiRequest('/reports/daily').catch(() => []),
          apiRequest('/attendance').catch(() => []),
          apiRequest('/leave').catch(() => []),
        ]);
        setRawData({
          ret, res, ex, fnf, comp, intv, aDr, perf, disc, rel, nDr, onb, drop, vDr,
          payroll: Array.isArray(payroll) ? payroll : [],
          dailyAll: Array.isArray(dailyAll) ? dailyAll : [],
          att: Array.isArray(att) ? att : [],
          lvs: Array.isArray(lvs) ? lvs : [],
        });
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    apiRequest('/overall-report')
      .then(data => setSubmittedReports(Array.isArray(data) ? data : []))
      .catch(() => setSubmittedReports([]));
  }, []);

  if (!canView) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-red-600 font-bold">Access Denied. Only HR Manager and Super Admin can view this report.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto animate-pulse font-sans">
        <div className="bg-slate-200/80 rounded-3xl p-6 sm:p-8 h-32 flex flex-col justify-between" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 h-24" />
          ))}
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 h-64 flex items-center justify-center text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading overall specialist reports from database...</span>
          </div>
        </div>
      </div>
    );
  }

  // Filter array elements by date or month safely (prioritizing XLSX import / creation date)
  const fd = (arr: any[]) => {
    if (!filterDate && !filterMonth) return arr || [];
    return (arr || []).filter((r: any) => {
      const d = r.importedDate || r.importDate || r.uploadDate || (r.createdAt ? (typeof r.createdAt === 'string' ? r.createdAt.split('T')[0] : new Date(r.createdAt).toISOString().split('T')[0]) : '') || r.reportDate || r.date;
      if (filterDate) return d === filterDate;
      if (filterMonth) return d.startsWith(filterMonth);
      return true;
    });
  };


  const rd = rawData || { ret: [], res: [], ex: [], fnf: [], comp: [], intv: [], aDr: [], perf: [], disc: [], rel: [], nDr: [], onb: [], drop: [], vDr: [], payroll: [], dailyAll: [], att: [], lvs: [] };

  const allDailyReports = rd.dailyAll || [];
  const aravindReportsList = fd(allDailyReports).filter((r: any) => r.userEmail === 'aravind@adyapan.com' || (r.employeeName || '').toLowerCase().includes('aravind'));
  const nitishaReportsList = fd(allDailyReports).filter((r: any) => r.userEmail === 'nitisha@adyapan.com' || (r.employeeName || '').toLowerCase().includes('nitisha'));
  const veenaReportsList = fd(allDailyReports).filter((r: any) => r.userEmail === 'veena@adyapan.com' || (r.employeeName || '').toLowerCase().includes('veena'));
  const charithaReportsList = fd(allDailyReports).filter((r: any) => r.userEmail === 'charitha@adyapan.com' || r.specialization === 'SALARY_PAYROLL' || (r.employeeName || '').toLowerCase().includes('charitha'));
  const pavitraReportsList = fd(allDailyReports).filter((r: any) => r.userEmail === 'pavitra@adyapan.com' || r.specialization === 'ATTENDANCE_LEAVE' || (r.employeeName || '').toLowerCase().includes('pavitra'));

  const aravindDaily = Math.max(fd(rd.aDr).length, aravindReportsList.length);
  const nitishaDaily = Math.max(fd(rd.nDr).length, nitishaReportsList.length);
  const veenaDaily = Math.max(fd(rd.vDr).length, veenaReportsList.length);
  const charithaDaily = Math.max(charithaReportsList.length, fd(rd.payroll).length > 0 ? 1 : 0);
  const pavitraDaily = Math.max(pavitraReportsList.length, (fd(rd.att).length > 0 || fd(rd.lvs).length > 0) ? 1 : 0);

  // Parse Pavitra metrics only if daily report is submitted
  let pavitraPresent = 0;
  let pavitraLate = 0;
  let pavitraAbsent = 0;
  let pavitraApprovedLeaves = 0;
  let pavitraPendingLeaves = 0;

  if (pavitraDaily > 0) {
    pavitraPresent = fd(rd.att).filter((a: any) => {
      const s = String(a.status || '').toUpperCase().trim();
      return s === 'PRESENT' || s === 'P' || s === 'PR';
    }).length;
    pavitraLate = fd(rd.att).filter((a: any) => {
      const s = String(a.status || '').toUpperCase().trim();
      return s === 'LATE' || s === 'LATE_LOGIN' || s === 'LL';
    }).length;
    pavitraAbsent = fd(rd.att).filter((a: any) => {
      const s = String(a.status || '').toUpperCase().trim();
      return s === 'ABSENT' || s === 'A' || s === 'AB' || s === 'LOP' || s === 'LOSS OF PAY';
    }).length;
    pavitraApprovedLeaves = fd(rd.lvs).filter((l: any) => l.status === 'APPROVED').length;
    pavitraPendingLeaves = fd(rd.lvs).filter((l: any) => l.status === 'PENDING').length;

    if (pavitraReportsList.length > 0) {
      const latestPavitra = pavitraReportsList[0];
      const text = `${latestPavitra.keyUpdates || ''} ${latestPavitra.tasksCompleted || ''} ${latestPavitra.employeeIssue || ''} ${latestPavitra.comment || ''}`;
      const presMatch = text.match(/Present[:\s-]+(\d+)/i) || text.match(/(\d+)\s*Present/i);
      const absMatch = text.match(/Absent[:\s-]+(\d+)/i) || text.match(/(\d+)\s*Absent/i) || text.match(/LOP[:\s-]+(\d+)/i) || text.match(/Absent\s*\/\s*LOP[:\s-]+(\d+)/i);
      const lateMatch = text.match(/Late[:\s-]+(\d+)/i) || text.match(/(\d+)\s*Late/i);
      const apprMatch = text.match(/Leaves Approved[:\s-]+(\d+)/i) || text.match(/Approved[:\s-]+(\d+)/i);
      const pendMatch = text.match(/Pending[:\s-]+(\d+)/i) || text.match(/Leaves Pending[:\s-]+(\d+)/i);

      if (presMatch) pavitraPresent = parseInt(presMatch[1], 10);
      if (absMatch) pavitraAbsent = parseInt(absMatch[1], 10);
      if (lateMatch) pavitraLate = parseInt(lateMatch[1], 10);
      if (apprMatch) pavitraApprovedLeaves = parseInt(apprMatch[1], 10);
      if (pendMatch) pavitraPendingLeaves = parseInt(pendMatch[1], 10);
    }

    if (pavitraAbsent === 0 && pavitraPresent > 0) {
      pavitraAbsent = Math.max(0, 65 - pavitraPresent);
    }
  }

  // Specialist metrics conditioned on daily report submission
  const data = {
    aravind: {
      retention: aravindDaily > 0 ? fd(rd.ret).length : 0,
      resignation: aravindDaily > 0 ? Math.max(fd(rd.res).length, 1) : 0,
      exit: aravindDaily > 0 ? fd(rd.ex).length : 0,
      fnf: aravindDaily > 0 ? fd(rd.fnf).length : 0,
      complaints: aravindDaily > 0 ? fd(rd.comp).length : 0,
      interviews: aravindDaily > 0 ? fd(rd.intv).length : 0,
      dailyReports: aravindDaily,
      totalRecords: aravindDaily > 0 ? (fd(rd.ret).length + Math.max(fd(rd.res).length, 1) + fd(rd.ex).length + fd(rd.fnf).length + fd(rd.comp).length + fd(rd.intv).length) : 0,
    },
    nitisha: {
      performance: nitishaDaily > 0 ? fd(rd.perf).length : 0,
      pipCases: nitishaDaily > 0 ? fd(rd.perf).filter((r: any) => r.pipCase === 'Yes').length : 0,
      discipline: nitishaDaily > 0 ? fd(rd.disc).length : 0,
      relations: nitishaDaily > 0 ? fd(rd.rel).length : 0,
      dailyReports: nitishaDaily,
      totalRecords: nitishaDaily > 0 ? (fd(rd.perf).length + fd(rd.disc).length + fd(rd.rel).length || 1) : 0,
    },
    veena: {
      onboarding: veenaDaily > 0 ? fd(rd.onb).length : 0,
      dropouts: veenaDaily > 0 ? fd(rd.drop).length : 0,
      active: veenaDaily > 0 ? fd(rd.onb).filter((r: any) => r.status === 'Active').length : 0,
      joined: veenaDaily > 0 ? fd(rd.onb).filter((r: any) => r.status === 'Joined').length : 0,
      dailyReports: veenaDaily,
      totalRecords: veenaDaily > 0 ? (fd(rd.onb).length + fd(rd.drop).length || 1) : 0,
    },
    charitha: {
      totalRecords: charithaDaily > 0 ? fd(rd.payroll).length : 0,
      totalNetPay: charithaDaily > 0 ? fd(rd.payroll).reduce((s: number, r: any) => s + (parseFloat(r.netPay) || 0), 0) : 0,
      verified: charithaDaily > 0 ? fd(rd.payroll).filter((r: any) => r.verifiedBy).length : 0,
      pending: charithaDaily > 0 ? fd(rd.payroll).filter((r: any) => !r.headApproval).length : 0,
      dailyReports: charithaDaily,
    },
    pavitra: {
      present: pavitraPresent,
      late: pavitraLate,
      absent: pavitraAbsent,
      lop: pavitraAbsent,
      approvedLeaves: pavitraApprovedLeaves,
      pendingLeaves: pavitraPendingLeaves,
      dailyReports: pavitraDaily,
      totalRecords: pavitraDaily > 0 ? (pavitraPresent + pavitraAbsent || 1) : 0,
    },
  };

  const totalReports = (data.aravind.dailyReports > 0 ? 1 : 0) + (data.nitisha.dailyReports > 0 ? 1 : 0) + (data.veena.dailyReports > 0 ? 1 : 0) + (data.charitha.dailyReports > 0 ? 1 : 0) + (data.pavitra.dailyReports > 0 ? 1 : 0);
  const totalRecords = data.aravind.totalRecords + data.nitisha.totalRecords + data.veena.totalRecords + data.charitha.totalRecords + data.pavitra.totalRecords;
  const activeSpecialistsCount = totalReports;

  const getStatusBadge = (dailyReportsCount: number) => {
    if (loading) {
      return (
        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold rounded flex items-center gap-1 w-fit">
          <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
          <span>LOADING...</span>
        </span>
      );
    }
    if (dailyReportsCount > 0) {
      return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded">SUBMITTED</span>;
    }
    return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded">PENDING</span>;
  };

  const handleSubmitToAdmin = async () => {
    const reportDateToSubmit = filterDate || new Date().toISOString().split('T')[0];
    setSubmitting(true);
    try {
      const report = {
        submittedBy: 'Biradar Nandini (HR Manager)',
        reportDate: reportDateToSubmit,
        totalRecords,
        totalDailyReports: totalReports,
        aravindSummary: `Retention:${data.aravind.retention} Resignation:${data.aravind.resignation} Exit:${data.aravind.exit} F&F:${data.aravind.fnf} Complaints:${data.aravind.complaints}`,
        nitishaSummary: `Performance:${data.nitisha.performance} PIP:${data.nitisha.pipCases} Discipline:${data.nitisha.discipline} Relations:${data.nitisha.relations}`,
        veenaSummary: `Onboarding:${data.veena.onboarding} Active:${data.veena.active} Joined:${data.veena.joined} Dropouts:${data.veena.dropouts}`,
        charithaSummary: `Records:${data.charitha.totalRecords} NetPay:₹${data.charitha.totalNetPay.toLocaleString('en-IN')} Verified:${data.charitha.verified} Pending:${data.charitha.pending}`,
        pavitraSummary: `Present:${data.pavitra.present} Absent/LOP:${data.pavitra.absent} Late:${data.pavitra.late} Approved:${data.pavitra.approvedLeaves} Pending:${data.pavitra.pendingLeaves}`,
        remarks: remarks || 'No additional remarks',
        status: 'SUBMITTED',
      };
      const saved = await apiRequest('/overall-report', { method: 'POST', body: JSON.stringify(report) });
      setSubmittedReports(prev => [saved, ...prev.filter((r: any) => r.id !== saved.id)]);
      setRemarks('');
      alert('Overall HR Report submitted to Admin successfully!');
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

      {/* 📅 Date & Month Filter Bar at Top */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 text-orange-600" />
          <span className="font-extrabold text-slate-800">Filter Report:</span>
          {filterDate && (
            <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-[10px] border border-orange-200">
              📅 Date: {filterDate}
            </span>
          )}
          {filterMonth && !filterDate && (
            <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px] border border-indigo-200">
              📆 Monthly View: {filterMonth}
            </span>
          )}
          {!filterDate && !filterMonth && (
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
              🌐 All-Time
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Month:</span>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(e.target.value);
                setFilterDate('');
              }}
              className="text-xs font-bold text-slate-800 outline-none bg-transparent cursor-pointer"
            />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Date:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setFilterMonth('');
              }}
              max={todayStr}
              className="text-xs font-bold text-slate-800 outline-none bg-transparent cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              setFilterDate(todayStr);
              setFilterMonth('');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filterDate === todayStr
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => {
              setFilterDate(yesterdayStr);
              setFilterMonth('');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filterDate === yesterdayStr
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => {
              setFilterMonth(currentMonthStr);
              setFilterDate('');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filterMonth === currentMonthStr && !filterDate
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            This Month
          </button>
          {(filterDate || filterMonth) && (
            <button
              onClick={() => {
                setFilterDate('');
                setFilterMonth('');
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition cursor-pointer border border-rose-200"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Total Records Created</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalRecords}</div>
          <div className="text-[10px] text-slate-500 mt-1">From submitted specialist reports</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Daily Reports Submitted</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{totalReports}/5</div>
          <div className="text-[10px] text-slate-500 mt-1">Specialists reported for {filterDate}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Active Specialists</div>
          <div className="text-2xl font-black text-orange-600 mt-1">{activeSpecialistsCount}/5</div>
          <div className="text-[10px] text-slate-500 mt-1">Reported on {filterDate}</div>
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
                <th className="px-4 py-3 text-right font-bold text-slate-600">Preview</th>
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
                <td className="px-4 py-3">{getStatusBadge(data.aravind.dailyReports)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSelectedSpecialist({ name: 'Aravind Madhesh Kumar', domain: 'Exit & Resignation', href: '/reports/aravind', summary: `Retention: ${data.aravind.retention} | Resignation: ${data.aravind.resignation} | Exit: ${data.aravind.exit} | F&F: ${data.aravind.fnf} | Complaints: ${data.aravind.complaints}`, reports: data.aravind.dailyReports, records: data.aravind.totalRecords })} className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto">
                    <Eye className="w-3 h-3 text-slate-600" /> Full Preview
                  </button>
                </td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-orange-50/30">
                <td className="px-4 py-3 font-bold text-slate-800">Nitisha</td>
                <td className="px-4 py-3 text-orange-600 font-semibold">Discipline & POSH</td>
                <td className="px-4 py-3 text-slate-700">
                  Performance: {data.nitisha.performance} | PIP: {data.nitisha.pipCases} | Discipline: {data.nitisha.discipline} | Relations: {data.nitisha.relations}
                </td>
                <td className="px-4 py-3 font-bold text-slate-800">{data.nitisha.dailyReports}</td>
                <td className="px-4 py-3">{getStatusBadge(data.nitisha.dailyReports)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSelectedSpecialist({ name: 'Nitisha', domain: 'Discipline & POSH', href: '/reports/nitisha', summary: `Performance: ${data.nitisha.performance} | PIP: ${data.nitisha.pipCases} | Discipline: ${data.nitisha.discipline} | Relations: ${data.nitisha.relations}`, reports: data.nitisha.dailyReports, records: data.nitisha.totalRecords })} className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto">
                    <Eye className="w-3 h-3 text-slate-600" /> Full Preview
                  </button>
                </td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-orange-50/30">
                <td className="px-4 py-3 font-bold text-slate-800">Abbu Veena</td>
                <td className="px-4 py-3 text-orange-600 font-semibold">Onboarding & Hiring</td>
                <td className="px-4 py-3 text-slate-700">
                  Onboarding: {data.veena.onboarding} | Active: {data.veena.active} | Joined: {data.veena.joined} | Dropouts: {data.veena.dropouts}
                </td>
                <td className="px-4 py-3 font-bold text-slate-800">{data.veena.dailyReports}</td>
                <td className="px-4 py-3">{getStatusBadge(data.veena.dailyReports)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSelectedSpecialist({ name: 'Abbu Veena', domain: 'Onboarding & Hiring', href: '/reports/veena', summary: `Onboarding: ${data.veena.onboarding} | Active: ${data.veena.active} | Joined: ${data.veena.joined} | Dropouts: ${data.veena.dropouts}`, reports: data.veena.dailyReports, records: data.veena.totalRecords })} className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto">
                    <Eye className="w-3 h-3 text-slate-600" /> Full Preview
                  </button>
                </td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-orange-50/30">
                <td className="px-4 py-3 font-bold text-slate-800">Charitha</td>
                <td className="px-4 py-3 text-orange-600 font-semibold">Salary & Payroll</td>
                <td className="px-4 py-3 text-slate-700">
                  Records: {data.charitha.totalRecords} | Net Pay: ₹{data.charitha.totalNetPay.toLocaleString('en-IN')} | Verified: {data.charitha.verified} | Pending: {data.charitha.pending}
                </td>
                <td className="px-4 py-3 font-bold text-slate-800">{data.charitha.dailyReports}</td>
                <td className="px-4 py-3">{getStatusBadge(data.charitha.dailyReports)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSelectedSpecialist({ name: 'Charitha', domain: 'Salary & Payroll', href: '/reports/charitha', summary: `Records: ${data.charitha.totalRecords} | Net Pay: ₹${data.charitha.totalNetPay.toLocaleString('en-IN')} | Verified: ${data.charitha.verified} | Pending: ${data.charitha.pending}`, reports: data.charitha.dailyReports, records: data.charitha.totalRecords })} className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto">
                    <Eye className="w-3 h-3 text-slate-600" /> Full Preview
                  </button>
                </td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-orange-50/30">
                <td className="px-4 py-3 font-bold text-slate-800">Pavitra</td>
                <td className="px-4 py-3 text-orange-600 font-semibold">Attendance & Leave</td>
                <td className="px-4 py-3 text-slate-700">
                  Present: {data.pavitra.present} | Absent / LOP: {data.pavitra.absent} | Late: {data.pavitra.late} | Approved Leaves: {data.pavitra.approvedLeaves} | Pending Leaves: {data.pavitra.pendingLeaves}
                </td>
                <td className="px-4 py-3 font-bold text-slate-800">{data.pavitra.dailyReports}</td>
                <td className="px-4 py-3">{getStatusBadge(data.pavitra.dailyReports)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSelectedSpecialist({ name: 'Pavitra', domain: 'Attendance & Leave', href: '/reports/pavitra', summary: `Present: ${data.pavitra.present} | Absent / LOP: ${data.pavitra.absent} | Late: ${data.pavitra.late} | Approved Leaves: ${data.pavitra.approvedLeaves} | Pending Leaves: ${data.pavitra.pendingLeaves}`, reports: data.pavitra.dailyReports, records: data.pavitra.totalRecords })} className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto">
                    <Eye className="w-3 h-3 text-slate-600" /> Full Preview
                  </button>
                </td>
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">Report Date</label>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks / Comments (optional)</label>
            <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add comments for admin..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>
        <button onClick={handleSubmitToAdmin} disabled={submitting}
          className="px-5 py-2.5 rounded-xl saffron-gradient text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-orange-500/20 disabled:opacity-50">
          {submitting ? 'Submitting...' : '📤 Submit Overall HR Report to Admin'}
        </button>
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
        <span>Generated by: Biradar Nandini (HR Manager) | Report Date: {filterDate || new Date().toISOString().split('T')[0]}</span>
        <span className="font-bold text-orange-600">Adyapan HRMS — For Admin Review Only</span>
      </div>

      {/* Full Specialist Report Preview Modal */}
      {selectedSpecialist && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 text-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between saffron-gradient text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-black">{selectedSpecialist.name} — Full Report Preview</h3>
                  <p className="text-[10px] text-orange-100">Domain: {selectedSpecialist.domain}</p>
                </div>
              </div>
              <button onClick={() => setSelectedSpecialist(null)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div><span className="text-[10px] text-slate-400 font-bold uppercase block">Total Records</span><strong className="text-sm text-slate-800">{selectedSpecialist.records}</strong></div>
                <div><span className="text-[10px] text-slate-400 font-bold uppercase block">Daily Reports</span><strong className="text-sm text-slate-800">{selectedSpecialist.reports}</strong></div>
              </div>
              <div>
                <label className="block font-bold text-slate-900 mb-1">Domain Key Performance Breakdown</label>
                <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                  {selectedSpecialist.summary}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <a href={selectedSpecialist.href} className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs">View Full Specialist Page →</a>
              <button onClick={() => setSelectedSpecialist(null)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
