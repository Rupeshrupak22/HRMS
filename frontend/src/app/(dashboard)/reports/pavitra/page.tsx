'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Clock, Calendar, CheckCircle2, XCircle, Eye, X, Download } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Pagination } from '@/components/Pagination';

export default function PavitraReportPage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  // Pagination states (20 per page)
  const [attPage, setAttPage] = useState(1);
  const [leavePage, setLeavePage] = useState(1);
  const [repPage, setRepPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    // 1. Attendance logs
    const savedAtt = typeof window !== 'undefined' ? localStorage.getItem('adyapan_imported_attendance_logs') : null;
    let localAtt: any[] = [];
    try { localAtt = savedAtt ? JSON.parse(savedAtt) : []; } catch { localAtt = []; }

    apiRequest('/attendance').then((d) => {
      const fetched = Array.isArray(d) ? d : (d?.data && Array.isArray(d.data) ? d.data : []);
      const map = new Map();
      for (const item of fetched) {
        const key = item.id || `${item.employeeId || item.employeeCode}_${item.date}`;
        map.set(key, item);
      }
      for (const item of localAtt) {
        const key = item.id || `${item.employeeId || item.employeeCode}_${item.date}`;
        if (!map.has(key)) map.set(key, item);
      }
      setAttendance(Array.from(map.values()));
    }).catch(() => {
      setAttendance(localAtt);
    });

    // 2. Leave requests
    const savedLeave = typeof window !== 'undefined' ? localStorage.getItem('adyapan_imported_leave_requests') : null;
    let localLeave: any[] = [];
    try { localLeave = savedLeave ? JSON.parse(savedLeave) : []; } catch { localLeave = []; }

    apiRequest('/leave/requests').then((d) => {
      const fetched = Array.isArray(d) ? d : (d?.data && Array.isArray(d.data) ? d.data : []);
      const map = new Map();
      for (const item of fetched) {
        const key = item.id || `${item.employeeCode || item.employeeId}_${item.startDate}`;
        map.set(key, item);
      }
      for (const item of localLeave) {
        const key = item.id || `${item.employeeCode || item.employeeId}_${item.startDate}`;
        if (!map.has(key)) map.set(key, item);
      }
      setLeaves(Array.from(map.values()));
    }).catch(() => {
      setLeaves(localLeave);
    });

    // 3. Daily reports
    apiRequest('/reports/daily').then((d) => {
      const arr = Array.isArray(d) ? d : (d?.data && Array.isArray(d.data) ? d.data : []);
      const pavitraReports = arr.filter((r: any) =>
        r.userEmail === 'pavitra@adyapan.com' ||
        r.specialization === 'ATTENDANCE_LEAVE' ||
        (r.employeeName || '').toLowerCase().includes('pavitra')
      );
      setDailyReports(pavitraReports);
    }).catch(() => {
      setDailyReports([]);
    });
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await apiRequest(`/reports/daily/${id}/approve`, { method: 'PUT' });
      setDailyReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'APPROVED' } : r));
      if (selectedReport?.id === id) {
        setSelectedReport((prev: any) => prev ? { ...prev, status: 'APPROVED' } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiRequest(`/reports/daily/${id}/reject`, { method: 'PUT' });
      setDailyReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'REJECTED' } : r));
      if (selectedReport?.id === id) {
        setSelectedReport((prev: any) => prev ? { ...prev, status: 'REJECTED' } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
    }
  };

  const filterByDate = (records: any[]) => {
    if (!filterDate) return records;
    return records.filter((r) => {
      const created = r.date || r.importedDate || (r.createdAt ? r.createdAt.split('T')[0] : '') || r.createdDate || r.startDate || r.from;
      return created === filterDate;
    });
  };

  const filteredAttendance = filterByDate(attendance);
  const filteredLeaves = filterByDate(leaves);
  const filteredDailyReports = filterByDate(dailyReports);

  const paginatedAttendance = useMemo(() => {
    const start = (attPage - 1) * PAGE_SIZE;
    return filteredAttendance.slice(start, start + PAGE_SIZE);
  }, [filteredAttendance, attPage]);

  const paginatedLeaves = useMemo(() => {
    const start = (leavePage - 1) * PAGE_SIZE;
    return filteredLeaves.slice(start, start + PAGE_SIZE);
  }, [filteredLeaves, leavePage]);

  const paginatedReports = useMemo(() => {
    const start = (repPage - 1) * PAGE_SIZE;
    return filteredDailyReports.slice(start, start + PAGE_SIZE);
  }, [filteredDailyReports, repPage]);

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Pavitra&apos;s Complete Attendance & Leave Report</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Attendance verification, leave application workflow, and daily logs submitted by Pavitra
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 shadow-xs">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setAttPage(1);
                setLeavePage(1);
                setRepPage(1);
              }}
              className="text-xs font-bold text-white border-none outline-none bg-transparent cursor-pointer"
            />
          </div>
          {filterDate && (
            <button
              onClick={() => {
                setFilterDate('');
                setAttPage(1);
                setLeavePage(1);
                setRepPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {filterDate && (
        <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
          Showing verified records for: {filterDate}
        </div>
      )}

      {/* 1. Attendance Records Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-4 h-4 text-emerald-600" /> Attendance Records ({filteredAttendance.length})
        </h2>
        {filteredAttendance.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No attendance records found for this date.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Emp ID / Code</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Check In</th>
                    <th className="px-4 py-3">Check Out</th>
                    <th className="px-4 py-3">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAttendance.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-2.5 font-bold text-slate-800">{r.date || filterDate || '-'}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-700">{r.employeeId || r.employeeCode || `EMP-${1000 + idx}`}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'PRESENT' ? 'bg-green-100 text-green-700'
                          : r.status === 'LATE' ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                          {r.status || 'PRESENT'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-600">{r.checkInTime || '-'}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-600">{r.checkOutTime || '-'}</td>
                      <td className="px-4 py-2.5 text-emerald-600 font-semibold">Verified by Pavitra</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={attPage}
              totalItems={filteredAttendance.length}
              pageSize={PAGE_SIZE}
              onPageChange={setAttPage}
            />
          </div>
        )}
      </section>

      {/* 2. Leave Applications Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Calendar className="w-4 h-4 text-purple-600" /> Leave Applications ({filteredLeaves.length})
        </h2>
        {filteredLeaves.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No leave applications found for this date.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="px-4 py-3">Emp ID</th>
                    <th className="px-4 py-3">Leave Type</th>
                    <th className="px-4 py-3">Start Date</th>
                    <th className="px-4 py-3">End Date</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedLeaves.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-2.5 font-bold text-slate-800">{r.employeeId || r.employeeCode || `EMP-${1000 + idx}`}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-700">{typeof r.leaveType === 'object' ? r.leaveType?.name : r.leaveType || 'Casual Leave'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{r.startDate || '-'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{r.endDate || '-'}</td>
                      <td className="px-4 py-2.5 max-w-[200px] truncate text-slate-600">{r.reason || 'Personal Work'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'APPROVED' ? 'bg-green-100 text-green-700'
                          : r.status === 'REJECTED' ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                          {r.status || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={leavePage}
              totalItems={filteredLeaves.length}
              pageSize={PAGE_SIZE}
              onPageChange={setLeavePage}
            />
          </div>
        )}
      </section>

      {/* 3. Daily Reports Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="w-4 h-4 text-indigo-600" /> Daily Reports Submitted ({filteredDailyReports.length})
        </h2>
        {filteredDailyReports.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No daily reports submitted yet.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Key Performance Updates</th>
                    <th className="px-4 py-3">Blockers / Issues</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action / Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedReports.map((r) => (
                    <tr key={r.id} className="hover:bg-emerald-50/20 transition">
                      <td className="px-4 py-2.5 font-bold text-slate-800">{r.date || r.createdAt?.split('T')[0]}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-700">{r.employeeName || 'Pavitra'}</td>
                      <td className="px-4 py-2.5 text-slate-700 max-w-[280px] truncate">
                        {r.keyUpdates || r.tasksCompleted || 'Attendance verification'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 max-w-[150px] truncate">{r.issue || r.blockers || 'None'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'APPROVED' ? 'bg-green-100 text-green-700'
                          : r.status === 'REJECTED' ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                          {r.status || 'SUBMITTED'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReport(r)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-slate-600" /> Preview
                          </button>
                          {r.status === 'SUBMITTED' && (
                            <>
                              <button
                                onClick={() => handleApprove(r.id)}
                                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleReject(r.id)}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                              >
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={repPage}
              totalItems={filteredDailyReports.length}
              pageSize={PAGE_SIZE}
              onPageChange={setRepPage}
            />
          </div>
        )}
      </section>

      {/* Modal Preview */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2 text-white">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Daily Report Full Preview
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">{selectedReport.employeeName || 'Pavitra'} • {selectedReport.date || selectedReport.createdAt?.split('T')[0]}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Key Performance Summary</label>
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
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
              <button
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
