'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Calendar, CreditCard, Eye, X
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function CharithaReportPage() {
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

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

  const safeNum = (val: any) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  return (
    <div className="space-y-8">
      {/* Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-500" />
            <span>Charitha&apos;s Complete Salary & Payroll Report</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Salary disbursement records, attendance freeze tracking, and daily reports submitted by Charitha
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
            <Calendar className="w-4 h-4 text-orange-500" />
            <input 
              type="date" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)}
              className="text-sm font-semibold text-slate-700 border-none outline-none bg-transparent cursor-pointer" 
            />
          </div>
          {filterDate && (
            <button 
              onClick={() => setFilterDate('')} 
              className="px-3 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {filterDate && (
        <div className="px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-700">
          Showing records for: {filterDate}
        </div>
      )}

      {/* 1. Daily Work Reports Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <FileText className="w-4 h-4 text-orange-500" /> Daily Work Reports ({filteredDailyReports.length})
        </h2>
        {filteredDailyReports.length === 0 ? (
          <p className="text-xs text-slate-400">No daily reports submitted for this date</p>
        ) : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="px-3 py-2 text-left font-bold">Date</th>
                  <th className="px-3 py-2 text-left font-bold">Employee</th>
                  <th className="px-3 py-2 text-left font-bold">Key Performance Updates</th>
                  <th className="px-3 py-2 text-left font-bold">Status</th>
                  <th className="px-3 py-2 text-right font-bold">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDailyReports.map((r: any) => (
                  <tr key={r.id} className="hover:bg-orange-50/30">
                    <td className="px-3 py-2 font-bold text-slate-800">{r.date || r.createdAt?.split('T')[0]}</td>
                    <td className="px-3 py-2 font-semibold text-slate-700">{r.employeeName || 'Charitha'}</td>
                    <td className="px-3 py-2 text-slate-700 max-w-[280px] truncate">
                      {r.keyUpdates || r.tasksCompleted || 'Payroll processing completed'}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {r.status || 'SUBMITTED'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => setSelectedReport(r)} className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto">
                        <Eye className="w-3 h-3 text-slate-600" /> Full Preview
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 2. Detailed Payroll Audit Table */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <CreditCard className="w-4 h-4 text-emerald-600" /> Detailed Payroll Audit ({filteredPayrollRecords.length})
        </h2>
        
        {filteredPayrollRecords.length === 0 ? (
          <p className="text-xs text-slate-400">No payroll records found for this date.</p>
        ) : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto shadow-xs">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <th className="py-3 px-3">Employee</th>
                  <th className="py-3 px-3">Work Days</th>
                  <th className="py-3 px-3">Leaves</th>
                  <th className="py-3 px-3">LOP Days</th>
                  <th className="py-3 px-3">Deduction</th>
                  <th className="py-3 px-3">Gross</th>
                  <th className="py-3 px-3 font-black text-emerald-700">Net Pay</th>
                  <th className="py-3 px-3 text-center">Frozen</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPayrollRecords.map((record: any, idx: number) => {
                  const wDays = safeNum(record.workingDays);
                  const lTaken = safeNum(record.leavesTaken);
                  const lopD = safeNum(record.lopDays);
                  const lopDed = safeNum(record.lopDeduction);
                  const gross = safeNum(record.newSalary || record.oldSalary);
                  const net = safeNum(record.netPay);

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{record.employeeName || 'Unknown'}</td>
                      <td className="py-2.5 px-3">{wDays.toFixed(1)}</td>
                      <td className="py-2.5 px-3">{lTaken.toFixed(1)}</td>
                      <td className="py-2.5 px-3">{lopD.toFixed(1)}</td>
                      <td className="py-2.5 px-3 text-amber-600">₹{lopDed.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3">₹{gross.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 font-black text-emerald-600">₹{net.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-center">
                        {record.attendanceFreeze === 'YES' ? <span className="text-red-500 font-bold">YES</span> : <span className="text-slate-400">NO</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">PROCESSED</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Full Report Preview Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 text-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between saffron-gradient text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-black">Charitha Daily Report Preview</h3>
                  <p className="text-[10px] text-orange-100">Charitha (Salary & Payroll) — {selectedReport.date || selectedReport.createdAt?.split('T')[0]}</p>
                </div>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Key Performance Updates</label>
                <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                  {selectedReport.keyUpdates || selectedReport.tasksCompleted || 'No key updates provided.'}
                </div>
              </div>
              {selectedReport.comment && (
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Remarks & Notes</label>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium whitespace-pre-wrap">
                    {selectedReport.comment}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setSelectedReport(null)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
