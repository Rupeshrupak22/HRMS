'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Calendar, DollarSign, FileSpreadsheet, 
  Users, TrendingDown, CheckCircle2, Clock, CalendarDays, FileCheck,
  Snowflake, ArrowUpRight 
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function CharithaReportPage() {
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    // Fetch payroll records directly (no auth needed for report view)
    fetch('http://localhost:4000/api/v1/payroll-public').then(r => r.json()).then((data) => {
      setPayrollRecords(Array.isArray(data) ? data : []);
    }).catch(() => {});

    // Fetch daily reports (no auth needed for report view)
    fetch('http://localhost:4000/api/v1/reports/daily').then(r => r.json()).then((reports: any) => {
      const arr = Array.isArray(reports) ? reports : [];
      const charithaReports = arr.filter((r: any) => r.userEmail === 'charitha@adyapan.com' || r.specialization === 'SALARY_PAYROLL');
      setDailyReports(charithaReports);
    }).catch(() => {});
  }, []);

  const filterByDate = (records: any[]) => {
    if (!filterDate) return records;
    return records.filter((r) => {
      const dateField = r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-CA') : '');
      return dateField === filterDate;
    });
  };

  const filteredDailyReports = filterByDate(dailyReports);
  const filteredPayrollRecords = filterDate
    ? payrollRecords.filter((r) => {
        const created = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-CA') : '';
        return created === filterDate;
      })
    : payrollRecords;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            <span>Charitha&apos;s Complete Report</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Payroll & Salary specialist — daily activity and payroll logs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
            <Calendar className="w-4 h-4 text-orange-500" />
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
              className="text-sm font-semibold text-slate-700 border-none outline-none bg-transparent cursor-pointer" />
          </div>
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="px-3 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer">
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

      {/* Daily Reports Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <FileText className="w-4 h-4 text-slate-600" /> Daily Task Reports ({filteredDailyReports.length})
        </h2>
        {filteredDailyReports.length === 0 ? <p className="text-xs text-slate-400">No reports submitted yet</p> : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-bold text-slate-600">Date</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Employee Name</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Key Updates</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Issues</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Status</th>
              </tr></thead>
              <tbody>{filteredDailyReports.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold">{r.date || (r.createdAt && r.createdAt.split('T')[0])}</td>
                  <td className="px-4 py-3">{r.employeeName || 'Charitha'}</td>
                  <td className="px-4 py-3">{r.keyUpdates || 'N/A'}</td>
                  <td className="px-4 py-3">{r.issue || 'None'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-violet-50 text-violet-700 text-[9px] font-bold rounded-full uppercase">{r.status || 'SUBMITTED'}</span>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent Payroll Credits Section */}
      <section className="space-y-3 mt-8">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Payroll Records ({filteredPayrollRecords.length})
        </h2>
        {filteredPayrollRecords.length === 0 ? <p className="text-xs text-slate-400">No records found</p> : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
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
                {filteredPayrollRecords.map((record: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{record.employeeName || 'Unknown'}</td>
                    <td className="py-2.5 px-3">{parseFloat(record.workingDays || '0').toFixed(1)}</td>
                    <td className="py-2.5 px-3">{parseFloat(record.leavesTaken || '0').toFixed(1)}</td>
                    <td className="py-2.5 px-3">{parseFloat(record.lopDays || '0').toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-amber-600">₹{parseFloat(record.lopDeduction || '0').toLocaleString()}</td>
                    <td className="py-2.5 px-3">₹{parseFloat(record.newSalary || record.oldSalary || '0').toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-black text-emerald-600">₹{parseFloat(record.netPay || '0').toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-center">
                      {record.attendanceFreeze === 'YES' ? <span className="text-red-500 font-bold">YES</span> : <span className="text-slate-400">NO</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">PROCESSED</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
