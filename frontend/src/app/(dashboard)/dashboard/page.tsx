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
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  UserPlus,
  LogOut,
  ShieldAlert,
  Activity,
  PieChart as PieChartIcon,
  BarChart3,
  FileText,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Timer,
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
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from 'recharts';
import { AravindDashboard } from '@/components/AravindDashboard';
import { NitishaDashboard } from '@/components/NitishaDashboard';
import { VeenaDashboard } from '@/components/VeenaDashboard';
import { NandiniDashboard } from '@/components/NandiniDashboard';
import { CharithaDashboard } from '@/components/CharithaDashboard';
import { PavitraDashboard } from '@/components/PavitraDashboard';

interface DashboardMetrics {
  totalEmployees: number;
  activeEmployees: number;
  probationEmployees: number;
  todayPresent: number;
  todayLate: number;
  todayAbsent: number;
  pendingLeaves: number;
  approvedLeavesToday: number;
  attendanceRate: number;
  openJobs: number;
  lopCount: number;
  totalPayrollCtc: number;
  departmentDistribution: { name: string; count: number }[];
  payroll: {
    totalRecords: number;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    totalLopDays: number;
    totalWorkingDays: number;
    totalLeavesTaken: number;
    attendanceFrozen: number;
    salaryChanges: number;
  };
  dailyReports: any[];
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subLabel,
  subValue,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  subLabel?: string;
  subValue?: string | number;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  };
  const iconBg: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600',
    cyan: 'bg-cyan-100 text-cyan-600',
  };

  return (
    <div className={`p-5 rounded-2xl border ${colorMap[color]} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
          <p className="text-2xl font-black mt-1">{value}</p>
          {subLabel && (
            <p className="text-[10px] mt-1.5 opacity-60">
              {subLabel}: <span className="font-bold">{subValue}</span>
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function MiniCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  const colorMap: Record<string, { bg: string; iconBg: string; text: string }> = {
    red:    { bg: 'bg-red-50 border-red-100',     iconBg: 'bg-red-100 text-red-600',       text: 'text-red-700' },
    blue:   { bg: 'bg-blue-50 border-blue-100',   iconBg: 'bg-blue-100 text-blue-600',     text: 'text-blue-700' },
    green:  { bg: 'bg-emerald-50 border-emerald-100', iconBg: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-700' },
    amber:  { bg: 'bg-amber-50 border-amber-100', iconBg: 'bg-amber-100 text-amber-600',   text: 'text-amber-700' },
    purple: { bg: 'bg-purple-50 border-purple-100', iconBg: 'bg-purple-100 text-purple-600', text: 'text-purple-700' },
    orange: { bg: 'bg-orange-50 border-orange-100', iconBg: 'bg-orange-100 text-orange-600', text: 'text-orange-700' },
  };
  const c = colorMap[color] ?? colorMap.blue;

  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all hover:shadow-sm ${c.bg}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.iconBg}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] text-slate-500 font-medium">{label}</p>
        <p className={`text-base font-black ${c.text}`}>{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiRequest('/reports/dashboard-metrics');
        setMetrics(data);
      } catch {
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const CHART_COLORS = ['#f97316', '#0ea5e9', '#8b5cf6', '#10b981', '#f43f5e', '#eab308', '#06b6d4', '#6366f1', '#ec4899', '#14b8a6', '#a855f7', '#f59e0b'];
  const userEmail = (user?.email || '').toLowerCase();

  // Specialist-specific dashboards
  if (userEmail === 'charitha@adyapan.com' || user?.specialization === 'SALARY_PAYROLL') {
    return <CharithaDashboard />;
  }
  if (userEmail === 'pavitra@adyapan.com' || user?.specialization === 'ATTENDANCE_LEAVE') {
    return <PavitraDashboard />;
  }
  if (userEmail === 'veena@adyapan.com' || user?.specialization === 'ONBOARDING_HIRING') {
    return <VeenaDashboard />;
  }
  if (userEmail === 'aravind@adyapan.com' || user?.specialization === 'RESIGNATION_EXIT') {
    return <AravindDashboard />;
  }
  if (userEmail === 'nitisha@adyapan.com' || user?.specialization === 'DISCIPLINE_POSH') {
    return <NitishaDashboard />;
  }
  if (userEmail === 'nandini@adyapan.com' || userEmail === 'nandani@adyapan.com' || user?.specialization === 'HR_MANAGER_ALL') {
    return <NandiniDashboard />;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const m = metrics || {
    totalEmployees: 0,
    activeEmployees: 0,
    probationEmployees: 0,
    todayPresent: 0,
    todayLate: 0,
    todayAbsent: 0,
    pendingLeaves: 0,
    approvedLeavesToday: 0,
    attendanceRate: 0,
    openJobs: 0,
    lopCount: 0,
    totalPayrollCtc: 0,
    departmentDistribution: [],
    payroll: { totalRecords: 0, totalGross: 0, totalDeductions: 0, totalNet: 0, totalLopDays: 0, totalWorkingDays: 0, totalLeavesTaken: 0, attendanceFrozen: 0, salaryChanges: 0 },
    dailyReports: [],
  };

  const deptData = m.departmentDistribution
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count);

  const attendancePieData = [
    { name: 'Present', value: m.todayPresent, color: '#10b981' },
    { name: 'Late', value: m.todayLate, color: '#f59e0b' },
    { name: 'Absent', value: m.todayAbsent, color: '#ef4444' },
    { name: 'On Leave', value: m.approvedLeavesToday, color: '#8b5cf6' },
  ].filter((d) => d.value > 0);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 rounded-full bg-white/5 translate-y-1/2" />
        <div className="relative">
          <p className="text-xs text-orange-100 font-medium">{greeting}</p>
          <h1 className="text-xl font-black tracking-tight mt-0.5">
            {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-xs text-orange-100 mt-1">
            Super Admin Dashboard — Adyapan Edutech Pvt. Ltd.
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
              <p className="text-[10px] text-orange-100">Workforce</p>
              <p className="text-lg font-black">{m.totalEmployees}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
              <p className="text-[10px] text-orange-100">Attendance Rate</p>
              <p className="text-lg font-black">{m.attendanceRate}%</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
              <p className="text-[10px] text-orange-100">Pending Actions</p>
              <p className="text-lg font-black">{m.pendingLeaves + m.openJobs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Employees"
          value={m.totalEmployees}
          icon={Users}
          color="blue"
          subLabel="Active"
          subValue={m.activeEmployees}
        />
        <StatCard
          label="Present Today"
          value={m.todayPresent}
          icon={UserCheck}
          color="green"
          subLabel="Late arrivals"
          subValue={m.todayLate}
        />
        <StatCard
          label="Pending Leaves"
          value={m.pendingLeaves}
          icon={CalendarDays}
          color="amber"
          subLabel="On leave today"
          subValue={m.approvedLeavesToday}
        />
        <StatCard
          label="Open Positions"
          value={m.openJobs}
          icon={Briefcase}
          color="purple"
          subLabel="Probation"
          subValue={m.probationEmployees}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Department Distribution</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">{deptData.length} departments with employees</p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', fontSize: '11px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" fill="#f97316" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-sm text-slate-400">
              No department data available
            </div>
          )}
        </div>

        {/* Attendance Overview Pie */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Today&apos;s Attendance</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {m.todayPresent + m.todayLate + m.todayAbsent + m.approvedLeavesToday} total workforce
              </p>
            </div>
            <PieChartIcon className="w-4 h-4 text-slate-400" />
          </div>
          {attendancePieData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={attendancePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    {attendancePieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5">
                {attendancePieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] text-slate-600">{item.name}</span>
                    <span className="text-[11px] font-bold text-slate-800 ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-slate-400">
              No attendance recorded today
            </div>
          )}
        </div>
      </div>

      {/* HR Operations Summary */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">HR Operations Overview</h3>
          <Activity className="w-4 h-4 text-slate-400" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MiniCard label="LOP Cases"        value={m.lopCount}              icon={AlertTriangle} color="red"    />
          <MiniCard label="Attendance Rate"  value={m.attendanceRate}        icon={Clock}         color="blue"   />
          <MiniCard label="Active Employees" value={m.activeEmployees}       icon={UserCheck}     color="green"  />
          <MiniCard label="In Probation"     value={m.probationEmployees}    icon={Timer}         color="amber"  />
          <MiniCard label="Payroll Records"  value={m.payroll.totalRecords}  icon={FileText}      color="purple" />
          <MiniCard label="Open Positions"   value={m.openJobs}              icon={Briefcase}     color="orange" />
        </div>
      </div>

      {/* Bottom Row - Payroll Summary + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll Summary */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Payroll Summary</h3>
          {m.payroll.totalRecords > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                <span className="text-xs text-slate-500">Total Gross</span>
                <span className="text-xs font-bold text-slate-800">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(m.payroll.totalGross)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                <span className="text-xs text-slate-500">Total Deductions</span>
                <span className="text-xs font-bold text-red-600">
                  -{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(m.payroll.totalDeductions)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                <span className="text-xs text-slate-500">Net Disbursed</span>
                <span className="text-xs font-bold text-emerald-600">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(m.payroll.totalNet)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                <span className="text-xs text-slate-500">LOP Days</span>
                <span className="text-xs font-bold text-amber-600">{m.payroll.totalLopDays}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-xs text-slate-500">Salary Revisions</span>
                <span className="text-xs font-bold text-blue-600">{m.payroll.salaryChanges}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-slate-400">
              No payroll data processed yet
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Recent Daily Reports</h3>
          {m.dailyReports.length > 0 ? (
            <div className="space-y-3 max-h-[260px] overflow-y-auto">
              {m.dailyReports.slice(0, 6).map((report: any) => (
                <div key={report.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    report.status === 'APPROVED' ? 'bg-emerald-500' :
                    report.status === 'REJECTED' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-800 truncate">
                      {report.employeeName || report.userEmail}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                      {report.tasksCompleted || report.keyUpdates || 'Report submitted'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-slate-400">{report.date}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        report.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                        report.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-slate-400">
              No daily reports submitted yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
