'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FileText, TrendingUp, ShieldAlert, Users, Calendar, Eye, X, Download, AlertCircle } from 'lucide-react';
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
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

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

  const filterByDate = (records: any[]) => {
    if (!filterDate) return records;
    return records.filter((r) => {
      const created = r.date || (r.createdAt ? r.createdAt.split('T')[0] : '');
      return created === filterDate;
    });
  };

  const filteredPerformances = filterByDate(performances);
  const filteredIssues = filterByDate(issues);
  const filteredDiscipline = filterByDate(discipline);
  const filteredRelations = filterByDate(relations);
  const filteredDailyReports = filterByDate(dailyReports);

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-purple-400" />
            <span>Nitisha&apos;s Complete Discipline & POSH Report</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Discipline cases, employee engagement relations, PIP records, and daily reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 shadow-xs">
            <Calendar className="w-4 h-4 text-purple-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setPagePerf(1);
                setPageDisc(1);
                setPageRel(1);
                setPageRep(1);
              }}
              className="text-xs font-bold text-white border-none outline-none bg-transparent cursor-pointer"
            />
          </div>
          {filterDate && (
            <button
              onClick={() => {
                setFilterDate('');
                setPagePerf(1);
                setPageDisc(1);
                setPageRel(1);
                setPageRep(1);
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {filterDate && (
        <div className="px-4 py-2.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-800">
          Showing records for: {filterDate}
        </div>
      )}

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
                      <button onClick={() => setSelectedReport(r)} className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto">
                        <Eye className="w-3 h-3 text-slate-600" /> Full Preview
                      </button>
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
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setSelectedReport(null)} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer">Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
