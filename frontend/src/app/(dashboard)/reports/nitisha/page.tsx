'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FileText, TrendingUp, ShieldAlert, Users, Calendar, Eye, X, Download, AlertCircle, Trash2 } from 'lucide-react';
import { nitishaApi } from '@/lib/nitisha-api';
import { apiRequest } from '@/lib/api';
import { Pagination } from '@/components/Pagination';

export default function NitishaReportPage() {
  const [performances, setPerformances] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [discipline, setDiscipline] = useState<any[]>([]);
  const [relations, setRelations] = useState<any[]>([]);
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
  const [pagePerf, setPagePerf] = useState(1);
  const [pageIssues, setPageIssues] = useState(1);
  const [pageDisc, setPageDisc] = useState(1);
  const [pageRel, setPageRel] = useState(1);
  const [pageRep, setPageRep] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [perfRes, issRes, discRes, relRes, dailyRes] = await Promise.allSettled([
          nitishaApi.getPerformances().catch(() => []),
          nitishaApi.getIssues().catch(() => []),
          nitishaApi.getDiscipline().catch(() => []),
          nitishaApi.getRelations().catch(() => []),
          apiRequest('/reports/daily').catch(() => nitishaApi.getDailyReports()),
        ]);

        if (perfRes.status === 'fulfilled' && Array.isArray(perfRes.value)) setPerformances(perfRes.value);
        if (issRes.status === 'fulfilled' && Array.isArray(issRes.value)) setIssues(issRes.value);
        if (discRes.status === 'fulfilled' && Array.isArray(discRes.value)) setDiscipline(discRes.value);
        if (relRes.status === 'fulfilled' && Array.isArray(relRes.value)) setRelations(relRes.value);
        if (dailyRes.status === 'fulfilled' && Array.isArray(dailyRes.value)) {
          setDailyReports(
            dailyRes.value.filter(
              (r: any) =>
                r.userEmail === 'nitisha@adyapan.com' ||
                r.specialization === 'DISCIPLINE_POSH' ||
                (r.employeeName || '').toLowerCase().includes('nitisha')
            )
          );
        }
      } catch (err) {
        console.error('Failed to load Nitisha report data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filterByDateOrMonth = (records: any[]) => {
    if (!filterDate && !filterMonth) return records;
    return records.filter((r) => {
      const created = r.date || r.reportDate || (r.createdAt ? r.createdAt.split('T')[0] : '');
      if (filterDate) return created === filterDate;
      if (filterMonth) return created.startsWith(filterMonth);
      return true;
    });
  };

  const matchesDateOrMonth = (r: any, isDaily?: boolean) => {
    const created = r.date || r.reportDate || (r.createdAt ? r.createdAt.split('T')[0] : '');
    if (filterDate) return created === filterDate;
    if (filterMonth) return created.startsWith(filterMonth);
    return true;
  };

  const filteredPerformances = useMemo(() => filterByDateOrMonth(performances), [performances, filterDate, filterMonth]);
  const filteredIssues = useMemo(() => filterByDateOrMonth(issues), [issues, filterDate, filterMonth]);
  const filteredDiscipline = useMemo(() => filterByDateOrMonth(discipline), [discipline, filterDate, filterMonth]);
  const filteredRelations = useMemo(() => filterByDateOrMonth(relations), [relations, filterDate, filterMonth]);
  const filteredDailyReports = useMemo(() => filterByDateOrMonth(dailyReports), [dailyReports, filterDate, filterMonth]);

  const handleDeleteReport = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this daily report? It will be removed from all records and dashboards.')) return;
    try {
      await apiRequest(`/reports/daily/${id}`, { method: 'DELETE' });
      try { await nitishaApi.deleteDailyReport(id); } catch {}
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
    setPagePerf(1);
    setPageIssues(1);
    setPageDisc(1);
    setPageRel(1);
    setPageRep(1);
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-purple-400" />
            <span>Nitisha&apos;s Complete Discipline &amp; POSH Report</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Discipline cases, employee engagement relations, PIP records, and daily reports
          </p>
        </div>
      </div>

      {/* 📅 Date & Month Filter Controls Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 text-purple-600" />
          <span className="font-extrabold text-slate-800">Filter Discipline/POSH Data:</span>
          {filterDate && (
            <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px] border border-purple-200">
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
              filterDate === todayStr ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs">
          <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Performance Tracked</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{loading ? '...' : filteredPerformances.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total in DB: {performances.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs">
          <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Discipline Cases</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{loading ? '...' : filteredDiscipline.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total in DB: {discipline.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Employee Relations</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{loading ? '...' : filteredRelations.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total in DB: {relations.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs">
          <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Daily Reports</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{loading ? '...' : filteredDailyReports.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total in DB: {dailyReports.length}</p>
        </div>
      </div>

      {/* Performance & PIP Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <TrendingUp className="w-4 h-4 text-purple-600" /> Performance & PIP Records ({loading ? 'Loading...' : filteredPerformances.length})
        </h2>
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading performance records...</span>
          </div>
        ) : filteredPerformances.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No performance records found.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead><tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="px-4 py-3">Emp ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Daily Rev</th>
                  <th className="px-4 py-3">Weekly Rev</th>
                  <th className="px-4 py-3">Monthly Rev</th>
                  <th className="px-4 py-3">PIP Case</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">{filteredPerformances.slice((pagePerf - 1) * PAGE_SIZE, pagePerf * PAGE_SIZE).map((r) => (
                  <tr key={r.id || r._id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{r.employeeId}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{r.employeeName || r.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.department === 'Sales' ? 'bg-blue-100 text-blue-700' :
                        r.department === 'Tech' ? 'bg-purple-100 text-purple-700' :
                        r.department === 'Operation' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {r.department || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-700">{r.dailyRevenue || '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-700">{r.weeklyRevenue || '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-700">{r.monthlyRevenue || '—'}</td>
                    <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.pipCase === 'Yes' || r.pipStatus === 'Active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{r.pipCase || r.pipStatus || 'No'}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination currentPage={pagePerf} totalItems={filteredPerformances.length} pageSize={PAGE_SIZE} onPageChange={setPagePerf} />
          </div>
        )}
      </section>

      {/* Employee Issues Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <AlertCircle className="w-4 h-4 text-orange-600" /> Employee Issues & Explanations ({loading ? 'Loading...' : filteredIssues.length})
        </h2>
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading employee issues...</span>
          </div>
        ) : filteredIssues.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No employee issues recorded.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead><tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="px-4 py-3">Emp ID</th>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Issue</th>
                  <th className="px-4 py-3">Emp Explanation</th>
                  <th className="px-4 py-3">Fact Finding</th>
                  <th className="px-4 py-3">Manager Explanation</th>
                  <th className="px-4 py-3">HR Explanation</th>
                  <th className="px-4 py-3">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">{filteredIssues.slice((pageIssues - 1) * PAGE_SIZE, pageIssues * PAGE_SIZE).map((r) => (
                  <tr key={r.id || r._id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{r.employeeId}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{r.employeeName}</td>
                    <td className="px-4 py-2.5 text-slate-800">{r.employeeIssue}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.employeeExplanation || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.factFinding || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.managerExplanation || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.myExplanation || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'RESOLVED' || r.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.status || 'OPEN'}
                      </span>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination currentPage={pageIssues} totalItems={filteredIssues.length} pageSize={PAGE_SIZE} onPageChange={setPageIssues} />
          </div>
        )}
      </section>

      {/* Discipline Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldAlert className="w-4 h-4 text-red-600" /> Discipline & POSH Cases ({loading ? 'Loading...' : filteredDiscipline.length})
        </h2>
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading discipline cases...</span>
          </div>
        ) : filteredDiscipline.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No discipline cases found.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead><tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="px-4 py-3">Emp ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Issue Type</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action Taken</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">{filteredDiscipline.slice((pageDisc - 1) * PAGE_SIZE, pageDisc * PAGE_SIZE).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{r.employeeId}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{r.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.issueType || '-'}</td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">{r.severity || 'Medium'}</span></td>
                    <td className="px-4 py-2.5 text-slate-600">{r.status || 'Under Investigation'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.actionTaken || '-'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination currentPage={pageDisc} totalItems={filteredDiscipline.length} pageSize={PAGE_SIZE} onPageChange={setPageDisc} />
          </div>
        )}
      </section>

      {/* Daily Reports Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="w-4 h-4 text-purple-600" /> Daily Reports Submitted ({filteredDailyReports.length})
        </h2>
        {filteredDailyReports.length === 0 ? <p className="text-xs text-slate-400 py-4 text-center">No daily reports submitted yet</p> : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead><tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Key Updates</th>
                  <th className="px-4 py-3">Issues / Blockers</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action / Preview</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">{filteredDailyReports.slice((pageRep - 1) * PAGE_SIZE, pageRep * PAGE_SIZE).map((r) => (
                  <tr key={r.id} className="hover:bg-purple-50/30 transition">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{r.date || r.createdAt?.split('T')[0]}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{r.employeeName || 'Nitisha'}</td>
                    <td className="px-4 py-2.5 text-slate-700 max-w-[280px] truncate">{r.keyUpdates || r.tasksCompleted || 'Discipline investigation'}</td>
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
            <div className="p-5 bg-gradient-to-r from-slate-900 to-purple-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2 text-white">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Daily Report Full Preview
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">{selectedReport.employeeName || 'Nitisha'} • {selectedReport.date || selectedReport.createdAt?.split('T')[0]}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-1 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Key Performance Summary</label>
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                  {selectedReport.keyUpdates || selectedReport.tasksCompleted || 'No updates logged.'}
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
