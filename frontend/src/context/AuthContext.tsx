'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
  sessionConfirmation: SessionConfirmation | null;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithForce: (identifier: string, password: string) => Promise<void>;
  cancelSessionConfirmation: () => void;
  logout: () => void;
  switchRole: (role: RoleName) => void;
}

interface SessionConfirmation {
  identifier: string;
  password: string;
  message: string;
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

const DEMO_USERS: Record<RoleName, UserProfile> | null = process.env.NODE_ENV === 'production' ? null : {
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionConfirmation, setSessionConfirmation] = useState<SessionConfirmation | null>(null);

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);
  const isLoggedOutRef = useRef(false);

  // --- Session restoration on mount ---
  useEffect(() => {
    const storedUser = localStorage.getItem('adyapan_user');
    const storedToken = localStorage.getItem('adyapan_access_token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        isLoggedOutRef.current = false;
      } catch {
        clearSession();
      }
    }
    setLoading(false);
  }, []);

  // --- Token Auto-Refresh (Periodic silent background refresh) ---
  useEffect(() => {
    if (!user || isLoggedOutRef.current) return;

    const refreshTokens = async () => {
      try {
        const refreshToken = localStorage.getItem('adyapan_refresh_token');
        if (!refreshToken || isLoggedOutRef.current) return;

        const data = await apiRequest('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });

        if (data && data.accessToken && data.refreshToken) {
          localStorage.setItem('adyapan_access_token', data.accessToken);
          localStorage.setItem('adyapan_refresh_token', data.refreshToken);
        }
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (msg === 'FORCE_LOGOUT' || msg.includes('FORCE_LOGOUT') || msg.includes('another device') || msg.includes('compromised')) {
          performLogout('force_logout', 'Session ended. You have been logged in on another device.');
        }
      }
    };

    refreshTimerRef.current = setInterval(refreshTokens, 60 * 60 * 1000); // 1 hour

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [user]);

  // --- Force-Logout Detection on API errors ---
  useEffect(() => {
    const handleForceLogout = (event: CustomEvent) => {
      performLogout('force_logout', event.detail?.message);
    };
    window.addEventListener('auth:force-logout' as any, handleForceLogout);
    return () => window.removeEventListener('auth:force-logout' as any, handleForceLogout);
  }, []);

  // --- Multi-Tab Synchronization via BroadcastChannel ---
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('adyapan_auth_channel');

    channel.onmessage = (event) => {
      if (event.data?.type === 'FORCE_LOGOUT') {
        performLogout('force_logout', event.data.message, false);
      } else if (event.data?.type === 'MANUAL_LOGOUT') {
        performLogout('manual', undefined, false);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  // --- Instant Real-Time Session Invalidation Stream (SSE) ---
  useEffect(() => {
    if (!user || isLoggedOutRef.current) return;

    const abortController = new AbortController();

    const connectSSE = async () => {
      const token = localStorage.getItem('adyapan_access_token');
      if (!token || isLoggedOutRef.current) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1'}/auth/session-events`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: abortController.signal,
          credentials: 'include',
        });

        if (res.status === 401) {
          performLogout('force_logout', 'You have been logged out because your account was signed in on another device.');
          return;
        }

        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const chunk of lines) {
            const trimmed = chunk.trim();
            if (trimmed.startsWith('data: ')) {
              try {
                const payload = JSON.parse(trimmed.slice(6));
                if (payload.type === 'FORCE_LOGOUT') {
                  performLogout(
                    'force_logout',
                    payload.reason || 'You have been logged out because your account was signed in on another device.'
                  );
                  return;
                }
              } catch {}
            }
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        // Auto-reconnect after 5s on network disconnect if still authenticated
        if (!isLoggedOutRef.current && user) {
          setTimeout(connectSSE, 5000);
        }
      }
    };

    connectSSE();

    return () => {
      abortController.abort();
    };
  }, [user]);

  // --- Lightweight Active Session Heartbeat (every 30s) as backup check ---
  useEffect(() => {
    if (!user || isLoggedOutRef.current) return;

    const checkSessionHeartbeat = async () => {
      if (isLoggedOutRef.current || isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        const token = localStorage.getItem('adyapan_access_token');
        if (!token || isLoggedOutRef.current) {
          isCheckingRef.current = false;
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1'}/auth/session-status`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include',
        });

        if (res.status === 401) {
          const data = await res.json().catch(() => ({}));
          const msg = String(data.message || data.error || '');
          if (data.forceLogout || data.code === 'FORCE_LOGOUT' || msg === 'FORCE_LOGOUT' || msg.includes('FORCE_LOGOUT') || msg.includes('another device')) {
            performLogout('force_logout', 'You have been logged out because your account was signed in on another device.');
            return;
          }

          // Token expired or invalid — attempt silent refresh once
          const refreshToken = localStorage.getItem('adyapan_refresh_token');
          if (refreshToken) {
            try {
              const refRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1'}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
              });
              if (refRes.ok) {
                const refData = await refRes.json();
                if (refData.accessToken) {
                  localStorage.setItem('adyapan_access_token', refData.accessToken);
                  if (refData.refreshToken) localStorage.setItem('adyapan_refresh_token', refData.refreshToken);
                  return;
                }
              }
            } catch {}
          }
          // If refresh fails, cleanly terminate session
          performLogout('expired', 'Session expired. Please log in again.');
        }
      } catch {} finally {
        isCheckingRef.current = false;
      }
    };

    // Immediate check on window focus or tab visibility change (with debounce/concurrency guard)
    const onVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && !isLoggedOutRef.current && !isCheckingRef.current) {
        checkSessionHeartbeat();
      }
    };

    window.addEventListener('focus', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);

    const interval = setInterval(checkSessionHeartbeat, 30 * 1000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
    };
  }, [user]);

  // --- Login ---
  const login = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const deviceId = localStorage.getItem('adyapan_device_id') || generateDeviceId();
      localStorage.setItem('adyapan_device_id', deviceId);

      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password, deviceId, forceLogin: true }),
      });

      completeLogin(data, identifier);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // --- Login with Force (user clicked "Login Here" on popup) ---
  const loginWithForce = async (identifier: string, password: string) => {
    setLoading(true);
    setSessionConfirmation(null);
    try {
      const deviceId = localStorage.getItem('adyapan_device_id') || generateDeviceId();
      localStorage.setItem('adyapan_device_id', deviceId);

      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password, forceLogin: true, deviceId }),
      });

      completeLogin(data, identifier);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelSessionConfirmation = () => {
    setSessionConfirmation(null);
  };

  // --- Complete login (store tokens, set user) ---
  const completeLogin = (data: any, identifier: string) => {
    isLoggedOutRef.current = false;
    const userProfile: UserProfile = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
      firstName: data.user.employee?.firstName || data.user.email.split('@')[0],
      lastName: data.user.employee?.lastName || '',
      employeeCode: data.user.employee?.employeeCode,
      employeeId: data.user.employee?.id,
      departmentId: data.user.employee?.departmentId,
      specialization: HR_SPECIALIST_ACCOUNTS[identifier.toLowerCase()]?.specialization,
    };

    setUser(userProfile);
    localStorage.setItem('adyapan_access_token', data.accessToken);
    localStorage.setItem('adyapan_refresh_token', data.refreshToken);
    localStorage.setItem('adyapan_user', JSON.stringify(userProfile));
    if (data.deviceId) {
      localStorage.setItem('adyapan_device_id', data.deviceId);
    }

    // Fetch CSRF token (non-critical)
    apiRequest('/auth/csrf-token', { method: 'GET' }).catch(() => {});
  };

  // --- Logout ---
  const logout = () => {
    performLogout('manual');
  };

  const performLogout = (reason: string, message?: string, broadcast = true) => {
    isLoggedOutRef.current = true;

    const defaultMsg = 'You have been logged out because your account was signed in on another device.';
    const finalMsg = message || defaultMsg;

    if (broadcast && typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('adyapan_auth_channel');
        channel.postMessage({
          type: reason === 'force_logout' ? 'FORCE_LOGOUT' : 'MANUAL_LOGOUT',
          message: finalMsg,
        });
        channel.close();
      } catch {}
    }

    // Call backend to invalidate refresh token
    apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
    clearSession();

    if (reason === 'force_logout') {
      sessionStorage.setItem('adyapan_logout_reason', finalMsg);
    } else if (reason === 'idle_timeout') {
      sessionStorage.setItem('adyapan_logout_reason', 'Session expired due to inactivity (15 minutes).');
    }

    window.location.href = '/login';
  };

  const clearSession = () => {
    localStorage.removeItem('adyapan_access_token');
    localStorage.removeItem('adyapan_refresh_token');
    localStorage.removeItem('adyapan_user');
    setUser(null);
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
  };

  // --- Role switching (dev only) ---
  const switchRole = (role: RoleName) => {
    if (process.env.NODE_ENV === 'production' || !DEMO_USERS) return;
    const newUser = DEMO_USERS[role];
    if (!newUser) return;
    setUser(newUser);
    localStorage.setItem('adyapan_user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, sessionConfirmation, login, loginWithForce, cancelSessionConfirmation, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

function generateDeviceId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}
