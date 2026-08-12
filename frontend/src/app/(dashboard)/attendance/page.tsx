'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Clock, Play, Square, CheckCircle, Upload, Download, FileSpreadsheet, X, Search } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPavitra = user?.specialization === 'ATTENDANCE_LEAVE' || user?.email === 'pavitra@adyapan.com';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN' || user?.role === 'HR_EXECUTIVE' || isPavitra;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin ? '/attendance/all-logs' : '/attendance/my-logs';
      const data = await apiRequest(endpoint);
      setAllLogs(data);
      setLogs(data);
      if (!isAdmin && data.length > 0 && data[0].checkInTime && data[0].checkInTime !== '-' && !data[0].checkOutTime) {
        setCheckedIn(true);
        setCheckInTime(data[0].checkInTime);
      }
    } catch {
      setAllLogs([]);
      setLogs([]);
    } finally {
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
    setLogs(filtered);
  }, [searchTerm, statusFilter, allLogs]);

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

  // Download template
  const handleDownloadTemplate = () => {
    const templateData = [
      { 'Employee ID': 'EMP-001', 'Employee Name': 'John Doe', 'Date': '2026-08-12', 'Check In Time': '09:30 AM', 'Check Out Time': '06:30 PM', 'Status': 'PRESENT', 'Remarks': '' },
      { 'Employee ID': 'EMP-002', 'Employee Name': 'Jane Smith', 'Date': '2026-08-12', 'Check In Time': '09:45 AM', 'Check Out Time': '06:30 PM', 'Status': 'LATE', 'Remarks': 'Traffic' },
      { 'Employee ID': 'EMP-003', 'Employee Name': 'Ravi Kumar', 'Date': '2026-08-12', 'Check In Time': '', 'Check Out Time': '', 'Status': 'ABSENT', 'Remarks': 'Sick' },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Template');
    ws['!cols'] = [
      { wch: 14 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 20 },
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
        const wb = XLSX.read(data, { type: 'array' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        if (jsonData.length === 0) {
          setImportError('File is empty or has no valid data rows.');
          return;
        }

        const requiredHeaders = ['Employee ID', 'Date', 'Status'];
        const headers = Object.keys(jsonData[0] as object);
        const missing = requiredHeaders.filter((h) => !headers.includes(h));
        if (missing.length > 0) {
          setImportError(`Missing required columns: ${missing.join(', ')}. Download the template for correct format.`);
          return;
        }

        setImportData(jsonData);
        setShowImportModal(true);
      } catch {
        setImportError('Failed to parse file. Please use .xlsx or .csv format.');
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
        date: row['Date'],
        checkInTime: row['Check In Time'] || null,
        checkOutTime: row['Check Out Time'] || null,
        status: row['Status'] || 'PRESENT',
        remarks: row['Remarks'] || '',
      }));

      const result = await apiRequest('/attendance/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ records: payload }),
      });

      setShowImportModal(false);
      setImportData([]);
      loadLogs();
      alert(`Successfully imported ${result.imported} records. Skipped: ${result.skipped}`);
    } catch (err: any) {
      alert(err.message || 'Import failed. Please check your file format.');
    } finally {
      setImporting(false);
    }
  };

  // Stats from actual data
  const totalPresent = allLogs.filter((l) => l.status === 'PRESENT').length;
  const totalLate = allLogs.filter((l) => l.status === 'LATE').length;
  const totalAbsent = allLogs.filter((l) => l.status === 'ABSENT').length;

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

        {isAdmin && (
          <div className="flex items-center gap-2">
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
          </div>
        )}
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
          <div className="text-2xl font-black text-slate-900 mt-1">{allLogs.length}</div>
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
        <div className="flex flex-col sm:flex-row gap-3">
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="ALL">All Status</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="ABSENT">Absent</option>
          </select>
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
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Check In</th>
                <th className="py-3.5 px-5">Check Out</th>
                <th className="py-3.5 px-5">Work Hours</th>
                <th className="py-3.5 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 5} className="py-8 px-5 text-center text-slate-400">
                    Loading attendance records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 5} className="py-8 px-5 text-center text-slate-400 italic">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-orange-50/40 transition-colors">
                    {isAdmin && <td className="py-3.5 px-5 font-mono font-bold text-slate-700">{log.empId || '-'}</td>}
                    {isAdmin && <td className="py-3.5 px-5 font-semibold text-slate-900">{log.empName || '-'}</td>}
                    <td className="py-3.5 px-5 font-bold text-slate-900">{log.date}</td>
                    <td className="py-3.5 px-5 text-slate-700 font-medium">{log.checkInTime || '-'}</td>
                    <td className="py-3.5 px-5 text-slate-700 font-medium">{log.checkOutTime || '-'}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-700 font-semibold">{log.workHours ? `${log.workHours} hrs` : '-'}</td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Check In</th>
                    <th className="py-2.5 px-3">Check Out</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importData.map((row: any, i) => (
                    <tr key={i} className="hover:bg-orange-50/30">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{row['Employee ID']}</td>
                      <td className="py-2.5 px-3 text-slate-900">{row['Employee Name'] || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row['Date']}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row['Check In Time'] || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row['Check Out Time'] || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row['Status'] === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' :
                          row['Status'] === 'LATE' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>{row['Status']}</span>
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
