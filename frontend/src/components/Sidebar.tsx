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
  ShieldAlert,
  MessageSquareWarning,
  ClipboardList,
  UserX,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isOpenMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Nitisha-specific navigation (Discipline & POSH)
  const nitishaNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Employee Performance', href: '/employee-performance', icon: Target },
    { label: 'Discipline', href: '/discipline', icon: ShieldAlert },
    { label: 'Relations', href: '/relations', icon: Users },
    { label: 'Daily Reports', href: '/daily-reports', icon: FileText },
  ];

  // Aravind-specific navigation (Exit Specialist)
  const aravindNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Retention', href: '/retention', icon: ShieldAlert },
    { label: 'Resignation', href: '/resignation', icon: UserX },
    { label: 'Exit', href: '/exit', icon: LogOut },
    { label: 'F&F', href: '/fnf', icon: CreditCard },
    { label: 'Employee Complaints', href: '/employee-complaints', icon: MessageSquareWarning },
    { label: 'Exit Interview', href: '/exit-interview', icon: ClipboardList },
    { label: 'Daily Reports', href: '/daily-reports', icon: FileText },
  ];

  const allNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'FINANCE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Aravind Report', href: '/reports/aravind', icon: FileText, roles: ['SUPER_ADMIN'] },
    { label: 'Nitisha Report', href: '/reports/nitisha', icon: FileText, roles: ['SUPER_ADMIN'] },
    { label: 'Pavitra Report', href: '/reports/pavitra', icon: FileText, roles: ['SUPER_ADMIN'] },
    { label: 'Charitha Report', href: '/reports/charitha', icon: FileText, roles: ['SUPER_ADMIN'] },
    { label: 'Veena Report', href: '/reports/veena', icon: FileText, roles: ['SUPER_ADMIN'] },
    { label: 'Daily Reports', href: '/reports/all-daily', icon: ClipboardList, roles: ['SUPER_ADMIN'] },
    { label: 'HR Manager Report', href: '/reports/hr-manager', icon: BarChart3, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
    { label: 'Daily Work Report', href: '/daily-reports', icon: FileText, roles: ['HR_EXECUTIVE', 'FINANCE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Employees', href: '/employees', icon: Users, roles: ['HR_ADMIN', 'HR_EXECUTIVE', 'FINANCE', 'DEPARTMENT_HEAD', 'TEAM_LEADER'] },
    { label: 'Attendance', href: '/attendance', icon: Clock, roles: ['HR_ADMIN', 'HR_EXECUTIVE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Leave Management', href: '/leaves', icon: CalendarDays, roles: ['HR_ADMIN', 'HR_EXECUTIVE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Payroll & Payslips', href: '/payroll', icon: CreditCard, roles: ['HR_ADMIN', 'FINANCE', 'EMPLOYEE'] },
    { label: 'Recruitment (ATS)', href: '/recruitment', icon: UserPlus, roles: ['HR_ADMIN', 'HR_EXECUTIVE', 'DEPARTMENT_HEAD'] },
    { label: 'Performance & Goals', href: '/performance', icon: Target, roles: ['HR_ADMIN', 'HR_EXECUTIVE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Asset Management', href: '/assets', icon: Laptop, roles: ['HR_ADMIN', 'HR_EXECUTIVE', 'FINANCE'] },
    { label: 'Document Vault', href: '/documents', icon: FolderOpen, roles: ['HR_ADMIN', 'HR_EXECUTIVE', 'EMPLOYEE'] },
    { label: 'Expenses & Travel', href: '/expenses', icon: Receipt, roles: ['HR_ADMIN', 'FINANCE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Settings', href: '/settings', icon: Settings, roles: ['HR_ADMIN'] },
  ];

  // Pavitra-specific navigation (Attendance & Leave)
  const pavitraNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', href: '/attendance', icon: Clock },
    { label: 'Leaves', href: '/leaves', icon: CalendarDays },
    { label: 'Daily Reports', href: '/daily-reports', icon: FileText },
  ];

  // Veena-specific navigation (Onboarding & Hiring)
  const veenaNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Onboarding', href: '/onboarding', icon: UserPlus },
    { label: 'Interviews', href: '/interviews', icon: Users },
    { label: 'Dropout', href: '/dropouts', icon: UserX },
    { label: 'Daily Reports', href: '/daily-reports', icon: FileText },
  ];

  // Charitha-specific navigation (Salary & Payroll)
  const charithaNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Payroll Management', href: '/payroll-management', icon: CreditCard },
    { label: 'Daily Reports', href: '/daily-reports', icon: FileText },
  ];

  // Nandini (HR Manager) - custom sidebar with team reports
  const nandiniNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Aravind Report', href: '/reports/aravind', icon: FileText },
    { label: 'Nitisha Report', href: '/reports/nitisha', icon: FileText },
    { label: 'Pavitra Report', href: '/reports/pavitra', icon: FileText },
    { label: 'Charitha Report', href: '/reports/charitha', icon: FileText },
    { label: 'Veena Report', href: '/reports/veena', icon: FileText },
    { label: 'Daily Reports', href: '/reports/all-daily', icon: ClipboardList },
    { label: 'Overall Report', href: '/reports/overall', icon: BarChart3 },
  ];

  // Use specialist-specific nav based on specialization
  const isAravind = user?.specialization === 'RESIGNATION_EXIT';
  const isNitisha = user?.specialization === 'DISCIPLINE_POSH';
  const isVeena = user?.specialization === 'ONBOARDING_HIRING';
  const isPavitra = user?.specialization === 'ATTENDANCE_LEAVE' || user?.email === 'pavitra@adyapan.com';
  const isCharitha = user?.specialization === 'SALARY_PAYROLL' || user?.email === 'charitha@adyapan.com';
  const isNandini = user?.specialization === 'HR_MANAGER_ALL' || user?.email === 'nandini@adyapan.com' || user?.email === 'nandani@adyapan.com';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.email === 'superadmin@adyapan.com';

  const navItems = isAravind
    ? aravindNavItems
    : isNitisha
    ? nitishaNavItems
    : isVeena
    ? veenaNavItems
    : isPavitra
    ? pavitraNavItems
    : isCharitha
    ? charithaNavItems
    : isNandini
    ? nandiniNavItems
    : isSuperAdmin
    ? allNavItems.filter((item) => item.roles.includes('SUPER_ADMIN'))
    : allNavItems.filter((item) => item.roles.includes(user?.role || 'EMPLOYEE'));

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
            <img src="/icon-192x192.png" alt="Adyapan" className="w-9 h-9 rounded-xl shadow-md" />
            <div>
              <div className="font-extrabold text-sm tracking-tight text-slate-900">
                Adyapan HRMS
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
            <img src="/icon-192x192.png" alt="Adyapan" className="w-4 h-4 rounded" />
            <span>Adyapan HRMS</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Role: <span className="text-orange-600 font-bold">{isAravind ? 'EXIT SPECIALIST' : isNitisha ? 'DISCIPLINE & POSH' : isVeena ? 'ONBOARDING & HIRING' : isPavitra ? 'ATTENDANCE & LEAVE' : isCharitha ? 'PAYROLL SPECIALIST' : isNandini ? 'HR MANAGER' : user?.role}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
