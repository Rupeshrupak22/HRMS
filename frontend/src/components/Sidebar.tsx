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
  UserCheck,
  UserX,
  CheckSquare,
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
    { label: 'My Work & Tasks', href: '/my-work', icon: CheckSquare, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'FINANCE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Daily Work Report', href: '/daily-reports', icon: FileText, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'FINANCE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Recruitment & Onboarding', href: '/recruitment-tracker', icon: UserCheck, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'DEPARTMENT_HEAD'] },
    { label: 'Dropout Tracker', href: '/dropouts', icon: UserX, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'DEPARTMENT_HEAD'] },
    { label: 'Employees', href: '/employees', icon: Users, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'FINANCE', 'DEPARTMENT_HEAD', 'TEAM_LEADER'] },
    { label: 'Attendance', href: '/attendance', icon: Clock, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Leave Management', href: '/leaves', icon: CalendarDays, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Payroll & Payslips', href: '/payroll', icon: CreditCard, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE', 'EMPLOYEE'] },
    { label: 'Payroll Management', href: '/payroll-management', icon: CreditCard, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE'] },
    { label: 'Recruitment (ATS)', href: '/recruitment', icon: UserPlus, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'DEPARTMENT_HEAD'] },
    { label: 'Performance & Goals', href: '/performance', icon: Target, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Asset Management', href: '/assets', icon: Laptop, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'FINANCE'] },
    { label: 'Document Vault', href: '/documents', icon: FolderOpen, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_EXECUTIVE', 'EMPLOYEE'] },
    { label: 'Expenses & Travel', href: '/expenses', icon: Receipt, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE', 'DEPARTMENT_HEAD', 'TEAM_LEADER', 'EMPLOYEE'] },
    { label: 'Exit & F&F', href: '/exit-management', icon: LogOut, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE', 'DEPARTMENT_HEAD'] },
    { label: 'Reports & Analytics', href: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE', 'DEPARTMENT_HEAD'] },
    { label: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  ];

  const userEmail = (user?.email || '').toLowerCase();

  const navItems = allNavItems.filter((item) => {
    if (!item.roles.includes(user?.role || 'EMPLOYEE')) return false;

    // Specialized HR Team Member Sidebar Filtering
    if (userEmail === 'veena@adyapan.com' || user?.specialization === 'ONBOARDING_HIRING') {
      return ['/dashboard', '/my-work', '/recruitment-tracker', '/dropouts', '/recruitment', '/daily-reports', '/documents'].includes(item.href);
    }
    if (userEmail === 'charitha@adyapan.com' || user?.specialization === 'SALARY_PAYROLL') {
      return ['/dashboard', '/daily-reports', '/payroll', '/payroll-management'].includes(item.href);
    }
    if (userEmail === 'aravind@adyapan.com' || user?.specialization === 'RESIGNATION_EXIT') {
      return ['/dashboard', '/my-work', '/daily-reports', '/exit-management', '/assets', '/documents'].includes(item.href);
    }
    if (userEmail === 'nitisha@adyapan.com' || user?.specialization === 'DISCIPLINE_POSH') {
      return ['/dashboard', '/my-work', '/daily-reports', '/employees', '/performance', '/documents'].includes(item.href);
    }
    if (userEmail === 'pavitra@adyapan.com' || user?.specialization === 'ATTENDANCE_LEAVE') {
      return ['/dashboard', '/my-work', '/daily-reports', '/attendance', '/leaves', '/employees'].includes(item.href);
    }

    return true;
  });

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
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl saffron-gradient flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 tracking-wider uppercase">
                ADYAPAN
              </div>
              <div className="text-[10px] text-orange-600 font-bold tracking-widest uppercase">
                
              </div>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 md:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'saffron-gradient text-white shadow-md shadow-orange-500/20 font-bold'
                    : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Info / Role Footer Badge */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Active Role
          </div>
          <div className="text-xs font-extrabold text-slate-800 truncate mt-0.5">
            {user?.role?.replace('_', ' ') || 'EMPLOYEE'}
          </div>
          <div className="text-[10px] text-orange-600 font-medium truncate">
            {user?.email || 'guest@adyapan.com'}
          </div>
        </div>
      </aside>
    </>
  );
}
