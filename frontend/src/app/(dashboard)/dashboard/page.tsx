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
import { AravindDashboard } from '@/components/AravindDashboard';
import { NitishaDashboard } from '@/components/NitishaDashboard';
import { VeenaDashboard } from '@/components/VeenaDashboard';
import { NandiniDashboard } from '@/components/NandiniDashboard';

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
              <div className="text-xs text-slate-500 font-semibold">Gross Monthly Payroll CTC</div>
              <div className="text-2xl font-black text-slate-900 mt-1">₹1.18 Cr</div>
              <div className="text-[10px] text-emerald-600 mt-1 font-bold">115 Salaried Staff</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">PF & Statutory Tax Deductions</div>
              <div className="text-2xl font-black text-amber-600 mt-1">₹18.0 Lakh</div>
              <div className="text-[10px] text-slate-500 mt-1">PF, PT, TDS Withheld</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Net Salary Disbursement</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">₹1.00 Cr</div>
              <div className="text-[10px] text-emerald-600 mt-1 font-bold">Direct HDFC Credit Ready</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">PDF Payslips Issued</div>
              <div className="text-2xl font-black text-blue-600 mt-1">115 / 115</div>
              <div className="text-[10px] text-slate-500 mt-1">August Payslips Batch Done</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Award className="w-5 h-5" />
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
            <h3 className="text-sm font-bold text-slate-900">August Salary Credit Processing Register</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Gross Salary</th>
                    <th className="py-2.5 px-3">PF/TDS Deductions</th>
                    <th className="py-2.5 px-3">Net Credit</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-900">Siddharth Verma (TECH)</td>
                    <td className="py-2.5 px-3">₹1,33,333</td>
                    <td className="py-2.5 px-3 text-amber-600">₹20,000</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600">₹1,13,333</td>
                    <td className="py-2.5 px-3 text-right"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">DISBURSED</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-900">Arjun Mehta (TECH)</td>
                    <td className="py-2.5 px-3">₹1,77,777</td>
                    <td className="py-2.5 px-3 text-amber-600">₹26,666</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600">₹1,51,111</td>
                    <td className="py-2.5 px-3 text-right"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">DISBURSED</span></td>
                  </tr>
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
    return <AravindDashboard />;
  }

  // ====================================================
  // 3. ABBU VEENA — ONBOARDING & HIRING SPECIALIST DASHBOARD
  // ====================================================
  if (userEmail === 'veena@adyapan.com' || user?.specialization === 'ONBOARDING_HIRING') {
    return <VeenaDashboard />;
  }

  // ====================================================
  // 4. NITISHA — DISCIPLINE, POSH & COMPLIANCE DASHBOARD
  // ====================================================
  if (userEmail === 'nitisha@adyapan.com' || user?.specialization === 'DISCIPLINE_POSH') {
    return <NitishaDashboard />;
  }

  // ====================================================
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
              <div className="text-2xl font-black text-emerald-600 mt-1">102 / 110</div>
              <div className="text-[10px] text-amber-600 font-bold mt-1">4 Late Check-ins Exceeded</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Pending Leave Applications</div>
              <div className="text-2xl font-black text-amber-600 mt-1">3 Applications</div>
              <div className="text-[10px] text-slate-500 mt-1">Casual & Sick Leaves</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Loss of Pay (LOP) Days</div>
              <div className="text-2xl font-black text-red-600 mt-1">2 LOPs</div>
              <div className="text-[10px] text-slate-500 mt-1">Unexcused Absence Logs</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Approved Overtime Hours</div>
              <div className="text-2xl font-black text-blue-600 mt-1">24.5 Hours</div>
              <div className="text-[10px] text-slate-500 mt-1">August Shift Roster</div>
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
            <h3 className="text-sm font-bold text-slate-900">Pavitra's Pending Leave Approval Queue</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Siddharth Verma — Casual Leave (2 Days)</div>
                  <div className="text-[10px] text-slate-500">Reason: Family Function | Dates: 18-19 Aug</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 bg-emerald-600 text-white rounded font-bold text-[11px]">Approve</button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded font-bold text-[11px]">Reject</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // 6. BIRADAR NANDINI — HR MANAGER MASTER OPERATIONS HUB
  // ====================================================
  if (userEmail === 'nandini@adyapan.com' || userEmail === 'nandani@adyapan.com' || user?.specialization === 'HR_MANAGER_ALL') {
    return <NandiniDashboard />;
  }

  // ====================================================
  // DEFAULT — SUPER ADMIN / OTHER USERS DASHBOARD
  // ====================================================
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg">
        <h1 className="text-xl font-black tracking-tight">
          Adyapan HRMS — Super Admin Dashboard
        </h1>
        <p className="text-xs text-orange-100 mt-1">
          Welcome back, {user?.firstName}. Manage all HR operations from here.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Total Employees</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics?.totalEmployees || 0}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Today Present</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{metrics?.todayPresent || 0}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Pending Leaves</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{metrics?.pendingLeaves || 0}</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Open Jobs</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{metrics?.openJobs || 0}</div>
        </div>
      </div>
    </div>
  );
}
