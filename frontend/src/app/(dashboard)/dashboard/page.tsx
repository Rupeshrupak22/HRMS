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
import { CharithaDashboard } from '@/components/CharithaDashboard';
import { PavitraDashboard } from '@/components/PavitraDashboard';

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
    return <CharithaDashboard />;
  }

  // ====================================================
  // 2. PAVITRA — ATTENDANCE & LEAVE SPECIALIST DASHBOARD
  // ====================================================
  if (userEmail === 'pavitra@adyapan.com' || user?.specialization === 'ATTENDANCE_LEAVE') {
    return <PavitraDashboard />;
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
