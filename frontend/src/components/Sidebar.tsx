'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  CreditCard,
  UserPlus,
  Target,
  Laptop,
  FolderOpen,
  Receipt,
  LogOut,
  BarChart3,
  Settings,
  GraduationCap,
  FileText,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isOpenMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const allNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'FINANCE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Daily Work Report', href: '/daily-reports', icon: FileText, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'FINANCE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Employees', href: '/employees', icon: Users, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'FINANCE', 'DEPARTMENT_HEAD', 'TEAM_LEADER'] },
    { label: 'Attendance', href: '/attendance', icon: Clock, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Leave Management', href: '/leaves', icon: CalendarDays, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Payroll & Payslips', href: '/payroll', icon: CreditCard, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE', 'EMPLOYEE'] },
    { label: 'Recruitment (ATS)', href: '/recruitment', icon: UserPlus, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'DEPARTMENT_HEAD'] },
    { label: 'Performance & Goals', href: '/performance', icon: Target, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Asset Management', href: '/assets', icon: Laptop, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'FINANCE'] },
    { label: 'Document Vault', href: '/documents', icon: FolderOpen, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'EMPLOYEE'] },
    { label: 'Expenses & Travel', href: '/expenses', icon: Receipt, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Exit & F&F', href: '/exit-management', icon: LogOut, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE', 'DEPARTMENT_HEAD'] },
    { label: 'Reports & Analytics', href: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE', 'DEPARTMENT_HEAD'] },
    { label: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  ];

  const navItems = allNavItems.filter((item) =>
    item.roles.includes(user?.role || 'EMPLOYEE'),
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`w-64 border-r border-slate-200 bg-white flex flex-col h-screen fixed md:sticky top-0 z-40 transition-transform duration-300 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl saffron-gradient flex items-center justify-center font-black text-lg text-white shadow-md shadow-orange-500/20">
              A
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
                <span>Adyapan HRMS</span>
              </div>
              <div className="text-[10px] text-orange-600 font-bold tracking-wider uppercase">
                Edutech Enterprise
              </div>
            </div>
          </div>

          {/* Close Mobile Sidebar */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'saffron-gradient text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-orange-50/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footprint */}
        <div className="p-4 border-t border-slate-100 bg-amber-50/40">
          <div className="flex items-center gap-2 text-xs text-slate-800 font-bold">
            <GraduationCap className="w-4 h-4 text-orange-600" />
            <span>Adyapan Edutech</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Role: <span className="text-orange-600 font-bold">{user?.role}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
