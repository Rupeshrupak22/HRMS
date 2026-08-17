'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Download, Upload, Search, Edit3, Trash2, X, AlertTriangle, Plus, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import UploadProgressModal from '@/components/UploadProgressModal';

export default function AttendancePage() {
  const { user } = useAuth();
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchTerm, setSearchTerm] = useState('');

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
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN' || user?.role === 'HR_EXECUTIVE' || isPavitra;

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1).toISOString();
      const endDate = new Date(parseInt(year, 10), parseInt(month, 10), 0, 23, 59, 59).toISOString();
      const res = await apiRequest(`/attendance/all-logs?startDate=${startDate}&endDate=${endDate}`);
      if (Array.isArray(res)) {
        setAllLogs(res);
      } else if (res?.data && Array.isArray(res.data)) {
        setAllLogs(res.data);
      } else if (res?.success && Array.isArray(res.data)) {
        setAllLogs(res.data);
      }
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
          role: log.role || '-',
          department: log.department || '-',
          designation: log.designation || '-',
          days: {} as Record<number, string>,
          present: 0,
          absent: 0,
          earlyLogout: 0,
          lateLogin: 0,
          sickLeave: 0,
          emergencyLeave: 0,
          paidLeave: 0,
          longLeave: 0,
          mailReceived: 0,
          mailNotReceived: 0,
          casualLeave: 0,
          approvedBy: '-',
          notApproved: 0,
          nationalHoliday: 0,
          festiveHoliday: 0,
          holiday: 0,
          training: 0,
          wo: 0, ot: 0, wfh: 0, hd: 0
        });
      }
      const emp = empMap.get(key)!;
      const day = parseInt(log.date.split('-')[2], 10);
      emp.days[day] = log.status;

      if (log.status === 'PRESENT' || log.status === 'P') emp.present++;
      else if (log.status === 'ABSENT' || log.status === 'A') emp.absent++;
      else if (log.status === 'CASUAL_LEAVE' || log.status === 'CL') emp.casualLeave++;
      else if (log.status === 'SICK_LEAVE' || log.status === 'SL') emp.sickLeave++;
      else if (log.status === 'HOLIDAY' || log.status === 'H') emp.holiday++;
      else if (log.status === 'WEEKLY_OFF' || log.status === 'WO') emp.wo++;
      else if (log.status === 'OVERTIME' || log.status === 'OT') emp.ot++;
      else if (log.status === 'WORK_FROM_HOME' || log.status === 'WFH') emp.wfh++;
      else if (log.status === 'HALF_DAY' || log.status === 'HD') emp.hd++;
      else if (log.status === 'EARLY_LOGOUT') emp.earlyLogout++;
      else if (log.status === 'LATE_LOGIN') emp.lateLogin++;
      else if (log.status === 'EMERGENCY_LEAVE') emp.emergencyLeave++;
      else if (log.status === 'PAID_LEAVE') emp.paidLeave++;
      else if (log.status === 'LONG_LEAVE') emp.longLeave++;
      else if (log.status === 'NATIONAL_HOLIDAY') emp.nationalHoliday++;
      else if (log.status === 'FESTIVE_HOLIDAY') emp.festiveHoliday++;
      else if (log.status === 'TRAINING') emp.training++;
    }
    return Array.from(empMap.values());
  };

  const allEmployees = getMonthlyStats();
  const filteredEmployees = allEmployees.filter(emp => {
    return emp.empName.toLowerCase().includes(searchTerm.toLowerCase()) || emp.empId.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
        const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

        const codeMap: Record<string, string> = {
          'P': 'PRESENT', 'A': 'ABSENT', 'CL': 'CASUAL_LEAVE', 'SL': 'SICK_LEAVE', 
          'H': 'HOLIDAY', 'WO': 'WEEKLY_OFF', 'OT': 'OVERTIME', 'WFH': 'WORK_FROM_HOME', 'HD': 'HALF_DAY',
          'EL': 'EARLY_LOGOUT', 'LL': 'LATE_LOGIN', 'E_L': 'EMERGENCY_LEAVE', 'PL': 'PAID_LEAVE',
          'LLV': 'LONG_LEAVE', 'NH': 'NATIONAL_HOLIDAY', 'FH': 'FESTIVE_HOLIDAY', 'T': 'TRAINING'
        };

        const formattedRecords: any[] = [];

        for (const row of jsonData) {
          const keys = Object.keys(row);
          
          // Find employee ID flexibly
          const empIdKey = keys.find(k => /^(employee\s*id|emp\s*id|id|employee\s*code|emp\s*code)$/i.test(k.trim()));
          const empId = empIdKey ? row[empIdKey] : (row['Employee ID'] || row['ID'] || row['Emp ID']);

          // Find employee Name flexibly
          const empNameKey = keys.find(k => /^(employee\s*name|emp\s*name|name|staff\s*name)$/i.test(k.trim()));
          const empName = empNameKey ? row[empNameKey] : (row['Employee Name'] || row['Name'] || row['Emp Name']);

          if (empId) {
            for (let i = 1; i <= daysInMonth; i++) {
              const dayStr = String(i);
              const paddedDay = String(i).padStart(2, '0');
              
              // Match column: "1", "01", "1-Aug", "1/8", etc.
              const dayKey = keys.find(k => {
                const cleanK = k.trim();
                return cleanK === dayStr || 
                       cleanK === paddedDay || 
                       new RegExp(`^0?${i}[\\s\\-\\/]`, 'i').test(cleanK);
              });

              const rawVal = dayKey ? String(row[dayKey] ?? '').trim().toUpperCase() : '';
              if (rawVal && rawVal !== '-' && rawVal !== 'UNDEFINED' && rawVal !== 'NULL') {
                const fullStatus = codeMap[rawVal] || rawVal;
                const dateStr = `${yearStr}-${monthStr}-${paddedDay}`;
                
                formattedRecords.push({
                  employeeCode: String(empId).trim(),
                  employeeName: empName ? String(empName).trim() : `Employee (${empId})`,
                  date: dateStr,
                  status: fullStatus
                });
              }
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
      const totalRecords = importData.length;
      const batchSize = 50;
      const batches = Math.ceil(totalRecords / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const batch = importData.slice(i * batchSize, (i + 1) * batchSize);
        await apiRequest('/attendance/bulk-import', {
          method: 'POST',
          body: JSON.stringify({ records: batch }),
        });
        const progress = Math.round(((i + 1) / batches) * 100);
        setUploadProgress(progress);
      }
      
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
      const records = [];
      for (let i = 1; i <= daysInMonth; i++) {
        if (editForm[i]) {
          const dateStr = `${selectedMonth}-${String(i).padStart(2, '0')}`;
          records.push({ 
            date: dateStr, 
            status: editForm[i],
            remarks: editForm.approvedBy ? `Approved By: ${editForm.approvedBy}` : undefined
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
    setEditForm(form);
    setEditEmployee(emp);
  };

  const calculateCountersFromDays = () => {
    let p = 0, a = 0, el = 0, ll = 0, sl = 0, ecl = 0, pl = 0, llv = 0, cl = 0, nh = 0, fh = 0, h = 0, t = 0, hd = 0, wfh = 0, wo = 0, ot = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const s = editForm[i];
      if (s === 'PRESENT' || s === 'P') p++;
      else if (s === 'ABSENT' || s === 'A') a++;
      else if (s === 'EARLY_LOGOUT' || s === 'EL') el++;
      else if (s === 'LATE_LOGIN' || s === 'LL') ll++;
      else if (s === 'SICK_LEAVE' || s === 'SL') sl++;
      else if (s === 'EMERGENCY_LEAVE' || s === 'E_L') ecl++;
      else if (s === 'PAID_LEAVE' || s === 'PL') pl++;
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


        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
            />
          </div>
          <div className="flex-1 max-w-md relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Employee ID or Name..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* Main Monthly Grid */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase">
                  <th className="py-2.5 px-2 sticky left-0 bg-slate-50 z-20 min-w-[30px]">Sl#</th>
                  <th className="py-2.5 px-2 sticky left-[30px] bg-slate-50 z-20 min-w-[120px]">Employee Name</th>
                  <th className="py-2.5 px-2 min-w-[70px]">Employee ID</th>
                  <th className="py-2.5 px-2 min-w-[60px]">Role</th>
                  <th className="py-2.5 px-2 min-w-[80px]">Department</th>
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
                  <th className="py-2.5 px-2 text-center bg-slate-50 min-w-[130px] sticky right-0 z-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={daysInMonth + 7} className="text-center p-8 text-slate-400">Loading attendance data...</td></tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr><td colSpan={daysInMonth + 7} className="text-center p-8 text-slate-400">No records found for {selectedMonth}.</td></tr>
                ) : (
                  filteredEmployees.map((emp, index) => (
                    <tr key={emp.empId} className="hover:bg-slate-50/50">
                      <td className="p-2 font-mono text-slate-500 sticky left-0 bg-white z-10 border-r border-slate-50 text-center">{index + 1}</td>
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
                      <td className="p-2 sticky right-0 bg-slate-50 z-10 text-center border-l border-slate-100">
                        {isAdmin && (
                          <div className="flex justify-center gap-1">
                            <button onClick={() => openEditModal(emp)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setDeleteEmployee(emp)} className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
                    else if (currentVal === 'HOLIDAY' || currentVal === 'NATIONAL_HOLIDAY' || currentVal === 'FESTIVE_HOLIDAY') badgeColor = 'bg-amber-50 border-amber-300 text-amber-700 font-bold';
                    else if (currentVal === 'WEEKLY_OFF') badgeColor = 'bg-blue-50 border-blue-300 text-blue-700 font-bold';
                    else if (currentVal) badgeColor = 'bg-violet-50 border-violet-300 text-violet-700 font-bold';

                    return (
                      <div key={i} className={`flex flex-col gap-1 p-2 rounded-xl border transition ${badgeColor}`}>
                        <div className="flex justify-between items-center px-0.5">
                          <label className="text-[10px] font-black uppercase">Day {i + 1}</label>
                          {currentVal && (
                            <span className="text-[9px] font-black opacity-70">
                              {currentVal === 'PRESENT' ? 'P' : currentVal === 'ABSENT' ? 'A' : currentVal === 'HALF_DAY' ? 'HD' : currentVal === 'CASUAL_LEAVE' ? 'CL' : currentVal === 'SICK_LEAVE' ? 'SL' : currentVal === 'HOLIDAY' ? 'H' : currentVal.slice(0, 3)}
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
                        </select>
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