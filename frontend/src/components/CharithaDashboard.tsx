'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, DollarSign, TrendingDown, FileText,
  CalendarDays, Clock, FileCheck, Send, Snowflake,
  ArrowUpRight, CreditCard
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export function CharithaDashboard({ isManagerView = false }: { isManagerView?: boolean }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    apiRequest(`/reports/dashboard-metrics?t=${Date.now()}`).then((data: any) => {
      setMetrics(data);
    }).catch(() => {});
  }, []);

  const p = metrics?.payroll || {};
  const totalEmployees = p.totalRecords || 0;
  const netPay = p.totalNet || 0;
  const lopDays = p.totalLopDays || 0;
  const deductions = p.totalDeductions || 0;
  const workingDays = p.totalWorkingDays || 0;
  const leavesTaken = p.totalLeavesTaken || 0;
  const attendanceFrozen = p.attendanceFrozen || 0;
  const salaryChanges = p.salaryChanges || 0;
  
  // All records
  const allRecords = p.records || [];

  const cards = [
    { id: 'total', label: 'Total Employees', value: totalEmployees, sub: 'Records Uploaded', icon: Users, color: 'blue' },
    { id: 'netpay', label: 'Net Pay', value: `₹${netPay.toLocaleString()}`, sub: 'Ready for Credit', icon: DollarSign, color: 'emerald' },
    { id: 'deductions', label: 'Total Deduction', value: `₹${deductions.toLocaleString()}`, sub: 'Deducted from Gross', icon: FileText, color: 'amber' },
    { id: 'leaves', label: 'Leaves Taken', value: leavesTaken.toFixed(1), sub: 'Approved Leaves', icon: Clock, color: 'sky' },
    { id: 'frozen', label: 'Attendance Frozen', value: attendanceFrozen, sub: 'Freeze records', icon: Snowflake, color: 'slate' },
    { id: 'hikes', label: 'Salary Updates', value: salaryChanges, sub: 'Recent Hikes', icon: ArrowUpRight, color: 'emerald' },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', iconBg: 'bg-amber-100' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', iconBg: 'bg-red-100' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', iconBg: 'bg-blue-100' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', iconBg: 'bg-purple-100' },
    sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-600', iconBg: 'bg-sky-100' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', iconBg: 'bg-slate-100' },
  };

  const getFilteredRecords = () => {
    if (!activeFilter) return allRecords;
    switch (activeFilter) {
      case 'lop': return allRecords.filter((r: any) => parseFloat(r.lopDays || '0') > 0);
      case 'deductions': return allRecords.filter((r: any) => parseFloat(r.lopDeduction || '0') > 0);
      case 'leaves': return allRecords.filter((r: any) => parseFloat(r.leavesTaken || '0') > 0);
      case 'frozen': return allRecords.filter((r: any) => r.attendanceFreeze === 'YES');
      case 'hikes': return allRecords.filter((r: any) => r.salaryChangeDate && r.salaryChangeDate !== '');
      case 'netpay': 
      case 'working':
      case 'total':
      default: return allRecords;
    }
  };

  const filteredRecords = getFilteredRecords();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <span>Charitha — HR Salary & Payroll System</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
              PAYROLL SPECIALIST
            </span>
          </h1>
          <p className="text-xs text-orange-100 mt-1">
            Master control panel for monthly CTC breakdown, PF/ESI/TDS tax deductions, and daily reports
          </p>
        </div>
        {!isManagerView && (
          <div className="flex gap-2">
            <Link href="/payroll" className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md">
              Process Payroll
            </Link>
            <Link href="/daily-reports" className="px-4 py-2 rounded-xl bg-black/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> Submit Daily Report
            </Link>
          </div>
        )}
      </div>

      {/* Stats Cards as Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const c = colorMap[card.color];
          const isActive = activeFilter === card.id;
          
          return (
            <button key={card.id} onClick={() => setActiveFilter(isActive ? null : card.id)}
              className={`p-5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all text-left ${isActive ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-200' : 'bg-white border-slate-200 hover:border-orange-300'}`}>
              <div>
                <div className="text-xs text-slate-500 font-semibold">{card.label}</div>
                <div className={`text-2xl font-black mt-1 ${isActive ? 'text-orange-600' : c.text}`}>{card.value}</div>
                <div className="text-[10px] text-slate-500 mt-1">{card.sub}</div>
              </div>
              <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${isActive ? 'bg-orange-100 border-orange-200 text-orange-600' : c.iconBg + ' ' + c.border + ' ' + c.text}`}>
                <Icon className="w-5 h-5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Payroll Records */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-orange-500" /> Payroll Records {activeFilter ? '(Filtered)' : ''}
            </h3>
            {activeFilter && (
              <button onClick={() => setActiveFilter(null)} className="text-xs text-orange-600 font-bold hover:underline">Clear Filter</button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 rounded-l-lg">Employee</th>
                  <th className="py-3 px-4">Gross</th>
                  <th className="py-3 px-4">Net Credit</th>
                  <th className="py-3 px-4 text-right rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{record.employeeName || 'Unknown'}</td>
                      <td className="py-3 px-4">₹{parseFloat(record.newSalary || record.oldSalary || '0').toLocaleString()}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">₹{parseFloat(record.netPay || '0').toLocaleString()}</td>
                      <td className="py-3 px-4 text-right"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-full">PROCESSED</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">No matching records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Reports */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-violet-500" /> Recent Daily Task Reports
            </h3>
          </div>
          <div className="space-y-3">
            {metrics?.dailyReports?.length > 0 ? (
              metrics.dailyReports.slice(0, 5).map((report: any) => (
                <div key={report.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-200 transition-colors">
                  <div>
                    <div className="font-bold text-slate-900">{report.employeeName}</div>
                    <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">{report.keyUpdates || 'No updates'}</div>
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-[10px] text-slate-400">{report.date}</span>
                    <span className="px-2 py-1 bg-violet-50 text-violet-700 text-[9px] font-bold rounded-full uppercase tracking-wider">{report.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">No daily reports available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
