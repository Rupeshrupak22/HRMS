'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FileText, ShieldAlert, UserX, UserMinus, LogOut, CreditCard, MessageSquareWarning, ClipboardList, Calendar, Eye, X, Download, Trash2 } from 'lucide-react';
import { aravindApi } from '@/lib/aravind-api';
import { apiRequest } from '@/lib/api';
import { Pagination } from '@/components/Pagination';

export default function AravindReportPage() {
  const [retention, setRetention] = useState<any[]>([]);
  const [resignation, setResignation] = useState<any[]>([]);
  const [abscond, setAbscond] = useState<any[]>([]);
  const [exit, setExit] = useState<any[]>([]);
  const [fnf, setFnf] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  // Pagination states
  const [pageRet, setPageRet] = useState(1);
  const [pageRes, setPageRes] = useState(1);
  const [pageAbs, setPageAbs] = useState(1);
  const [pageExit, setPageExit] = useState(1);
  const [pageFnf, setPageFnf] = useState(1);
  const [pageComp, setPageComp] = useState(1);
  const [pageIntv, setPageIntv] = useState(1);
  const [pageRep, setPageRep] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [retRes, resRes, absRes, exitRes, fnfRes, compRes, intvRes, dailyRes] = await Promise.allSettled([
          aravindApi.getRetention().catch(() => []),
          aravindApi.getResignation().catch(() => []),
          aravindApi.getAbscond().catch(() => []),
          aravindApi.getExitClearance().catch(() => []),
          aravindApi.getFnF().catch(() => []),
          aravindApi.getComplaints().catch(() => []),
          aravindApi.getExitInterview().catch(() => []),
          apiRequest('/reports/daily').catch(() => aravindApi.getDailyReports()),
        ]);

        if (retRes.status === 'fulfilled' && Array.isArray(retRes.value)) setRetention(retRes.value);
        if (resRes.status === 'fulfilled' && Array.isArray(resRes.value)) setResignation(resRes.value);
        if (absRes.status === 'fulfilled' && Array.isArray(absRes.value)) setAbscond(absRes.value);
        if (exitRes.status === 'fulfilled' && Array.isArray(exitRes.value)) setExit(exitRes.value);
        if (fnfRes.status === 'fulfilled' && Array.isArray(fnfRes.value)) setFnf(fnfRes.value);
        if (compRes.status === 'fulfilled' && Array.isArray(compRes.value)) setComplaints(compRes.value);
        if (intvRes.status === 'fulfilled' && Array.isArray(intvRes.value)) setInterviews(intvRes.value);
        if (dailyRes.status === 'fulfilled' && Array.isArray(dailyRes.value)) {
          setDailyReports(
            dailyRes.value.filter(
              (r: any) =>
                r.userEmail === 'aravind@adyapan.com' ||
                r.specialization === 'RESIGNATION_EXIT' ||
                (r.employeeName || '').toLowerCase().includes('aravind')
            )
          );
        }
      } catch (err) {
        console.error('Failed to load Aravind report data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filterByDateOrMonth = (records: any[]) => {
    if (!filterDate && !filterMonth) return records;
    return records.filter((r) => {
      const created = r.date || r.reportDate || r.dateOfResignation || r.lastWorkingDay || (r.createdAt ? r.createdAt.split('T')[0] : '');
      if (filterDate) return created === filterDate;
      if (filterMonth) return created.startsWith(filterMonth);
      return true;
    });
  };

  const filteredRetention = filterByDateOrMonth(retention);
  const filteredResignation = filterByDateOrMonth(resignation);
  const filteredAbscond = filterByDateOrMonth(abscond);
  const filteredExit = filterByDateOrMonth(exit);
  const filteredFnf = filterByDateOrMonth(fnf);
  const filteredComplaints = filterByDateOrMonth(complaints);
  const filteredInterviews = filterByDateOrMonth(interviews);
  const filteredDailyReports = filterByDateOrMonth(dailyReports);

  const handleDeleteReport = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this daily report? It will be removed from all records and dashboards.')) return;
    try {
      await apiRequest(`/reports/daily/${id}`, { method: 'DELETE' });
      try { await aravindApi.deleteDailyReport(id); } catch {}
      setDailyReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
      alert('Daily report deleted successfully from all records.');
    } catch (err: any) {
      alert(err?.message || 'Failed to delete daily report');
    }
  };

  const resetFilters = () => {
    setFilterDate('');
    setFilterMonth('');
    setPageRet(1);
    setPageRes(1);
    setPageAbs(1);
    setPageExit(1);
    setPageFnf(1);
    setPageComp(1);
    setPageIntv(1);
    setPageRep(1);
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-sky-400" />
            <span>Aravind&apos;s Complete Exit & Resignation Report</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Exit & Resignation specialist — comprehensive operations & daily logs
          </p>
        </div>
      </div>

      {/* 📅 Date & Month Filter Controls Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 text-sky-600" />
          <span className="font-extrabold text-slate-800">Filter Exit/Resignation Data:</span>
          {filterDate && (
            <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px] border border-sky-200">
              📅 Specific Date: {filterDate}
            </span>
          )}
          {filterMonth && !filterDate && (
            <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px] border border-indigo-200">
              📆 Monthly View: {filterMonth}
            </span>
          )}
          {!filterDate && !filterMonth && (
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
              🌐 All-Time Records
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
                resetFilters();
                setFilterMonth(e.target.value);
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
                const val = e.target.value;
                resetFilters();
                setFilterDate(val);
              }}
              className="text-xs font-bold text-slate-800 outline-none bg-transparent cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              resetFilters();
              setFilterDate(todayStr);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filterDate === todayStr ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Today
          </button>

          <button
            onClick={() => {
              resetFilters();
              setFilterMonth(currentMonthStr);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filterMonth === currentMonthStr && !filterDate ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            This Month
          </button>

          {(filterDate || filterMonth) && (
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition cursor-pointer border border-rose-200"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-xs">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Resignations Tracked</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{loading ? '...' : filteredResignation.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total in DB: {resignation.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Abscond Cases</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{loading ? '...' : filteredAbscond.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total in DB: {abscond.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">F&F Settlements</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{loading ? '...' : filteredFnf.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total in DB: {fnf.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Daily Reports</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{loading ? '...' : filteredDailyReports.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total in DB: {dailyReports.length}</p>
        </div>
      </div>

      {/* Retention Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldAlert className="w-4 h-4 text-amber-600" /> Retention Cases ({loading ? 'Loading...' : filteredRetention.length})
        </h2>
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading retention records...</span>
          </div>
        ) : filteredRetention.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No retention records found.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead><tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="px-4 py-3">Emp ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Outcome</th>
                  <th className="px-4 py-3">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">{filteredRetention.slice((pageRet - 1) * PAGE_SIZE, pageRet * PAGE_SIZE).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{r.employeeId}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{r.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.department}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.reason}</td>
                    <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.retentionOutcome === 'Retained' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.retentionOutcome}</span></td>
                    <td className="px-4 py-2.5 text-slate-600">{r.status}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination currentPage={pageRet} totalItems={filteredRetention.length} pageSize={PAGE_SIZE} onPageChange={setPageRet} />
          </div>
        )}
      </section>

      {/* Resignation Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <UserX className="w-4 h-4 text-red-600" /> Resignations ({loading ? 'Loading...' : filteredResignation.length})
        </h2>
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading resignation records...</span>
          </div>
        ) : filteredResignation.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No resignation records found.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead><tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="px-4 py-3">Emp ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Notice Period</th>
                  <th className="px-4 py-3">Overall</th>
                  <th className="px-4 py-3">LWD</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">{filteredResignation.slice((pageRes - 1) * PAGE_SIZE, pageRes * PAGE_SIZE).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{r.employeeId}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{r.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.department}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.dateOfResignation}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.noticePeriod}</td>
                    <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.overall === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.overall}</span></td>
                    <td className="px-4 py-2.5 text-slate-600">{r.lwd}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination currentPage={pageRes} totalItems={filteredResignation.length} pageSize={PAGE_SIZE} onPageChange={setPageRes} />
          </div>
        )}
      </section>

      {/* Abscond Cases Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <UserMinus className="w-4 h-4 text-rose-600" /> Abscond Cases ({loading ? 'Loading...' : filteredAbscond.length})
        </h2>
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading abscond records...</span>
          </div>
        ) : filteredAbscond.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No abscond records found.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead><tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="px-4 py-3">Emp ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Manager</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">{filteredAbscond.slice((pageAbs - 1) * PAGE_SIZE, pageAbs * PAGE_SIZE).map((r) => (
                  <tr key={r.id || r._id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 font-mono font-bold text-rose-700">{r.employeeId}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{r.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.department}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.designation}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{r.manager || '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination currentPage={pageAbs} totalItems={filteredAbscond.length} pageSize={PAGE_SIZE} onPageChange={setPageAbs} />
          </div>
        )}
      </section>

      {/* Daily Reports Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="w-4 h-4 text-sky-600" /> Daily Reports Submitted ({loading ? 'Loading...' : filteredDailyReports.length})
        </h2>
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading daily reports...</span>
          </div>
        ) : filteredDailyReports.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No daily reports submitted yet</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead><tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Key Performance Actions</th>
                  <th className="px-4 py-3">Blockers / Issues</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action / Preview</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">{filteredDailyReports.slice((pageRep - 1) * PAGE_SIZE, pageRep * PAGE_SIZE).map((r) => (
                  <tr key={r.id} className="hover:bg-sky-50/30 transition">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{r.date || r.reportDate || r.createdAt?.split('T')[0]}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{r.employeeName || 'Aravind'}</td>
                    <td className="px-4 py-2.5 text-slate-700 max-w-[280px] truncate">{r.keyUpdates || r.keyActions || r.tasksCompleted || 'Exit clearance operations'}</td>
                    <td className="px-4 py-2.5 text-slate-500 max-w-[150px] truncate">{r.issue || r.blockers || 'None'}</td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">{r.status || 'SUBMITTED'}</span></td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 ml-auto">
                        <button onClick={() => setSelectedReport(r)} className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer">
                          <Eye className="w-3 h-3 text-slate-600" /> Preview
                        </button>
                        <button
                          onClick={(e) => handleDeleteReport(r.id, e)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Daily Report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination currentPage={pageRep} totalItems={filteredDailyReports.length} pageSize={PAGE_SIZE} onPageChange={setPageRep} />
          </div>
        )}
      </section>

      {/* Modal Preview */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-sky-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2 text-white">
                  <FileText className="w-5 h-5 text-sky-400" />
                  Daily Report Full Preview
                </h3>
                <p className="text-xs text-sky-200 mt-0.5">{selectedReport.employeeName || 'Aravind'} • {selectedReport.date || selectedReport.reportDate || selectedReport.createdAt?.split('T')[0]}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-1 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Key Performance Summary</label>
                <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-200 text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                  {selectedReport.keyUpdates || selectedReport.keyActions || selectedReport.tasksCompleted || 'No updates logged.'}
                </div>
              </div>
              {selectedReport.issue && (
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Issues / Blockers</label>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 font-medium">
                    {selectedReport.issue}
                  </div>
                </div>
              )}
              {selectedReport.comment && (
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Remarks & Notes</label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                    {selectedReport.comment}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => handleDeleteReport(selectedReport.id)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-rose-200 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Report</span>
              </button>
              <button onClick={() => setSelectedReport(null)} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer">Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
