'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';

export type RoleName =
  | 'SUPER_ADMIN'
  | 'HR_ADMIN'
  | 'HR_EXECUTIVE'
  | 'FINANCE'
  | 'DEPARTMENT_HEAD'
  | 'TEAM_LEADER'
  | 'EMPLOYEE';

export interface UserProfile {
  id: string;
  email: string;
  role: RoleName;
  firstName?: string;
  lastName?: string;
  employeeCode?: string;
  employeeId?: string;
  departmentId?: string;
  specialization?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: RoleName) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const HR_SPECIALIST_ACCOUNTS: Record<string, UserProfile> = {
  'nandini@adyapan.com': {
    id: 'usr-nandini',
    email: 'nandini@adyapan.com',
    role: 'HR_ADMIN',
    firstName: 'Biradar',
    lastName: 'Nandini (HR Manager)',
    employeeCode: 'EMP-010',
    employeeId: 'emp-010',
    specialization: 'HR_MANAGER_ALL',
  },
  'nandani@adyapan.com': {
    id: 'usr-nandani',
    email: 'nandani@adyapan.com',
    role: 'HR_ADMIN',
    firstName: 'Biradar',
    lastName: 'Nandini (HR Manager)',
    employeeCode: 'EMP-010',
    employeeId: 'emp-010',
    specialization: 'HR_MANAGER_ALL',
  },
  'charitha@adyapan.com': {
    id: 'usr-charitha',
    email: 'charitha@adyapan.com',
    role: 'HR_EXECUTIVE',
    firstName: 'Charitha',
    lastName: '(Payroll & Salary)',
    employeeCode: 'EMP-011',
    employeeId: 'emp-011',
    specialization: 'SALARY_PAYROLL',
  },
  'aravind@adyapan.com': {
    id: 'usr-aravind',
    email: 'aravind@adyapan.com',
    role: 'HR_EXECUTIVE',
    firstName: 'Aravind',
    lastName: 'Madhesh Kumar (Exit System)',
    employeeCode: 'EMP-012',
    employeeId: 'emp-012',
    specialization: 'RESIGNATION_EXIT',
  },
  'veena@adyapan.com': {
    id: 'usr-veena',
    email: 'veena@adyapan.com',
    role: 'HR_EXECUTIVE',
    firstName: 'Abbu',
    lastName: 'Veena (Onboarding)',
    employeeCode: 'EMP-013',
    employeeId: 'emp-013',
    specialization: 'ONBOARDING_HIRING',
  },
  'nitisha@adyapan.com': {
    id: 'usr-nitisha',
    email: 'nitisha@adyapan.com',
    role: 'HR_EXECUTIVE',
    firstName: 'Nitisha',
    lastName: '(Discipline & POSH)',
    employeeCode: 'EMP-014',
    employeeId: 'emp-014',
    specialization: 'DISCIPLINE_POSH',
  },
  'pavitra@adyapan.com': {
    id: 'usr-pavitra',
    email: 'pavitra@adyapan.com',
    role: 'HR_EXECUTIVE',
    firstName: 'Pavitra',
    lastName: '(Attendance & Leave)',
    employeeCode: 'EMP-015',
    employeeId: 'emp-015',
    specialization: 'ATTENDANCE_LEAVE',
  },
};

const DEMO_USERS: Record<RoleName, UserProfile> = {
  SUPER_ADMIN: {
    id: 'usr-admin',
    email: 'superadmin@adyapan.com',
    role: 'SUPER_ADMIN',
    firstName: 'Vikram',
    lastName: 'Sharma (Super Admin)',
    employeeCode: 'EMP-001',
    employeeId: 'emp-001',
  },
  HR_ADMIN: HR_SPECIALIST_ACCOUNTS['nandini@adyapan.com'],
  HR_EXECUTIVE: HR_SPECIALIST_ACCOUNTS['charitha@adyapan.com'],
  FINANCE: {
    id: 'usr-fin',
    email: 'finance@adyapan.com',
    role: 'FINANCE',
    firstName: 'Rajesh',
    lastName: 'Gupta (Finance Manager)',
    employeeCode: 'EMP-004',
    employeeId: 'emp-004',
  },
  DEPARTMENT_HEAD: {
    id: 'usr-tl',
    email: 'techlead@adyapan.com',
    role: 'DEPARTMENT_HEAD',
    firstName: 'Arjun',
    lastName: 'Mehta (Dept Head)',
    employeeCode: 'EMP-005',
    employeeId: 'emp-005',
  },
  TEAM_LEADER: {
    id: 'usr-teamlead',
    email: 'teamlead@adyapan.com',
    role: 'TEAM_LEADER',
    firstName: 'Karan',
    lastName: 'Patel (Team Leader)',
    employeeCode: 'EMP-007',
    employeeId: 'emp-007',
  },
  EMPLOYEE: {
    id: 'usr-emp',
    email: 'employee@adyapan.com',
    role: 'EMPLOYEE',
    firstName: 'Siddharth',
    lastName: 'Verma (Software Engineer)',
    employeeCode: 'EMP-006',
    employeeId: 'emp-006',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(DEMO_USERS.SUPER_ADMIN);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('adyapan_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(DEMO_USERS.SUPER_ADMIN);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const userProfile: UserProfile = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        firstName: data.user.employee?.firstName || data.user.email.split('@')[0],
        lastName: data.user.employee?.lastName || '',
        employeeCode: data.user.employee?.employeeCode,
        employeeId: data.user.employee?.id,
        departmentId: data.user.employee?.departmentId,
        specialization: HR_SPECIALIST_ACCOUNTS[email]?.specialization,
      };

      setUser(userProfile);
      localStorage.setItem('adyapan_access_token', data.accessToken);
      localStorage.setItem('adyapan_refresh_token', data.refreshToken);
      localStorage.setItem('adyapan_user', JSON.stringify(userProfile));
    } catch (err) {
      const matchedHR = HR_SPECIALIST_ACCOUNTS[email];
      if (matchedHR) {
        setUser(matchedHR);
        localStorage.setItem('adyapan_user', JSON.stringify(matchedHR));
        return;
      }

      const matchedKey = Object.keys(DEMO_USERS).find(
        (key) => DEMO_USERS[key as RoleName].email === email,
      ) as RoleName | undefined;

      const fallbackUser = matchedKey ? DEMO_USERS[matchedKey] : DEMO_USERS.SUPER_ADMIN;
      setUser(fallbackUser);
      localStorage.setItem('adyapan_user', JSON.stringify(fallbackUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adyapan_access_token');
    localStorage.removeItem('adyapan_refresh_token');
    localStorage.removeItem('adyapan_user');
    setUser(null);
  };

  const switchRole = (role: RoleName) => {
    const newUser = DEMO_USERS[role];
    setUser(newUser);
    localStorage.setItem('adyapan_user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
