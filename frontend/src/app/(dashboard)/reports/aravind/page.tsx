'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FileText, ShieldAlert, UserX, UserMinus, LogOut, CreditCard, MessageSquareWarning, ClipboardList, Calendar, Eye, X, Download } from 'lucide-react';
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
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

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
    aravindApi.getRetention().then(setRetention).catch(() => {});
    aravindApi.getResignation().then(setResignation).catch(() => {});
    aravindApi.getAbscond().then((res) => {
      const list = Array.isArray(res) ? res : [];
      const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('adyapan_aravind_abscond') : null;
      let localList: any[] = [];
      try { localList = savedLocal ? JSON.parse(savedLocal) : []; } catch { localList = []; }
      const existingIds = new Set(list.map((r: any) => r.id || r._id || r.employeeId));
      const combined = [...list, ...localList.filter((r: any) => !existingIds.has(r.id || r._id || r.employeeId))];
      setAbscond(combined);
    }).catch(() => {
      const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('adyapan_aravind_abscond') : null;
      let localList: any[] = [];
      try { localList = savedLocal ? JSON.parse(savedLocal) : []; } catch { localList = []; }
      setAbscond(localList);
    });
    aravindApi.getExitClearance().then(setExit).catch(() => {});
    aravindApi.getFnF().then(setFnf).catch(() => {});
    aravindApi.getComplaints().then(setComplaints).catch(() => {});
    aravindApi.getExitInterview().then(setInterviews).catch(() => {});
    apiRequest('/reports/daily').then((res) => {
      const arr = Array.isArray(res) ? res : [];
      setDailyReports(arr.filter((r: any) => 
        r.userEmail === 'aravind@adyapan.com' || 
        r.specialization === 'RESIGNATION_EXIT' || 
        (r.employeeName || '').toLowerCase().includes('aravind')
      ));
    }).catch(() => {
      aravindApi.getDailyReports().then((res) => {
        const arr = Array.isArray(res) ? res : [];
        setDailyReports(arr.filter((r: any) => 
          r.userEmail === 'aravind@adyapan.com' || 
          r.specialization === 'RESIGNATION_EXIT' || 
          (r.employeeName || '').toLowerCase().includes('aravind')
        ));
      }).catch(() => setDailyReports([]));
    });
  }, []);

  const filterByDate = (records: any[]) => {
    if (!filterDate) return records;
    return records.filter((r) => {
      const created = r.date || r.reportDate || r.dateOfResignation || r.lastWorkingDay || (r.createdAt ? r.createdAt.split('T')[0] : '');
      return created === filterDate;
    });
  };

  const filteredRetention = filterByDate(retention);
  const filteredResignation = filterByDate(resignation);
  const filteredAbscond = filterByDate(abscond);
  const filteredExit = filterByDate(exit);
  const filteredFnf = filterByDate(fnf);
  const filteredComplaints = filterByDate(complaints);
  const filteredInterviews = filterByDate(interviews);
  const filteredDailyReports = filterDate
    ? dailyReports.filter((r) => r.reportDate === filterDate || r.date === filterDate || (r.createdAt && r.createdAt.split('T')[0] === filterDate))
    : dailyReports;

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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 shadow-xs">
            <Calendar className="w-4 h-4 text-sky-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="text-xs font-bold text-white border-none outline-none bg-transparent cursor-pointer"
            />
          </div>
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {filterDate && (
        <div className="px-4 py-2.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs font-bold text-sky-800">
          Showing records for: {filterDate}
        </div>
      )}

      {/* Retention Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldAlert className="w-4 h-4 text-amber-600" /> Retention Cases ({filteredRetention.length})
        </h2>
        {filteredRetention.length === 0 ? <p className="text-xs text-slate-400 py-4 text-center">No retention records found.</p> : (
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
          <UserX className="w-4 h-4 text-red-600" /> Resignations ({filteredResignation.length})
        </h2>
        {filteredResignation.length === 0 ? <p className="text-xs text-slate-400 py-4 text-center">No resignation records found.</p> : (
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
          <UserMinus className="w-4 h-4 text-rose-600" /> Abscond Cases ({filteredAbscond.length})
        </h2>
        {filteredAbscond.length === 0 ? <p className="text-xs text-slate-400 py-4 text-center">No abscond records found.</p> : (
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
          <FileText className="w-4 h-4 text-sky-600" /> Daily Reports Submitted ({filteredDailyReports.length})
        </h2>
        {filteredDailyReports.length === 0 ? <p className="text-xs text-slate-400 py-4 text-center">No daily reports submitted yet</p> : (
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
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setSelectedReport(null)} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer">Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
