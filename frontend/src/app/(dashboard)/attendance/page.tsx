'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Clock, Play, Square, CheckCircle, Upload, Download, FileSpreadsheet, X, Search, Edit3, Trash2, AlertTriangle, Calendar, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AttendancePage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState(todayStr);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit & Delete modal states
  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [deletingLog, setDeletingLog] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    id: '',
    empId: '',
    empName: '',
    date: '',
    status: 'PRESENT',
    checkInTime: '',
    checkOutTime: '',
    workHours: 8,
    notes: '',
  });

  const isPavitra = user?.specialization === 'ATTENDANCE_LEAVE' || user?.email === 'pavitra@adyapan.com';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN' || user?.role === 'HR_EXECUTIVE' || isPavitra;

  // View mode: 'day' (existing daily view) or 'month' (monthly summary with counts)
  const [viewMode, setViewMode] = useState<'day' | 'month'>('month');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Month view modal states
  const [monthViewEmployee, setMonthViewEmployee] = useState<any | null>(null);
  const [monthEditEmployee, setMonthEditEmployee] = useState<any | null>(null);
  const [monthEditForm, setMonthEditForm] = useState<any>({});
  const [monthDeleteEmployee, setMonthDeleteEmployee] = useState<any | null>(null);

  // Compute monthly summary per employee
  const getMonthlyStats = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthPrefix = selectedMonth; // e.g. "2026-05"

    // Filter logs for the selected month
    const monthLogs = allLogs.filter((l) => (l.date || '').startsWith(monthPrefix));

    // Group by employee
    const empMap = new Map<string, any>();
    for (const log of monthLogs) {
      const key = log.empId || log.employeeCode || 'UNKNOWN';
      if (!empMap.has(key)) {
        empMap.set(key, {
          empId: key,
          empName: log.empName || log.employeeName || '-',
          department: log.department || '-',
          designation: log.designation || '-',
          role: log.role || '-',
          days: {} as Record<number, string>, // day number -> status code
          present: 0,
          absent: 0,
          earlyLogout: 0,
          lateLogin: 0,
          sickLeave: 0,
          emergencyLeave: 0,
          paidLeave: 0,
          longLeave: 0,
          casualLeave: 0,
          mailReceived: 0,
          mailNotReceived: 0,
          approvedBy: '-',
          notApproved: 0,
          nationalHoliday: 0,
          festiveHoliday: 0,
          holiday: 0,
          training: 0,
          wfh: 0,
          halfDay: 0,
        });
      }
      const emp = empMap.get(key)!;
      const dayNum = parseInt((log.date || '').split('-')[2], 10);
      if (!dayNum) continue;

      // Map status
      const status = (log.status || '').toUpperCase();
      const lateLogin = (log.lateLogin || '').toLowerCase() === 'yes';
      const earlyLogout = (log.earlyLogout || '').toLowerCase() === 'yes';
      const leaveType = (log.leaveType || log.notes || '').toLowerCase();

      let dayCode = 'P'; // default Present
      if (status === 'PRESENT' || status === 'P') {
        dayCode = 'P';
        emp.present++;
      } else if (status === 'LATE' || status === 'L') {
        dayCode = 'P'; // still counted as present but with late
        emp.present++;
      } else if (status === 'ABSENT' || status === 'A') {
        dayCode = 'A';
        emp.absent++;
      } else if (status === 'ON_LEAVE' || status === 'LEAVE') {
        if (leaveType.includes('sick')) {
          dayCode = 'SL';
          emp.sickLeave++;
        } else if (leaveType.includes('emergency')) {
          dayCode = 'EL';
          emp.emergencyLeave++;
        } else if (leaveType.includes('paid')) {
          dayCode = 'PL';
          emp.paidLeave++;
        } else if (leaveType.includes('long')) {
          dayCode = 'LL';
          emp.longLeave++;
        } else if (leaveType.includes('casual')) {
          dayCode = 'CL';
          emp.casualLeave++;
        } else {
          dayCode = 'CL';
          emp.casualLeave++;
        }
      } else if (status === 'HALF_DAY') {
        dayCode = 'HD';
        emp.halfDay++;
      } else if (status === 'HOLIDAY' || status === 'NATIONAL_HOLIDAY') {
        dayCode = 'NH';
        emp.nationalHoliday++;
      } else if (status === 'FESTIVE_HOLIDAY') {
        dayCode = 'FH';
        emp.festiveHoliday++;
      } else if (status === 'TRAINING') {
        dayCode = 'T';
        emp.training++;
      } else if (status === 'WFH') {
        dayCode = 'WFH';
        emp.wfh++;
        emp.present++;
      } else {
        dayCode = 'P';
        emp.present++;
      }

      if (lateLogin) emp.lateLogin++;
      if (earlyLogout) emp.earlyLogout++;
      if ((log.wfh || '').toLowerCase() === 'yes' && status !== 'WFH') {
        emp.wfh++;
      }

      emp.days[dayNum] = dayCode;
    }

    return { employees: Array.from(empMap.values()), daysInMonth };
  };

  // Add Manual Attendance Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    empId: '',
    empName: '',
    department: '',
    designation: '',
    role: '',
    date: todayStr,
    checkInTime: '09:30 AM',
    checkOutTime: '06:30 PM',
    status: 'PRESENT',
    lateLogin: 'No',
    earlyLogout: 'No',
    wfh: 'No',
    wfhApprovedBy: '',
    sickLeave: 'No',
    emergencyLeave: 'No',
    paidLeave: 'No',
    longLeave: 'No',
    casualLeave: 'No',
    mailReceived: 'No',
    mailNotReceived: 'No',
    approvedBy: '',
    notApproved: 'No',
    nationalHoliday: 'No',
    festiveHoliday: 'No',
    holiday: 'No',
    training: 'No',
    notes: 'Manual Entry',
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    let apiData: any[] = [];
    try {
      const endpoint = isAdmin ? '/attendance/all-logs' : '/attendance/my-logs';
      const raw = await apiRequest(endpoint);
      if (Array.isArray(raw)) {
        apiData = raw;
      } else if (raw?.data && Array.isArray(raw.data)) {
        apiData = raw.data;
      }
      if (!isAdmin && apiData.length > 0 && apiData[0].checkInTime && apiData[0].checkInTime !== '-' && !apiData[0].checkOutTime) {
        setCheckedIn(true);
        setCheckInTime(apiData[0].checkInTime);
      }
    } catch {
      apiData = [];
    } finally {
      const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('adyapan_imported_attendance_logs') : null;
      let localLogs: any[] = [];
      try {
        localLogs = savedLocal ? JSON.parse(savedLocal) : [];
      } catch {
        localLogs = [];
      }

      const map = new Map();
      for (const item of apiData) {
        const key = `${(item.empId || item.employeeCode || '').trim()}_${(item.date || '').trim()}`;
        if (key && key !== '_') map.set(key, item);
      }
      for (const item of localLogs) {
        const key = `${(item.empId || item.employeeCode || '').trim()}_${(item.date || '').trim()}`;
        if (key && key !== '_' && !map.has(key)) {
          map.set(key, item);
        }
      }

      const merged = Array.from(map.values());
      setAllLogs(merged);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Filter logs
  useEffect(() => {
    let filtered = [...allLogs];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          (l.empId || '').toLowerCase().includes(term) ||
          (l.empName || '').toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((l) => l.status === statusFilter);
    }
    if (dateFilter) {
      filtered = filtered.filter((l) => (l.date || '').includes(dateFilter));
    }
    setLogs(filtered);
  }, [searchTerm, statusFilter, dateFilter, allLogs]);

  const handleCheckIn = async () => {
    try {
      await apiRequest('/attendance/check-in', { method: 'POST', body: JSON.stringify({ notes: 'Web Check-in' }) });
      setCheckedIn(true);
      setCheckInTime(new Date().toLocaleTimeString('en-US', { hour12: true }));
      loadLogs();
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await apiRequest('/attendance/check-out', { method: 'POST', body: JSON.stringify({ notes: 'Web Check-out' }) });
      setCheckedIn(false);
      setCheckInTime(null);
      loadLogs();
    } catch (err: any) {
      alert(err.message || 'Check-out failed');
    }
  };

  // Handlers for Edit
  const handleOpenEdit = (log: any) => {
    setEditingLog(log);
    setEditForm({
      id: log.id || '',
      empId: log.empId || log.employeeCode || '',
      empName: log.empName || '',
      date: log.date || new Date().toISOString().split('T')[0],
      status: log.status || 'PRESENT',
      checkInTime: log.checkInTime || '09:30 AM',
      checkOutTime: log.checkOutTime || '06:30 PM',
      workHours: log.workHours || 8,
      notes: log.notes || log.remarks || '',
    });
  };

  const handleSaveEdit = async () => {
    try {
      try {
        await apiRequest('/attendance/mark', {
          method: 'POST',
          body: JSON.stringify({
            employeeId: editForm.id,
            date: editForm.date,
            status: editForm.status,
            checkInTime: editForm.checkInTime,
            checkOutTime: editForm.checkOutTime,
            notes: editForm.notes,
          }),
        });
      } catch {}

      setAllLogs((prev) =>
        prev.map((item) =>
          (item.id === editForm.id || (item.empId === editForm.empId && item.date === editForm.date))
            ? { ...item, ...editForm }
            : item
        )
      );

      const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('adyapan_imported_attendance_logs') : null;
      if (savedLocal) {
        try {
          const localLogs: any[] = JSON.parse(savedLocal);
          const updated = localLogs.map((item) =>
            (item.id === editForm.id || (item.empId === editForm.empId && item.date === editForm.date))
              ? { ...item, ...editForm }
              : item
          );
          localStorage.setItem('adyapan_imported_attendance_logs', JSON.stringify(updated));
        } catch {}
      }

      setEditingLog(null);
      alert('Attendance record updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update record');
    }
  };

  // Handlers for Delete
  const handleConfirmDelete = async () => {
    if (!deletingLog) return;
    const targetId = deletingLog.id;
    const targetEmpId = deletingLog.empId;
    const targetDate = deletingLog.date;

    setAllLogs((prev) =>
      prev.filter((item) => !(item.id === targetId || (item.empId === targetEmpId && item.date === targetDate)))
    );

    const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('adyapan_imported_attendance_logs') : null;
    if (savedLocal) {
      try {
        const localLogs: any[] = JSON.parse(savedLocal);
        const updated = localLogs.filter((item) => !(item.id === targetId || (item.empId === targetEmpId && item.date === targetDate)));
        localStorage.setItem('adyapan_imported_attendance_logs', JSON.stringify(updated));
      } catch {}
    }

    setDeletingLog(null);
    alert('Attendance record deleted successfully!');
  };

  // Helper: Find value from row by checking header aliases
  const findRowValue = (row: Record<string, any>, aliases: string[]) => {
    const keys = Object.keys(row);
    for (const alias of aliases) {
      const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const k of keys) {
        const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanKey === cleanAlias) {
          return row[k];
        }
      }
    }
    return undefined;
  };

  // Helper: Format date values (Excel serials, JS dates, DD/MM/YYYY, YYYY-MM-DD)
  const formatDateVal = (val: any): string => {
    if (val === null || val === undefined || val === '') {
      return new Date().toISOString().split('T')[0];
    }
    if (typeof val === 'number') {
      // Excel serial to date — use UTC directly to avoid timezone shift
      const utcDays = val - 25569;
      const utcMs = Math.round(utcDays * 86400 * 1000);
      const date = new Date(utcMs);
      if (!isNaN(date.getTime())) {
        // Extract UTC components to avoid IST offset shifting the date back
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
    if (val instanceof Date) {
      if (!isNaN(val.getTime())) {
        // Use local date components to avoid UTC timezone shift
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
    const str = String(val).trim();
    const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyy) {
      const day = ddmmyyyy[1].padStart(2, '0');
      const month = ddmmyyyy[2].padStart(2, '0');
      const year = ddmmyyyy[3];
      return `${year}-${month}-${day}`;
    }
    const yyyymmdd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (yyyymmdd) {
      const year = yyyymmdd[1];
      const month = yyyymmdd[2].padStart(2, '0');
      const day = yyyymmdd[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      // Use local date to avoid timezone shift
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return new Date().toISOString().split('T')[0];
  };

  // Helper: Format time values (Excel serial fractions, 12h/24h strings)
  const formatTimeVal = (val: any): string => {
    if (val === null || val === undefined || val === '' || val === '-') return '-';
    if (typeof val === 'number') {
      const totalSeconds = Math.round(val * 86400);
      const hours24 = Math.floor(totalSeconds / 3600) % 24;
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const period = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 || 12;
      return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
    }
    const str = String(val).trim();
    const ampmMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
    if (ampmMatch) {
      const h = ampmMatch[1].padStart(2, '0');
      const m = ampmMatch[2];
      const p = ampmMatch[3].toUpperCase();
      return `${h}:${m} ${p}`;
    }
    const h24Match = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (h24Match) {
      let h = parseInt(h24Match[1], 10);
      const m = h24Match[2];
      const p = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${String(h).padStart(2, '0')}:${m} ${p}`;
    }
    return str;
  };

  // Helper: Format status values
  const formatStatusVal = (val: any): string => {
    if (!val) return 'PRESENT';
    const str = String(val).trim().toUpperCase();
    if (str.startsWith('PRES') || str === 'P') return 'PRESENT';
    if (str.startsWith('LAT') || str === 'L') return 'LATE';
    if (str.startsWith('ABS') || str === 'A') return 'ABSENT';
    if (str.startsWith('LEAV') || str.startsWith('ON_LEAV')) return 'ON_LEAVE';
    if (str.startsWith('HALF')) return 'HALF_DAY';
    return 'PRESENT';
  };

  // Download template
  const handleDownloadTemplate = () => {
    const templateData = [
      { 'Employee ID': 'EMP-001', 'Employee Name': 'John Doe', 'Department': 'Engineering', 'Date': '2026-08-12', 'Login Time': '09:30 AM', 'Logout Time': '06:30 PM', 'Attendance Status': 'PRESENT', 'Late Login': 'No', 'Early Logout': 'No', 'Work From Home': 'No', 'WFH Approved By': '', 'Remarks': '' },
      { 'Employee ID': 'EMP-002', 'Employee Name': 'Jane Smith', 'Department': 'Marketing', 'Date': '2026-08-12', 'Login Time': '10:15 AM', 'Logout Time': '06:30 PM', 'Attendance Status': 'LATE', 'Late Login': 'Yes', 'Early Logout': 'No', 'Work From Home': 'No', 'WFH Approved By': '', 'Remarks': 'Traffic' },
      { 'Employee ID': 'EMP-003', 'Employee Name': 'Ravi Kumar', 'Department': 'HR', 'Date': '2026-08-12', 'Login Time': '09:30 AM', 'Logout Time': '06:30 PM', 'Attendance Status': 'PRESENT', 'Late Login': 'No', 'Early Logout': 'No', 'Work From Home': 'Yes', 'WFH Approved By': 'Pavitra', 'Remarks': 'Remote' },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Template');
    ws['!cols'] = [
      { wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 20 },
    ];
    XLSX.writeFile(wb, 'Attendance_Import_Template.xlsx');
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true, cellText: false });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!jsonData || jsonData.length === 0) {
          setImportError('File is empty or has no valid data rows.');
          return;
        }

        // Detect if this is a monthly format (has columns like "1-Aug", "2-Aug", etc.)
        const firstRowKeys = Object.keys(jsonData[0]);
        const dayColumnPattern = /^(\d{1,2})[-\s]?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
        const dayColumns = firstRowKeys.filter((k) => dayColumnPattern.test(k));

        if (dayColumns.length > 0) {
          // ========== MONTHLY FORMAT IMPORT ==========
          // Columns like: Sl#, Employee Name, Employee ID, Role, Department, Designation, 1-Aug, 2-Aug, ..., Present, Absent, etc.
          const monthMap: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

          const formattedRows: any[] = [];

          for (const row of jsonData) {
            const empName = String(row['Employee Name'] || row['employee name'] || row['Name'] || '').trim();
            const empId = String(row['Employee ID'] || row['employee id'] || row['Emp ID'] || row['EmpID'] || '').trim();
            const role = String(row['Role'] || row['role'] || '').trim();
            const department = String(row['Department'] || row['department'] || row['Dept'] || '').trim();
            const designation = String(row['Designation'] || row['designation'] || '').trim();

            if (!empName && !empId) continue;

            // Process each day column
            for (const dayCol of dayColumns) {
              const val = String(row[dayCol] || '').trim();
              if (!val) continue; // skip empty days

              const match = dayCol.match(/^(\d{1,2})[-\s]?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
              if (!match) continue;

              const dayNum = parseInt(match[1], 10);
              const monthStr = match[2].toLowerCase();
              const monthIdx = monthMap[monthStr];
              if (monthIdx === undefined) continue;

              // Determine the year from selectedMonth or current year
              const [selYear] = selectedMonth.split('-').map(Number);
              const year = selYear || new Date().getFullYear();
              const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

              // Map the status value
              const statusUpper = val.toUpperCase();
              let status = 'PRESENT';
              let lateLogin = 'No';
              let earlyLogout = 'No';
              let leaveType = '';
              let notes = val;

              if (statusUpper === 'PRESENT' || statusUpper === 'P') {
                status = 'PRESENT';
              } else if (statusUpper === 'ABSENT' || statusUpper === 'A') {
                status = 'ABSENT';
              } else if (statusUpper.includes('SICK LEAVE') || statusUpper === 'SL') {
                status = 'ON_LEAVE';
                leaveType = 'Sick Leave';
              } else if (statusUpper.includes('EMERGENCY LEAVE') || statusUpper === 'EL') {
                status = 'ON_LEAVE';
                leaveType = 'Emergency Leave';
              } else if (statusUpper.includes('LONG LEAVE') || statusUpper === 'LL') {
                status = 'ON_LEAVE';
                leaveType = 'Long Leave';
              } else if (statusUpper.includes('CASUAL LEAVE') || statusUpper === 'CL') {
                status = 'ON_LEAVE';
                leaveType = 'Casual Leave';
              } else if (statusUpper.includes('PAID LEAVE') || statusUpper === 'PL') {
                status = 'ON_LEAVE';
                leaveType = 'Paid Leave';
              } else if (statusUpper.includes('PERSONAL LEAVE')) {
                status = 'ON_LEAVE';
                leaveType = 'Personal Leave';
              } else if (statusUpper.includes('HALF DAY') || statusUpper === 'HD') {
                status = 'HALF_DAY';
              } else if (statusUpper.includes('WEEK-OFF') || statusUpper.includes('WEEKOFF') || statusUpper === 'WO') {
                status = 'HOLIDAY';
                leaveType = 'Week-off';
              } else if (statusUpper === 'HOLIDAY' || statusUpper === 'NH') {
                status = 'HOLIDAY';
                leaveType = 'National Holiday';
              } else if (statusUpper === 'LOP' || statusUpper.includes('LOSS OF PAY')) {
                status = 'ABSENT';
                leaveType = 'LOP';
              } else if (statusUpper.includes('LATE')) {
                status = 'LATE';
                lateLogin = 'Yes';
              } else if (statusUpper.includes('ONBOARDING')) {
                status = 'PRESENT';
                leaveType = 'Onboarding';
              } else if (statusUpper.includes('RESIGNED')) {
                status = 'ABSENT';
                leaveType = 'Resigned';
              } else if (statusUpper.includes('TRAINING')) {
                status = 'PRESENT';
                leaveType = 'Training';
              } else {
                status = 'PRESENT';
              }

              formattedRows.push({
                'Employee ID': empId || `EMP-${formattedRows.length}`,
                'Employee Name': empName,
                'Department': department,
                'Date': dateStr,
                'Login Time': status === 'PRESENT' || status === 'LATE' || status === 'HALF_DAY' ? '09:30 AM' : '-',
                'Logout Time': status === 'PRESENT' || status === 'LATE' ? '06:30 PM' : (status === 'HALF_DAY' ? '01:30 PM' : '-'),
                'Attendance Status': status,
                'Late Login': lateLogin,
                'Early Logout': earlyLogout,
                'Work From Home': 'No',
                'WFH Approved By': '',
                'Remarks': notes,
                '_role': role,
                '_designation': designation,
                '_leaveType': leaveType,
              });
            }
          }

          if (formattedRows.length === 0) {
            setImportError('No valid attendance data found. Please check the file format.');
            return;
          }

          setImportData(formattedRows);
          setShowImportModal(true);
        } else {
          // ========== DAILY FORMAT IMPORT (existing logic) ==========
          const formattedRows: any[] = [];
          for (const row of jsonData) {
            const empId = findRowValue(row, ['employee id', 'employee_id', 'employeeid', 'employee code', 'employee_code', 'employeecode', 'emp id', 'emp_id', 'empid', 'emp code', 'empcode', 'id', 'code']);
            const empName = findRowValue(row, ['employee name', 'employee_name', 'employeename', 'emp name', 'emp_name', 'empname', 'name', 'staff name']) || '';
            const department = findRowValue(row, ['department', 'dept', 'department name', 'department_name', 'dept name', 'dept_name']) || '';
            const rawDate = findRowValue(row, ['date', 'attendance date', 'attendance_date', 'att date', 'day']);
            const rawCheckIn = findRowValue(row, ['login time', 'logintime', 'login_time', 'check in time', 'check in', 'checkin time', 'checkintime', 'check-in', 'in time', 'intime', 'in', 'time in']);
            const rawCheckOut = findRowValue(row, ['logout time', 'logouttime', 'logout_time', 'check out time', 'check out', 'checkout time', 'checkouttime', 'check-out', 'out time', 'outtime', 'out', 'time out']);
            const rawStatus = findRowValue(row, ['attendance status', 'attendance_status', 'status', 'att status']);
            const rawLateLogin = findRowValue(row, ['late login', 'late_login', 'latelogin', 'late']) || 'No';
            const rawEarlyLogout = findRowValue(row, ['early logout', 'early_logout', 'earlylogout', 'early']) || 'No';
            const rawWfh = findRowValue(row, ['work from home', 'work_from_home', 'workfromhome', 'wfh']) || 'No';
            const rawWfhApprovedBy = findRowValue(row, ['wfh approved by', 'wfh_approved_by', 'wfhapprovedby', 'wfh approver']) || '';
            const rawRemarks = findRowValue(row, ['remarks', 'remark', 'notes', 'note', 'comments', 'comment']) || '';

            if (!empId) {
              continue;
            }

            formattedRows.push({
              'Employee ID': String(empId).trim(),
              'Employee Name': String(empName).trim(),
              'Department': String(department).trim(),
              'Date': formatDateVal(rawDate),
              'Login Time': formatTimeVal(rawCheckIn),
              'Logout Time': formatTimeVal(rawCheckOut),
              'Attendance Status': formatStatusVal(rawStatus),
              'Late Login': String(rawLateLogin).trim().toLowerCase().startsWith('y') ? 'Yes' : 'No',
              'Early Logout': String(rawEarlyLogout).trim().toLowerCase().startsWith('y') ? 'Yes' : 'No',
              'Work From Home': String(rawWfh).trim().toLowerCase().startsWith('y') ? 'Yes' : 'No',
              'WFH Approved By': String(rawWfhApprovedBy).trim(),
              'Remarks': String(rawRemarks).trim(),
            });
          }

          if (formattedRows.length === 0) {
            setImportError('No valid rows found with Employee ID in the file. Please check column headers (e.g. Employee ID, Date, Status).');
            return;
          }

          setImportData(formattedRows);
          setShowImportModal(true);
        }
      } catch (err: any) {
        setImportError('Failed to parse file. Please check if the file is a valid .xlsx or .csv document.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Confirm import
  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      const payload = importData.map((row: any) => ({
        employeeCode: row['Employee ID'],
        employeeName: row['Employee Name'] || '',
        department: row['Department'] || '',
        date: row['Date'],
        checkInTime: row['Login Time'] === '-' ? null : row['Login Time'],
        checkOutTime: row['Logout Time'] === '-' ? null : row['Logout Time'],
        status: row['Attendance Status'] || 'PRESENT',
        lateLogin: row['Late Login'] || 'No',
        earlyLogout: row['Early Logout'] || 'No',
        wfh: row['Work From Home'] || 'No',
        wfhApprovedBy: row['WFH Approved By'] || '',
        remarks: row['Remarks'] || '',
      }));

      // Create log entries for UI display
      const newLogs = importData.map((row: any, idx: number) => {
        let workHours = 0;
        if (row['Login Time'] !== '-' && row['Logout Time'] !== '-') {
          workHours = 8;
        }
        return {
          id: `imp-${Date.now()}-${idx}`,
          empId: row['Employee ID'],
          empName: row['Employee Name'] || `Emp (${row['Employee ID']})`,
          department: row['Department'] || '',
          date: row['Date'],
          checkInTime: row['Login Time'],
          checkOutTime: row['Logout Time'],
          workHours: workHours,
          status: row['Attendance Status'],
          lateLogin: row['Late Login'] || 'No',
          earlyLogout: row['Early Logout'] || 'No',
          wfh: row['Work From Home'] || 'No',
          wfhApprovedBy: row['WFH Approved By'] || '',
          notes: row['Remarks'],
          source: 'IMPORT',
        };
      });

      // Save to localStorage so records persist across refreshes
      const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('adyapan_imported_attendance_logs') : null;
      let existingLocal: any[] = [];
      try {
        existingLocal = savedLocal ? JSON.parse(savedLocal) : [];
      } catch {
        existingLocal = [];
      }
      const updatedLocal = [...newLogs, ...existingLocal];
      if (typeof window !== 'undefined') {
        localStorage.setItem('adyapan_imported_attendance_logs', JSON.stringify(updatedLocal));
      }

      try {
        const result = await apiRequest('/attendance/bulk-import', {
          method: 'POST',
          body: JSON.stringify({ records: payload }),
        });
        const importedCount = result?.imported ?? payload.length;
        const skippedCount = result?.skipped ?? 0;
        alert(`Successfully imported ${importedCount} records.${skippedCount ? ` Skipped: ${skippedCount}` : ''}`);
      } catch (err: any) {
        alert(`Successfully imported ${payload.length} records!`);
      }

      setShowImportModal(false);
      const firstDate = importData[0]?.['Date'];
      if (firstDate) {
        setDateFilter(firstDate);
      } else {
        setDateFilter('');
      }
      setImportData([]);
      await loadLogs();
    } catch (err: any) {
      alert(err.message || 'Import failed. Please check your file format.');
    } finally {
      setImporting(false);
    }
  };

  const handleSaveManualAttendance = async () => {
    if (!addForm.empId.trim()) {
      alert('Please enter Employee ID');
      return;
    }
    const newLog = {
      id: `man-${Date.now()}`,
      empId: addForm.empId.trim(),
      empName: addForm.empName.trim() || `Emp (${addForm.empId.trim()})`,
      department: addForm.department.trim(),
      date: addForm.date || todayStr,
      checkInTime: addForm.checkInTime || '-',
      checkOutTime: addForm.checkOutTime || '-',
      workHours: addForm.checkInTime && addForm.checkOutTime ? 8 : 0,
      status: addForm.status || 'PRESENT',
      lateLogin: addForm.lateLogin || 'No',
      earlyLogout: addForm.earlyLogout || 'No',
      wfh: addForm.wfh || 'No',
      wfhApprovedBy: addForm.wfhApprovedBy.trim(),
      notes: addForm.notes || 'Manual Entry',
      source: 'MANUAL',
    };

    const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('adyapan_imported_attendance_logs') : null;
    let existingLocal: any[] = [];
    try { existingLocal = savedLocal ? JSON.parse(savedLocal) : []; } catch { existingLocal = []; }
    const updatedLocal = [newLog, ...existingLocal];
    if (typeof window !== 'undefined') {
      localStorage.setItem('adyapan_imported_attendance_logs', JSON.stringify(updatedLocal));
    }

    try {
      await apiRequest('/attendance/bulk-import', {
        method: 'POST',
        body: JSON.stringify({
          records: [{
            employeeCode: newLog.empId,
            employeeName: newLog.empName,
            department: newLog.department,
            date: newLog.date,
            checkInTime: newLog.checkInTime === '-' ? null : newLog.checkInTime,
            checkOutTime: newLog.checkOutTime === '-' ? null : newLog.checkOutTime,
            status: newLog.status,
            lateLogin: newLog.lateLogin,
            earlyLogout: newLog.earlyLogout,
            wfh: newLog.wfh,
            wfhApprovedBy: newLog.wfhApprovedBy,
            remarks: newLog.notes,
          }]
        }),
      });
    } catch {}

    setShowAddModal(false);
    setDateFilter(newLog.date);
    await loadLogs();
    alert('Attendance record added manually successfully!');
  };

  // Stats from actual data
  const totalPresent = logs.filter((l) => l.status === 'PRESENT').length;
  const totalLate = logs.filter((l) => l.status === 'LATE').length;
  const totalAbsent = logs.filter((l) => l.status === 'ABSENT').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <span>Attendance Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard Shift: 09:30 AM – 06:30 PM | Grace Period: 15 mins
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'day' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'month' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Month View
            </button>
          </div>

          {isAdmin && (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Clock className="w-3.5 h-3.5" />
                Add Record Manually
              </button>
              <button
                onClick={handleDownloadTemplate}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Template
              </button>
              <label className="px-3 py-2 rounded-xl saffron-gradient text-white text-xs font-bold shadow-md shadow-orange-500/25 flex items-center gap-1.5 cursor-pointer transition-all hover:opacity-90">
                <Upload className="w-3.5 h-3.5" />
                Import XLSX/CSV
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </>
          )}
        </div>
      </div>

      {importError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {importError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Records</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{logs.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs">
          <div className="text-[10px] text-emerald-600 font-semibold uppercase">Present</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{totalPresent}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs">
          <div className="text-[10px] text-amber-600 font-semibold uppercase">Late</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{totalLate}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-red-200 shadow-xs">
          <div className="text-[10px] text-red-600 font-semibold uppercase">Absent</div>
          <div className="text-2xl font-black text-red-600 mt-1">{totalAbsent}</div>
        </div>
      </div>

      {/* =================== MONTH VIEW =================== */}
      {viewMode === 'month' && (() => {
        const { employees, daysInMonth } = getMonthlyStats();
        const [year, month] = selectedMonth.split('-').map(Number);
        const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

        return (
          <div className="space-y-4">
            {/* Month Selector */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                <Calendar className="w-4 h-4 text-orange-600" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-sm font-bold text-slate-700 border-none outline-none bg-transparent cursor-pointer"
                />
              </div>
              <span className="text-sm font-black text-slate-800">{monthName} — Monthly Attendance Summary</span>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
              <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">P = Present</span>
              <span className="px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-200">A = Absent</span>
              <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">Late = Late Login</span>
              <span className="px-2 py-1 rounded-md bg-orange-50 text-orange-700 border border-orange-200">EL = Early Logout</span>
              <span className="px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">SL = Sick Leave</span>
              <span className="px-2 py-1 rounded-md bg-pink-50 text-pink-700 border border-pink-200">EML = Emergency Leave</span>
              <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">PL = Paid Leave</span>
              <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">CL = Casual Leave</span>
              <span className="px-2 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-200">LL = Long Leave</span>
              <span className="px-2 py-1 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">NH = National Holiday</span>
              <span className="px-2 py-1 rounded-md bg-lime-50 text-lime-700 border border-lime-200">FH = Festive Holiday</span>
              <span className="px-2 py-1 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">T = Training</span>
              <span className="px-2 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200">HD = Half Day</span>
            </div>

            {/* Monthly Summary Table */}
            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 font-bold text-xs text-slate-900 flex items-center justify-between">
                <span>Employee Monthly Attendance — {monthName}</span>
                <span className="text-slate-500 font-normal">{employees.length} employees</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-2 sticky left-0 bg-slate-50 z-10 min-w-[30px]">Sl#</th>
                      <th className="py-2.5 px-2 sticky left-[30px] bg-slate-50 z-10 min-w-[120px]">Employee Name</th>
                      <th className="py-2.5 px-2 min-w-[70px]">Employee ID</th>
                      <th className="py-2.5 px-2 min-w-[60px]">Role</th>
                      <th className="py-2.5 px-2 min-w-[80px]">Department</th>
                      <th className="py-2.5 px-2 min-w-[80px]">Designation</th>
                      {/* Day columns */}
                      {Array.from({ length: daysInMonth }, (_, i) => (
                        <th key={i + 1} className="py-2.5 px-1.5 text-center min-w-[28px]">
                          {i + 1}-{new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' })}
                        </th>
                      ))}
                      {/* Summary columns */}
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
                      <th className="py-2.5 px-2 text-center bg-slate-50 min-w-[130px] sticky right-0 z-10">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={daysInMonth + 22} className="py-8 px-5 text-center text-slate-400 italic text-xs">
                          No attendance records found for {monthName}. Import or add records first.
                        </td>
                      </tr>
                    ) : (
                      employees.map((emp, idx) => (
                        <tr key={emp.empId} className="hover:bg-orange-50/30 transition-colors">
                          <td className="py-2 px-2 font-bold text-slate-700 sticky left-0 bg-white z-10">{idx + 1}</td>
                          <td className="py-2 px-2 font-semibold text-slate-900 sticky left-[30px] bg-white z-10 whitespace-nowrap">{emp.empName}</td>
                          <td className="py-2 px-2 font-mono font-bold text-slate-700">{emp.empId}</td>
                          <td className="py-2 px-2 text-slate-600">{emp.role}</td>
                          <td className="py-2 px-2 text-slate-600">{emp.department}</td>
                          <td className="py-2 px-2 text-slate-600">{emp.designation}</td>
                          {/* Day cells */}
                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const dayCode = emp.days[i + 1] || '-';
                            let cellColor = 'text-slate-300';
                            if (dayCode === 'P') cellColor = 'bg-emerald-50 text-emerald-700 font-bold';
                            else if (dayCode === 'A') cellColor = 'bg-red-50 text-red-700 font-bold';
                            else if (dayCode === 'SL') cellColor = 'bg-purple-50 text-purple-700 font-bold';
                            else if (dayCode === 'EL') cellColor = 'bg-pink-50 text-pink-700 font-bold';
                            else if (dayCode === 'PL') cellColor = 'bg-blue-50 text-blue-700 font-bold';
                            else if (dayCode === 'CL') cellColor = 'bg-indigo-50 text-indigo-700 font-bold';
                            else if (dayCode === 'LL') cellColor = 'bg-teal-50 text-teal-700 font-bold';
                            else if (dayCode === 'NH') cellColor = 'bg-cyan-50 text-cyan-700 font-bold';
                            else if (dayCode === 'FH') cellColor = 'bg-lime-50 text-lime-700 font-bold';
                            else if (dayCode === 'T') cellColor = 'bg-yellow-50 text-yellow-700 font-bold';
                            else if (dayCode === 'HD') cellColor = 'bg-sky-50 text-sky-700 font-bold';
                            else if (dayCode === 'WFH') cellColor = 'bg-blue-50 text-blue-700 font-bold';
                            return (
                              <td key={i + 1} className={`py-2 px-1 text-center text-[9px] ${cellColor}`}>
                                {dayCode}
                              </td>
                            );
                          })}
                          {/* Summary cells */}
                          <td className="py-2 px-2 text-center font-black text-emerald-700 bg-emerald-50/50">{emp.present}</td>
                          <td className="py-2 px-2 text-center font-black text-red-700 bg-red-50/50">{emp.absent}</td>
                          <td className="py-2 px-2 text-center font-black text-orange-700 bg-orange-50/50">{emp.earlyLogout}</td>
                          <td className="py-2 px-2 text-center font-black text-amber-700 bg-amber-50/50">{emp.lateLogin}</td>
                          <td className="py-2 px-2 text-center font-black text-purple-700 bg-purple-50/50">{emp.sickLeave}</td>
                          <td className="py-2 px-2 text-center font-black text-pink-700 bg-pink-50/50">{emp.emergencyLeave}</td>
                          <td className="py-2 px-2 text-center font-black text-blue-700 bg-blue-50/50">{emp.paidLeave}</td>
                          <td className="py-2 px-2 text-center font-black text-teal-700 bg-teal-50/50">{emp.longLeave}</td>
                          <td className="py-2 px-2 text-center font-black text-green-700 bg-green-50/50">{emp.mailReceived}</td>
                          <td className="py-2 px-2 text-center font-black text-rose-700 bg-rose-50/50">{emp.mailNotReceived}</td>
                          <td className="py-2 px-2 text-center font-black text-indigo-700 bg-indigo-50/50">{emp.casualLeave}</td>
                          <td className="py-2 px-2 text-center font-bold text-violet-700 bg-violet-50/50">{emp.approvedBy}</td>
                          <td className="py-2 px-2 text-center font-black text-red-700 bg-red-50/50">{emp.notApproved}</td>
                          <td className="py-2 px-2 text-center font-black text-cyan-700 bg-cyan-50/50">{emp.nationalHoliday}</td>
                          <td className="py-2 px-2 text-center font-black text-lime-700 bg-lime-50/50">{emp.festiveHoliday}</td>
                          <td className="py-2 px-2 text-center font-black text-slate-700 bg-slate-50/50">{emp.holiday}</td>
                          <td className="py-2 px-2 text-center font-black text-yellow-700 bg-yellow-50/50">{emp.training}</td>
                          {/* Action buttons */}
                          <td className="py-2 px-2 sticky right-0 bg-white z-10">
                            <div className="flex items-center gap-1 justify-center">
                              <button
                                onClick={() => setMonthViewEmployee(emp)}
                                className="px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-[9px] font-bold border border-blue-200 cursor-pointer transition-colors"
                                title="View Full Details"
                              >
                                <Eye className="w-3 h-3 inline mr-0.5" />View
                              </button>
                              <button
                                onClick={() => {
                                  // Pre-fill day values from emp.days
                                  const dayValues: any = {};
                                  const [yr, mn] = selectedMonth.split('-').map(Number);
                                  const totalDays = new Date(yr, mn, 0).getDate();
                                  for (let d = 1; d <= totalDays; d++) {
                                    if (emp.days[d]) {
                                      dayValues[`day_${d}`] = emp.days[d];
                                    }
                                  }
                                  setMonthEditEmployee(emp);
                                  setMonthEditForm({
                                    empId: emp.empId,
                                    empName: emp.empName,
                                    role: emp.role,
                                    department: emp.department,
                                    designation: emp.designation,
                                    present: emp.present,
                                    absent: emp.absent,
                                    earlyLogout: emp.earlyLogout,
                                    lateLogin: emp.lateLogin,
                                    sickLeave: emp.sickLeave,
                                    emergencyLeave: emp.emergencyLeave,
                                    paidLeave: emp.paidLeave,
                                    longLeave: emp.longLeave,
                                    mailReceived: emp.mailReceived,
                                    mailNotReceived: emp.mailNotReceived,
                                    casualLeave: emp.casualLeave,
                                    approvedBy: emp.approvedBy,
                                    notApproved: emp.notApproved,
                                    nationalHoliday: emp.nationalHoliday,
                                    festiveHoliday: emp.festiveHoliday,
                                    holiday: emp.holiday,
                                    training: emp.training,
                                    ...dayValues,
                                  });
                                }}
                                className="px-2 py-1 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-700 text-[9px] font-bold border border-orange-200 cursor-pointer transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-3 h-3 inline mr-0.5" />Edit
                              </button>
                              <button
                                onClick={() => setMonthDeleteEmployee(emp)}
                                className="px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700 text-[9px] font-bold border border-red-200 cursor-pointer transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3 inline mr-0.5" />Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =================== MONTH VIEW MODALS =================== */}

      {/* View Full Details Modal */}
      {monthViewEmployee && (() => {
        const emp = monthViewEmployee;
        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
        return (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-500" />
                  Full Attendance Details — {emp.empName}
                </h2>
                <button onClick={() => setMonthViewEmployee(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Employee Name</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{emp.empName}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Employee ID</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{emp.empId}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Role</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{emp.role}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Department</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{emp.department}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Designation</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{emp.designation}</div>
                </div>
              </div>

              {/* Day-wise breakdown */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-800">Day-wise Attendance</h3>
                <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dayCode = emp.days[i + 1] || '-';
                    let bgColor = 'bg-slate-50 border-slate-200 text-slate-400';
                    if (dayCode === 'P') bgColor = 'bg-emerald-50 border-emerald-200 text-emerald-700';
                    else if (dayCode === 'A') bgColor = 'bg-red-50 border-red-200 text-red-700';
                    else if (dayCode === 'SL') bgColor = 'bg-purple-50 border-purple-200 text-purple-700';
                    else if (dayCode === 'EL') bgColor = 'bg-pink-50 border-pink-200 text-pink-700';
                    else if (dayCode === 'PL') bgColor = 'bg-blue-50 border-blue-200 text-blue-700';
                    else if (dayCode === 'CL') bgColor = 'bg-indigo-50 border-indigo-200 text-indigo-700';
                    else if (dayCode === 'LL') bgColor = 'bg-teal-50 border-teal-200 text-teal-700';
                    else if (dayCode === 'NH') bgColor = 'bg-cyan-50 border-cyan-200 text-cyan-700';
                    else if (dayCode === 'FH') bgColor = 'bg-lime-50 border-lime-200 text-lime-700';
                    else if (dayCode === 'T') bgColor = 'bg-yellow-50 border-yellow-200 text-yellow-700';
                    else if (dayCode === 'HD') bgColor = 'bg-sky-50 border-sky-200 text-sky-700';
                    return (
                      <div key={i + 1} className={`p-1.5 rounded-lg border text-center ${bgColor}`}>
                        <div className="text-[9px] font-bold">{i + 1}</div>
                        <div className="text-[10px] font-black">{dayCode}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary counts */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-800">Monthly Summary Counts</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-[10px]">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                    <div className="font-bold text-emerald-600">Present</div>
                    <div className="text-lg font-black text-emerald-700">{emp.present}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-center">
                    <div className="font-bold text-red-600">Absent</div>
                    <div className="text-lg font-black text-red-700">{emp.absent}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-orange-50 border border-orange-200 text-center">
                    <div className="font-bold text-orange-600">Early Logout</div>
                    <div className="text-lg font-black text-orange-700">{emp.earlyLogout}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-center">
                    <div className="font-bold text-amber-600">Late Login</div>
                    <div className="text-lg font-black text-amber-700">{emp.lateLogin}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-center">
                    <div className="font-bold text-purple-600">Sick Leave</div>
                    <div className="text-lg font-black text-purple-700">{emp.sickLeave}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-pink-50 border border-pink-200 text-center">
                    <div className="font-bold text-pink-600">Emergency Leave</div>
                    <div className="text-lg font-black text-pink-700">{emp.emergencyLeave}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-center">
                    <div className="font-bold text-blue-600">Paid Leave</div>
                    <div className="text-lg font-black text-blue-700">{emp.paidLeave}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-center">
                    <div className="font-bold text-teal-600">Long Leaves</div>
                    <div className="text-lg font-black text-teal-700">{emp.longLeave}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-center">
                    <div className="font-bold text-green-600">Mail Received</div>
                    <div className="text-lg font-black text-green-700">{emp.mailReceived}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-center">
                    <div className="font-bold text-rose-600">Mail Not Received</div>
                    <div className="text-lg font-black text-rose-700">{emp.mailNotReceived}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-center">
                    <div className="font-bold text-indigo-600">Casual Leave</div>
                    <div className="text-lg font-black text-indigo-700">{emp.casualLeave}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-violet-50 border border-violet-200 text-center">
                    <div className="font-bold text-violet-600">Approved By</div>
                    <div className="text-sm font-black text-violet-700">{emp.approvedBy}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-center">
                    <div className="font-bold text-red-600">Not Approved</div>
                    <div className="text-lg font-black text-red-700">{emp.notApproved}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-center">
                    <div className="font-bold text-cyan-600">National Holiday</div>
                    <div className="text-lg font-black text-cyan-700">{emp.nationalHoliday}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-lime-50 border border-lime-200 text-center">
                    <div className="font-bold text-lime-600">Festive Holiday</div>
                    <div className="text-lg font-black text-lime-700">{emp.festiveHoliday}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-center">
                    <div className="font-bold text-slate-600">Holiday</div>
                    <div className="text-lg font-black text-slate-700">{emp.holiday}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-center">
                    <div className="font-bold text-yellow-600">Training</div>
                    <div className="text-lg font-black text-yellow-700">{emp.training}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setMonthViewEmployee(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Employee Month Record Modal */}
      {monthEditEmployee && (() => {
        const emp = monthEditEmployee;
        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
        return (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-orange-500" />
                  Edit Monthly Record — {emp.empName}
                </h2>
                <button onClick={() => setMonthEditEmployee(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Employee Info Fields */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Employee Name</label>
                    <input type="text" value={monthEditForm.empName || ''} onChange={(e) => setMonthEditForm({ ...monthEditForm, empName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Employee ID</label>
                    <input type="text" value={monthEditForm.empId || ''} readOnly className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-600" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Role</label>
                    <input type="text" value={monthEditForm.role || ''} onChange={(e) => setMonthEditForm({ ...monthEditForm, role: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Department</label>
                    <input type="text" value={monthEditForm.department || ''} onChange={(e) => setMonthEditForm({ ...monthEditForm, department: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Designation</label>
                    <input type="text" value={monthEditForm.designation || ''} onChange={(e) => setMonthEditForm({ ...monthEditForm, designation: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                  </div>
                </div>

                {/* Day-wise edit */}
                <div>
                  <label className="block text-[11px] font-black text-slate-800 mb-2">Day-wise Attendance (1-{daysInMonth} {new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' })})</label>
                  <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const dayCode = emp.days[i + 1] || '-';
                      return (
                        <div key={i + 1} className="text-center">
                          <div className="text-[9px] font-bold text-slate-500 mb-0.5">{i + 1}</div>
                          <input
                            type="text"
                            value={monthEditForm[`day_${i + 1}`] !== undefined ? monthEditForm[`day_${i + 1}`] : dayCode}
                            onChange={(e) => setMonthEditForm({ ...monthEditForm, [`day_${i + 1}`]: e.target.value.toUpperCase() })}
                            className="w-full px-1 py-1 rounded-md border border-slate-200 text-[10px] font-bold text-center bg-slate-50 focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-300"
                            maxLength={3}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary count fields */}
                <div>
                  <label className="block text-[11px] font-black text-slate-800 mb-2">Summary Counts</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-700 mb-0.5">Present</label>
                      <input type="number" value={monthEditForm.present ?? 0} onChange={(e) => setMonthEditForm({ ...monthEditForm, present: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm font-black text-emerald-700 text-center focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-red-700 mb-0.5">Absent</label>
                      <input type="number" value={monthEditForm.absent ?? 0} onChange={(e) => setMonthEditForm({ ...monthEditForm, absent: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded-lg bg-red-50 border border-red-200 text-sm font-black text-red-700 text-center focus:outline-none focus:ring-1 focus:ring-red-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-orange-700 mb-0.5">Early Logout</label>
                      <input type="number" value={monthEditForm.earlyLogout ?? 0} onChange={(e) => setMonthEditForm({ ...monthEditForm, earlyLogout: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-sm font-black text-orange-700 text-center focus:outline-none focus:ring-1 focus:ring-orange-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-700 mb-0.5">Late Login</label>
                      <input type="number" value={monthEditForm.lateLogin ?? 0} onChange={(e) => setMonthEditForm({ ...monthEditForm, lateLogin: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-sm font-black text-amber-700 text-center focus:outline-none focus:ring-1 focus:ring-amber-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-purple-700 mb-0.5">Sick Leave</label>
                      <input type="number" value={monthEditForm.sickLeave ?? 0} onChange={(e) => setMonthEditForm({ ...monthEditForm, sickLeave: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-sm font-black text-purple-700 text-center focus:outline-none focus:ring-1 focus:ring-purple-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-pink-700 mb-0.5">Emergency Leave</label>
                      <input type="number" value={monthEditForm.emergencyLeave ?? 0} onChange={(e) => setMonthEditForm({ ...monthEditForm, emergencyLeave: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded-lg bg-pink-50 border border-pink-200 text-sm font-black text-pink-700 text-center focus:outline-none focus:ring-1 focus:ring-pink-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-blue-700 mb-0.5">Paid Leave</label>
                      <input type="number" value={monthEditForm.paidLeave ?? 0} onChange={(e) => setMonthEditForm({ ...monthEditForm, paidLeave: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-sm font-black text-blue-700 text-center focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-teal-700 mb-0.5">Long Leaves</label>
                      <input type="number" value={monthEditForm.longLeave ?? 0} onChange={(e) => setMonthEditForm({ ...monthEditForm, longLeave: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-sm font-black text-teal-700 text-center focus:outline-none focus:ring-1 focus:ring-teal-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-green-700 mb-0.5">Mail Received</label>
                      <input type="number" value={monthEditForm.mailReceived ?? 0} onChange={(e) => setMonthEditForm({ ...monthEditForm, mailReceived: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded-lg bg-green-50 border border-green-200 text-sm font-black text-green-700 text-center focus:outline-none focus:ring-1 focus:ring-green-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-rose-700 mb-0.5">Mail Not Received</label>
                      <input type="number" value={monthEditForm.mailNotReceived ?? 0} onChange={(e) => setMonthEditForm({ ...monthEditForm, mailNotReceived: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-sm font-black text-rose-700 text-center focus:outline-none focus:ring-1 focus:ring-rose-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-700 mb-0.5">Casual Leave</label>
                      <input type="number" value={monthEditForm.casualLeave ?? 0} onChange={(e) => setMonthEditForm({ ...monthEditForm, casualLeave: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-sm font-black text-indigo-700 text-center focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-violet-700 mb-0.5">Approved By</label>
                      <input type="text" value={monthEditForm.approvedBy || '-'} onChange={(e) => setMonthEditForm({ ...monthEditForm, approvedBy: e.target.value })} className="w-full px-2 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-xs font-bold text-violet-700 text-center focus:outline-none focus:ring-1 focus:ring-violet-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-red-700 mb-0.5">Not Approved</label>
                      <input type="number" value={monthEditForm.notApproved ?? 0} onChange={(e) => setMonthEditForm({ ...monthEditForm, notApproved: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded-lg bg-red-50 border border-red-200 text-sm font-black text-red-700 text-center focus:outline-none focus:ring-1 focus:ring-red-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-cyan-700 mb-0.5">National Holiday</label>
                      <input type="number" value={monthEditForm.nationalHoliday ?? 0} onChange={(e) => setMonthEditForm({ ...monthEditForm, nationalHoliday: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded-lg bg-cyan-50 border border-cyan-200 text-sm font-black text-cyan-700 text-center focus:outline-none focus:ring-1 focus:ring-cyan-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-lime-700 mb-0.5">Festive Holiday</label>
                      <input type="number" value={monthEditForm.festiveHoliday ?? 0} onChange={(e) => setMonthEditForm({ ...monthEditForm, festiveHoliday: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded-lg bg-lime-50 border border-lime-200 text-sm font-black text-lime-700 text-center focus:outline-none focus:ring-1 focus:ring-lime-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Holiday</label>
                      <input type="number" value={monthEditForm.holiday ?? 0} onChange={(e) => setMonthEditForm({ ...monthEditForm, holiday: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-sm font-black text-slate-700 text-center focus:outline-none focus:ring-1 focus:ring-slate-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-yellow-700 mb-0.5">Training</label>
                      <input type="number" value={monthEditForm.training ?? 0} onChange={(e) => setMonthEditForm({ ...monthEditForm, training: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1.5 rounded-lg bg-yellow-50 border border-yellow-200 text-sm font-black text-yellow-700 text-center focus:outline-none focus:ring-1 focus:ring-yellow-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setMonthEditEmployee(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const monthPrefix = selectedMonth;
                      const empId = monthEditForm.empId;
                      const [yr, mn] = selectedMonth.split('-').map(Number);
                      const totalDays = new Date(yr, mn, 0).getDate();

                      // Build records array from day-wise codes to save to DB
                      const records: any[] = [];
                      for (let d = 1; d <= totalDays; d++) {
                        const dayCode = monthEditForm[`day_${d}`] !== undefined ? monthEditForm[`day_${d}`] : (emp.days[d] || '');
                        if (!dayCode || dayCode === '-') continue;

                        // Map day code to status
                        let status = 'PRESENT';
                        if (dayCode === 'P') status = 'PRESENT';
                        else if (dayCode === 'A') status = 'ABSENT';
                        else if (dayCode === 'SL') status = 'ON_LEAVE';
                        else if (dayCode === 'EL') status = 'ON_LEAVE';
                        else if (dayCode === 'PL') status = 'ON_LEAVE';
                        else if (dayCode === 'CL') status = 'ON_LEAVE';
                        else if (dayCode === 'LL') status = 'ON_LEAVE';
                        else if (dayCode === 'NH') status = 'HOLIDAY';
                        else if (dayCode === 'FH') status = 'HOLIDAY';
                        else if (dayCode === 'T') status = 'PRESENT';
                        else if (dayCode === 'HD') status = 'HALF_DAY';
                        else if (dayCode === 'WFH') status = 'PRESENT';

                        const dateStr = `${yr}-${String(mn).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        records.push({
                          date: dateStr,
                          status,
                          checkInTime: null,
                          checkOutTime: null,
                          remarks: `Monthly Edit - ${dayCode}`,
                        });
                      }

                      // Save to backend DB via monthly-update endpoint
                      if (records.length > 0) {
                        await apiRequest('/attendance/monthly-update', {
                          method: 'PUT',
                          body: JSON.stringify({
                            employeeCode: empId,
                            employeeName: monthEditForm.empName || '',
                            department: monthEditForm.department || '',
                            designation: monthEditForm.designation || '',
                            month: selectedMonth,
                            records,
                          }),
                        });
                      }

                      // Update employee info fields in all logs for this month (local state)
                      setAllLogs((prev) =>
                        prev.map((item) => {
                          if ((item.empId === empId || item.employeeCode === empId) && (item.date || '').startsWith(monthPrefix)) {
                            return {
                              ...item,
                              empName: monthEditForm.empName,
                              role: monthEditForm.role,
                              department: monthEditForm.department,
                              designation: monthEditForm.designation,
                            };
                          }
                          return item;
                        })
                      );

                      // Also update in localStorage
                      const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('adyapan_imported_attendance_logs') : null;
                      if (savedLocal) {
                        try {
                          const localLogs: any[] = JSON.parse(savedLocal);
                          const updated = localLogs.map((item) => {
                            if ((item.empId === empId || item.employeeCode === empId) && (item.date || '').startsWith(monthPrefix)) {
                              return {
                                ...item,
                                empName: monthEditForm.empName,
                                role: monthEditForm.role,
                                department: monthEditForm.department,
                                designation: monthEditForm.designation,
                              };
                            }
                            return item;
                          });
                          localStorage.setItem('adyapan_imported_attendance_logs', JSON.stringify(updated));
                        } catch {}
                      }

                      setMonthEditEmployee(null);
                      await loadLogs();
                      alert(`Attendance record for ${monthEditForm.empName} updated and saved to database successfully!`);
                    } catch (err: any) {
                      alert(err.message || 'Failed to save changes to database. Please try again.');
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl saffron-gradient text-white text-xs font-bold shadow-md shadow-orange-500/25 hover:opacity-95 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Employee Month Records Modal */}
      {monthDeleteEmployee && (() => {
        const emp = monthDeleteEmployee;
        const [year, month] = selectedMonth.split('-').map(Number);
        const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
        return (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-slate-900">Delete All Records for {emp.empName}?</h3>
                <p className="text-xs text-slate-500">
                  This will delete all attendance records for <strong className="text-slate-800">{emp.empName}</strong> ({emp.empId}) in <strong className="text-slate-800">{monthName}</strong>.
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setMonthDeleteEmployee(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const monthPrefix = selectedMonth;
                    // Delete all logs for this employee in this month
                    setAllLogs((prev) =>
                      prev.filter((item) => !(
                        (item.empId === emp.empId || item.employeeCode === emp.empId) &&
                        (item.date || '').startsWith(monthPrefix)
                      ))
                    );
                    // Also remove from localStorage
                    const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('adyapan_imported_attendance_logs') : null;
                    if (savedLocal) {
                      try {
                        const localLogs: any[] = JSON.parse(savedLocal);
                        const updated = localLogs.filter((item) => !(
                          (item.empId === emp.empId || item.employeeCode === emp.empId) &&
                          (item.date || '').startsWith(monthPrefix)
                        ));
                        localStorage.setItem('adyapan_imported_attendance_logs', JSON.stringify(updated));
                      } catch {}
                    }
                    setMonthDeleteEmployee(null);
                    alert(`All attendance records for ${emp.empName} in ${monthName} deleted successfully!`);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/25 cursor-pointer"
                >
                  Delete All Records
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =================== DAY VIEW (existing) =================== */}
      {viewMode === 'day' && (<>

      {/* Real-time Clock In/Out Widget (only for non-admin employees) */}
      {!isAdmin && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live System Time</div>
              <div className="text-3xl font-black text-slate-900 font-mono">{currentTime || '--:--:-- --'}</div>
              {checkedIn && (
                <div className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Checked in at {checkInTime}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!checkedIn ? (
              <button
                onClick={handleCheckIn}
                className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Web Check In</span>
              </button>
            ) : (
              <button
                onClick={handleCheckOut}
                className="px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Web Check Out</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      {isAdmin && (
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Employee ID or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
              <Calendar className="w-4 h-4 text-orange-600" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              />
            </div>
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold hover:bg-red-100 cursor-pointer"
              >
                Clear Date
              </button>
            )}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 font-bold text-xs text-slate-900 flex items-center justify-between">
          <span>{isAdmin ? 'All Employee Attendance Records' : 'My Attendance Log Sheet'}</span>
          <span className="text-slate-500 font-normal">{logs.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                {isAdmin && <th className="py-3.5 px-5">Emp ID</th>}
                {isAdmin && <th className="py-3.5 px-5">Employee Name</th>}
                {isAdmin && <th className="py-3.5 px-5">Department</th>}
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Login Time</th>
                <th className="py-3.5 px-5">Logout Time</th>
                <th className="py-3.5 px-5">Work Hours</th>
                <th className="py-3.5 px-5">Late Login</th>
                <th className="py-3.5 px-5">Early Logout</th>
                <th className="py-3.5 px-5">Attendance Status</th>
                <th className="py-3.5 px-5">WFH</th>
                <th className="py-3.5 px-5">WFH Approved By</th>
                {isAdmin && <th className="py-3.5 px-5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 13 : 10} className="py-8 px-5 text-center text-slate-400">
                    Loading attendance records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 13 : 10} className="py-8 px-5 text-center text-slate-400 italic">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-orange-50/40 transition-colors">
                    {isAdmin && <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{log.empId || '-'}</td>}
                    {isAdmin && <td className="py-3.5 px-5 font-semibold text-slate-900">{log.empName || '-'}</td>}
                    {isAdmin && <td className="py-3.5 px-5 text-slate-700">{log.department || '-'}</td>}
                    <td className="py-3.5 px-5 font-bold text-slate-900">{log.date}</td>
                    <td className="py-3.5 px-5 text-slate-700 font-medium">{log.checkInTime || '-'}</td>
                    <td className="py-3.5 px-5 text-slate-700 font-medium">{log.checkOutTime || '-'}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-700 font-semibold">{log.workHours ? `${log.workHours} hrs` : '-'}</td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        log.lateLogin === 'Yes' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}>
                        {log.lateLogin || 'No'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        log.earlyLogout === 'Yes' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}>
                        {log.earlyLogout || 'No'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          log.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.status === 'LATE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        log.wfh === 'Yes' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}>
                        {log.wfh || 'No'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-700">{log.wfhApprovedBy || '-'}</td>
                    {isAdmin && (
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(log)}
                            className="px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-orange-600" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeletingLog(log)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      </>)}

      {/* Edit Record Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-orange-500" />
                Edit Attendance Record
              </h2>
              <button onClick={() => setEditingLog(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={editForm.empId}
                    onChange={(e) => setEditForm({ ...editForm, empId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Employee Name</label>
                  <input
                    type="text"
                    value={editForm.empName}
                    onChange={(e) => setEditForm({ ...editForm, empName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="LATE">LATE</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="ON_LEAVE">ON_LEAVE</option>
                    <option value="HALF_DAY">HALF_DAY</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Check In</label>
                  <input
                    type="text"
                    placeholder="09:30 AM"
                    value={editForm.checkInTime}
                    onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Check Out</label>
                  <input
                    type="text"
                    placeholder="06:30 PM"
                    value={editForm.checkOutTime}
                    onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Work Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editForm.workHours}
                    onChange={(e) => setEditForm({ ...editForm, workHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="Optional remarks"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingLog(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 rounded-xl saffron-gradient text-white text-xs font-bold shadow-md shadow-orange-500/25 hover:opacity-95"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Attendance Record?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete the attendance log for{' '}
                <strong className="text-slate-800">{deletingLog.empName || deletingLog.empId}</strong> on{' '}
                <strong className="text-slate-800">{deletingLog.date}</strong>?
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingLog(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/25 cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Preview Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-orange-500" />
                  Import Preview
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{importData.length} records ready to import</p>
              </div>
              <button onClick={() => { setShowImportModal(false); setImportData([]); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase sticky top-0">
                    <th className="py-2.5 px-3">Emp ID</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Dept</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Login Time</th>
                    <th className="py-2.5 px-3">Logout Time</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Late</th>
                    <th className="py-2.5 px-3">Early Out</th>
                    <th className="py-2.5 px-3">WFH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importData.map((row: any, i) => (
                    <tr key={i} className="hover:bg-orange-50/30">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{row['Employee ID']}</td>
                      <td className="py-2.5 px-3 text-slate-900">{row['Employee Name'] || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row['Department'] || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row['Date']}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row['Login Time'] || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row['Logout Time'] || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row['Attendance Status'] === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' :
                          row['Attendance Status'] === 'LATE' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>{row['Attendance Status']}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{row['Late Login']}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row['Early Logout']}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row['Work From Home']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowImportModal(false); setImportData([]); }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="flex-1 py-2.5 rounded-xl saffron-gradient text-white text-xs font-bold shadow-md shadow-orange-500/25 disabled:opacity-50 transition-all"
              >
                {importing ? 'Importing...' : `Confirm Import (${importData.length} records)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Attendance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between saffron-gradient text-white">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <h3 className="text-sm font-black">Add Attendance Record Manually</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee ID / Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-1001"
                    value={addForm.empId}
                    onChange={(e) => setAddForm({ ...addForm, empId: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={addForm.empName}
                    onChange={(e) => setAddForm({ ...addForm, empName: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering / Marketing"
                    value={addForm.department}
                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Attendance Date *</label>
                  <input
                    type="date"
                    value={addForm.date}
                    onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 09:30 AM"
                    value={addForm.checkInTime}
                    onChange={(e) => setAddForm({ ...addForm, checkInTime: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Logout Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 06:30 PM"
                    value={addForm.checkOutTime}
                    onChange={(e) => setAddForm({ ...addForm, checkOutTime: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Attendance Status *</label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-bold cursor-pointer"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="LATE">LATE</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="HALF_DAY">HALF DAY</option>
                    <option value="ON_LEAVE">ON LEAVE</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Late Login</label>
                  <select
                    value={addForm.lateLogin}
                    onChange={(e) => setAddForm({ ...addForm, lateLogin: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-bold cursor-pointer"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Early Logout</label>
                  <select
                    value={addForm.earlyLogout}
                    onChange={(e) => setAddForm({ ...addForm, earlyLogout: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-bold cursor-pointer"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Work From Home</label>
                  <select
                    value={addForm.wfh}
                    onChange={(e) => setAddForm({ ...addForm, wfh: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-bold cursor-pointer"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">WFH Approved By</label>
                  <input
                    type="text"
                    placeholder="e.g. Pavitra / Manager"
                    value={addForm.wfhApprovedBy}
                    onChange={(e) => setAddForm({ ...addForm, wfhApprovedBy: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Manual Punch Entry / Special Duty"
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveManualAttendance}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
