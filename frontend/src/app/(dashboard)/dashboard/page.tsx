'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import {
  Users,
  UserCheck,
  CalendarDays,
  Briefcase,
  Clock,
  Sparkles,
  Award,
  DollarSign,
  Receipt,
  FileText,
  Laptop,
  AlertTriangle,
  ShieldAlert,
  LogOut,
  UserPlus,
  CheckCircle2,
  FileCheck,
  Send,
  Download,
  XCircle,
  FileSpreadsheet,
  Building2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiRequest('/reports/dashboard-metrics');
        setMetrics(data);
      } catch (err) {
        setMetrics({
          totalEmployees: 115,
          todayPresent: 102,
          todayLate: 4,
          pendingLeaves: 3,
          openJobs: 5,
        });
      }
    }
    loadData();
  }, []);

  const SAFFRON_COLORS = ['#f97316', '#d97706', '#0284c7', '#059669', '#8b5cf6', '#dc2626'];
  const userEmail = (user?.email || '').toLowerCase();

  // ====================================================
  // 1. CHARITHA — SALARY & PAYROLL SPECIALIST DASHBOARD
  // ====================================================
  if (userEmail === 'charitha@adyapan.com' || user?.specialization === 'SALARY_PAYROLL') {
    const deptSalaryData = [
      { name: 'Technology', grossCtc: 5400000 },
      { name: 'Academic', grossCtc: 3200000 },
      { name: 'Sales', grossCtc: 1800000 },
      { name: 'Operations', grossCtc: 1200000 },
      { name: 'HR & Admin', grossCtc: 900000 },
    ];

    return (
      <div className="space-y-6">
        <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <span>Charitha — HR Salary & Payroll Disbursement Center</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                PAYROLL SPECIALIST
              </span>
            </h1>
            <p className="text-xs text-orange-100 mt-1">
              Monthly CTC breakdown, PF/ESI/TDS tax deductions, HDFC bank disbursal statements & payslips
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/payroll" className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export HDFC Bank Register</span>
            </a>
            <a href="/daily-reports" className="px-4 py-2 rounded-xl bg-black/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> Submit Daily Report
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Gross Monthly Payroll</div>
              <div className="text-2xl font-black text-slate-900 mt-1">₹{((metrics?.payroll?.totalGross ?? 0) / 100000).toFixed(2)} L</div>
              <div className="text-[10px] text-emerald-600 mt-1 font-bold">{metrics?.payroll?.totalRecords ?? 0} Salaried Staff</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Total Deductions</div>
              <div className="text-2xl font-black text-amber-600 mt-1">₹{((metrics?.payroll?.totalDeductions ?? 0) / 100000).toFixed(2)} L</div>
              <div className="text-[10px] text-slate-500 mt-1">PF, PT, TDS Withheld</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Net Salary Disbursement</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">₹{((metrics?.payroll?.totalNet ?? 0) / 100000).toFixed(2)} L</div>
              <div className="text-[10px] text-emerald-600 mt-1 font-bold">Total Net Pay</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Total LOP Days</div>
              <div className="text-2xl font-black text-blue-600 mt-1">{metrics?.payroll?.totalLopDays ?? 0} Days</div>
              <div className="text-[10px] text-slate-500 mt-1">Total Loss of Pay Days</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Charitha Unique Charts & Salary Register Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Department Gross Salary Breakdown</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptSalaryData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip formatter={(value: any) => `₹${(Number(value) / 100000).toFixed(1)} L`} />
                  <Bar dataKey="grossCtc" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Salary Credit Processing</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Gross Salary</th>
                    <th className="py-2.5 px-3">Deductions</th>
                    <th className="py-2.5 px-3">Net Credit</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {metrics?.payroll?.records?.length > 0 ? (
                    metrics.payroll.records.map((record: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{record.employeeName || 'Unknown'}</td>
                        <td className="py-2.5 px-3">₹{parseFloat(record.newSalary || record.oldSalary || '0').toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-amber-600">₹{parseFloat(record.lopDeduction || '0').toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600">₹{parseFloat(record.netPay || '0').toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">PROCESSED</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-slate-900">Siddharth Verma (TECH)</td>
                      <td className="py-2.5 px-3">₹1,33,333</td>
                      <td className="py-2.5 px-3 text-amber-600">₹20,000</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-600">₹1,13,333</td>
                      <td className="py-2.5 px-3 text-right"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">DISBURSED</span></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // 2. ARAVIND — RESIGNATION & EXIT SPECIALIST DASHBOARD
  // ====================================================
  if (userEmail === 'aravind@adyapan.com' || user?.specialization === 'RESIGNATION_EXIT') {
    const exitReasonData = [
      { name: 'Higher Studies', value: 40 },
      { name: 'Better Career Growth', value: 40 },
      { name: 'Relocation', value: 20 },
    ];

    return (
      <div className="space-y-6">
        <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <span>Aravind — HR Resignations & Exit Clearances System</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                EXIT SPECIALIST
              </span>
            </h1>
            <p className="text-xs text-orange-100 mt-1">
              Notice period tracking, exit interview reviews, department no-dues & Full & Final (F&F) settlement calculation
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/exit-management" className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md">
              Process Exit Form
            </a>
            <a href="/daily-reports" className="px-4 py-2 rounded-xl bg-black/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> Submit Daily Report
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Active Resignation Notices</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{metrics?.exitMetrics?.activeResignations ?? 0} Staff</div>
              <div className="text-[10px] text-slate-500 mt-1">Pending Processing</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <LogOut className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Exit Interviews Done</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{metrics?.exitMetrics?.completedExitInterviews ?? 0} Completed</div>
              <div className="text-[10px] text-slate-500 mt-1">Feedback Recorded</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">No-Dues Sign-offs Pending</div>
              <div className="text-2xl font-black text-blue-600 mt-1">{metrics?.exitMetrics?.pendingSignOffs ?? 0} Pending</div>
              <div className="text-[10px] text-slate-500 mt-1">IT & Admin Clearances</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Laptop className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Calculated F&F Balance</div>
              <div className="text-2xl font-black text-slate-900 mt-1">₹{(metrics?.exitMetrics?.fnfBalance ?? 0).toLocaleString()}</div>
              <div className="text-[10px] text-emerald-600 mt-1 font-bold">Total Net Settlement</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Aravind Unique Charts & Resignation Clearance Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Exit Reason Analytics</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={exitReasonData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                    {exitReasonData.map((e, idx) => (
                      <Cell key={idx} fill={SAFFRON_COLORS[idx % SAFFRON_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Daily Task Reports</h3>
            <div className="space-y-3">
              {metrics?.dailyReports?.length > 0 ? (
                metrics.dailyReports.slice(0, 4).map((report: any) => (
                  <div key={report.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{report.employeeName} ({report.role})</div>
                      <div className="text-[10px] text-slate-500">Date: {report.date} | Updates: {report.keyUpdates || 'None'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded">{report.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500">No daily reports available.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // 3. ABBU VEENA — ONBOARDING & HIRING SPECIALIST DASHBOARD
  // ====================================================
  if (userEmail === 'veena@adyapan.com' || user?.specialization === 'ONBOARDING_HIRING') {
    return <VeenaDashboard metrics={metrics} />;
  }

  // ====================================================
  // 4. NITISHA — DISCIPLINE, POSH & COMPLIANCE DASHBOARD
  // ====================================================
  if (userEmail === 'nitisha@adyapan.com' || user?.specialization === 'DISCIPLINE_POSH') {
    const complianceData = [
      { category: 'Code of Conduct', count: 2 },
      { category: 'Attendance Violation', count: 4 },
      { category: 'POSH Policy Inquiry', count: 0 },
    ];

    return (
      <div className="space-y-6">
        <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <span>Nitisha — HR Discipline, POSH & Policy Compliance Office</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                DISCIPLINE & POSH SPECIALIST
              </span>
            </h1>
            <p className="text-xs text-orange-100 mt-1">
              Disciplinary notices, POSH policy awareness, employee conduct warnings & grievance resolution hearings
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/employees" className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md">
              Employee Conduct Directory
            </a>
            <a href="/daily-reports" className="px-4 py-2 rounded-xl bg-black/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> Submit Daily Report
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Active Misconduct Cases</div>
              <div className="text-2xl font-black text-amber-600 mt-1">0 Open Inquiry</div>
              <div className="text-[10px] text-slate-500 mt-1">All Clear</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">POSH Complaints</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">0 Open Cases</div>
              <div className="text-[10px] text-emerald-600 mt-1 font-bold">100% Policy Compliant</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Disciplinary Warnings Issued</div>
              <div className="text-2xl font-black text-slate-900 mt-1">0 Warning Notices</div>
              <div className="text-[10px] text-slate-500 mt-1">No Active Warnings</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Grievance Hearings Resolved</div>
              <div className="text-2xl font-black text-blue-600 mt-1">0 Cases Closed</div>
              <div className="text-[10px] text-slate-500 mt-1">No pending hearings</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Nitisha Unique Charts & Disciplinary Cases Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Policy Violation Categories</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceData}>
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Daily Task Reports</h3>
            <div className="space-y-3 text-xs">
              {metrics?.dailyReports?.length > 0 ? (
                metrics.dailyReports.slice(0, 4).map((report: any) => (
                  <div key={report.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{report.employeeName} ({report.role})</div>
                      <div className="text-[10px] text-slate-500">Date: {report.date} | Updates: {report.keyUpdates || 'None'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded">{report.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500">No daily reports available.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // 5. PAVITRA — ATTENDANCE & LEAVE SPECIALIST DASHBOARD
  // ====================================================
  if (userEmail === 'pavitra@adyapan.com' || user?.specialization === 'ATTENDANCE_LEAVE') {
    const attendanceTrendData = [
      { day: 'Mon', present: 104, late: 3, absent: 3 },
      { day: 'Tue', present: 106, late: 2, absent: 2 },
      { day: 'Wed', present: 102, late: 4, absent: 4 },
      { day: 'Thu', present: 105, late: 2, absent: 3 },
      { day: 'Fri', present: 100, late: 6, absent: 4 },
    ];

    return (
      <div className="space-y-6">
        <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <span>Pavitra — HR Attendance Logs & Leave Approvals Desk</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                ATTENDANCE & LEAVE SPECIALIST
              </span>
            </h1>
            <p className="text-xs text-orange-100 mt-1">
              Live web check in/out logs, shift rosters, leave approvals & Loss of Pay (LOP) calculations
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/leaves" className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md">
              Manage Leave Applications
            </a>
            <a href="/daily-reports" className="px-4 py-2 rounded-xl bg-black/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> Submit Daily Report
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Today's Office Present</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{metrics?.attendanceMetrics?.todayPresent ?? 0} / {metrics?.totalEmployees ?? 0}</div>
              <div className="text-[10px] text-amber-600 font-bold mt-1">{metrics?.attendanceMetrics?.todayLate ?? 0} Late Check-ins</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Pending Leave Applications</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{metrics?.attendanceMetrics?.pendingLeaves ?? 0} Applications</div>
              <div className="text-[10px] text-slate-500 mt-1">Requires Approval</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Total LOP Days</div>
              <div className="text-2xl font-black text-red-600 mt-1">{metrics?.attendanceMetrics?.totalLopDays ?? 0} LOPs</div>
              <div className="text-[10px] text-slate-500 mt-1">Unexcused Absence Logs</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Approved Overtime Hours</div>
              <div className="text-2xl font-black text-blue-600 mt-1">{metrics?.attendanceMetrics?.overtimeHours ?? 0} Hours</div>
              <div className="text-[10px] text-slate-500 mt-1">Monthly Shift Roster</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Pavitra Unique Charts & Attendance Approval Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Weekly Shift Attendance & Late Ratios</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceTrendData}>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="present" fill="#059669" name="Present" />
                  <Bar dataKey="late" fill="#d97706" name="Late" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Daily Task Reports</h3>
            <div className="space-y-3 text-xs">
              {metrics?.dailyReports?.length > 0 ? (
                metrics.dailyReports.slice(0, 4).map((report: any) => (
                  <div key={report.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{report.employeeName} ({report.role})</div>
                      <div className="text-[10px] text-slate-500">Date: {report.date} | Updates: {report.keyUpdates || 'None'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded">{report.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500">No daily reports available.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // 6. BIRADAR NANDINI — HR MANAGER MASTER OPERATIONS HUB
  // ====================================================
  const hrTeamMembers = [
    { name: 'Charitha', role: 'HR Salary & Payroll', email: 'charitha@adyapan.com', status: 'ACTIVE', tasks: 'August CTC Calculation & Bank CSV' },
    { name: 'Aravind Madhesh Kumar', role: 'HR Resignation & Exit System', email: 'aravind@adyapan.com', status: 'ACTIVE', tasks: 'Notice Period & No-Dues Clearances' },
    { name: 'Abbu Veena', role: 'HR Onboarding & Hiring', email: 'veena@adyapan.com', status: 'ACTIVE', tasks: 'ATS Resume Screen & Offer Letters' },
    { name: 'Nitisha', role: 'HR Discipline & POSH', email: 'nitisha@adyapan.com', status: 'ACTIVE', tasks: 'POSH Compliance & Conduct Warnings' },
    { name: 'Pavitra', role: 'HR Attendance & Leave', email: 'pavitra@adyapan.com', status: 'ACTIVE', tasks: 'Live Web Check-in & LOP Logs' },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <span>Biradar Nandini — HR Master Manager Operations Hub</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
              HR MANAGER
            </span>
          </h1>
          <p className="text-xs text-orange-100 mt-1">
            Complete supervision over Charitha (Payroll), Aravind (Exit), Veena (Hiring), Nitisha (POSH), and Pavitra (Attendance)
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/daily-reports" className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md flex items-center gap-1.5">
            <Send className="w-4 h-4" />
            <span>Review All Daily Reports</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">HR Team Members</div>
            <div className="text-2xl font-black text-slate-900 mt-1">6 HR Specialists</div>
            <div className="text-[10px] text-emerald-600 mt-1 font-bold">100% Operational</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Total Company Staff</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{metrics?.totalEmployees || 115} Staff</div>
            <div className="text-[10px] text-slate-500 mt-1">110 Active | 5 Probation</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Monthly HR Ops Spend</div>
            <div className="text-2xl font-black text-amber-600 mt-1">₹4.2 Lakh</div>
            <div className="text-[10px] text-slate-500 mt-1">Software & Training</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Daily Work Reports</div>
            <div className="text-2xl font-black text-violet-600 mt-1">{metrics?.dailyReports?.length || 0} Submitted</div>
            <div className="text-[10px] text-slate-500 mt-1">Requires Nandini Sign-off</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Biradar Nandini Unique Supervision Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
          <span>HR Team Daily Task Reports</span>
          <span className="text-xs text-orange-600 font-bold">{metrics?.dailyReports?.length || 0} Recent Reports</span>
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] text-slate-500 font-bold uppercase border-b border-slate-100">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Employee</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Key Updates</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {metrics?.dailyReports?.length > 0 ? (
                metrics.dailyReports.map((report: any) => (
                  <tr key={report.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-600">{report.date}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{report.employeeName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{report.role || 'HR'}</td>
                    <td className="py-2.5 px-3 text-slate-600 truncate max-w-[200px]">{report.keyUpdates || 'No updates'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded">
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">No daily reports found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


function VeenaDashboard({ metrics }: { metrics: any }) {
  const COLORS = ['#f97316', '#d97706', '#0284c7', '#059669', '#8b5cf6', '#dc2626'];

  const stats = {
    openJobs: metrics?.hiringMetrics?.openJobs ?? 0,
    totalScreened: metrics?.hiringMetrics?.candidatesScreened ?? 0,
    totalOffersSent: metrics?.hiringMetrics?.candidatesOffered ?? 0,
    totalDropouts: metrics?.hiringMetrics?.candidatesDropped ?? 0,
    totalJoined: metrics?.hiringMetrics?.candidatesJoined ?? 0,
    totalReports: metrics?.dailyReports?.length ?? 0
  };
  const funnelData: any[] = [];
  const sourceData: any[] = [];
  const recentActivities: any[] = [];
  const upcomingJoiners: any[] = [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="p-5 rounded-2xl saffron-gradient text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm">AV</div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Abbu Veena — Onboarding &amp; Hiring</h1>
              <p className="text-[10px] text-orange-100">HR Executive • Onboarding Specialist • ATS Pipeline Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/recruitment" className="px-3 py-2 rounded-lg bg-white text-orange-600 font-bold text-[11px] shadow flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> ATS Jobs Board
            </a>
            <a href="/recruitment-tracker" className="px-3 py-2 rounded-lg bg-white/20 text-white font-bold text-[11px] border border-white/30 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> Onboarding Tracker
            </a>
            <a href="/daily-reports" className="px-3 py-2 rounded-lg bg-white/20 text-white font-bold text-[11px] border border-white/30 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> Daily Report
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
          <div className="text-[10px] text-slate-500 font-bold uppercase">Open Jobs</div>
          <div className="text-2xl font-black text-violet-600 mt-1">{stats.openJobs}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
          <div className="text-[10px] text-slate-500 font-bold uppercase">Screened</div>
          <div className="text-2xl font-black text-orange-600 mt-1">{stats.totalScreened}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
          <div className="text-[10px] text-slate-500 font-bold uppercase">Offers Sent</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.totalOffersSent}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
          <div className="text-[10px] text-slate-500 font-bold uppercase">Dropouts</div>
          <div className="text-2xl font-black text-red-500 mt-1">{stats.totalDropouts}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
          <div className="text-[10px] text-slate-500 font-bold uppercase">Joined</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{stats.totalJoined}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 mb-3">Recruitment Funnel</h3>
          {funnelData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <XAxis type="number" stroke="#cbd5e1" fontSize={9} />
                  <YAxis dataKey="stage" type="category" stroke="#cbd5e1" fontSize={9} width={60} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="candidates" fill="#f97316" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">No data yet. Submit daily reports to see funnel.</div>
          )}
        </div>

        <div className="lg:col-span-3 p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 mb-3">Source Breakdown</h3>
          {sourceData.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>
                      {sourceData.map((_: any, idx: number) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {sourceData.map((s: any, i: number) => (
                  <span key={s.name} className="text-[9px] font-bold text-slate-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    {s.name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">No source data yet.</div>
          )}
        </div>

        <div className="lg:col-span-4 p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 mb-3">Recent Daily Reports</h3>
          {metrics?.dailyReports?.length > 0 ? (
            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {metrics.dailyReports.slice(0, 5).map((a: any, i: number) => (
                <div key={i} className="flex gap-2 text-[11px]">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-blue-500`} />
                  <div className="flex-1">
                    <div className="text-slate-700 font-medium leading-tight">{a.employeeName}: {a.keyUpdates || 'Submitted report'}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{a.date} - {a.status}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">No daily reports yet.</div>
          )}
        </div>
      </div>

      {/* Upcoming Joiners */}
      {upcomingJoiners.length > 0 && (
        <div className="rounded-xl bg-white border border-slate-100 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">Upcoming Joiners — Onboarding Queue</h3>
            <a href="/recruitment-tracker" className="text-[10px] text-orange-600 font-bold hover:underline">View All →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase">
                  <th className="py-2.5 px-4 text-left">Candidate</th>
                  <th className="py-2.5 px-4 text-left">Source</th>
                  <th className="py-2.5 px-4 text-left">Date</th>
                  <th className="py-2.5 px-4 text-left">Documents</th>
                  <th className="py-2.5 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {upcomingJoiners.map((j: any, i: number) => (
                  <tr key={i} className="hover:bg-orange-50/30">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{j.name}</td>
                    <td className="py-2.5 px-4 text-slate-600">{j.role}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-700">{j.date}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${j.docStatus === 'Verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{j.docStatus}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${j.assetStatus === 'Pending' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-700'}`}>{j.assetStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <a href="/dropouts" className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs hover:border-orange-200 transition-colors group">
          <XCircle className="w-5 h-5 text-red-500 mb-2" />
          <div className="text-xs font-bold text-slate-900 group-hover:text-orange-600">Dropout Tracker</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{stats.totalDropouts} dropouts recorded</div>
        </a>
        <a href="/documents" className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs hover:border-orange-200 transition-colors group">
          <FileText className="w-5 h-5 text-blue-500 mb-2" />
          <div className="text-xs font-bold text-slate-900 group-hover:text-orange-600">Document Vault</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Upload &amp; verify docs</div>
        </a>
        <a href="/my-work" className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs hover:border-orange-200 transition-colors group">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-2" />
          <div className="text-xs font-bold text-slate-900 group-hover:text-orange-600">My Tasks</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Pending tasks</div>
        </a>
        <a href="/daily-reports" className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs hover:border-orange-200 transition-colors group">
          <FileSpreadsheet className="w-5 h-5 text-orange-500 mb-2" />
          <div className="text-xs font-bold text-slate-900 group-hover:text-orange-600">Daily Reports</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{stats.totalReports} reports submitted</div>
        </a>
      </div>
    </div>
  );
}
