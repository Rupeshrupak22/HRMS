'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DollarSign, FileText, Send, Users, CreditCard, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';

export function CharithaDashboard() {
  const [records, setRecords] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiRequest('/payroll/manual');
        setRecords(Array.isArray(data) ? data : []);
      } catch { setRecords([]); }
      try {
        const reports = await apiRequest('/reports/daily');
        setDailyReports(Array.isArray(reports) ? reports.filter((r: any) => r.userEmail === 'charitha@adyapan.com') : []);
      } catch { setDailyReports([]); }
      setLoading(false);
    }
    load();
  }, []);

  const totalEmployees = records.length;
  let totalLopDays = 0;
  let totalLopDeduction = 0;
  let totalNetPay = 0;

  records.forEach((r) => {
    totalLopDays += parseFloat(r.lopDays || '0') || 0;
    totalLopDeduction += parseFloat(r.lopDeduction || '0') || 0;
    totalNetPay += parseFloat(r.netPay || '0') || 0;
  });

  if (loading) return <div className="p-10 text-center text-slate-400 text-sm">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <span>Charitha — HR Salary & Payroll Disbursement Center</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
              PAYROLL SPECIALIST
            </span>
          </h1>
          <p className="text-xs text-orange-100 mt-1">
            Monthly CTC breakdown, PF/ESI/TDS tax deductions, bank disbursal statements & payslips
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/payroll-management" className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer">
            <CreditCard className="w-4 h-4" />
            <span>Manage Payroll</span>
          </Link>
          <Link href="/daily-reports" className="px-4 py-2 rounded-xl bg-black/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1 cursor-pointer">
            <Send className="w-3.5 h-3.5" /> Submit Daily Report
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Total Payroll Records</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalEmployees}</div>
            <div className="text-[10px] text-emerald-600 mt-1 font-bold">Employees in system</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Total LOP Days</div>
            <div className="text-2xl font-black text-red-600 mt-1">{totalLopDays.toFixed(1)}</div>
            <div className="text-[10px] text-slate-500 mt-1">Loss of Pay logged</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Total LOP Deduction</div>
            <div className="text-2xl font-black text-amber-600 mt-1">₹{totalLopDeduction.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-slate-500 mt-1">Deducted from gross</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Net Pay Disbursement</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">₹{totalNetPay.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-emerald-600 mt-1 font-bold">Ready for credit</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Verified Records</div>
            <div className="text-2xl font-black text-blue-600 mt-1">{records.filter((r) => r.verifiedBy).length} / {totalEmployees}</div>
            <div className="text-[10px] text-slate-500 mt-1">Head approval done</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Pending Approval</div>
            <div className="text-2xl font-black text-violet-600 mt-1">{records.filter((r) => !r.headApproval).length}</div>
            <div className="text-[10px] text-slate-500 mt-1">Awaiting head sign-off</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recent Payroll Records */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900">Recent Payroll Records</h3>
          <Link href="/payroll-management" className="text-xs font-bold text-orange-600 hover:underline cursor-pointer">View All →</Link>
        </div>
        {records.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No payroll records yet. Add records from Payroll Management.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">LOP Days</th>
                  <th className="py-2.5 px-3">Deduction</th>
                  <th className="py-2.5 px-3">Net Pay</th>
                  <th className="py-2.5 px-3 text-right">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {records.slice(0, 5).map((r) => (
                  <tr key={r.id} className="hover:bg-orange-50/30">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{r.employeeName || r.employeeId || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-700">{r.department || '—'}</td>
                    <td className="py-2.5 px-3 text-red-600">{r.lopDays || '0'}</td>
                    <td className="py-2.5 px-3 text-amber-600">₹{r.lopDeduction || '0'}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600">₹{r.netPay || '0'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${r.verifiedBy ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {r.verifiedBy ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily Reports Summary */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900">Daily Reports</h3>
          <Link href="/daily-reports" className="text-xs font-bold text-orange-600 hover:underline cursor-pointer">View All →</Link>
        </div>
        {dailyReports.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No daily reports submitted yet</p>
        ) : (
          <div className="space-y-2">
            {dailyReports.slice(0, 5).map((r: any) => (
              <div key={r.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">{r.date || r.reportDate || '—'}</span>
                  <span className="text-slate-500 ml-3">{r.role || r.keyUpdates || r.candidateSource || '—'}</span>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded">
                  {r.status || 'SUBMITTED'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/payroll-management" className="p-4 rounded-xl bg-orange-50 border border-orange-200 hover:border-orange-400 transition-colors flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Payroll Management</div>
              <div className="text-[10px] text-slate-500">Add, edit, import salary records</div>
            </div>
          </Link>
          <Link href="/daily-reports" className="p-4 rounded-xl bg-blue-50 border border-blue-200 hover:border-blue-400 transition-colors flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Daily Reports</div>
              <div className="text-[10px] text-slate-500">Submit daily work report</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
