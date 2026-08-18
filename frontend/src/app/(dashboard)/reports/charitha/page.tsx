'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Calendar, CreditCard, Eye, X, Download
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Pagination } from '@/components/Pagination';

export default function CharithaReportPage() {
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  // Pagination states
  const [repPage, setRepPage] = useState(1);
  const [payPage, setPayPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    apiRequest('/payroll-public')
      .then(res => setPayrollRecords(Array.isArray(res) ? res : []))
      .catch(() => setPayrollRecords([]));

    apiRequest('/reports/daily')
      .then(res => {
        const arr = Array.isArray(res) ? res : [];
        setDailyReports(arr.filter((r: any) => r.userEmail === 'charitha@adyapan.com' || r.specialization === 'SALARY_PAYROLL'));
      })
      .catch(() => setDailyReports([]));
  }, []);

  const filterByDate = (records: any[]) => {
    if (!filterDate) return records;
    return records.filter((r) => {
      const created = r.date || (r.createdAt ? r.createdAt.split('T')[0] : '');
      return created === filterDate;
    });
  };

  const filteredPayrollRecords = filterByDate(payrollRecords);
  const filteredDailyReports = filterByDate(dailyReports);

  const paginatedReports = useMemo(() => {
    const start = (repPage - 1) * PAGE_SIZE;
    return filteredDailyReports.slice(start, start + PAGE_SIZE);
  }, [filteredDailyReports, repPage]);

  const paginatedPayroll = useMemo(() => {
    const start = (payPage - 1) * PAGE_SIZE;
    return filteredPayrollRecords.slice(start, start + PAGE_SIZE);
  }, [filteredPayrollRecords, payPage]);

  const safeNum = (val: any) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-rose-400" />
            <span>Charitha&apos;s Complete Salary & Payroll Report</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Salary disbursement records, attendance freeze tracking, and daily reports submitted by Charitha
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 shadow-xs">
            <Calendar className="w-4 h-4 text-rose-400" />
            <input 
              type="date" 
              value={filterDate} 
              onChange={(e) => {
                setFilterDate(e.target.value);
                setRepPage(1);
                setPayPage(1);
              }}
              className="text-xs font-bold text-white border-none outline-none bg-transparent cursor-pointer" 
            />
          </div>
          {filterDate && (
            <button 
              onClick={() => {
                setFilterDate('');
                setRepPage(1);
                setPayPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {filterDate && (
        <div className="px-4 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
          Showing records for: {filterDate}
        </div>
      )}

      {/* 1. Daily Work Reports Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="w-4 h-4 text-rose-500" /> Daily Work Reports ({filteredDailyReports.length})
        </h2>
        {filteredDailyReports.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No daily reports submitted for this date.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Key Performance Updates</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedReports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-2.5 font-bold text-slate-800">{r.date || r.createdAt?.split('T')[0]}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-700">{r.employeeName || 'Charitha'}</td>
                      <td className="px-4 py-2.5 text-slate-700 max-w-[320px] truncate">{r.keyUpdates || r.tasksCompleted || 'Payroll reconciliation'}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                          {r.status || 'SUBMITTED'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => setSelectedReport(r)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto"
                        >
                          <Eye className="w-3 h-3" /> Full Preview
                        </button>
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

      {/* 2. Payroll Records Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <CreditCard className="w-4 h-4 text-purple-600" /> Payroll Records ({filteredPayrollRecords.length})
        </h2>
        {filteredPayrollRecords.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No payroll records for this date.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="px-4 py-3">Emp ID</th>
                    <th className="px-4 py-3">Employee Name</th>
                    <th className="px-4 py-3">Designation</th>
                    <th className="px-4 py-3">Working Days</th>
                    <th className="px-4 py-3">LOP Days</th>
                    <th className="px-4 py-3">Net Salary</th>
                    <th className="px-4 py-3">Freeze Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPayroll.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-2.5 font-bold text-slate-800">{r.employeeId || `EMP-${1000 + idx}`}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-700">{r.employeeName || 'Staff'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{r.designation || '-'}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-700">{r.workingDays || 0}</td>
                      <td className="px-4 py-2.5 font-mono text-rose-600 font-bold">{r.lopDays || 0}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-emerald-700">₹{safeNum(r.netPay).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.attendanceFreeze === 'YES' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {r.attendanceFreeze === 'YES' ? 'Frozen' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={payPage}
              totalItems={filteredPayrollRecords.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPayPage}
            />
          </div>
        )}
      </section>

      {/* Modal Preview */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-rose-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2 text-white">
                  <CreditCard className="w-5 h-5 text-rose-400" />
                  Daily Payroll Report Full Preview
                </h3>
                <p className="text-xs text-rose-200 mt-0.5">{selectedReport.employeeName || 'Charitha'} • {selectedReport.date || selectedReport.createdAt?.split('T')[0]}</p>
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
                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                  {selectedReport.keyUpdates || selectedReport.tasksCompleted || 'No key updates provided.'}
                </div>
              </div>
              {selectedReport.issue && (
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Issues / Blockers</label>
                  <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-800 font-medium">
                    {selectedReport.issue}
                  </div>
                </div>
              )}
              {selectedReport.comment && (
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Remarks</label>
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
