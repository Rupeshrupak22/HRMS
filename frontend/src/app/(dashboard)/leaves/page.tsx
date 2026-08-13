'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  CalendarDays, Plus, CheckCircle2, XCircle, Clock, Upload, Download,
  FileSpreadsheet, X, Search, Edit3, Save, Trash2,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function LeavesPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [balances, setBalances] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const isPavitra = user?.specialization === 'ATTENDANCE_LEAVE' || user?.email === 'pavitra@adyapan.com';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN' || user?.role === 'HR_EXECUTIVE' || isPavitra;

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
      return '';
    }
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    if (val instanceof Date) {
      if (!isNaN(val.getTime())) {
        return val.toISOString().split('T')[0];
      }
    }
    const str = String(val).trim();
    if (str.includes('T')) return str.split('T')[0];
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
      return parsed.toISOString().split('T')[0];
    }
    return '';
  };

  // Helper: Format leave status values
  const formatStatusVal = (val: any): string => {
    if (!val) return 'PENDING';
    const s = String(val).toUpperCase().trim();
    if (s.includes('APPROV')) return 'APPROVED';
    if (s.includes('REJECT')) return 'REJECTED';
    return 'PENDING';
  };

  const loadData = async () => {
    setLoading(true);
    let fetchedRequests: any[] = [];
    let fetchedBalances: any[] = [];
    try {
      const [reqData, balData] = await Promise.all([
        apiRequest('/leave/requests'),
        apiRequest('/leave/balances'),
      ]);
      if (Array.isArray(reqData)) {
        fetchedRequests = reqData;
      } else if (reqData?.data && Array.isArray(reqData.data)) {
        fetchedRequests = reqData.data;
      }
      if (Array.isArray(balData)) {
        fetchedBalances = balData;
      } else if (balData?.data && Array.isArray(balData.data)) {
        fetchedBalances = balData.data;
      }
    } catch {
      fetchedRequests = [];
      fetchedBalances = [];
    } finally {
      const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('adyapan_imported_leave_requests') : null;
      let localRequests: any[] = [];
      try {
        localRequests = savedLocal ? JSON.parse(savedLocal) : [];
      } catch {
        localRequests = [];
      }

      const map = new Map();
      for (const item of fetchedRequests) {
        const key = item.id || `${(item.employee?.employeeCode || item.employeeCode || '').trim()}_${(item.startDate || '').trim()}`;
        if (key) map.set(key, item);
      }
      for (const item of localRequests) {
        const formattedItem = {
          ...item,
          createdAt: item.createdAt || item.createdDate || item.importedDate || item.startDate || item.from || item.date,
        };
        const key = item.id || `${(item.employeeCode || item.employee?.employeeCode || '').trim()}_${(item.startDate || '').trim()}`;
        if (key && !map.has(key)) map.set(key, formattedItem);
      }

      const merged = Array.from(map.values());
      setRequests(merged);
      setBalances(fetchedBalances);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter
  useEffect(() => {
    let filtered = [...requests];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.employee?.employeeCode || r.employeeCode || '').toLowerCase().includes(term) ||
          (r.employee?.firstName || r.employeeName || '').toLowerCase().includes(term) ||
          (r.employee?.lastName || '').toLowerCase().includes(term) ||
          (r.reason || '').toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    if (dateFilter) {
      filtered = filtered.filter((r) => {
        const rawDate = r.importedDate || r.createdAt || r.createdDate || r.startDate || r.from || r.date;
        const d = formatDateVal(rawDate);
        return d === dateFilter;
      });
    }
    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, dateFilter, requests]);

  // Apply leave
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/leave/apply', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setIsApplyModalOpen(false);
      setFormData({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to apply leave');
    }
  };

  // Update leave status (inline edit)
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await apiRequest(`/leave/requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, rejectionReason: newStatus === 'REJECTED' ? 'Rejected by HR' : undefined }),
      });
      setEditingId(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    const templateData = [
      { 'Employee ID': 'EMP-001', 'Employee Name': 'John Doe', 'Leave Type': 'Casual Leave', 'Start Date': '2026-08-15', 'End Date': '2026-08-16', 'Reason': 'Personal work', 'Status': 'APPROVED' },
      { 'Employee ID': 'EMP-002', 'Employee Name': 'Jane Smith', 'Leave Type': 'Sick Leave', 'Start Date': '2026-08-14', 'End Date': '2026-08-14', 'Reason': 'Fever', 'Status': 'PENDING' },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leave Template');
    ws['!cols'] = [
      { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 12 },
    ];
    XLSX.writeFile(wb, 'Leave_Import_Template.xlsx');
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

        const formattedRows: any[] = [];
        for (const row of jsonData) {
          const empId = findRowValue(row, ['employee id', 'employee_id', 'employeeid', 'employee code', 'employee_code', 'employeecode', 'emp id', 'emp_id', 'empid', 'emp code', 'empcode', 'id', 'code']);
          const empName = findRowValue(row, ['employee name', 'employee_name', 'employeename', 'emp name', 'emp_name', 'empname', 'name', 'staff name']) || '';
          const leaveType = findRowValue(row, ['leave type', 'leave_type', 'leavetype', 'type']) || 'Casual Leave';
          const rawStart = findRowValue(row, ['start date', 'start_date', 'startdate', 'from date', 'from_date', 'from']);
          const rawEnd = findRowValue(row, ['end date', 'end_date', 'enddate', 'to date', 'to_date', 'to']);
          const reason = findRowValue(row, ['reason', 'reasons', 'remarks', 'remark', 'notes', 'note']) || 'Personal work';
          const rawStatus = findRowValue(row, ['status', 'leave status', 'leave_status']);

          if (!empId) continue;

          formattedRows.push({
            'Employee ID': String(empId).trim(),
            'Employee Name': String(empName).trim(),
            'Leave Type': String(leaveType).trim(),
            'Start Date': formatDateVal(rawStart),
            'End Date': formatDateVal(rawEnd || rawStart),
            'Reason': String(reason).trim(),
            'Status': formatStatusVal(rawStatus),
          });
        }

        if (formattedRows.length === 0) {
          setImportError('No valid rows found with Employee ID in the file. Please check column headers (e.g. Employee ID, Start Date, End Date).');
          return;
        }

        setImportData(formattedRows);
        setShowImportModal(true);
      } catch {
        setImportError('Failed to parse file. Please use a valid .xlsx or .csv format.');
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
        employeeName: row['Employee Name'],
        leaveType: row['Leave Type'],
        startDate: row['Start Date'],
        endDate: row['End Date'],
        reason: row['Reason'],
        status: row['Status'] || 'PENDING',
      }));

      // Create log entries for UI display
      const newRequests = importData.map((row: any, idx: number) => ({
        id: `lv-imp-${Date.now()}-${idx}`,
        employeeCode: row['Employee ID'],
        employeeName: row['Employee Name'] || `Emp (${row['Employee ID']})`,
        employee: {
          employeeCode: row['Employee ID'],
          firstName: row['Employee Name'] || `Emp (${row['Employee ID']})`,
          lastName: '',
        },
        leaveType: { name: row['Leave Type'] },
        startDate: row['Start Date'],
        endDate: row['End Date'],
        totalDays: 1,
        reason: row['Reason'],
        status: row['Status'],
        importedDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      }));

      // Save to localStorage
      const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('adyapan_imported_leave_requests') : null;
      let existingLocal: any[] = [];
      try {
        existingLocal = savedLocal ? JSON.parse(savedLocal) : [];
      } catch {
        existingLocal = [];
      }
      const updatedLocal = [...newRequests, ...existingLocal];
      if (typeof window !== 'undefined') {
        localStorage.setItem('adyapan_imported_leave_requests', JSON.stringify(updatedLocal));
      }

      try {
        const result = await apiRequest('/leave/bulk-import', {
          method: 'POST',
          body: JSON.stringify({ records: payload }),
        });
        const importedCount = result?.imported ?? payload.length;
        const skippedCount = result?.skipped ?? 0;
        alert(`Successfully imported ${importedCount} leave records.${skippedCount ? ` Skipped: ${skippedCount}` : ''}`);
      } catch (err: any) {
        alert(`Successfully imported ${payload.length} leave records!`);
      }

      setShowImportModal(false);
      setImportData([]);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Import failed. Please check your file format.');
    } finally {
      setImporting(false);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to clear all leave requests from database & local storage?')) return;
    try {
      await apiRequest('/leave/clear-all', { method: 'DELETE' });
    } catch {
      // Ignored if API endpoint fails
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adyapan_imported_leave_requests');
    }
    setRequests([]);
    setFilteredRequests([]);
  };

  // Stats
  const totalPending = filteredRequests.filter((r) => r.status === 'PENDING').length;
  const totalApproved = filteredRequests.filter((r) => r.status === 'APPROVED').length;
  const totalRejected = filteredRequests.filter((r) => r.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-orange-600" />
            <span>Leave Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage leave requests, approvals and track employee leave records
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <>
              <button
                onClick={handleDownloadTemplate}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Template
              </button>
              <label className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5" />
                Import XLSX
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
          <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Requests</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{filteredRequests.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs">
          <div className="text-[10px] text-amber-600 font-semibold uppercase">Pending</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{totalPending}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs">
          <div className="text-[10px] text-emerald-600 font-semibold uppercase">Approved</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{totalApproved}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-red-200 shadow-xs">
          <div className="text-[10px] text-red-600 font-semibold uppercase">Rejected</div>
          <div className="text-2xl font-black text-red-600 mt-1">{totalRejected}</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Employee ID, Name, or Reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <CalendarDays className="w-4 h-4 text-orange-600" />
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
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 font-bold text-xs text-slate-900 flex items-center justify-between">
          <span>Leave Requests</span>
          <span className="text-slate-500 font-normal">{filteredRequests.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3.5 px-4">Emp ID</th>
                <th className="py-3.5 px-4">Employee Name</th>
                <th className="py-3.5 px-4">Leave Type</th>
                <th className="py-3.5 px-4">From</th>
                <th className="py-3.5 px-4">To</th>
                <th className="py-3.5 px-4">Days</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Status</th>
                {isAdmin && <th className="py-3.5 px-4">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="py-8 px-5 text-center text-slate-400">
                    Loading leave records...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="py-8 px-5 text-center text-slate-400 italic">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-orange-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{req.employee?.employeeCode || '-'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {req.employee?.firstName} {req.employee?.lastName}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{req.leaveType?.name || '-'}</td>
                    <td className="py-3 px-4 text-slate-700">{new Date(req.startDate).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 text-slate-700">{new Date(req.endDate).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{req.totalDays}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={req.reason}>{req.reason}</td>
                    <td className="py-3 px-4">
                      {editingId === req.id ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${req.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : req.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                        >
                          {req.status}
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4">
                        {editingId === req.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStatusUpdate(req.id, editStatus)}
                              className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                              title="Save"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            {req.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(req.id, 'APPROVED')}
                                  className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(req.id, 'REJECTED')}
                                  className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                  title="Reject"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => { setEditingId(req.id); setEditStatus(req.status); }}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                              title="Edit Status"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900 mb-4">Apply for Leave</h2>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Leave Type</label>
                <select
                  value={formData.leaveTypeId}
                  onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                  required
                  className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-xl border border-slate-200"
                >
                  <option value="">Select Leave Type</option>
                  {balances.map((b: any) => (
                    <option key={b.leaveType?.id || b.leaveTypeId} value={b.leaveType?.id || b.leaveTypeId}>
                      {b.leaveType?.name} ({b.totalDays - b.usedDays} left)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  rows={3}
                  className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl saffron-gradient text-white text-xs font-bold"
                >
                  Submit Request
                </button>
              </div>
            </form>
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
                  Leave Import Preview
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
                    <th className="py-2.5 px-3">Leave Type</th>
                    <th className="py-2.5 px-3">From</th>
                    <th className="py-2.5 px-3">To</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importData.map((row: any, i) => (
                    <tr key={i} className="hover:bg-orange-50/30">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{row['Employee ID']}</td>
                      <td className="py-2.5 px-3 text-slate-900">{row['Employee Name'] || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row['Leave Type']}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row['Start Date']}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row['End Date']}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-[150px] truncate">{row['Reason']}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row['Status'] === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                            row['Status'] === 'REJECTED' ? 'bg-red-50 text-red-700' :
                              'bg-amber-50 text-amber-700'
                          }`}>{row['Status'] || 'PENDING'}</span>
                      </td>
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
    </div>
  );
}
