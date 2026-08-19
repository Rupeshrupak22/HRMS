'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, X, Pencil, Trash2, TrendingUp, Search, Download, Upload, Loader2, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { nitishaApi } from '@/lib/nitisha-api';
import { Pagination } from '@/components/Pagination';

function parseRecordDate(record: any): { fullDate: string; yyyyMm: string } {
  // Extract date from entry/import timestamp or explicit record date (NOT joining date)
  const candidateDates = [
    record.entryDate,
    record.date,
    record.recordDate,
    record.importDate,
    record.createdAt,
    record.updatedAt,
  ];

  for (const raw of candidateDates) {
    if (!raw) continue;
    const str = String(raw).trim();
    if (!str || str === '-') continue;

    // ISO String e.g. 2026-08-19T10:15:30.000Z
    if (str.includes('T') && str.length >= 10) {
      const yyyy = str.slice(0, 4);
      const mm = str.slice(5, 7);
      const dd = str.slice(8, 10);
      return { fullDate: `${yyyy}-${mm}-${dd}`, yyyyMm: `${yyyy}-${mm}` };
    }

    // YYYY-MM-DD
    const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (ymd) {
      const yyyy = ymd[1];
      const mm = ymd[2].padStart(2, '0');
      const dd = ymd[3].padStart(2, '0');
      return { fullDate: `${yyyy}-${mm}-${dd}`, yyyyMm: `${yyyy}-${mm}` };
    }

    // DD-MM-YYYY
    const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (dmy) {
      const dd = dmy[1].padStart(2, '0');
      const mm = dmy[2].padStart(2, '0');
      let yyyy = dmy[3];
      if (yyyy.length === 2) yyyy = '20' + yyyy;
      return { fullDate: `${yyyy}-${mm}-${dd}`, yyyyMm: `${yyyy}-${mm}` };
    }

    // YYYY-MM
    const ym = str.match(/^(\d{4})[\/\-](\d{1,2})$/);
    if (ym) {
      const yyyy = ym[1];
      const mm = ym[2].padStart(2, '0');
      return { fullDate: `${yyyy}-${mm}-01`, yyyyMm: `${yyyy}-${mm}` };
    }
  }

  // Fallback to today's date if brand new unsaved record
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return { fullDate: `${yyyy}-${mm}-${dd}`, yyyyMm: `${yyyy}-${mm}` };
}

function formatDisplayDate(val: any): string {
  if (!val) return '—';
  const str = String(val).trim();
  if (!str || str === '-') return '—';
  if (str.includes('T')) {
    const [d] = str.split('T');
    return d;
  }
  return str;
}

export default function EmployeePerformancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [form, setForm] = useState({
    employeeName: '',
    joiningDate: '',
    employeeId: '',
    department: '',
    designation: '',
    kpi: '',
    dailyPerformance: '',
    weeklyPerformance: '',
    monthlyPerformance: '',
    dailyRevenue: '',
    weeklyRevenue: '',
    monthlyRevenue: '',
    pipCase: 'No',
    furtherActions: '',
    reasonForPip: '',
    performanceGap: '',
    currentPerformance: '',
    improvementAction: '',
    managerRemark: '',
    finalRemark: '',
  });

  const loadData = () => {
    setLoading(true);
    nitishaApi
      .getPerformances()
      .then((data) => {
        if (Array.isArray(data)) setRecords(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter based on Added/Imported Date (createdAt / entryDate) and Search
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (r.employeeName || '').toLowerCase().includes(q) ||
        (r.employeeId || '').toLowerCase().includes(q) ||
        (r.department || '').toLowerCase().includes(q) ||
        (r.designation || '').toLowerCase().includes(q) ||
        (r.kpi || '').toLowerCase().includes(q) ||
        (r.managerRemark || '').toLowerCase().includes(q);

      const parsed = parseRecordDate(r);

      // Month filter based on add/import date
      let matchesMonth = true;
      if (selectedMonth) {
        matchesMonth = parsed.yyyyMm === selectedMonth;
      }

      // Daywise date filter based on add/import date
      let matchesDay = true;
      if (filterDate) {
        matchesDay = parsed.fullDate === filterDate;
      }

      return matchesSearch && matchesMonth && matchesDay;
    });
  }, [records, searchTerm, selectedMonth, filterDate]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedMonth, filterDate]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, page]);

  const resetForm = () => {
    setForm({
      employeeName: '',
      joiningDate: '',
      employeeId: '',
      department: '',
      designation: '',
      kpi: '',
      dailyPerformance: '',
      weeklyPerformance: '',
      monthlyPerformance: '',
      dailyRevenue: '',
      weeklyRevenue: '',
      monthlyRevenue: '',
      pipCase: 'No',
      furtherActions: '',
      reasonForPip: '',
      performanceGap: '',
      currentPerformance: '',
      improvementAction: '',
      managerRemark: '',
      finalRemark: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (record: any) => {
    const { id, _id, ...rest } = record;
    setForm({
      employeeName: rest.employeeName || '',
      joiningDate: rest.joiningDate || '',
      employeeId: rest.employeeId || '',
      department: rest.department || '',
      designation: rest.designation || '',
      kpi: rest.kpi || '',
      dailyPerformance: rest.dailyPerformance || '',
      weeklyPerformance: rest.weeklyPerformance || '',
      monthlyPerformance: rest.monthlyPerformance || '',
      dailyRevenue: rest.dailyRevenue || '',
      weeklyRevenue: rest.weeklyRevenue || '',
      monthlyRevenue: rest.monthlyRevenue || '',
      pipCase: rest.pipCase || 'No',
      furtherActions: rest.furtherActions || '',
      reasonForPip: rest.reasonForPip || '',
      performanceGap: rest.performanceGap || '',
      currentPerformance: rest.currentPerformance || '',
      improvementAction: rest.improvementAction || '',
      managerRemark: rest.managerRemark || '',
      finalRemark: rest.finalRemark || '',
    });
    setEditingId(id || _id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await nitishaApi.deletePerformance(id);
    setRecords(records.filter((r) => (r.id || r._id) !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isTechOrHR = form.department === 'Tech' || form.department === 'HR';
    const payload = {
      ...form,
      dailyPerformance: isTechOrHR ? '' : form.dailyPerformance,
      weeklyPerformance: isTechOrHR ? '' : form.weeklyPerformance,
      dailyRevenue: form.department === 'Sales' ? form.dailyRevenue : '',
      weeklyRevenue: form.department === 'Sales' || form.department === 'Operation' ? form.weeklyRevenue : '',
      monthlyRevenue: form.department === 'Sales' || form.department === 'Operation' ? form.monthlyRevenue : '',
    };
    if (editingId) {
      let updated: any = { id: editingId, ...payload };
      try {
        updated = await nitishaApi.updatePerformance(editingId, payload);
      } catch {}
      setRecords(records.map((r) => ((r.id || r._id) === editingId ? { ...r, ...updated, ...payload } : r)));
    } else {
      let created: any = { id: `perf-${Date.now()}`, ...payload, createdAt: new Date().toISOString() };
      try {
        created = await nitishaApi.createPerformance(payload);
      } catch {}
      setRecords([created, ...records]);
    }
    resetForm();
  };

  // Demo Template Download
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Employee ID': 'EMP001',
        'Employee Name': 'Aakash Verma',
        'Joining Date': '15-08-2024',
        'Department': 'Sales',
        'Designation': 'Sales Executive',
        'KPI': '92%',
        'Daily Performance': 'Good',
        'Weekly Performance': 'Exceeded Targets',
        'Monthly Performance': 'Target Met',
        'Daily Revenue': '15000',
        'Weekly Revenue': '75000',
        'Monthly Revenue': '300000',
        'PIP Case': 'No',
        'Further Actions': 'None',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Performance');
    XLSX.writeFile(wb, `Employee_Performance_Template_${selectedMonth || '2026-08'}.xlsx`);
  };

  // Excel / CSV Import (uses upload date as createdAt in DB)
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rows.length > 0) {
          const formatted = rows
            .map((row) => ({
              employeeId: String(row['Employee ID'] || row['Emp ID'] || row['employeeId'] || '').trim(),
              employeeName: String(row['Employee Name'] || row['Name'] || row['employeeName'] || '').trim(),
              joiningDate: String(row['Joining Date'] || row['DOJ'] || row['joiningDate'] || '').trim(),
              department: String(row['Department'] || row['department'] || 'Sales').trim(),
              designation: String(row['Designation'] || row['designation'] || '').trim(),
              kpi: String(row['KPI'] || row['kpi'] || '').trim(),
              dailyPerformance: String(row['Daily Performance'] || row['dailyPerformance'] || '').trim(),
              weeklyPerformance: String(row['Weekly Performance'] || row['weeklyPerformance'] || '').trim(),
              monthlyPerformance: String(row['Monthly Performance'] || row['monthlyPerformance'] || '').trim(),
              dailyRevenue: String(row['Daily Revenue'] || row['dailyRevenue'] || '').trim(),
              weeklyRevenue: String(row['Weekly Revenue'] || row['weeklyRevenue'] || '').trim(),
              monthlyRevenue: String(row['Monthly Revenue'] || row['monthlyRevenue'] || '').trim(),
              pipCase: String(row['PIP Case'] || row['PIP'] || row['pipCase'] || 'No').trim(),
              furtherActions: String(row['Further Actions'] || row['furtherActions'] || '').trim(),
            }))
            .filter((r) => r.employeeName || r.employeeId);

          if (formatted.length > 0) {
            await nitishaApi.createPerformanceBulk(formatted);
            loadData();
            alert(`Successfully imported ${formatted.length} record(s)!`);
          }
        }
      } catch (err) {
        console.error('Import error:', err);
        alert('Failed to import file.');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const isSales = form.department === 'Sales';
  const isRevenueDept = form.department === 'Sales' || form.department === 'Operation';
  const showDailyWeeklyPerf = form.department !== 'Tech' && form.department !== 'HR';

  return (
    <div className="space-y-6">
      {/* Header with Search, Month & Date Pickers */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span>Employee Performance &amp; Discipline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track KPIs, performance reviews, PIP cases, and disciplinary actions
          </p>
        </div>

        {/* Responsive Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search performance..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs w-48 sm:w-56"
            />
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            />
            {selectedMonth && (
              <button
                onClick={() => {
                  setSelectedMonth('');
                  setPage(1);
                }}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold ml-0.5 cursor-pointer"
                title="Clear Month Filter"
              >
                ✕
              </button>
            )}
          </div>

          {/* Daywise Date Filter */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Date:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            />
            {filterDate && (
              <button
                onClick={() => {
                  setFilterDate('');
                  setPage(1);
                }}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold ml-0.5 cursor-pointer"
                title="Clear Date Filter"
              >
                ✕
              </button>
            )}
          </div>

          {/* Template Download */}
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Template</span>
          </button>

          {/* Import XLSX */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-orange-600" />}
            <span>Import</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          {/* Add Record */}
          <button
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Performance Record'}
          </button>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Performance Record' : 'New Performance Record'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Name *</label>
              <input type="text" required value={form.employeeName} onChange={(e) => setForm({ ...form, employeeName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Joining Date *</label>
              <input type="date" required value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee ID *</label>
              <input type="text" required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Department *</label>
              <select
                required
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="">Select Department</option>
                <option value="Sales">Sales</option>
                <option value="Tech">Tech</option>
                <option value="Operation">Operation</option>
                <option value="HR">HR</option>
                <option value="Academic">Academic</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Designation *</label>
              <input type="text" required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">KPI *</label>
              <input type="text" required value={form.kpi} onChange={(e) => setForm({ ...form, kpi: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            {showDailyWeeklyPerf && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Daily Performance</label>
                  <input type="text" value={form.dailyPerformance} onChange={(e) => setForm({ ...form, dailyPerformance: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Weekly Performance</label>
                  <input type="text" value={form.weeklyPerformance} onChange={(e) => setForm({ ...form, weeklyPerformance: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Performance *</label>
              <input type="text" required value={form.monthlyPerformance} onChange={(e) => setForm({ ...form, monthlyPerformance: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            {isSales && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Daily Revenue</label>
                <input type="text" value={form.dailyRevenue} onChange={(e) => setForm({ ...form, dailyRevenue: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            )}

            {isRevenueDept && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Weekly Revenue</label>
                  <input type="text" value={form.weeklyRevenue} onChange={(e) => setForm({ ...form, weeklyRevenue: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Revenue</label>
                  <input type="text" value={form.monthlyRevenue} onChange={(e) => setForm({ ...form, monthlyRevenue: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">PIP Case *</label>
              <select
                required
                value={form.pipCase}
                onChange={(e) => setForm({ ...form, pipCase: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Further Actions</label>
              <input
                type="text"
                value={form.furtherActions}
                onChange={(e) => setForm({ ...form, furtherActions: e.target.value })}
                placeholder="Disciplinary action, warning letter, counseling notes, etc."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {form.pipCase === 'Yes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for PIP *</label>
                <input type="text" required value={form.reasonForPip} onChange={(e) => setForm({ ...form, reasonForPip: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Performance Gap *</label>
                <input type="text" required value={form.performanceGap} onChange={(e) => setForm({ ...form, performanceGap: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Current Performance *</label>
                <input type="text" required value={form.currentPerformance} onChange={(e) => setForm({ ...form, currentPerformance: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Improvement Action *</label>
                <input type="text" required value={form.improvementAction} onChange={(e) => setForm({ ...form, improvementAction: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Manager Remark *</label>
                <input type="text" required value={form.managerRemark} onChange={(e) => setForm({ ...form, managerRemark: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Final Remark *</label>
                <input type="text" required value={form.finalRemark} onChange={(e) => setForm({ ...form, finalRemark: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
          )}

          <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer">
            {editingId ? 'Update Performance Record' : 'Save Performance Record'}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-bold text-slate-600">Employee Name</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Emp ID</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Department</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Designation</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">KPI</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Daily</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Weekly</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Monthly</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Daily Rev</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Weekly Rev</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Monthly Rev</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">PIP</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Date Added</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-slate-400">
                    No performance records found for {selectedMonth || 'selected filters'}. Click &quot;Add Performance Record&quot; to create one.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr key={r.id || r._id} className="border-b border-slate-100 hover:bg-orange-50/30">
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.employeeName}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono font-bold text-[11px]">{r.employeeId}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.department === 'Sales'
                            ? 'bg-blue-100 text-blue-700'
                            : r.department === 'Tech'
                            ? 'bg-purple-100 text-purple-700'
                            : r.department === 'Operation'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {r.department || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.designation}</td>
                    <td className="px-4 py-3 text-slate-700 font-semibold">{r.kpi}</td>
                    <td className="px-4 py-3 text-slate-700">{r.dailyPerformance || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{r.weeklyPerformance || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{r.monthlyPerformance}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono">{r.dailyRevenue || '—'}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono">{r.weeklyRevenue || '—'}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono">{r.monthlyRevenue || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.pipCase === 'Yes' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {r.pipCase}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {formatDisplayDate(r.createdAt || r.entryDate || r.joiningDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(r)}
                          className="p-1.5 rounded-lg hover:bg-orange-100 text-orange-600 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id || r._id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalItems={filteredRecords.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
