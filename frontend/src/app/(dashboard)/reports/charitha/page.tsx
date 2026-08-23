'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Calendar, CreditCard, Eye, X, Download, Trash2
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Pagination } from '@/components/Pagination';

export default function CharithaReportPage() {
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  // Pagination states
  const [repPage, setRepPage] = useState(1);
  const [payPage, setPayPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
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
      } finally {
        setLoading(false);
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

  const getRecordImportDate = (r: any, isDailyReport = false): string => {
    if (isDailyReport) {
      if (r.reportDate) return String(r.reportDate).split('T')[0];
      if (r.date) return String(r.date).split('T')[0];
    }
    // For imported XLSX payroll records, use the date the file was imported / record was created
    if (r.importedDate) return String(r.importedDate).split('T')[0];
    if (r.importDate) return String(r.importDate).split('T')[0];
    if (r.uploadDate) return String(r.uploadDate).split('T')[0];
    if (r.createdAt) {
      if (typeof r.createdAt === 'string') return r.createdAt.split('T')[0];
      try { return new Date(r.createdAt).toISOString().split('T')[0]; } catch {}
    }
    if (r.updatedAt) {
      if (typeof r.updatedAt === 'string') return r.updatedAt.split('T')[0];
      try { return new Date(r.updatedAt).toISOString().split('T')[0]; } catch {}
    }
    // Fallbacks
    if (r.reportDate) return String(r.reportDate).split('T')[0];
    if (r.date) return String(r.date).split('T')[0];
    return '';
  };

  const matchesImportDateOrMonth = (r: any, isDailyReport = false) => {
    if (!filterDate && !filterMonth) return true;
    const recordDate = getRecordImportDate(r, isDailyReport);
    if (!recordDate) return false;
    if (filterDate) return recordDate === filterDate;
    if (filterMonth) return recordDate.startsWith(filterMonth);
    return true;
  };

  const filteredDailyReports = useMemo(() => {
    return dailyReports.filter((r) => matchesImportDateOrMonth(r, true));
  }, [dailyReports, filterDate, filterMonth]);

  const filteredPayrollRecords = useMemo(() => {
    return payrollRecords.filter((r) => {
      const dateMatch = matchesImportDateOrMonth(r, false);
      if (!dateMatch) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (r.employeeName || '').toLowerCase().includes(q) ||
        (r.employeeId || '').toLowerCase().includes(q) ||
        (r.department || '').toLowerCase().includes(q) ||
        (r.designation || '').toLowerCase().includes(q)
      );
    });
  }, [payrollRecords, filterDate, filterMonth, searchQuery]);

  const handleDeleteReport = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this daily report? It will be removed from all records and dashboards.')) return;
    try {
      await apiRequest(`/reports/daily/${id}`, { method: 'DELETE' });
      setDailyReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
      alert('Daily report deleted successfully from all records.');
    } catch (err: any) {
      alert(err?.message || 'Failed to delete daily report');
    }
  };

  const paginatedReports = useMemo(() => {
    const start = (repPage - 1) * PAGE_SIZE;
    return filteredDailyReports.slice(start, start + PAGE_SIZE);
  }, [filteredDailyReports, repPage]);

  const paginatedPayroll = useMemo(() => {
    const start = (payPage - 1) * PAGE_SIZE;
    return filteredPayrollRecords.slice(start, start + PAGE_SIZE);
  }, [filteredPayrollRecords, payPage]);

  // Aggregate KPI metrics based on filtered records
  const totalGross = filteredPayrollRecords.reduce((acc, r) => acc + safeNum(r.newSalary || r.grossSalary || r.grossPay || r.netPay), 0);
  const totalNet = filteredPayrollRecords.reduce((acc, r) => acc + safeNum(r.netPay || r.newSalary || r.grossSalary), 0);
  const totalLop = filteredPayrollRecords.reduce((acc, r) => acc + safeNum(r.lopDeduction), 0);
  const frozenCount = filteredPayrollRecords.filter((r) => r.attendanceFreeze === 'YES' || r.isFrozen === true).length;

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
      </div>

      {/* 📅 Date & Month Filter Controls Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="font-extrabold text-slate-800">Filter Payroll Data:</span>
          {filterDate && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
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
                setRepPage(1);
                setPayPage(1);
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
                setRepPage(1);
                setPayPage(1);
              }}
              className="text-xs font-bold text-slate-800 outline-none bg-transparent cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              setFilterDate(todayStr);
              setFilterMonth('');
              setRepPage(1);
              setPayPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filterDate === todayStr ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Today
          </button>

          <button
            onClick={() => {
              setFilterMonth(currentMonthStr);
              setFilterDate('');
              setRepPage(1);
              setPayPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              filterMonth === currentMonthStr && !filterDate ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            This Month
          </button>

          {(filterDate || filterMonth || searchQuery) && (
            <button
              onClick={() => {
                setFilterDate('');
                setFilterMonth('');
                setSearchQuery('');
                setRepPage(1);
                setPayPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition cursor-pointer border border-rose-200"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Payroll Records</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{loading ? '...' : filteredPayrollRecords.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total in DB: {payrollRecords.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Net Disbursed</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{loading ? '...' : `₹${totalNet.toLocaleString('en-IN')}`}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Filtered CTC Disbursed</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-xs">
          <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider">LOP Deductions</p>
          <p className="text-2xl font-black text-red-600 mt-1">{loading ? '...' : `-₹${totalLop.toLocaleString('en-IN')}`}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Loss of Pay Logged</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs">
          <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Daily Reports</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {loading ? '...' : filteredDailyReports.length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total in DB: {dailyReports.length}</p>
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
          <FileText className="w-4 h-4 text-rose-500" /> Daily Work Reports ({loading ? 'Loading...' : filteredDailyReports.length})
        </h2>
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading daily work reports...</span>
          </div>
        ) : filteredDailyReports.length === 0 ? (
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
                        <div className="flex items-center justify-end gap-1.5 ml-auto">
                          <button
                            onClick={() => setSelectedReport(r)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" /> Preview
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
          <CreditCard className="w-4 h-4 text-purple-600" /> Payroll Records ({loading ? 'Loading...' : filteredPayrollRecords.length})
        </h2>
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading payroll records...</span>
          </div>
        ) : filteredPayrollRecords.length === 0 ? (
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

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => handleDeleteReport(selectedReport.id)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-rose-200 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Report</span>
              </button>
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
