'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Download,
  Users,
  Search,
  Filter,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Pagination } from '@/components/Pagination';
import * as XLSX from 'xlsx';

export default function PavitraReportPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Employee Master directory filters
  const [empStatusFilter, setEmpStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [empSearchTerm, setEmpSearchTerm] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('ALL');

  // Pagination states (20 per page)
  const [empPage, setEmpPage] = useState(1);
  const [attPage, setAttPage] = useState(1);
  const [leavePage, setLeavePage] = useState(1);
  const [repPage, setRepPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1).toISOString();
      const endDate = new Date(parseInt(year, 10), parseInt(month, 10), 0, 23, 59, 59).toISOString();
      const res = await apiRequest(`/attendance/all-logs?startDate=${startDate}&endDate=${endDate}`);
      let logs: any[] = [];
      if (Array.isArray(res)) {
        logs = res;
      } else if (res?.data && Array.isArray(res.data)) {
        logs = res.data;
      } else if (res?.success && Array.isArray(res.data)) {
        logs = res.data;
      }

      const savedAtt = typeof window !== 'undefined' ? localStorage.getItem('adyapan_imported_attendance_logs') : null;
      let localAtt: any[] = [];
      try { localAtt = savedAtt ? JSON.parse(savedAtt) : []; } catch { localAtt = []; }

      const map = new Map();
      for (const item of logs) {
        const key = item.id || `${item.empId || item.employeeId || item.employeeCode}_${item.date}`;
        map.set(key, item);
      }
      for (const item of localAtt) {
        const key = item.id || `${item.empId || item.employeeId || item.employeeCode}_${item.date}`;
        if (!map.has(key)) map.set(key, item);
      }
      setAttendance(Array.from(map.values()));
    } catch (error) {
      console.error('Failed to fetch attendance', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedMonth]);

  useEffect(() => {
    // 0. Employee Master roster — CRM + internal DB
    (async () => {
      let list: any[] = [];
      // Primary: CRM employees
      try {
        const crmRes = await fetch('/api/crm-employees');
        if (crmRes.ok) {
          const crmJson = await crmRes.json();
          const crmList = Array.isArray(crmJson) ? crmJson : (crmJson.employees || crmJson.data || []);
          list = crmList.map((emp: any) => ({
            id: emp.id,
            employeeCode: emp.employeeId || emp.employeeCode || '',
            firstName: emp.name?.split(' ')[0] || '',
            lastName: emp.name?.split(' ').slice(1).join(' ') || '',
            name: emp.name || '',
            email: emp.email || '',
            department: { name: emp.department || '-' },
            designation: { title: emp.designation || '-' },
            status: emp.status || (emp.isActive !== false ? 'ACTIVE' : 'INACTIVE'),
            isActive: emp.isActive !== false,
            employeeStatus: emp.employeeStatus || emp.status || '',
            joiningDate: emp.joiningDate || '',
          }));
        }
      } catch {}
      // Secondary: internal DB employees (merge non-duplicates)
      try {
        const res = await apiRequest('/employees');
        const fetched = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
        const existingEmails = new Set(list.map((e: any) => (e.email || '').toLowerCase().trim()).filter(Boolean));
        const existingCodes = new Set(list.map((e: any) => String(e.employeeCode || e.employeeId || e.id || '').toLowerCase().trim()).filter(Boolean));
        const dbOnly = fetched
          .filter((e: any) => {
            const email = (e.user?.email || e.email || '').toLowerCase().trim();
            const code = String(e.employeeCode || e.id || '').toLowerCase().trim();
            return (!email || !existingEmails.has(email)) && (!code || !existingCodes.has(code));
          })
          .map((emp: any) => ({
            id: emp.id,
            employeeCode: emp.employeeCode || emp.id,
            employeeId: emp.employeeCode || emp.id,
            firstName: emp.firstName || '',
            lastName: emp.lastName || '',
            name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee',
            email: emp.user?.email || emp.email || '',
            department: { name: emp.department?.name || (typeof emp.department === 'string' ? emp.department : '-') },
            designation: { title: emp.designation?.title || (typeof emp.designation === 'string' ? emp.designation : '-') },
            status: emp.status || 'ACTIVE',
            isActive: emp.status === 'ACTIVE',
            employeeStatus: emp.status || '',
            joiningDate: emp.joiningDate || emp.createdAt || '',
          }));
        list = [...list, ...dbOnly];
      } catch {}
      setEmployees(list);
    })();

    // 2. Leave requests
    const savedLeave = typeof window !== 'undefined' ? localStorage.getItem('adyapan_imported_leave_requests') : null;
    let localLeave: any[] = [];
    try { localLeave = savedLeave ? JSON.parse(savedLeave) : []; } catch { localLeave = []; }

    apiRequest('/leave/requests').then((d) => {
      const fetched = Array.isArray(d) ? d : (d?.data && Array.isArray(d.data) ? d.data : []);
      const map = new Map();
      for (const item of fetched) {
        const key = item.id || `${item.employeeCode || item.employeeId}_${item.startDate}`;
        map.set(key, item);
      }
      for (const item of localLeave) {
        const key = item.id || `${item.employeeCode || item.employeeId}_${item.startDate}`;
        if (!map.has(key)) map.set(key, item);
      }
      setLeaves(Array.from(map.values()));
    }).catch(() => {
      setLeaves(localLeave);
    });

    // 3. Daily reports
    apiRequest('/reports/daily').then((d) => {
      const arr = Array.isArray(d) ? d : (d?.data && Array.isArray(d.data) ? d.data : []);
      const pavitraReports = arr.filter((r: any) =>
        r.userEmail === 'pavitra@adyapan.com' ||
        r.specialization === 'ATTENDANCE_LEAVE' ||
        (r.employeeName || '').toLowerCase().includes('pavitra')
      );
      setDailyReports(pavitraReports);
    }).catch(() => {
      setDailyReports([]);
    });
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await apiRequest(`/reports/daily/${id}/approve`, { method: 'PUT' });
      setDailyReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'APPROVED' } : r));
      if (selectedReport?.id === id) {
        setSelectedReport((prev: any) => prev ? { ...prev, status: 'APPROVED' } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiRequest(`/reports/daily/${id}/reject`, { method: 'PUT' });
      setDailyReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'REJECTED' } : r));
      if (selectedReport?.id === id) {
        setSelectedReport((prev: any) => prev ? { ...prev, status: 'REJECTED' } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
    }
  };

  const normalizeStatusToCode = (status: string): string => {
    const s = String(status || '').toUpperCase().trim();
    if (!s) return '-';
    if (s === 'PRESENT' || s === 'P' || s === 'PR' || s === 'PRES' || s === '1') return 'P';
    if (s === 'ABSENT' || s === 'A' || s === 'AB' || s === 'ABS' || s === '0') return 'A';
    if (s === 'CASUAL_LEAVE' || s === 'CL' || s === 'C.L' || s === 'CASUAL' || s === 'CASUAL LEAVE') return 'CL';
    if (s === 'SICK_LEAVE' || s === 'SL' || s === 'S.L' || s === 'SICK' || s === 'SICK LEAVE') return 'SL';
    if (s === 'HOLIDAY' || s === 'H' || s === 'HOL') return 'H';
    if (s === 'WEEKLY_OFF' || s === 'WO' || s === 'W.O' || s === 'W/O' || s === 'OFF' || s === 'WEEKLY OFF' || s === 'WEEK OFF') return 'WO';
    if (s === 'OVERTIME' || s === 'OT' || s === 'O.T' || s === 'OVERTIME') return 'OT';
    if (s === 'WORK_FROM_HOME' || s === 'WFH' || s === 'W.F.H' || s === 'WORK FROM HOME') return 'WFH';
    if (s === 'HALF_DAY' || s === 'HD' || s === 'H.D' || s === 'HALF DAY' || s === 'HALF-DAY' || s === '0.5' || s === '0.5P') return 'HD';
    if (s === 'EARLY_LOGOUT' || s === 'EL' || s === 'E.L' || s === 'EARLY LOGOUT' || s === 'EARLY OUT') return 'EL';
    if (s === 'LATE_LOGIN' || s === 'LATE' || s === 'LL' || s === 'L.L' || s === 'LATE LOGIN' || s === 'LATE IN') return 'LL';
    if (s === 'EMERGENCY_LEAVE' || s === 'E_L' || s === 'E.L.' || s === 'EMERGENCY' || s === 'EMERGENCY LEAVE') return 'E_L';
    if (s === 'PAID_LEAVE' || s === 'PL' || s === 'P.L' || s === 'PAID LEAVE') return 'PL';
    if (s === 'LONG_LEAVE' || s === 'LLV' || s === 'L.L.V' || s === 'LONG LEAVE' || s === 'LONG LEAVES') return 'LLV';
    if (s === 'NATIONAL_HOLIDAY' || s === 'NH' || s === 'N.H' || s === 'NATIONAL HOLIDAY') return 'NH';
    if (s === 'FESTIVE_HOLIDAY' || s === 'FH' || s === 'F.H' || s === 'FESTIVE HOLIDAY') return 'FH';
    if (s === 'TRAINING' || s === 'T' || s === 'TR' || s === 'TRAINING') return 'T';
    if (s === 'LOP' || s === 'L.O.P' || s === 'LOSS OF PAY' || s === 'LOSS_OF_PAY') return 'LOP';
    if (s === 'PERSONAL_LEAVE' || s === 'PEL' || s === 'PERSONAL LEAVE') return 'PeL';
    return s;
  };

  const getStatusBadgeStyle = (code: string) => {
    switch (code) {
      case 'P': return 'bg-emerald-100 text-emerald-800 font-bold';
      case 'A': return 'bg-red-100 text-red-800 font-bold';
      case 'CL': return 'bg-amber-100 text-amber-800 font-bold';
      case 'SL': return 'bg-orange-100 text-orange-800 font-bold';
      case 'H': return 'bg-slate-200 text-slate-800 font-bold';
      case 'WO': return 'bg-slate-200 text-slate-800 font-bold';
      case 'OT': return 'bg-blue-100 text-blue-800 font-bold';
      case 'WFH': return 'bg-teal-100 text-teal-800 font-bold';
      case 'HD': return 'bg-pink-100 text-pink-800 font-bold';
      case 'EL': return 'bg-yellow-100 text-yellow-800 font-bold';
      case 'LL': return 'bg-amber-100 text-amber-800 font-bold';
      case 'E_L': return 'bg-rose-100 text-rose-800 font-bold';
      case 'PL': return 'bg-indigo-100 text-indigo-800 font-bold';
      case 'LLV': return 'bg-purple-100 text-purple-800 font-bold';
      case 'NH': return 'bg-cyan-100 text-cyan-800 font-bold';
      case 'FH': return 'bg-lime-100 text-lime-800 font-bold';
      case 'T': return 'bg-violet-100 text-violet-800 font-bold';
      case 'LOP': return 'bg-gray-200 text-gray-800 font-bold';
      case 'PeL': return 'bg-fuchsia-100 text-fuchsia-800 font-bold';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  const [yearStr, monthStr] = selectedMonth.split('-');
  const daysInMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0).getDate();

  // Extract unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      const d = e.department?.name || e.department;
      if (d && d !== '-' && d.trim() !== '') set.add(d);
    });
    attendance.forEach((a) => {
      if (a.department && a.department !== '-' && a.department.trim() !== '') set.add(a.department);
    });
    return Array.from(set).sort();
  }, [employees, attendance]);

  // Grouped monthly attendance data
  const groupedAttendance = useMemo(() => {
    const empMap = new Map<
      string,
      {
        empId: string;
        empName: string;
        role: string;
        department: string;
        designation: string;
        days: Record<number, string>;
        presentCount: number;
        absentCount: number;
        lopCount: number;
        sickLeaveCount: number;
        casualLeaveCount: number;
        lateLoginCount: number;
        halfDayCount: number;
        woCount: number;
        holidayCount: number;
        wfhCount: number;
        earlyLogoutCount: number;
        paidLeaveCount: number;
      }
    >();

    // 1. Populate from attendance logs first (exact match with attendance page)
    for (const log of attendance) {
      const key = log.empId || log.employeeId || log.employeeCode;
      if (!key) continue;

      if (!empMap.has(key)) {
        empMap.set(key, {
          empId: key,
          empName: log.empName || log.employeeName || 'Employee',
          role: log.role && log.role !== '-' ? log.role : '-',
          department: log.department && log.department !== '-' ? log.department : '-',
          designation: log.designation && log.designation !== '-' ? log.designation : '-',
          days: {},
          presentCount: 0,
          absentCount: 0,
          lopCount: 0,
          sickLeaveCount: 0,
          casualLeaveCount: 0,
          lateLoginCount: 0,
          halfDayCount: 0,
          woCount: 0,
          holidayCount: 0,
          wfhCount: 0,
          earlyLogoutCount: 0,
          paidLeaveCount: 0,
        });
      }

      const emp = empMap.get(key)!;

      let meta: any = log.summary || {};
      if (log.notes && typeof log.notes === 'string' && log.notes.trim().startsWith('{')) {
        try {
          meta = { ...meta, ...JSON.parse(log.notes) };
        } catch {}
      }

      if (log.department && log.department !== '-' && (!emp.department || emp.department === '-')) {
        emp.department = log.department;
      }
      if (log.designation && log.designation !== '-' && (!emp.designation || emp.designation === '-')) {
        emp.designation = log.designation;
      }
      if (log.role && log.role !== '-' && (!emp.role || emp.role === '-')) {
        emp.role = log.role;
      }
      if (log.empName && log.empName !== 'Employee' && (emp.empName === 'Employee' || !emp.empName)) {
        emp.empName = log.empName;
      }

      if (meta.department && meta.department !== '-') emp.department = meta.department;
      if (meta.designation && meta.designation !== '-') emp.designation = meta.designation;
      if (meta.role && meta.role !== '-') emp.role = meta.role;

      const dateStr = log.date || (log.createdAt ? log.createdAt.split('T')[0] : '');
      if (dateStr && (!filterDate || dateStr === filterDate)) {
        const day = parseInt(dateStr.split('-')[2], 10);
        if (!isNaN(day) && day >= 1 && day <= 31) {
          const code = normalizeStatusToCode(log.status);
          emp.days[day] = code;
        }
      }
    }

    // 2. Calculate row stats
    const list = Array.from(empMap.values());
    for (const emp of list) {
      let p = 0, a = 0, lop = 0, sl = 0, cl = 0, ll = 0, hd = 0, wo = 0, h = 0, wfh = 0, el = 0, pl = 0;
      Object.values(emp.days).forEach((code) => {
        if (code === 'P') p++;
        else if (code === 'A') a++;
        else if (code === 'LOP') lop++;
        else if (code === 'SL') sl++;
        else if (code === 'CL') cl++;
        else if (code === 'LL') ll++;
        else if (code === 'HD') { hd++; p += 0.5; }
        else if (code === 'WO') wo++;
        else if (code === 'H') h++;
        else if (code === 'WFH') wfh++;
        else if (code === 'EL') el++;
        else if (code === 'PL') pl++;
      });
      emp.presentCount = p;
      emp.absentCount = a;
      emp.lopCount = lop;
      emp.sickLeaveCount = sl;
      emp.casualLeaveCount = cl;
      emp.lateLoginCount = ll;
      emp.halfDayCount = hd;
      emp.woCount = wo;
      emp.holidayCount = h;
      emp.wfhCount = wfh;
      emp.earlyLogoutCount = el;
      emp.paidLeaveCount = pl;
    }

    return list;
  }, [attendance, selectedMonth, filterDate]);

  // Filtered grouped attendance by search and department
  const filteredGroupedAttendance = useMemo(() => {
    return groupedAttendance.filter((emp) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        emp.empName.toLowerCase().includes(q) ||
        emp.empId.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q);
      const matchesDept = selectedDepartment === 'ALL' || emp.department === selectedDepartment;
      return matchesSearch && matchesDept;
    });
  }, [groupedAttendance, searchTerm, selectedDepartment]);

  const filterByDate = (records: any[]) => {
    if (!filterDate) return records;
    return records.filter((r) => {
      const created = r.date || r.importedDate || (r.createdAt ? r.createdAt.split('T')[0] : '') || r.createdDate || r.startDate || r.from;
      return created === filterDate;
    });
  };

  const filteredLeaves = filterByDate(leaves);
  const filteredDailyReports = filterByDate(dailyReports);

  const getEmpStatus = (emp: any): 'ACTIVE' | 'INACTIVE' => {
    const raw = String(emp.status || emp.employeeStatus || '').trim().toUpperCase();
    if (
      raw === 'INACTIVE' ||
      raw === 'TERMINATED' ||
      raw === 'RESIGNED' ||
      raw === 'EXITED' ||
      raw.includes('INACT') ||
      raw.includes('RESIGN') ||
      raw.includes('EXIT')
    ) {
      return 'INACTIVE';
    }

    const activeVal: any = emp.isActive;
    if (activeVal !== undefined && activeVal !== null) {
      if (
        activeVal === false ||
        activeVal === 0 ||
        activeVal === '0' ||
        String(activeVal).toLowerCase() === 'false'
      ) {
        return 'INACTIVE';
      }
      if (
        activeVal === true ||
        activeVal === 1 ||
        activeVal === '1' ||
        String(activeVal).toLowerCase() === 'true'
      ) {
        return 'ACTIVE';
      }
    }

    if (raw === 'ACTIVE' || raw === 'CONFIRMED' || raw === 'PROBATION' || raw.includes('ACT')) {
      return 'ACTIVE';
    }

    return 'ACTIVE';
  };

  const empMetrics = useMemo(() => {
    let active = 0;
    let inactive = 0;
    employees.forEach((e) => {
      const s = getEmpStatus(e);
      if (s === 'ACTIVE') active++;
      else inactive++;
    });
    return {
      total: employees.length,
      active,
      inactive,
    };
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const q = empSearchTerm.toLowerCase().trim();
      const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || '';
      const code = String(emp.employeeCode || emp.id || '').toLowerCase();
      const email = String(emp.user?.email || emp.email || '').toLowerCase();
      const dept = String(emp.department?.name || emp.department || '');
      const status = getEmpStatus(emp);

      const matchesSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        code.includes(q) ||
        email.includes(q) ||
        dept.toLowerCase().includes(q);

      const matchesStatus =
        empStatusFilter === 'ALL' ||
        (empStatusFilter === 'ACTIVE' && status === 'ACTIVE') ||
        (empStatusFilter === 'INACTIVE' && status === 'INACTIVE');

      const matchesDept = empDeptFilter === 'ALL' || dept === empDeptFilter;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [employees, empSearchTerm, empStatusFilter, empDeptFilter]);

  const paginatedEmployees = useMemo(() => {
    const start = (empPage - 1) * PAGE_SIZE;
    return filteredEmployees.slice(start, start + PAGE_SIZE);
  }, [filteredEmployees, empPage]);

  const paginatedAttendance = useMemo(() => {
    const start = (attPage - 1) * PAGE_SIZE;
    return filteredGroupedAttendance.slice(start, start + PAGE_SIZE);
  }, [filteredGroupedAttendance, attPage]);

  const paginatedLeaves = useMemo(() => {
    const start = (leavePage - 1) * PAGE_SIZE;
    return filteredLeaves.slice(start, start + PAGE_SIZE);
  }, [filteredLeaves, leavePage]);

  const paginatedReports = useMemo(() => {
    const start = (repPage - 1) * PAGE_SIZE;
    return filteredDailyReports.slice(start, start + PAGE_SIZE);
  }, [filteredDailyReports, repPage]);

  const downloadReportExcel = () => {
    const headers = ['Sl#', 'Emp ID', 'Employee Name', 'Department'];
    for (let i = 1; i <= daysInMonth; i++) headers.push(i.toString());
    headers.push('Present (P)', 'Absent (A)', 'LOP', 'Sick Leave (SL)', 'Casual Leave (CL)', 'Late (LL)', 'Half Day (HD)', 'Weekly Off (WO)', 'WFH');

    const rows = filteredGroupedAttendance.map((emp, idx) => {
      const row: any[] = [idx + 1, emp.empId, emp.empName, emp.department];
      for (let i = 1; i <= daysInMonth; i++) {
        row.push(emp.days[i] || '-');
      }
      row.push(
        emp.presentCount,
        emp.absentCount,
        emp.lopCount,
        emp.sickLeaveCount,
        emp.casualLeaveCount,
        emp.lateLoginCount,
        emp.halfDayCount,
        emp.woCount,
        emp.wfhCount
      );
      return row;
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pavitra_Attendance_Report');
    XLSX.writeFile(wb, `Pavitra_Attendance_Report_${selectedMonth}.xlsx`);
  };

  return (
    <div className="space-y-8 max-w-[1450px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Pavitra&apos;s Complete Attendance & Leave Report</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Attendance verification, standard status codes (P, A, LOP, SL, CL, LL, HD), leave applications, and daily work logs
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 shadow-xs text-xs">
            <span className="font-bold text-slate-300">Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setAttPage(1);
              }}
              className="text-xs font-bold text-white border-none outline-none bg-transparent cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 shadow-xs text-xs">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setAttPage(1);
                setLeavePage(1);
                setRepPage(1);
              }}
              className="text-xs font-bold text-white border-none outline-none bg-transparent cursor-pointer"
            />
          </div>
          {filterDate && (
            <button
              onClick={() => {
                setFilterDate('');
                setAttPage(1);
                setLeavePage(1);
                setRepPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-xs font-bold text-red-200 transition cursor-pointer border border-red-400/30"
            >
              Clear Filter
            </button>
          )}
          <button
            onClick={downloadReportExcel}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {filterDate && (
        <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>Showing records filtered strictly for date: {filterDate}</span>
          <button onClick={() => setFilterDate('')} className="underline text-emerald-700 font-semibold cursor-pointer">
            Reset to full month ({selectedMonth})
          </button>
        </div>
      )}

      {/* 1. Employee Master Roster Section */}
      <section className="space-y-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-black text-slate-900">
              Employee Master Directory ({filteredEmployees.length})
            </h2>
          </div>

          {/* Status Filter Tabs & Search */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Pills */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => {
                  setEmpStatusFilter('ALL');
                  setEmpPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  empStatusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({empMetrics.total})
              </button>
              <button
                onClick={() => {
                  setEmpStatusFilter('ACTIVE');
                  setEmpPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  empStatusFilter === 'ACTIVE'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active ({empMetrics.active})
              </button>
              <button
                onClick={() => {
                  setEmpStatusFilter('INACTIVE');
                  setEmpPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  empStatusFilter === 'INACTIVE'
                    ? 'bg-white text-red-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Inactive ({empMetrics.inactive})
              </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee..."
                value={empSearchTerm}
                onChange={(e) => {
                  setEmpSearchTerm(e.target.value);
                  setEmpPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none w-32 sm:w-40"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={empDeptFilter}
                onChange={(e) => {
                  setEmpDeptFilter(e.target.value);
                  setEmpPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No employee records match the selected filter criteria.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold whitespace-nowrap">
                    <th className="px-4 py-3">Emp Code</th>
                    <th className="px-4 py-3">Employee Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Designation</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Join Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedEmployees.map((emp, idx) => {
                    const empStatus = getEmpStatus(emp);
                    const isActive = empStatus === 'ACTIVE';
                    return (
                      <tr key={emp.id || idx} className="hover:bg-slate-50 transition whitespace-nowrap">
                        <td className="px-4 py-2.5 font-bold text-slate-800">{emp.employeeCode || emp.id}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">{`${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || 'Employee'}</td>
                        <td className="px-4 py-2.5 text-slate-600">{emp.user?.email || emp.email || '-'}</td>
                        <td className="px-4 py-2.5 text-slate-600">{emp.department?.name || emp.department || '-'}</td>
                        <td className="px-4 py-2.5 text-slate-600">{emp.designation?.title || emp.designation || '-'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {empStatus}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 font-medium">{(emp.joiningDate || emp.dateOfJoining || '').split('T')[0] || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={empPage}
              totalItems={filteredEmployees.length}
              pageSize={PAGE_SIZE}
              onPageChange={setEmpPage}
            />
          </div>
        )}
      </section>

      {/* 2. Attendance Records Section — Standard Monthly View Matching Attendance Page */}
      <section className="space-y-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-black text-slate-900">
              Attendance Records — Monthly Grid ({filteredGroupedAttendance.length} employees)
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name / ID / dept..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setAttPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none w-36 sm:w-44"
              />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setAttPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredGroupedAttendance.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No attendance records found for the selected criteria.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="text-[10px] text-center min-w-[1350px] w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="px-3 py-2.5 text-left sticky left-0 bg-slate-50 z-20 min-w-[65px]">Emp ID</th>
                    <th className="px-3 py-2.5 text-left sticky left-[65px] bg-slate-50 z-20 min-w-[125px]">Name</th>
                    <th className="px-2 py-2.5 min-w-[70px]">Dept</th>
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <th key={i + 1} className="px-1 py-2.5 min-w-[26px]">
                        {i + 1}
                      </th>
                    ))}
                    <th className="px-2 py-2.5 min-w-[34px] bg-emerald-50 text-emerald-800" title="Present">P</th>
                    <th className="px-2 py-2.5 min-w-[34px] bg-red-50 text-red-800" title="Absent">A</th>
                    <th className="px-2 py-2.5 min-w-[36px] bg-gray-100 text-gray-800" title="Loss of Pay">LOP</th>
                    <th className="px-2 py-2.5 min-w-[34px] bg-orange-50 text-orange-800" title="Sick Leave">SL</th>
                    <th className="px-2 py-2.5 min-w-[34px] bg-amber-50 text-amber-800" title="Casual Leave">CL</th>
                    <th className="px-2 py-2.5 min-w-[34px] bg-yellow-50 text-yellow-800" title="Late Login">LL</th>
                    <th className="px-2 py-2.5 min-w-[34px] bg-pink-50 text-pink-800" title="Half Day">HD</th>
                    <th className="px-2 py-2.5 min-w-[34px] bg-slate-100 text-slate-800" title="Weekly Off">WO</th>
                    <th className="px-2 py-2.5 min-w-[36px] bg-teal-50 text-teal-800" title="Work From Home">WFH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAttendance.map((emp, idx) => (
                    <tr key={emp.empId + idx} className="hover:bg-slate-50/80 transition">
                      <td className="px-3 py-2 text-left font-mono font-bold text-slate-800 sticky left-0 bg-white z-10">{emp.empId}</td>
                      <td className="px-3 py-2 text-left font-bold text-slate-900 sticky left-[65px] bg-white z-10 truncate max-w-[125px]">{emp.empName}</td>
                      <td className="px-2 py-2 text-slate-600 truncate max-w-[90px]">{emp.department}</td>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const code = emp.days[i + 1] || '-';
                        return (
                          <td key={i + 1} className="px-0.5 py-1.5">
                            {code !== '-' ? (
                              <span className={`inline-block w-5 h-5 leading-5 rounded text-[9px] font-bold ${getStatusBadgeStyle(code)}`}>
                                {code}
                              </span>
                            ) : (
                              <span className="text-slate-200">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 font-bold text-emerald-700 bg-emerald-50/30">{emp.presentCount}</td>
                      <td className="px-2 py-2 font-bold text-red-700 bg-red-50/30">{emp.absentCount}</td>
                      <td className="px-2 py-2 font-bold text-gray-800 bg-gray-100/60">{emp.lopCount}</td>
                      <td className="px-2 py-2 font-bold text-orange-700 bg-orange-50/30">{emp.sickLeaveCount}</td>
                      <td className="px-2 py-2 font-bold text-amber-700 bg-amber-50/30">{emp.casualLeaveCount}</td>
                      <td className="px-2 py-2 font-bold text-amber-700 bg-amber-50/30">{emp.lateLoginCount}</td>
                      <td className="px-2 py-2 font-bold text-pink-700 bg-pink-50/30">{emp.halfDayCount}</td>
                      <td className="px-2 py-2 font-bold text-slate-700 bg-slate-100/40">{emp.woCount}</td>
                      <td className="px-2 py-2 font-bold text-teal-700 bg-teal-50/30">{emp.wfhCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Comprehensive Status Codes Legend */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-600 px-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[8px]">P</span> Present</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-red-100 text-red-800 font-bold flex items-center justify-center text-[8px]">A</span> Absent</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-gray-200 text-gray-800 font-bold flex items-center justify-center text-[8px]">LOP</span> Loss Of Pay</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-orange-100 text-orange-800 font-bold flex items-center justify-center text-[8px]">SL</span> Sick Leave</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[8px]">CL</span> Casual Leave</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[8px]">LL</span> Late Login</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-pink-100 text-pink-800 font-bold flex items-center justify-center text-[8px]">HD</span> Half Day</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-[8px]">WO</span> Weekly Off</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-[8px]">WFH</span> Work From Home</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-yellow-100 text-yellow-800 font-bold flex items-center justify-center text-[8px]">EL</span> Early Out</span>
                <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-[8px]">PL</span> Paid Leave</span>
              </div>
            </div>

            <Pagination
              currentPage={attPage}
              totalItems={filteredGroupedAttendance.length}
              pageSize={PAGE_SIZE}
              onPageChange={setAttPage}
            />
          </div>
        )}
      </section>

      {/* 3. Leave Applications Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Calendar className="w-4 h-4 text-purple-600" /> Leave Applications ({filteredLeaves.length})
        </h2>
        {filteredLeaves.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No leave applications found for this date.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="px-4 py-3">Emp ID</th>
                    <th className="px-4 py-3">Leave Type</th>
                    <th className="px-4 py-3">Start Date</th>
                    <th className="px-4 py-3">End Date</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedLeaves.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-2.5 font-bold text-slate-800">{r.employeeId || r.employeeCode || `EMP-${1000 + idx}`}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-700">{typeof r.leaveType === 'object' ? r.leaveType?.name : r.leaveType || 'Casual Leave'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{r.startDate || '-'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{r.endDate || '-'}</td>
                      <td className="px-4 py-2.5 max-w-[200px] truncate text-slate-600">{r.reason || 'Personal Work'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'APPROVED' ? 'bg-green-100 text-green-700'
                          : r.status === 'REJECTED' ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                          {r.status || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={leavePage}
              totalItems={filteredLeaves.length}
              pageSize={PAGE_SIZE}
              onPageChange={setLeavePage}
            />
          </div>
        )}
      </section>

      {/* 4. Daily Reports Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="w-4 h-4 text-indigo-600" /> Daily Reports Submitted ({filteredDailyReports.length})
        </h2>
        {filteredDailyReports.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No daily reports submitted yet.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Key Performance Updates</th>
                    <th className="px-4 py-3">Blockers / Issues</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action / Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedReports.map((r) => (
                    <tr key={r.id} className="hover:bg-emerald-50/20 transition">
                      <td className="px-4 py-2.5 font-bold text-slate-800">{r.date || r.createdAt?.split('T')[0]}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-700">{r.employeeName || 'Pavitra'}</td>
                      <td className="px-4 py-2.5 text-slate-700 max-w-[280px] truncate">
                        {r.keyUpdates || r.tasksCompleted || 'Attendance verification'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 max-w-[150px] truncate">{r.issue || r.blockers || 'None'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'APPROVED' ? 'bg-green-100 text-green-700'
                          : r.status === 'REJECTED' ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                          {r.status || 'SUBMITTED'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReport(r)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-slate-600" /> Preview
                          </button>
                          {r.status === 'SUBMITTED' && (
                            <>
                              <button
                                onClick={() => handleApprove(r.id)}
                                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleReject(r.id)}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                              >
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={repPage}
              totalItems={filteredDailyReports.length}
              pageSize={PAGE_SIZE}
              onPageChange={setRepPage}
            />
          </div>
        )}
      </section>

      {/* Modal Preview */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2 text-white">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Daily Report Full Preview
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">{selectedReport.employeeName || 'Pavitra'} • {selectedReport.date || selectedReport.createdAt?.split('T')[0]}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Key Performance Summary</label>
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                  {selectedReport.keyUpdates || selectedReport.tasksCompleted || 'No updates logged.'}
                </div>
              </div>
              {selectedReport.issue && (
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Issues / Blockers</label>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 font-medium">
                    {selectedReport.issue}
                  </div>
                </div>
              )}
              {selectedReport.comment && (
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Remarks & Notes</label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                    {selectedReport.comment}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
