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
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  // Pagination states
  const [repPage, setRepPage] = useState(1);
  const [payPage, setPayPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    async function loadData() {
      try {
        const [payRes, dailyRes] = await Promise.allSettled([
          apiRequest('/payroll-public').catch(() => apiRequest('/payroll/manual')),
          apiRequest('/reports/daily').catch(() => []),
        ]);

        if (payRes.status === 'fulfilled' && payRes.value) {
          const list = Array.isArray(payRes.value)
            ? payRes.value
            : payRes.value.data || payRes.value.records || [];
          if (list.length > 0) {
            setPayrollRecords(list);
          }
        }

        if (dailyRes.status === 'fulfilled' && dailyRes.value) {
          const arr = Array.isArray(dailyRes.value) ? dailyRes.value : [];
          setDailyReports(
            arr.filter(
              (r: any) =>
                r.userEmail === 'charitha@adyapan.com' ||
                r.specialization === 'SALARY_PAYROLL' ||
                (r.employeeName || '').toLowerCase().includes('charitha')
            )
          );
        }
      } catch (e) {
        console.error('Failed to load Charitha report data:', e);
      }
    }
    loadData();
  }, []);

  const safeNum = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const clean = String(val).replace(/[^0-9.-]+/g, '');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  };

  const filteredDailyReports = filterDate
    ? dailyReports.filter((r) => {
        const created = r.reportDate || r.date || (r.createdAt ? r.createdAt.split('T')[0] : '');
        return created === filterDate;
      })
    : dailyReports;

  const filteredPayrollRecords = searchQuery
    ? payrollRecords.filter(
        (r) =>
          (r.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.designation || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : payrollRecords;

  const paginatedReports = useMemo(() => {
    const start = (repPage - 1) * PAGE_SIZE;
    return filteredDailyReports.slice(start, start + PAGE_SIZE);
  }, [filteredDailyReports, repPage]);

  const paginatedPayroll = useMemo(() => {
    const start = (payPage - 1) * PAGE_SIZE;
    return filteredPayrollRecords.slice(start, start + PAGE_SIZE);
  }, [filteredPayrollRecords, payPage]);

  // Aggregate KPI metrics
  const totalGross = payrollRecords.reduce((acc, r) => acc + safeNum(r.newSalary || r.grossSalary || r.grossPay || r.netPay), 0);
  const totalNet = payrollRecords.reduce((acc, r) => acc + safeNum(r.netPay || r.newSalary || r.grossSalary), 0);
  const totalLop = payrollRecords.reduce((acc, r) => acc + safeNum(r.lopDeduction), 0);
  const frozenCount = payrollRecords.filter((r) => r.attendanceFreeze === 'YES' || r.isFrozen === true).length;

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>Charitha&apos;s Complete Salary &amp; Payroll Report</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Salary disbursement records, attendance freeze tracking, and daily reports submitted by Charitha
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
                setRepPage(1);
              }}
              className="text-xs font-bold text-white border-none outline-none bg-transparent cursor-pointer"
            />
          </div>
          {filterDate && (
            <button
              onClick={() => {
                setFilterDate('');
                setRepPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Payroll Records</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{payrollRecords.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Logged Employees</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Net Disbursed</p>
          <p className="text-2xl font-black text-slate-900 mt-1">₹{totalNet.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total CTC Disbursed</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-xs">
          <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider">LOP Deductions</p>
          <p className="text-2xl font-black text-red-600 mt-1">-₹{totalLop.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Loss of Pay Logged</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs">
          <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Attendance Status</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {frozenCount > 0 ? `${frozenCount} Frozen` : 'Active'}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Monthly Payroll Lock</p>
        </div>
      </div>

      {filterDate && (
        <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
          Showing daily reports for: {filterDate}
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
