'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  CalendarDays,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Timer,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';

interface AttendanceStats {
  totalEmployees: number;
  todayPresent: number;
  todayAbsent: number;
  todayLate: number;
  pendingLeaves: number;
  approvedLeavesToday: number;
  attendanceRate: number;
  lopCount: number;
}

export function PavitraDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    todayPresent: 0,
    todayAbsent: 0,
    todayLate: 0,
    pendingLeaves: 0,
    approvedLeavesToday: 0,
    attendanceRate: 0,
    lopCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await apiRequest('/reports/dashboard-metrics');
        setStats({
          totalEmployees: data.totalEmployees || 0,
          todayPresent: data.todayPresent || 0,
          todayAbsent: data.todayAbsent || 0,
          todayLate: data.todayLate || 0,
          pendingLeaves: data.pendingLeaves || 0,
          approvedLeavesToday: data.approvedLeavesToday || 0,
          attendanceRate: data.attendanceRate || 0,
          lopCount: data.lopCount || 0,
        });
      } catch {
        // No dummy data - show zeros if API fails
        setStats({
          totalEmployees: 0,
          todayPresent: 0,
          todayAbsent: 0,
          todayLate: 0,
          pendingLeaves: 0,
          approvedLeavesToday: 0,
          attendanceRate: 0,
          lopCount: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const cards = [
    { label: 'Total Employees', value: stats.totalEmployees, sub: 'Active workforce', icon: Users, color: 'slate', href: '/attendance' },
    { label: 'Today Present', value: stats.todayPresent, sub: 'Checked in today', icon: UserCheck, color: 'emerald', href: '/attendance' },
    { label: 'Today Absent', value: stats.todayAbsent, sub: 'Not checked in', icon: AlertCircle, color: 'red', href: '/attendance' },
    { label: 'Late Arrivals', value: stats.todayLate, sub: 'After grace period', icon: Timer, color: 'amber', href: '/attendance' },
    { label: 'Pending Leaves', value: stats.pendingLeaves, sub: 'Awaiting approval', icon: CalendarDays, color: 'orange', href: '/leaves' },
    { label: 'Approved Today', value: stats.approvedLeavesToday, sub: 'On leave today', icon: CheckCircle2, color: 'blue', href: '/leaves' },
    { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, sub: 'This month overall', icon: Clock, color: 'purple', href: '/attendance' },
    { label: 'LOP Cases', value: stats.lopCount, sub: 'Loss of pay this month', icon: FileText, color: 'rose', href: '/leaves' },
  ];

  const colorMap: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
  };

  const iconBgMap: Record<string, string> = {
    slate: 'bg-slate-100',
    emerald: 'bg-emerald-100',
    red: 'bg-red-100',
    amber: 'bg-amber-100',
    orange: 'bg-orange-100',
    blue: 'bg-blue-100',
    purple: 'bg-purple-100',
    rose: 'bg-rose-100',
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg">
        <h1 className="text-xl font-black tracking-tight">
          Attendance & Leave Dashboard
        </h1>
        <p className="text-xs text-orange-100 mt-1">
          Welcome back, {user?.firstName}. Manage attendance tracking, leave approvals, and LOP records.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500 font-semibold">{card.label}</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">{card.value}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{card.sub}</div>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgMap[card.color]}`}>
                    <Icon className={`w-5 h-5 ${colorMap[card.color].split(' ')[1]}`} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-orange-500" />
            Pending Leave Requests
          </h3>
          {stats.pendingLeaves > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                {stats.pendingLeaves} leave request{stats.pendingLeaves > 1 ? 's' : ''} awaiting your review.
              </p>
              <Link
                href="/leaves"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                Review now →
              </Link>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No pending leave requests.</p>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Today&apos;s Attendance Summary
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-black text-emerald-600">{stats.todayPresent}</div>
              <div className="text-[10px] text-slate-400">Present</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-red-500">{stats.todayAbsent}</div>
              <div className="text-[10px] text-slate-400">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-amber-500">{stats.todayLate}</div>
              <div className="text-[10px] text-slate-400">Late</div>
            </div>
          </div>
          <Link
            href="/attendance"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 mt-3"
          >
            View full attendance →
          </Link>
        </div>
      </div>
    </div>
  );
}
