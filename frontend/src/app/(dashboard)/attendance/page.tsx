'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Download, Upload, Search, Edit3, Trash2, X, AlertTriangle, Plus, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import UploadProgressModal from '@/components/UploadProgressModal';
import { Pagination } from '@/components/Pagination';

export default function AttendancePage() {
  const { user } = useAuth();
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [sortBy, setSortBy] = useState<'EMP_ID_ASC' | 'EMP_ID_DESC' | 'NAME_ASC' | 'NAME_DESC' | 'DEPT_ASC'>('EMP_ID_ASC');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);

  const [editEmployee, setEditEmployee] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  
  const [deleteEmployee, setDeleteEmployee] = useState<any | null>(null);
  const [reportEmployee, setReportEmployee] = useState<any | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'success' | 'error'>('uploading');
  const [showUploadProgress, setShowUploadProgress] = useState(false);

  const isPavitra = user?.specialization === 'ATTENDANCE_LEAVE' || user?.email === 'pavitra@adyapan.com';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN' || user?.role === 'HR_EXECUTIVE' || user?.role === 'DEPARTMENT_HEAD' || user?.role === 'TEAM_LEADER' || (user?.role as any) === 'ADMIN' || (user?.role as any) === 'SPECIALIST' || isPavitra;

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

      // If HRMS DB is empty, fetch from CRM attendance API
      if (logs.length === 0) {
        try {
          const fromDate = startDate.split('T')[0];
          const toDate = endDate.split('T')[0];
          const crmRes = await fetch(`/api/crm-attendance?from=${fromDate}&to=${toDate}`);
          if (crmRes.ok) {
            const crmJson = await crmRes.json();
            const crmRecords: any[] = Array.isArray(crmJson) ? crmJson : (crmJson.attendance || crmJson.data || crmJson.records || []);
            if (crmRecords.length > 0) {
              logs = crmRecords.map((r: any) => ({
                id: r.id || Math.random().toString(36).slice(2),
                empId: r.employeeCode || r.empId || '-',
                empName: r.employeeName || r.empName || 'Employee',
                role: r.role || '-',
                department: r.department || '-',
                designation: r.designation || '-',
                date: r.date ? r.date.split('T')[0] : '',
                checkInTime: r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
                checkOutTime: r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
                workHours: r.workMinutes ? Math.round((r.workMinutes / 60) * 100) / 100 : 0,
                status: r.status || 'PRESENT',
                lateMinutes: 0,
                source: 'CRM',
              }));
            }
          }
        } catch (crmErr) {
          console.warn('CRM attendance fallback skipped:', crmErr);
        }
      }

      setAllLogs(logs);
    } catch (error) {
      console.error('Failed to fetch attendance', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedMonth]);

  const [yearStr, monthStr] = selectedMonth.split('-');
  const daysInMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0).getDate();

  const getMonthlyStats = () => {
    const empMap = new Map<string, any>();
    for (const log of allLogs) {
      const key = log.empId;
      if (!empMap.has(key)) {
        empMap.set(key, {
          empId: key,
          empName: log.empName,
          role: log.role && log.role !== '-' ? log.role : '-',
          department: log.department && log.department !== '-' ? log.department : '-',
          designation: log.designation && log.designation !== '-' ? log.designation : '-',
          days: {} as Record<number, string>,
          customSummary: {} as Record<string, any>,
          presentCount: 0,
          absentCount: 0,
          earlyLogoutCount: 0,
          lateLoginCount: 0,
          sickLeaveCount: 0,
          emergencyLeaveCount: 0,
          paidLeaveCount: 0,
          longLeaveCount: 0,
          mailReceivedCount: 0,
          mailNotReceivedCount: 0,
          casualLeaveCount: 0,
          approvedByVal: '-',
          notApprovedCount: 0,
          nationalHolidayCount: 0,
          festiveHolidayCount: 0,
          holidayCount: 0,
          trainingCount: 0,
          wo: 0, ot: 0, wfh: 0, hd: 0, lopCount: 0, personalLeaveCount: 0
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

      if (meta.department && meta.department !== '-') emp.department = meta.department;
      if (meta.designation && meta.designation !== '-') emp.designation = meta.designation;
      if (meta.role && meta.role !== '-') emp.role = meta.role;

      if (meta && typeof meta === 'object') {
        emp.customSummary = { ...emp.customSummary, ...meta };
      }

      if (log.date) {
        const day = parseInt(log.date.split('-')[2], 10);
        if (!isNaN(day)) {
          emp.days[day] = log.status;
          if (log.status === 'PRESENT') emp.presentCount++;
          else if (log.status === 'ABSENT') emp.absentCount++;
          else if (log.status === 'EARLY_LOGOUT') emp.earlyLogoutCount++;
          else if (log.status === 'LATE_LOGIN') emp.lateLoginCount++;
          else if (log.status === 'SICK_LEAVE') emp.sickLeaveCount++;
          else if (log.status === 'EMERGENCY_LEAVE') emp.emergencyLeaveCount++;
          else if (log.status === 'PAID_LEAVE') emp.paidLeaveCount++;
          else if (log.status === 'LONG_LEAVE') emp.longLeaveCount++;
          else if (log.status === 'CASUAL_LEAVE') emp.casualLeaveCount++;
          else if (log.status === 'NATIONAL_HOLIDAY') emp.nationalHolidayCount++;
          else if (log.status === 'FESTIVE_HOLIDAY') emp.festiveHolidayCount++;
          else if (log.status === 'HOLIDAY') emp.holidayCount++;
          else if (log.status === 'TRAINING') emp.trainingCount++;
          else if (log.status === 'WEEKLY_OFF') emp.wo++;
          else if (log.status === 'OVERTIME') emp.ot++;
          else if (log.status === 'WORK_FROM_HOME') emp.wfh++;
          else if (log.status === 'HALF_DAY') emp.hd++;
          else if (log.status === 'LOP') emp.lopCount++;
          else if (log.status === 'PERSONAL_LEAVE') emp.personalLeaveCount++;
        }
      }
    }
    return Array.from(empMap.values());
  };

  const allEmployees = useMemo(() => {
    return getMonthlyStats().map(emp => {
      const cs = emp.customSummary || {};
      const resolveSummaryVal = (customVal: any, autoCount: number) => {
        if (customVal !== undefined && customVal !== null && String(customVal).trim() !== '') {
          return customVal;
        }
        return autoCount;
      };

      return {
        ...emp,
        present: resolveSummaryVal(cs.present, emp.presentCount),
        absent: resolveSummaryVal(cs.absent, emp.absentCount),
        earlyLogout: resolveSummaryVal(cs.earlyLogout, emp.earlyLogoutCount),
        lateLogin: resolveSummaryVal(cs.lateLogin, emp.lateLoginCount),
        sickLeave: resolveSummaryVal(cs.sickLeave, emp.sickLeaveCount),
        emergencyLeave: resolveSummaryVal(cs.emergencyLeave, emp.emergencyLeaveCount),
        paidLeave: resolveSummaryVal(cs.paidLeave, emp.paidLeaveCount),
        longLeave: resolveSummaryVal(cs.longLeave, emp.longLeaveCount),
        mailReceived: resolveSummaryVal(cs.mailReceived, emp.mailReceivedCount),
        mailNotReceived: resolveSummaryVal(cs.mailNotReceived, emp.mailNotReceivedCount),
        casualLeave: resolveSummaryVal(cs.casualLeave, emp.casualLeaveCount),
        approvedBy: cs.approvedBy !== undefined && String(cs.approvedBy).trim() !== '' ? cs.approvedBy : emp.approvedByVal,
        notApproved: resolveSummaryVal(cs.notApproved, emp.notApprovedCount),
        nationalHoliday: resolveSummaryVal(cs.nationalHoliday, emp.nationalHolidayCount),
        festiveHoliday: resolveSummaryVal(cs.festiveHoliday, emp.festiveHolidayCount),
        holiday: resolveSummaryVal(cs.holiday, emp.holidayCount),
        training: resolveSummaryVal(cs.training, emp.trainingCount),
        lop: resolveSummaryVal(cs.lop, emp.lopCount),
        personalLeave: resolveSummaryVal(cs.personalLeave, emp.personalLeaveCount),
      };
    });
  }, [allLogs, daysInMonth]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    allEmployees.forEach(emp => {
      if (emp.department && emp.department !== '-' && emp.department.trim() !== '') {
        set.add(emp.department);
      }
    });
    return Array.from(set).sort();
  }, [allEmployees]);

  const filteredEmployees = useMemo(() => {
    return allEmployees
      .filter(emp => {
        const q = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !q ||
          emp.empName.toLowerCase().includes(q) ||
          emp.empId.toLowerCase().includes(q) ||
          (emp.role || '').toLowerCase().includes(q) ||
          (emp.department || '').toLowerCase().includes(q) ||
          (emp.designation || '').toLowerCase().includes(q);

        const matchesDept =
          selectedDepartment === 'ALL' || emp.department === selectedDepartment;

        return matchesSearch && matchesDept;
      })
      .sort((a, b) => {
        if (sortBy === 'NAME_ASC') {
          return (a.empName || '').localeCompare(b.empName || '', undefined, { sensitivity: 'base' });
        }
        if (sortBy === 'NAME_DESC') {
          return (b.empName || '').localeCompare(a.empName || '', undefined, { sensitivity: 'base' });
        }
        if (sortBy === 'EMP_ID_DESC') {
          return (b.empId || '').localeCompare(a.empId || '', undefined, { numeric: true, sensitivity: 'base' });
        }
        if (sortBy === 'DEPT_ASC') {
          const deptComp = (a.department || '').localeCompare(b.department || '');
          if (deptComp !== 0) return deptComp;
          return (a.empId || '').localeCompare(b.empId || '', undefined, { numeric: true, sensitivity: 'base' });
        }
        return (a.empId || '').localeCompare(b.empId || '', undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [allEmployees, searchTerm, selectedDepartment, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [selectedMonth, searchTerm, selectedDepartment, sortBy]);

  const paginatedEmployees = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredEmployees.slice(start, start + PAGE_SIZE);
  }, [filteredEmployees, page]);

  const downloadTemplate = () => {
    const headers = ['Sl#', 'Employee Name', 'Employee ID', 'Role', 'Department', 'Designation'];
    for (let i = 1; i <= daysInMonth; i++) headers.push(i.toString());
    headers.push(
      'Present', 'Absent', 'Early Logout', 'Late Login', 'Sick Leave', 
      'Emergency Leave', 'Paid Leave', 'Long Leaves', 'Mail Received', 
      'Mail Not Received', 'Casual Leave', 'Approved By', 'Not Approved', 
      'National Holiday', 'Festive Holiday', 'Holiday', 'Training'
    );
    
    const ws = XLSX.utils.aoa_to_sheet([
      headers,
      ['1', 'John Doe', 'EMP-001', 'Developer', 'Engineering', 'SDE-1', ...Array(daysInMonth).fill('P'), '20', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'Admin', '0', '0', '0', '0', '0']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance_Template');
    XLSX.writeFile(wb, `Attendance_Template_${selectedMonth}.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // 1. Dynamic Header Row Detection (supports title rows / metadata headers)
        const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
        let headerRowIdx = 0;

        for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
          const rowStr = rawRows[r].map(c => String(c).toLowerCase()).join(' ');
          if (
            /emp.*(?:id|code)|employee.*(?:id|code)|staff.*(?:id|code)/i.test(rowStr) ||
            (rowStr.includes('name') && (rowStr.includes('present') || rowStr.includes('absent') || /\b1\b.*\b2\b.*\b3\b/.test(rowStr)))
          ) {
            headerRowIdx = r;
            break;
          }
        }

        const headerRow = rawRows[headerRowIdx].map((c: any) => String(c ?? '').trim().replace(/[\u00a0\r\n\t]/g, ' '));
        const dataRows = rawRows.slice(headerRowIdx + 1);

        const jsonData: any[] = [];
        for (const row of dataRows) {
          if (!row || row.every((c: any) => String(c ?? '').trim() === '')) continue;
          const obj: Record<string, any> = {};
          headerRow.forEach((h: string, colIdx: number) => {
            if (h) {
              obj[h] = row[colIdx] !== undefined ? row[colIdx] : '';
            } else {
              obj[`col_${colIdx}`] = row[colIdx] !== undefined ? row[colIdx] : '';
            }
          });
          jsonData.push(obj);
        }

        const codeMap: Record<string, string> = {
          'P': 'PRESENT', 'PR': 'PRESENT', 'PRES': 'PRESENT', 'PRESENT': 'PRESENT', '1': 'PRESENT',
          'A': 'ABSENT', 'AB': 'ABSENT', 'ABS': 'ABSENT', 'ABSENT': 'ABSENT', '0': 'ABSENT',
          'CL': 'CASUAL_LEAVE', 'C.L': 'CASUAL_LEAVE', 'CASUAL': 'CASUAL_LEAVE', 'CASUAL LEAVE': 'CASUAL_LEAVE', 'CASUAL_LEAVE': 'CASUAL_LEAVE',
          'SL': 'SICK_LEAVE', 'S.L': 'SICK_LEAVE', 'SICK': 'SICK_LEAVE', 'SICK LEAVE': 'SICK_LEAVE', 'SICK_LEAVE': 'SICK_LEAVE',
          'H': 'HOLIDAY', 'HOL': 'HOLIDAY', 'HOLIDAY': 'HOLIDAY',
          'WO': 'WEEKLY_OFF', 'W.O': 'WEEKLY_OFF', 'W/O': 'WEEKLY_OFF', 'OFF': 'WEEKLY_OFF', 'WEEKLY OFF': 'WEEKLY_OFF', 'WEEKLY_OFF': 'WEEKLY_OFF', 'WEEK OFF': 'WEEKLY_OFF',
          'OT': 'OVERTIME', 'O.T': 'OVERTIME', 'OVERTIME': 'OVERTIME',
          'WFH': 'WORK_FROM_HOME', 'W.F.H': 'WORK_FROM_HOME', 'WORK FROM HOME': 'WORK_FROM_HOME', 'WORK_FROM_HOME': 'WORK_FROM_HOME',
          'HD': 'HALF_DAY', 'H.D': 'HALF_DAY', 'HALF DAY': 'HALF_DAY', 'HALF_DAY': 'HALF_DAY', 'HALF-DAY': 'HALF_DAY', '0.5': 'HALF_DAY', '0.5P': 'HALF_DAY',
          'EL': 'EARLY_LOGOUT', 'E.L': 'EARLY_LOGOUT', 'EARLY LOGOUT': 'EARLY_LOGOUT', 'EARLY_LOGOUT': 'EARLY_LOGOUT', 'EARLY OUT': 'EARLY_LOGOUT',
          'LL': 'LATE_LOGIN', 'L.L': 'LATE_LOGIN', 'LATE LOGIN': 'LATE_LOGIN', 'LATE_LOGIN': 'LATE_LOGIN', 'LATE IN': 'LATE_LOGIN',
          'E_L': 'EMERGENCY_LEAVE', 'E.L.': 'EMERGENCY_LEAVE', 'EMERGENCY LEAVE': 'EMERGENCY_LEAVE', 'EMERGENCY_LEAVE': 'EMERGENCY_LEAVE', 'EMERGENCY': 'EMERGENCY_LEAVE',
          'PL': 'PAID_LEAVE', 'P.L': 'PAID_LEAVE', 'PAID LEAVE': 'PAID_LEAVE', 'PAID_LEAVE': 'PAID_LEAVE',
          'LLV': 'LONG_LEAVE', 'L.L.V': 'LONG_LEAVE', 'LONG LEAVE': 'LONG_LEAVE', 'LONG_LEAVE': 'LONG_LEAVE', 'LONG LEAVES': 'LONG_LEAVE',
          'NH': 'NATIONAL_HOLIDAY', 'N.H': 'NATIONAL_HOLIDAY', 'NATIONAL HOLIDAY': 'NATIONAL_HOLIDAY', 'NATIONAL_HOLIDAY': 'NATIONAL_HOLIDAY',
          'FH': 'FESTIVE_HOLIDAY', 'F.H': 'FESTIVE_HOLIDAY', 'FESTIVE HOLIDAY': 'FESTIVE_HOLIDAY', 'FESTIVE_HOLIDAY': 'FESTIVE_HOLIDAY',
          'T': 'TRAINING', 'TR': 'TRAINING', 'TRAINING': 'TRAINING',
          'LOP': 'LOP', 'L.O.P': 'LOP', 'LOSS OF PAY': 'LOP', 'LOSS_OF_PAY': 'LOP',
          'PEL': 'PERSONAL_LEAVE', 'PERSONAL LEAVE': 'PERSONAL_LEAVE', 'PERSONAL_LEAVE': 'PERSONAL_LEAVE'
        };

        const formattedRecords: any[] = [];

        for (const row of jsonData) {
          const keys = Object.keys(row);
          
          const empIdKey = keys.find(k => /^(employee\s*id|emp\s*id|id|employee\s*code|emp\s*code|code|emp_id|employee_id|emp_code|employee_code)$/i.test(k.trim().replace(/[\u00a0\r\n\t]/g, ' ')));
          const rawEmpId = empIdKey ? row[empIdKey] : (row['Employee ID'] || row['ID'] || row['Emp ID'] || row['Employee Code'] || row['Emp Code'] || row['empId']);

          const empNameKey = keys.find(k => /^(employee\s*name|emp\s*name|name|staff\s*name|full\s*name|employee|staff|emp_name|employee_name)$/i.test(k.trim().replace(/[\u00a0\r\n\t]/g, ' ')));
          const rawEmpName = empNameKey ? row[empNameKey] : (row['Employee Name'] || row['Name'] || row['Emp Name']);

          const empId = rawEmpId !== undefined && rawEmpId !== null && String(rawEmpId).trim() !== '' ? String(rawEmpId).trim() : '';
          const empName = rawEmpName !== undefined && rawEmpName !== null && String(rawEmpName).trim() !== '' ? String(rawEmpName).trim() : '';

          const deptKey = keys.find(k => /^(department|dept|dept\s*name|department\s*name)$/i.test(k.trim().replace(/[\u00a0\r\n\t]/g, ' ')));
          const department = deptKey ? String(row[deptKey] ?? '').trim() : (row['Department'] || row['Dept'] || '');

          const desigKey = keys.find(k => /^(designation|desig|designation\s*title|title|position)$/i.test(k.trim().replace(/[\u00a0\r\n\t]/g, ' ')));
          const designation = desigKey ? String(row[desigKey] ?? '').trim() : (row['Designation'] || row['Desig'] || '');

          const roleKey = keys.find(k => /^(role|user\s*role)$/i.test(k.trim().replace(/[\u00a0\r\n\t]/g, ' ')));
          const role = roleKey ? String(row[roleKey] ?? '').trim() : (row['Role'] || '');

          const findVal = (regex: RegExp) => {
            const matchedKey = keys.find(k => regex.test(k.trim().replace(/[\u00a0\r\n\t]/g, ' ')));
            return matchedKey !== undefined ? row[matchedKey] : undefined;
          };

          const summary: Record<string, any> = {};
          const checkAndSet = (prop: string, regex: RegExp) => {
            const v = findVal(regex);
            if (v !== undefined && v !== null && String(v).trim() !== '') {
              summary[prop] = v;
            }
          };

          checkAndSet('present', /^(present|total\s*present|present\s*count|present\s*days|total\s*p|p\s*days|no\.?\s*of\s*present)$/i);
          checkAndSet('absent', /^(absent|total\s*absent|absent\s*count|absent\s*days|total\s*a|a\s*days|no\.?\s*of\s*absent)$/i);
          checkAndSet('earlyLogout', /^(early\s*logout|early\s*out|total\s*early\s*logout|el)$/i);
          checkAndSet('lateLogin', /^(late\s*login|late\s*in|total\s*late\s*login|ll)$/i);
          checkAndSet('sickLeave', /^(sick\s*leave|total\s*sick\s*leave|sl)$/i);
          checkAndSet('emergencyLeave', /^(emergency\s*leave|emergency|total\s*emergency\s*leave|e_l|e\.l)$/i);
          checkAndSet('paidLeave', /^(paid\s*leave|total\s*paid\s*leave|pl)$/i);
          checkAndSet('longLeave', /^(long\s*leave|long\s*leaves|total\s*long\s*leave|llv)$/i);
          checkAndSet('mailReceived', /^(mail\s*received|mail\s*rec|email\s*received)$/i);
          checkAndSet('mailNotReceived', /^(mail\s*not\s*received|mail\s*not\s*rec|email\s*not\s*received)$/i);
          checkAndSet('casualLeave', /^(casual\s*leave|total\s*casual\s*leave|cl)$/i);
          checkAndSet('approvedBy', /^(approved\s*by|approved|approver)$/i);
          checkAndSet('notApproved', /^(not\s*approved|unapproved)$/i);
          checkAndSet('nationalHoliday', /^(national\s*holiday|total\s*national\s*holiday|nh)$/i);
          checkAndSet('festiveHoliday', /^(festive\s*holiday|total\s*festive\s*holiday|fh)$/i);
          checkAndSet('holiday', /^(holiday|total\s*holiday)$/i);
          checkAndSet('training', /^(training|total\s*training)$/i);

          const finalEmpCode = empId || (empName ? `EMP-${empName.replace(/\s+/g, '').slice(0, 6).toUpperCase()}` : '');
          const finalEmpName = empName || (empId ? `Employee (${empId})` : '');

          if (finalEmpCode) {
            let hasDays = false;
            for (let i = 1; i <= daysInMonth; i++) {
              const dayStr = String(i);
              const paddedDay = String(i).padStart(2, '0');
              
              const dayKey = keys.find(k => {
                const cleanK = k.trim().replace(/[\u00a0\r\n\t]/g, ' ');
                if (cleanK === dayStr || cleanK === paddedDay) return true;
                const m = cleanK.match(/^(?:day\s*)?0?([1-9]|[12]\d|3[01])(?:\b|[^\d])/i);
                if (m && parseInt(m[1], 10) === i) return true;
                return false;
              });

              const rawVal = dayKey ? String(row[dayKey] ?? '').trim().toUpperCase() : '';
              if (rawVal && rawVal !== '-' && rawVal !== 'UNDEFINED' && rawVal !== 'NULL') {
                hasDays = true;
                const fullStatus = codeMap[rawVal] || rawVal;
                const dateStr = `${yearStr}-${monthStr}-${paddedDay}`;
                
                formattedRecords.push({
                  employeeCode: finalEmpCode,
                  employeeName: finalEmpName,
                  department: department || undefined,
                  designation: designation || undefined,
                  role: role || undefined,
                  date: dateStr,
                  status: fullStatus,
                  summary: Object.keys(summary).length > 0 ? summary : undefined,
                });
              }
            }

            // If a row had employee details and summary columns but no day numbers
            if (!hasDays && Object.keys(summary).length > 0) {
              const dateStr = `${yearStr}-${monthStr}-01`;
              formattedRecords.push({
                employeeCode: finalEmpCode,
                employeeName: finalEmpName,
                department: department || undefined,
                designation: designation || undefined,
                role: role || undefined,
                date: dateStr,
                status: 'PRESENT',
                summary,
              });
            }
          }
        }

        if (formattedRecords.length === 0) {
          setImportError('No valid attendance day records found. Please check that your Excel file contains Employee ID and day columns.');
          return;
        }

        setImportData(formattedRecords);
        setShowImportModal(true);
      } catch (err: any) {
        setImportError('Failed to parse file. Please ensure it is a valid .xlsx, .xls, or .csv document.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    setShowUploadProgress(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    
    try {
      // Simulate progress while the single API call runs
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 300);

      await apiRequest('/attendance/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ records: importData }),
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');
      setShowImportModal(false);
      await fetchAttendanceData();
    } catch (err: any) {
      setUploadStatus('error');
    } finally {
      setImporting(false);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      // Auto-calculate counters from day-wise statuses before saving
      let p = 0, a = 0, el = 0, ll = 0, sl = 0, ecl = 0, pl = 0, llv = 0, cl = 0, nh = 0, fh = 0, h = 0, t = 0, lop = 0, personalLeave = 0;
      for (let i = 1; i <= daysInMonth; i++) {
        const s = editForm[i];
        if (s === 'PRESENT' || s === 'P') p++;
        else if (s === 'ABSENT' || s === 'A') a++;
        else if (s === 'EARLY_LOGOUT' || s === 'EL') el++;
        else if (s === 'LATE_LOGIN' || s === 'LL') ll++;
        else if (s === 'SICK_LEAVE' || s === 'SL') sl++;
        else if (s === 'EMERGENCY_LEAVE' || s === 'E_L') ecl++;
        else if (s === 'PAID_LEAVE') pl++;
        else if (s === 'LONG_LEAVE' || s === 'LLV') llv++;
        else if (s === 'CASUAL_LEAVE' || s === 'CL') cl++;
        else if (s === 'NATIONAL_HOLIDAY' || s === 'NH') nh++;
        else if (s === 'FESTIVE_HOLIDAY' || s === 'FH') fh++;
        else if (s === 'HOLIDAY' || s === 'H') h++;
        else if (s === 'TRAINING' || s === 'T') t++;
        else if (s === 'LOP') lop++;
        else if (s === 'PERSONAL_LEAVE') personalLeave++;
      }

      const summaryPayload: Record<string, any> = {
        present: p,
        absent: a,
        earlyLogout: el,
        lateLogin: ll,
        sickLeave: sl,
        emergencyLeave: ecl,
        paidLeave: pl,
        longLeave: llv,
        mailReceived: editForm.mailReceived,
        mailNotReceived: editForm.mailNotReceived,
        casualLeave: cl,
        approvedBy: editForm.approvedBy,
        notApproved: editForm.notApproved,
        nationalHoliday: nh,
        festiveHoliday: fh,
        holiday: h,
        training: t,
        lop,
        personalLeave,
        department: editForm.department,
        designation: editForm.designation,
        role: editForm.role,
      };

      const records = [];
      for (let i = 1; i <= daysInMonth; i++) {
        if (editForm[i]) {
          const dateStr = `${selectedMonth}-${String(i).padStart(2, '0')}`;
          const dayApprovedBy = editForm[`approvedBy_${i}`] || '';
          const remarkData = { ...summaryPayload };
          if (dayApprovedBy) {
            remarkData[`approvedBy_day_${i}`] = dayApprovedBy;
          }
          records.push({ 
            date: dateStr, 
            status: editForm[i],
            remarks: JSON.stringify(remarkData),
            approvedBy: dayApprovedBy || editForm.approvedBy || '',
          });
        }
      }
      const targetEmpId = editEmployee.isNew ? editForm.empId : (editForm.empId || editEmployee.empId);
      if (!targetEmpId) {
        alert("Employee ID is required");
        setSaving(false);
        return;
      }
      
      await apiRequest('/attendance/monthly-update', {
        method: 'PUT',
        body: JSON.stringify({
          employeeCode: targetEmpId,
          employeeName: editForm.empName,
          role: editForm.role,
          department: editForm.department,
          designation: editForm.designation,
          month: selectedMonth,
          records
        })
      });

      setEditEmployee(null);
      await fetchAttendanceData();
    } catch (err: any) {
      alert(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteEmployee) return;
    const targetEmpId = deleteEmployee.empId || deleteEmployee.id;
    try {
      await apiRequest('/attendance/monthly-delete', {
        method: 'DELETE',
        body: JSON.stringify({ employeeId: targetEmpId, month: selectedMonth })
      });
      setAllLogs(prev => prev.filter(l => l.empId !== targetEmpId && l.employeeId !== targetEmpId));
      setDeleteEmployee(null);
      await fetchAttendanceData();
    } catch (err: any) {
      alert(err?.message || 'Delete failed');
    }
  };

  const openEditModal = (emp: any) => {
    const form: any = {
      empId: emp.empId || '',
      empName: emp.empName && emp.empName !== 'Employee' ? emp.empName : '',
      role: emp.role && emp.role !== '-' ? emp.role : '',
      department: emp.department && emp.department !== '-' ? emp.department : '',
      designation: emp.designation && emp.designation !== '-' ? emp.designation : '',
      approvedBy: emp.approvedBy && emp.approvedBy !== '-' ? emp.approvedBy : '',
      present: emp.present ?? 0,
      absent: emp.absent ?? 0,
      earlyLogout: emp.earlyLogout ?? 0,
      lateLogin: emp.lateLogin ?? 0,
      sickLeave: emp.sickLeave ?? 0,
      emergencyLeave: emp.emergencyLeave ?? 0,
      paidLeave: emp.paidLeave ?? 0,
      longLeave: emp.longLeave ?? 0,
      mailReceived: emp.mailReceived ?? 0,
      mailNotReceived: emp.mailNotReceived ?? 0,
      casualLeave: emp.casualLeave ?? 0,
      notApproved: emp.notApproved ?? 0,
      nationalHoliday: emp.nationalHoliday ?? 0,
      festiveHoliday: emp.festiveHoliday ?? 0,
      holiday: emp.holiday ?? 0,
      training: emp.training ?? 0,
    };
    if (!emp.isNew && emp.days) {
      for (let i = 1; i <= daysInMonth; i++) {
        form[i] = emp.days[i] || '';
      }
    }
    // Restore per-day approvedBy values from customSummary
    if (emp.customSummary) {
      for (let i = 1; i <= daysInMonth; i++) {
        const dayApproved = emp.customSummary[`approvedBy_day_${i}`];
        if (dayApproved && String(dayApproved).trim() !== '') {
          form[`approvedBy_${i}`] = dayApproved;
        }
      }
    }
    setEditForm(form);
    setEditEmployee(emp);
  };

  const calculateCountersFromDays = () => {
    let p = 0, a = 0, el = 0, ll = 0, sl = 0, ecl = 0, pl = 0, llv = 0, cl = 0, nh = 0, fh = 0, h = 0, t = 0, hd = 0, wfh = 0, wo = 0, ot = 0, lop = 0, personalLeave = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const s = editForm[i];
      if (s === 'PRESENT' || s === 'P') p++;
      else if (s === 'ABSENT' || s === 'A') a++;
      else if (s === 'EARLY_LOGOUT' || s === 'EL') el++;
      else if (s === 'LATE_LOGIN' || s === 'LL') ll++;
      else if (s === 'SICK_LEAVE' || s === 'SL') sl++;
      else if (s === 'EMERGENCY_LEAVE' || s === 'E_L') ecl++;
      else if (s === 'PAID_LEAVE') pl++;
      else if (s === 'LONG_LEAVE' || s === 'LLV') llv++;
      else if (s === 'CASUAL_LEAVE' || s === 'CL') cl++;
      else if (s === 'NATIONAL_HOLIDAY' || s === 'NH') nh++;
      else if (s === 'FESTIVE_HOLIDAY' || s === 'FH') fh++;
      else if (s === 'HOLIDAY' || s === 'H') h++;
      else if (s === 'TRAINING' || s === 'T') t++;
      else if (s === 'HALF_DAY' || s === 'HD') hd++;
      else if (s === 'WORK_FROM_HOME' || s === 'WFH') wfh++;
      else if (s === 'WEEKLY_OFF' || s === 'WO') wo++;
      else if (s === 'OVERTIME' || s === 'OT') ot++;
      else if (s === 'LOP') lop++;
      else if (s === 'PERSONAL_LEAVE') personalLeave++;
    }
    setEditForm({
      ...editForm,
      present: p,
      absent: a,
      earlyLogout: el,
      lateLogin: ll,
      sickLeave: sl,
      emergencyLeave: ecl,
      paidLeave: pl,
      longLeave: llv,
      casualLeave: cl,
      nationalHoliday: nh,
      festiveHoliday: fh,
      holiday: h,
      training: t,
      hd,
      wfh,
      wo,
      ot,
      lop,
      personalLeave,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Monthly Attendance Management</h1>
            <p className="text-sm text-slate-500">Manage and oversee employee attendance strictly by month</p>
          </div>
          
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => openEditModal({ isNew: true, empId: '', empName: '', days: {} })} className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 font-semibold shadow-sm text-sm">
                <Plus className="w-4 h-4" /> Add Manually
              </button>
              <button onClick={downloadTemplate} className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center gap-2 font-semibold shadow-sm text-sm">
                <Download className="w-4 h-4" /> Download Template
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 font-semibold shadow-sm text-sm">
                <Upload className="w-4 h-4" /> Import Excel/CSV
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
            </div>
          )}
        </div>


        {/* Filters & Sorting */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Month Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Month:</span>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 cursor-pointer"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department:</span>
              <select
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Departments ({departments.length})</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="EMP_ID_ASC">Employee ID (Default)</option>
                <option value="NAME_ASC">Employee Name (A to Z)</option>
                <option value="NAME_DESC">Employee Name (Z to A)</option>
                <option value="DEPT_ASC">Department Wise</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex-1 min-w-[240px] max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Employee ID, Name, Role, Department..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Bar for Active Filters */}
        {(selectedDepartment !== 'ALL' || sortBy !== 'EMP_ID_ASC' || searchTerm) && (
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 -mt-2">
            <span>
              Showing <strong className="text-slate-800">{filteredEmployees.length}</strong> of{' '}
              <strong className="text-slate-800">{allEmployees.length}</strong> employees
              {selectedDepartment !== 'ALL' && <span> • Department: <strong>{selectedDepartment}</strong></span>}
              {sortBy === 'NAME_ASC' && <span> • Sorted: <strong>Alphabetical (A-Z)</strong></span>}
              {sortBy === 'NAME_DESC' && <span> • Sorted: <strong>Alphabetical (Z-A)</strong></span>}
              {sortBy === 'DEPT_ASC' && <span> • Sorted: <strong>Department</strong></span>}
            </span>
            <button
              onClick={() => {
                setSelectedDepartment('ALL');
                setSortBy('EMP_ID_ASC');
                setSearchTerm('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Main Monthly Grid */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase">
                  <th className="py-2.5 px-2 sticky left-0 bg-slate-50 z-20 min-w-[30px]">Sl#</th>
                  <th 
                    className="py-2.5 px-2 sticky left-[30px] bg-slate-50 z-20 min-w-[120px] cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => setSortBy(sortBy === 'NAME_ASC' ? 'NAME_DESC' : 'NAME_ASC')}
                    title="Click to sort by Employee Name (A-Z / Z-A)"
                  >
                    <div className="flex items-center gap-1">
                      <span>Employee Name</span>
                      {sortBy === 'NAME_ASC' ? (
                        <ArrowUp className="w-3 h-3 text-indigo-600" />
                      ) : sortBy === 'NAME_DESC' ? (
                        <ArrowDown className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-2.5 px-2 min-w-[70px] cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => setSortBy(sortBy === 'EMP_ID_ASC' ? 'EMP_ID_DESC' : 'EMP_ID_ASC')}
                    title="Click to sort by Employee ID"
                  >
                    <div className="flex items-center gap-1">
                      <span>Employee ID</span>
                      {sortBy === 'EMP_ID_ASC' ? (
                        <ArrowUp className="w-3 h-3 text-indigo-600" />
                      ) : sortBy === 'EMP_ID_DESC' ? (
                        <ArrowDown className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="py-2.5 px-2 min-w-[60px]">Role</th>
                  <th 
                    className="py-2.5 px-2 min-w-[80px] cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => setSortBy('DEPT_ASC')}
                    title="Click to sort by Department"
                  >
                    <div className="flex items-center gap-1">
                      <span>Department</span>
                      {sortBy === 'DEPT_ASC' ? (
                        <ArrowUp className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="py-2.5 px-2 min-w-[80px]">Designation</th>
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <th key={i + 1} className="py-2.5 px-1.5 text-center min-w-[28px]">
                      {i + 1}-{new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1).toLocaleString('en-US', { month: 'short' })}
                    </th>
                  ))}
                  <th className="py-2.5 px-2 text-center bg-emerald-50 min-w-[45px]">Present</th>
                  <th className="py-2.5 px-2 text-center bg-red-50 min-w-[45px]">Absent</th>
                  <th className="py-2.5 px-2 text-center bg-orange-50 min-w-[55px]">Early Logout</th>
                  <th className="py-2.5 px-2 text-center bg-amber-50 min-w-[50px]">Late Login</th>
                  <th className="py-2.5 px-2 text-center bg-purple-50 min-w-[55px]">Sick Leave</th>
                  <th className="py-2.5 px-2 text-center bg-pink-50 min-w-[60px]">Emergency Leave</th>
                  <th className="py-2.5 px-2 text-center bg-blue-50 min-w-[55px]">Paid Leave</th>
                  <th className="py-2.5 px-2 text-center bg-teal-50 min-w-[55px]">Long Leaves</th>
                  <th className="py-2.5 px-2 text-center bg-green-50 min-w-[60px]">Mail Received</th>
                  <th className="py-2.5 px-2 text-center bg-rose-50 min-w-[65px]">Mail Not Received</th>
                  <th className="py-2.5 px-2 text-center bg-indigo-50 min-w-[55px]">Casual Leave</th>
                  <th className="py-2.5 px-2 text-center bg-violet-50 min-w-[55px]">Approved By</th>
                  <th className="py-2.5 px-2 text-center bg-red-50 min-w-[55px]">Not Approved</th>
                  <th className="py-2.5 px-2 text-center bg-cyan-50 min-w-[60px]">National Holiday</th>
                  <th className="py-2.5 px-2 text-center bg-lime-50 min-w-[60px]">Festive Holiday</th>
                  <th className="py-2.5 px-2 text-center bg-slate-100 min-w-[45px]">Holiday</th>
                  <th className="py-2.5 px-2 text-center bg-yellow-50 min-w-[45px]">Training</th>
                  <th className="py-2.5 px-2 text-center bg-gray-100 min-w-[45px]">LOP</th>
                  <th className="py-2.5 px-2 text-center bg-fuchsia-50 min-w-[60px]">Personal Leave</th>
                  <th className="py-2.5 px-2 text-center bg-slate-50 min-w-[130px] sticky right-0 z-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={daysInMonth + 26} className="text-center p-8 text-slate-400">Loading attendance data...</td></tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr><td colSpan={daysInMonth + 26} className="text-center p-8 text-slate-400">No records found for {selectedMonth}.</td></tr>
                ) : (
                  paginatedEmployees.map((emp, index) => {
                    const slNo = (page - 1) * PAGE_SIZE + index + 1;
                    return (
                    <tr key={emp.empId} className="hover:bg-slate-50/50">
                      <td className="p-2 font-mono text-slate-500 sticky left-0 bg-white z-10 border-r border-slate-50 text-center">{slNo}</td>
                      <td className="p-2 font-semibold text-slate-800 sticky left-[30px] bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] cursor-pointer hover:text-indigo-600 transition-colors whitespace-nowrap" onClick={() => setReportEmployee(emp)}>{emp.empName}</td>
                      <td className="p-2 font-mono text-slate-500 bg-white">{emp.empId}</td>
                      <td className="p-2 text-slate-600 bg-white">{emp.role}</td>
                      <td className="p-2 text-slate-600 bg-white">{emp.department}</td>
                      <td className="p-2 text-slate-600 bg-white">{emp.designation}</td>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const s = emp.days[i + 1];
                        let color = 'text-slate-300';
                        let label = '-';
                        if (s === 'PRESENT' || s === 'P') { color = 'bg-emerald-100 text-emerald-800 font-bold'; label = 'P'; }
                        else if (s === 'ABSENT' || s === 'A') { color = 'bg-red-100 text-red-800 font-bold'; label = 'A'; }
                        else if (s === 'CASUAL_LEAVE' || s === 'CL') { color = 'bg-amber-100 text-amber-800 font-bold'; label = 'CL'; }
                        else if (s === 'SICK_LEAVE' || s === 'SL') { color = 'bg-orange-100 text-orange-800 font-bold'; label = 'SL'; }
                        else if (s === 'HOLIDAY' || s === 'H') { color = 'bg-slate-200 text-slate-800 font-bold'; label = 'H'; }
                        else if (s === 'WEEKLY_OFF' || s === 'WO') { color = 'bg-slate-200 text-slate-800 font-bold'; label = 'WO'; }
                        else if (s === 'OVERTIME' || s === 'OT') { color = 'bg-blue-100 text-blue-800 font-bold'; label = 'OT'; }
                        else if (s === 'WORK_FROM_HOME' || s === 'WFH') { color = 'bg-teal-100 text-teal-800 font-bold'; label = 'WFH'; }
                        else if (s === 'HALF_DAY' || s === 'HD') { color = 'bg-pink-100 text-pink-800 font-bold'; label = 'HD'; }
                        else if (s === 'EARLY_LOGOUT' || s === 'EL') { color = 'bg-yellow-100 text-yellow-800 font-bold'; label = 'EL'; }
                        else if (s === 'LATE_LOGIN' || s === 'LL') { color = 'bg-yellow-100 text-yellow-800 font-bold'; label = 'LL'; }
                        else if (s === 'EMERGENCY_LEAVE' || s === 'E_L') { color = 'bg-rose-100 text-rose-800 font-bold'; label = 'E_L'; }
                        else if (s === 'PAID_LEAVE' || s === 'PL') { color = 'bg-indigo-100 text-indigo-800 font-bold'; label = 'PL'; }
                        else if (s === 'LONG_LEAVE' || s === 'LLV') { color = 'bg-purple-100 text-purple-800 font-bold'; label = 'LLV'; }
                        else if (s === 'NATIONAL_HOLIDAY' || s === 'NH') { color = 'bg-cyan-100 text-cyan-800 font-bold'; label = 'NH'; }
                        else if (s === 'FESTIVE_HOLIDAY' || s === 'FH') { color = 'bg-lime-100 text-lime-800 font-bold'; label = 'FH'; }
                        else if (s === 'TRAINING' || s === 'T') { color = 'bg-violet-100 text-violet-800 font-bold'; label = 'T'; }
                        else if (s === 'LOP') { color = 'bg-gray-200 text-gray-800 font-bold'; label = 'LOP'; }
                        else if (s === 'PERSONAL_LEAVE') { color = 'bg-fuchsia-100 text-fuchsia-800 font-bold'; label = 'PeL'; }

                        return (
                          <td key={i} className="p-1 border-l border-slate-50">
                            <div className={`w-6 h-6 mx-auto rounded flex items-center justify-center text-[9px] ${color}`}>
                              {label}
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-2 text-center font-bold text-emerald-700 bg-emerald-50/30 border-l border-slate-100">{emp.present}</td>
                      <td className="p-2 text-center font-bold text-red-700 bg-red-50/30">{emp.absent}</td>
                      <td className="p-2 text-center font-bold text-orange-700 bg-orange-50/30">{emp.earlyLogout}</td>
                      <td className="p-2 text-center font-bold text-amber-700 bg-amber-50/30">{emp.lateLogin}</td>
                      <td className="p-2 text-center font-bold text-purple-700 bg-purple-50/30">{emp.sickLeave}</td>
                      <td className="p-2 text-center font-bold text-pink-700 bg-pink-50/30">{emp.emergencyLeave}</td>
                      <td className="p-2 text-center font-bold text-blue-700 bg-blue-50/30">{emp.paidLeave}</td>
                      <td className="p-2 text-center font-bold text-teal-700 bg-teal-50/30">{emp.longLeave}</td>
                      <td className="p-2 text-center font-bold text-green-700 bg-green-50/30">{emp.mailReceived}</td>
                      <td className="p-2 text-center font-bold text-rose-700 bg-rose-50/30">{emp.mailNotReceived}</td>
                      <td className="p-2 text-center font-bold text-indigo-700 bg-indigo-50/30">{emp.casualLeave}</td>
                      <td className="p-2 text-center font-bold text-violet-700 bg-violet-50/30">{emp.approvedBy}</td>
                      <td className="p-2 text-center font-bold text-red-700 bg-red-50/30">{emp.notApproved}</td>
                      <td className="p-2 text-center font-bold text-cyan-700 bg-cyan-50/30">{emp.nationalHoliday}</td>
                      <td className="p-2 text-center font-bold text-lime-700 bg-lime-50/30">{emp.festiveHoliday}</td>
                      <td className="p-2 text-center font-bold text-slate-700 bg-slate-50/30">{emp.holiday}</td>
                      <td className="p-2 text-center font-bold text-yellow-700 bg-yellow-50/30">{emp.training}</td>
                      <td className="p-2 text-center font-bold text-gray-700 bg-gray-50/30">{emp.lop}</td>
                      <td className="p-2 text-center font-bold text-fuchsia-700 bg-fuchsia-50/30">{emp.personalLeave}</td>
                      <td className="p-2 sticky right-0 bg-slate-50 z-10 text-center border-l border-slate-100">
                        {isAdmin && (
                          <div className="flex justify-center gap-1">
                            <button onClick={() => openEditModal(emp)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setDeleteEmployee(emp)} className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalItems={filteredEmployees.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>

        {/* Edit / Add Modal with Full Fields */}
        {editEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50/80 to-blue-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {editEmployee.isNew ? 'Add Monthly Attendance Record' : 'Edit Employee & Monthly Attendance'}
                    </h2>
                    <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                      Target Month: {selectedMonth}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditEmployee(null)} 
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                
                {/* 1. Employee Info Inputs (Full Fields) */}
                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Employee Details
                    </h3>
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      Syncs with Database
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Employee ID <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. EMP-001" 
                        value={editForm.empId || ''}
                        onChange={(e) => setEditForm({...editForm, empId: e.target.value})}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Employee Name <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. John Doe" 
                        value={editForm.empName || ''}
                        onChange={(e) => setEditForm({...editForm, empName: e.target.value})}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-medium rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Role
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Developer, HR, Admin" 
                        value={editForm.role || ''}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Department
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Engineering, Sales, HR" 
                        value={editForm.department || ''}
                        onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Designation
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. SDE-1, Team Lead" 
                        value={editForm.designation || ''}
                        onChange={(e) => setEditForm({...editForm, designation: e.target.value})}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Approved By
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Manager / HR" 
                        value={editForm.approvedBy || ''}
                        onChange={(e) => setEditForm({...editForm, approvedBy: e.target.value})}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Quick Fill Utilities */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Day-Wise Attendance (1 to {daysInMonth})
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button 
                      type="button"
                      onClick={() => {
                        const updated = { ...editForm };
                        for (let i = 1; i <= daysInMonth; i++) {
                          if (!updated[i]) updated[i] = 'PRESENT';
                        }
                        setEditForm(updated);
                      }}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold transition"
                    >
                      Fill Empty as Present (P)
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        const updated = { ...editForm };
                        for (let i = 1; i <= daysInMonth; i++) {
                          updated[i] = 'PRESENT';
                        }
                        setEditForm(updated);
                      }}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-semibold transition"
                    >
                      All Present (P)
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        const updated = { ...editForm };
                        for (let i = 1; i <= daysInMonth; i++) {
                          delete updated[i];
                        }
                        setEditForm(updated);
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-semibold transition"
                    >
                      Clear Days
                    </button>
                  </div>
                </div>

                {/* 3. Day Grid (1 to 31) */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2.5">
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const currentVal = editForm[i + 1] || '';
                    let badgeColor = 'bg-slate-50 border-slate-200 text-slate-500';
                    if (currentVal === 'PRESENT') badgeColor = 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold';
                    else if (currentVal === 'ABSENT') badgeColor = 'bg-red-50 border-red-300 text-red-700 font-bold';
                    else if (currentVal === 'HALF_DAY') badgeColor = 'bg-sky-50 border-sky-300 text-sky-700 font-bold';
                    else if (currentVal === 'CASUAL_LEAVE') badgeColor = 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold';
                    else if (currentVal === 'SICK_LEAVE') badgeColor = 'bg-purple-50 border-purple-300 text-purple-700 font-bold';
                    else if (currentVal === 'EMERGENCY_LEAVE') badgeColor = 'bg-rose-50 border-rose-300 text-rose-700 font-bold';
                    else if (currentVal === 'LONG_LEAVE') badgeColor = 'bg-pink-50 border-pink-300 text-pink-700 font-bold';
                    else if (currentVal === 'PAID_LEAVE') badgeColor = 'bg-blue-50 border-blue-300 text-blue-700 font-bold';
                    else if (currentVal === 'EARLY_LOGOUT') badgeColor = 'bg-yellow-50 border-yellow-300 text-yellow-700 font-bold';
                    else if (currentVal === 'LATE_LOGIN') badgeColor = 'bg-orange-50 border-orange-300 text-orange-700 font-bold';
                    else if (currentVal === 'HOLIDAY' || currentVal === 'NATIONAL_HOLIDAY' || currentVal === 'FESTIVE_HOLIDAY') badgeColor = 'bg-amber-50 border-amber-300 text-amber-700 font-bold';
                    else if (currentVal === 'WEEKLY_OFF') badgeColor = 'bg-slate-100 border-slate-300 text-slate-700 font-bold';
                    else if (currentVal === 'TRAINING') badgeColor = 'bg-violet-50 border-violet-300 text-violet-700 font-bold';
                    else if (currentVal === 'OVERTIME') badgeColor = 'bg-cyan-50 border-cyan-300 text-cyan-700 font-bold';
                    else if (currentVal === 'WORK_FROM_HOME') badgeColor = 'bg-teal-50 border-teal-300 text-teal-700 font-bold';
                    else if (currentVal) badgeColor = 'bg-violet-50 border-violet-300 text-violet-700 font-bold';

                    const isLeaveStatus = ['CASUAL_LEAVE', 'SICK_LEAVE', 'EMERGENCY_LEAVE', 'PAID_LEAVE', 'LONG_LEAVE', 'LOP', 'HALF_DAY', 'PERSONAL_LEAVE', 'WORK_FROM_HOME', 'LATE_LOGIN', 'EARLY_LOGOUT'].includes(currentVal);

                    return (
                      <div key={i} className={`flex flex-col gap-1 p-2 rounded-xl border transition ${badgeColor}`}>
                        <div className="flex justify-between items-center px-0.5">
                          <label className="text-[10px] font-black uppercase">Day {i + 1}</label>
                          {currentVal && (
                            <span className="text-[9px] font-black opacity-70">
                              {currentVal === 'PRESENT' ? 'P' : currentVal === 'ABSENT' ? 'A' : currentVal === 'HALF_DAY' ? 'HD' : currentVal === 'CASUAL_LEAVE' ? 'CL' : currentVal === 'SICK_LEAVE' ? 'SL' : currentVal === 'EMERGENCY_LEAVE' ? 'E_L' : currentVal === 'LONG_LEAVE' ? 'LLV' : currentVal === 'PAID_LEAVE' ? 'PL' : currentVal === 'EARLY_LOGOUT' ? 'EL' : currentVal === 'LATE_LOGIN' ? 'LL' : currentVal === 'HOLIDAY' ? 'H' : currentVal === 'NATIONAL_HOLIDAY' ? 'NH' : currentVal === 'FESTIVE_HOLIDAY' ? 'FH' : currentVal === 'WEEKLY_OFF' ? 'WO' : currentVal === 'TRAINING' ? 'T' : currentVal === 'OVERTIME' ? 'OT' : currentVal === 'WORK_FROM_HOME' ? 'WFH' : currentVal.slice(0, 3)}
                            </span>
                          )}
                        </div>
                        <select 
                          value={currentVal} 
                          onChange={(e) => setEditForm({...editForm, [i + 1]: e.target.value})}
                          className="bg-white/90 border border-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg p-1.5 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm cursor-pointer"
                        >
                          <option value="">- Empty -</option>
                          <option value="PRESENT">P (Present)</option>
                          <option value="ABSENT">A (Absent)</option>
                          <option value="HALF_DAY">HD (Half Day)</option>
                          <option value="CASUAL_LEAVE">CL (Casual Leave)</option>
                          <option value="SICK_LEAVE">SL (Sick Leave)</option>
                          <option value="HOLIDAY">H (Holiday)</option>
                          <option value="WEEKLY_OFF">WO (Weekly Off)</option>
                          <option value="WORK_FROM_HOME">WFH (Work from Home)</option>
                          <option value="OVERTIME">OT (Overtime)</option>
                          <option value="EARLY_LOGOUT">EL (Early Logout)</option>
                          <option value="LATE_LOGIN">LL (Late Login)</option>
                          <option value="EMERGENCY_LEAVE">E_L (Emergency Leave)</option>
                          <option value="PAID_LEAVE">PL (Paid Leave)</option>
                          <option value="LONG_LEAVE">LLV (Long Leave)</option>
                          <option value="NATIONAL_HOLIDAY">NH (National Holiday)</option>
                          <option value="FESTIVE_HOLIDAY">FH (Festive Holiday)</option>
                          <option value="TRAINING">T (Training)</option>
                          <option value="LOP">LOP (Loss of pay)</option>
                          <option value="PERSONAL_LEAVE">PL (Personal Leave)</option>
                        </select>
                        {isLeaveStatus && (
                          <input
                            type="text"
                            placeholder="Approved by"
                            value={editForm[`approvedBy_${i + 1}`] || ''}
                            onChange={(e) => setEditForm({...editForm, [`approvedBy_${i + 1}`]: e.target.value})}
                            className="bg-white border border-slate-200 text-slate-700 text-[10px] rounded-md px-1.5 py-1 mt-0.5 focus:ring-1 focus:ring-indigo-400 outline-none placeholder:text-slate-300"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 4. Columns after Day 31 (Summary & Stats Fields) */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/90 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <span>Columns After Date 31 (Stats & Leave Counters)</span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Table Sync
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        These fields correspond exactly to the table columns after day 31.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={calculateCountersFromDays}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                    >
                      <span>🔄</span> Auto-Calculate from Days 1-{daysInMonth}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-700 mb-1">Present</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.present ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, present: e.target.value })}
                        className="w-full bg-white border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-red-700 mb-1">Absent</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.absent ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, absent: e.target.value })}
                        className="w-full bg-white border border-red-200 text-red-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-red-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-orange-700 mb-1">Early Logout</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.earlyLogout ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, earlyLogout: e.target.value })}
                        className="w-full bg-white border border-orange-200 text-orange-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-orange-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-700 mb-1">Late Login</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.lateLogin ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, lateLogin: e.target.value })}
                        className="w-full bg-white border border-amber-200 text-amber-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-amber-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-purple-700 mb-1">Sick Leave</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.sickLeave ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, sickLeave: e.target.value })}
                        className="w-full bg-white border border-purple-200 text-purple-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-purple-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-pink-700 mb-1">Emergency Leave</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.emergencyLeave ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, emergencyLeave: e.target.value })}
                        className="w-full bg-white border border-pink-200 text-pink-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-pink-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-blue-700 mb-1">Paid Leave</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.paidLeave ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, paidLeave: e.target.value })}
                        className="w-full bg-white border border-blue-200 text-blue-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-teal-700 mb-1">Long Leaves</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.longLeave ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, longLeave: e.target.value })}
                        className="w-full bg-white border border-teal-200 text-teal-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-teal-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-green-700 mb-1">Mail Received</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.mailReceived ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, mailReceived: e.target.value })}
                        className="w-full bg-white border border-green-200 text-green-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-green-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-rose-700 mb-1">Mail Not Received</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.mailNotReceived ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, mailNotReceived: e.target.value })}
                        className="w-full bg-white border border-rose-200 text-rose-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-rose-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-indigo-700 mb-1">Casual Leave</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.casualLeave ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, casualLeave: e.target.value })}
                        className="w-full bg-white border border-indigo-200 text-indigo-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-violet-700 mb-1">Approved By</label>
                      <input
                        type="text"
                        placeholder="e.g. Admin"
                        value={editForm.approvedBy || ''}
                        onChange={(e) => setEditForm({ ...editForm, approvedBy: e.target.value })}
                        className="w-full bg-white border border-violet-200 text-violet-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-violet-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-red-700 mb-1">Not Approved</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.notApproved ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, notApproved: e.target.value })}
                        className="w-full bg-white border border-red-200 text-red-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-red-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-cyan-700 mb-1">National Holiday</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.nationalHoliday ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, nationalHoliday: e.target.value })}
                        className="w-full bg-white border border-cyan-200 text-cyan-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-lime-700 mb-1">Festive Holiday</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.festiveHoliday ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, festiveHoliday: e.target.value })}
                        className="w-full bg-white border border-lime-200 text-lime-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-lime-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Holiday</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.holiday ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, holiday: e.target.value })}
                        className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-slate-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-yellow-700 mb-1">Training</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.training ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, training: e.target.value })}
                        className="w-full bg-white border border-yellow-200 text-yellow-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-yellow-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">LOP (Loss of Pay)</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.lop ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, lop: e.target.value })}
                        className="w-full bg-white border border-gray-200 text-gray-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-gray-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-fuchsia-700 mb-1">Personal Leave</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.personalLeave ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, personalLeave: e.target.value })}
                        className="w-full bg-white border border-fuchsia-200 text-fuchsia-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-fuchsia-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-teal-700 mb-1">Work from Home</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.wfh ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, wfh: e.target.value })}
                        className="w-full bg-white border border-teal-200 text-teal-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-teal-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-sky-700 mb-1">Half Day</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.hd ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, hd: e.target.value })}
                        className="w-full bg-white border border-sky-200 text-sky-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-sky-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Weekly Off</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.wo ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, wo: e.target.value })}
                        className="w-full bg-white border border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-slate-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-blue-700 mb-1">Overtime</label>
                      <input
                        type="text"
                        placeholder="0"
                        value={editForm.ot ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, ot: e.target.value })}
                        className="w-full bg-white border border-blue-200 text-blue-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50 mt-auto">
                <p className="text-xs text-slate-500 font-medium">
                  {Object.keys(editForm).filter(k => !isNaN(Number(k)) && editForm[k]).length} of {daysInMonth} days assigned
                </p>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    disabled={saving}
                    onClick={() => setEditEmployee(null)} 
                    className="px-6 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    disabled={saving}
                    onClick={handleSaveEdit} 
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all text-sm flex items-center gap-2 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <span>Save All Changes</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Delete Monthly Records</h2>
              <p className="text-slate-500 mb-8">Are you sure you want to completely remove attendance records for <strong>{deleteEmployee.empName}</strong> in <strong>{selectedMonth}</strong>? This action cannot be undone (Soft deleted in database).</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteEmployee(null)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={handleConfirmDelete} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-600/20 transition-all">Delete Records</button>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Review Import Data</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Found {Array.from(new Set(importData.map(d => d.employeeCode))).length} employees to import ({importData.length} daily records).
                </p>
              </div>
              <div className="p-6 overflow-y-auto">
                {importError && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-xl mb-4 text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> {importError}
                  </div>
                )}
                <div className="bg-slate-50 rounded-xl p-4 max-h-60 overflow-y-auto text-xs font-mono text-slate-600">
                  {Array.from(new Set(importData.map(d => d.employeeCode))).slice(0, 50).map((empCode, i) => {
                    const empName = importData.find(d => d.employeeCode === empCode)?.employeeName;
                    const daysCount = importData.filter(d => d.employeeCode === empCode).length;
                    return (
                      <div key={i} className="py-2 border-b border-slate-200 last:border-0 flex justify-between items-center">
                        <span className="font-bold text-slate-700">{empCode as string} - {empName}</span>
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{daysCount} days recorded</span>
                      </div>
                    );
                  })}
                  {Array.from(new Set(importData.map(d => d.employeeCode))).length > 50 && (
                    <div className="pt-2 text-center text-slate-400 italic">
                      ...and {Array.from(new Set(importData.map(d => d.employeeCode))).length - 50} more employees
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button onClick={() => setShowImportModal(false)} className="px-6 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors" disabled={importing}>Cancel</button>
                <button onClick={handleConfirmImport} disabled={importing || !!importError} className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold shadow-md transition-all">
                  {importing ? 'Saving to Database...' : 'Confirm Import'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Report Modal */}
        {reportEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
                <div>
                  <h2 className="text-2xl font-black text-indigo-950">{reportEmployee.empName}</h2>
                  <p className="text-sm font-semibold text-indigo-600">{reportEmployee.empId} • Monthly Report for {selectedMonth}</p>
                </div>
                <button onClick={() => setReportEmployee(null)} className="p-2 text-slate-400 hover:bg-white rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-4 gap-4 mb-6">
                   <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100">
                     <div className="text-2xl font-black text-emerald-600">{reportEmployee.present}</div>
                     <div className="text-xs font-bold text-emerald-700 uppercase mt-1">Present</div>
                   </div>
                   <div className="bg-red-50 p-4 rounded-2xl text-center border border-red-100">
                     <div className="text-2xl font-black text-red-600">{reportEmployee.absent}</div>
                     <div className="text-xs font-bold text-red-700 uppercase mt-1">Absent</div>
                   </div>
                   <div className="bg-amber-50 p-4 rounded-2xl text-center border border-amber-100">
                     <div className="text-2xl font-black text-amber-600">{reportEmployee.cl + reportEmployee.sl}</div>
                     <div className="text-xs font-bold text-amber-700 uppercase mt-1">Leaves</div>
                   </div>
                   <div className="bg-blue-50 p-4 rounded-2xl text-center border border-blue-100">
                     <div className="text-2xl font-black text-blue-600">{Math.round((reportEmployee.present / daysInMonth) * 100)}%</div>
                     <div className="text-xs font-bold text-blue-700 uppercase mt-1">Attendance</div>
                   </div>
                </div>
                
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">Daily Breakdown</h3>
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const s = reportEmployee.days[i + 1];
                    let color = 'bg-slate-50 text-slate-400 border-slate-100';
                    let text = '-';
                    if (s === 'PRESENT' || s === 'P') { color = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'; text = 'P'; }
                    else if (s === 'ABSENT' || s === 'A') { color = 'bg-red-50 text-red-700 border-red-200 font-bold'; text = 'A'; }
                    else if (s === 'CASUAL_LEAVE' || s === 'CL') { color = 'bg-amber-50 text-amber-700 border-amber-200 font-bold'; text = 'CL'; }
                    else if (s === 'SICK_LEAVE' || s === 'SL') { color = 'bg-orange-50 text-orange-700 border-orange-200 font-bold'; text = 'SL'; }
                    else if (s === 'HOLIDAY' || s === 'H') { color = 'bg-purple-50 text-purple-700 border-purple-200 font-bold'; text = 'H'; }
                    else if (s === 'WEEKLY_OFF' || s === 'WO') { color = 'bg-slate-100 text-slate-700 border-slate-300 font-bold'; text = 'WO'; }
                    else if (s === 'OVERTIME' || s === 'OT') { color = 'bg-blue-50 text-blue-700 border-blue-200 font-bold'; text = 'OT'; }
                    else if (s === 'WORK_FROM_HOME' || s === 'WFH') { color = 'bg-teal-50 text-teal-700 border-teal-200 font-bold'; text = 'WFH'; }
                    else if (s === 'HALF_DAY' || s === 'HD') { color = 'bg-pink-50 text-pink-700 border-pink-200 font-bold'; text = 'HD'; }

                    return (
                      <div key={i} className={`p-2 rounded-xl border text-center flex flex-col justify-center h-16 ${color}`}>
                        <span className="text-[10px] opacity-70 mb-0.5">{i + 1}</span>
                        <span className="text-sm">{text}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 mt-auto">
                 <button className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2" onClick={() => window.print()}>
                   <Download className="w-4 h-4" /> Print PDF Report
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress Modal */}
        <UploadProgressModal
          isOpen={showUploadProgress}
          progress={uploadProgress}
          status={uploadStatus}
          title="Importing Attendance Data..."
          message={uploadStatus === 'uploading' ? `Processing records...` : uploadStatus === 'success' ? 'All attendance records imported successfully!' : 'Failed to import. Please try again.'}
          onClose={() => setShowUploadProgress(false)}
        />

      </div>
    </div>
  );
}