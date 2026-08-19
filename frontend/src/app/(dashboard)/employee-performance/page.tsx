'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, X, Pencil, Trash2, TrendingUp, Search, Download, Upload, Calendar, History, CheckCircle2, AlertCircle } from 'lucide-react';
import { nitishaApi } from '@/lib/nitisha-api';
import { Pagination } from '@/components/Pagination';
import * as XLSX from 'xlsx';

const MONTHS_2026 = [
  { value: '2026-01', label: 'January 2026' },
  { value: '2026-02', label: 'February 2026' },
  { value: '2026-03', label: 'March 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-05', label: 'May 2026' },
  { value: '2026-06', label: 'June 2026' },
  { value: '2026-07', label: 'July 2026' },
  { value: '2026-08', label: 'August 2026' },
  { value: '2026-09', label: 'September 2026' },
  { value: '2026-10', label: 'October 2026' },
  { value: '2026-11', label: 'November 2026' },
  { value: '2026-12', label: 'December 2026' },
];

export default function EmployeePerformancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyEmp, setHistoryEmp] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedDate, setSelectedDate] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    pipCase: '',
    furtherActions: '',
    monthPerformance: '',
    performanceMonth: '',
    // PIP Yes fields
    reasonForPip: '',
    performanceGap: '',
    currentPerformance: '',
    improvementAction: '',
    managerRemark: '',
    finalRemark: '',
  });

  useEffect(() => {
    nitishaApi.getPerformances().then(setRecords).catch(() => { });
  }, []);

  const filteredRecords = useMemo(() => {
    // First get records matching the selected month
    let monthRecords = records.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || (
        (r.employeeName || '').toLowerCase().includes(q) ||
        (r.employeeId || '').toLowerCase().includes(q) ||
        (r.department || '').toLowerCase().includes(q) ||
        (r.designation || '').toLowerCase().includes(q) ||
        (r.kpi || '').toLowerCase().includes(q)
      );
      // Month filter - match performanceMonth field (or fallback to createdAt month if empty)
      let matchesMonth = true;
      if (selectedMonth) {
        const recMonth = r.performanceMonth || (r.createdAt ? r.createdAt.slice(0, 7) : '');
        matchesMonth = recMonth === selectedMonth;
      }
      // Date filter
      let matchesDate = true;
      if (selectedDate && r.createdAt) {
        const recDate = r.createdAt.slice(0, 10);
        matchesDate = recDate === selectedDate;
      }
      return matchesSearch && matchesMonth && matchesDate;
    });

    // Auto-populate: if a month is selected, show skeleton rows for employees 
    // who have records in other months but not specifically in this selected month
    if (selectedMonth && !selectedDate) {
      const existingEmpIds = new Set(
        monthRecords
          .filter(r => (r.performanceMonth === selectedMonth) || (!r.performanceMonth && (!r.createdAt || r.createdAt.slice(0, 7) === selectedMonth)))
          .map(r => r.employeeId)
          .filter(Boolean)
      );

      // Get all unique employees from all records
      const allEmployees = new Map<string, any>();
      records.forEach(r => {
        if (r.employeeId && !allEmployees.has(r.employeeId)) {
          allEmployees.set(r.employeeId, {
            employeeName: r.employeeName || '',
            employeeId: r.employeeId || '',
            department: r.department || '',
            designation: r.designation || '',
            kpi: r.kpi || '',
            joiningDate: r.joiningDate || '',
          });
        }
      });

      // Add skeleton rows for missing employees in the active month
      allEmployees.forEach((emp, empId) => {
        if (!existingEmpIds.has(empId)) {
          const q = searchTerm.toLowerCase().trim();
          const matchesSearch = !q || (
            emp.employeeName.toLowerCase().includes(q) ||
            emp.employeeId.toLowerCase().includes(q) ||
            emp.department.toLowerCase().includes(q) ||
            emp.designation.toLowerCase().includes(q) ||
            emp.kpi.toLowerCase().includes(q)
          );
          if (matchesSearch) {
            monthRecords.push({
              ...emp,
              performanceMonth: selectedMonth,
              dailyPerformance: '',
              weeklyPerformance: '',
              monthlyPerformance: '',
              dailyRevenue: '',
              weeklyRevenue: '',
              monthlyRevenue: '',
              pipCase: '',
              furtherActions: '',
              monthPerformance: '',
              _isPlaceholder: true,
            });
          }
        }
      });
    }

    return monthRecords;
  }, [records, searchTerm, selectedMonth, selectedDate]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, page]);

  const resetForm = () => {
    setForm({
      employeeName: '', joiningDate: '', employeeId: '', department: '', designation: '',
      kpi: '', dailyPerformance: '', weeklyPerformance: '', monthlyPerformance: '',
      dailyRevenue: '', weeklyRevenue: '', monthlyRevenue: '', pipCase: '', furtherActions: '',
      monthPerformance: '', performanceMonth: selectedMonth,
      reasonForPip: '', performanceGap: '', currentPerformance: '', improvementAction: '',
      managerRemark: '', finalRemark: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (record: any, targetMonth?: string) => {
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
      pipCase: rest.pipCase || '',
      furtherActions: rest.furtherActions || '',
      monthPerformance: rest.monthPerformance || '',
      performanceMonth: targetMonth || rest.performanceMonth || selectedMonth,
      reasonForPip: rest.reasonForPip || '',
      performanceGap: rest.performanceGap || '',
      currentPerformance: rest.currentPerformance || '',
      improvementAction: rest.improvementAction || '',
      managerRemark: rest.managerRemark || '',
      finalRemark: rest.finalRemark || '',
    });
    setEditingId(record._isPlaceholder ? null : (id || _id));
    setShowForm(true);
    setHistoryEmp(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await nitishaApi.deletePerformance(id);
    setRecords(records.filter((r) => (r.id || r._id) !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isTechOrHR = form.department === 'Tech' || form.department === 'HR';
    const targetMonth = form.performanceMonth || selectedMonth || '';
    const payload = {
      ...form,
      dailyPerformance: isTechOrHR ? '' : form.dailyPerformance,
      weeklyPerformance: isTechOrHR ? '' : form.weeklyPerformance,
      dailyRevenue: form.department === 'Sales' ? form.dailyRevenue : '',
      weeklyRevenue: form.department === 'Sales' || form.department === 'Operation' ? form.weeklyRevenue : '',
      monthlyRevenue: form.department === 'Sales' || form.department === 'Operation' ? form.monthlyRevenue : '',
      performanceMonth: targetMonth,
    };

    // Check if a REAL database record already exists for this employee in this month
    const existingInSameMonth = !editingId && records.find(
      r => !r._isPlaceholder && (r.id || r._id) && !String(r.id || r._id).startsWith('perf-') && r.employeeId === payload.employeeId && (r.performanceMonth === targetMonth || (!r.performanceMonth && r.createdAt?.slice(0, 7) === targetMonth))
    );

    const actualEditId = (editingId && !editingId.startsWith('perf-')) ? editingId : (existingInSameMonth ? (existingInSameMonth.id || existingInSameMonth._id) : null);

    if (actualEditId) {
      let updated: any = { id: actualEditId, ...payload };
      try {
        const res = await nitishaApi.updatePerformance(actualEditId, payload);
        if (res && (res.id || res._id)) updated = res;
      } catch (e) {
        console.error('Update performance failed:', e);
      }
      setRecords(prev => prev.map((r) => (r.id || r._id) === actualEditId ? { ...r, ...updated, ...payload, _isPlaceholder: false } : r));
    } else {
      let created: any = { id: `perf-${Date.now()}`, ...payload };
      try {
        const res = await nitishaApi.createPerformance(payload);
        if (res && (res.id || res._id)) created = res;
      } catch (e) {
        console.error('Create performance failed:', e);
      }
      setRecords(prev => {
        const filtered = prev.filter(r => !(r._isPlaceholder && r.employeeId === payload.employeeId && r.performanceMonth === targetMonth));
        return [created, ...filtered];
      });
    }
    resetForm();
  };

  const isSales = form.department === 'Sales';
  const isRevenueDept = form.department === 'Sales' || form.department === 'Operation';
  const showDailyWeeklyPerf = form.department !== 'Tech' && form.department !== 'HR';

  const handleDownloadTemplate = () => {
    const headers = ['Employee Name', 'Employee ID', 'Department', 'Designation', 'KPI', 'Daily Performance', 'Weekly Performance', 'Monthly Performance', 'Daily Revenue', 'Weekly Revenue', 'Monthly Revenue', 'PIP Case', 'Further Actions'];
    const sample = ['John Doe', 'EMP-001', 'Sales', 'Team Lead', 'Revenue Target', '5 calls', '25 calls', '100 calls', '₹5,000', '₹25,000', '₹1,00,000', 'No', ''];
    const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Performance_Template');
    XLSX.writeFile(wb, `Performance_Template_${selectedMonth}.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

        for (const row of jsonData) {
          const payload = {
            employeeName: row['Employee Name'] || '',
            employeeId: row['Employee ID'] || '',
            department: row['Department'] || '',
            designation: row['Designation'] || '',
            kpi: row['KPI'] || '',
            dailyPerformance: row['Daily Performance'] || '',
            weeklyPerformance: row['Weekly Performance'] || '',
            monthlyPerformance: row['Monthly Performance'] || '',
            dailyRevenue: row['Daily Revenue'] || '',
            weeklyRevenue: row['Weekly Revenue'] || '',
            monthlyRevenue: row['Monthly Revenue'] || '',
            pipCase: row['PIP Case'] || 'No',
            furtherActions: row['Further Actions'] || '',
            joiningDate: row['Joining Date'] || '',
            performanceMonth: selectedMonth,
            reasonForPip: '', performanceGap: '', currentPerformance: '',
            improvementAction: '', managerRemark: '', finalRemark: '',
          };
          try {
            const created = await nitishaApi.createPerformance(payload);
            setRecords(prev => [created, ...prev]);
          } catch { }
        }
      } catch {
        alert('Failed to parse file. Please use the template format.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Month-wise data for employee history modal
  const employeeHistoryData = useMemo(() => {
    if (!historyEmp) return [];
    return MONTHS_2026.map(m => {
      const found = records.find(r =>
        r.employeeId === historyEmp.employeeId &&
        (r.performanceMonth === m.value || (!r.performanceMonth && r.createdAt?.slice(0, 7) === m.value))
      );
      return {
        month: m,
        record: found || null,
      };
    });
  }, [historyEmp, records]);

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span>Employee Performance & Discipline</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Month-wise KPI tracking, evaluation reviews, and PIP management for 2026
            </p>
          </div>

          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Performance Record</span>
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee, ID, dept..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 w-56"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setSelectedDate(''); setPage(1); }}
              className="border-none outline-none text-xs font-bold text-slate-800 bg-transparent cursor-pointer"
            >
              {MONTHS_2026.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
              className="border-none outline-none text-xs font-semibold text-slate-700 bg-transparent cursor-pointer"
            />
            {selectedDate && (
              <button onClick={() => setSelectedDate('')} className="text-slate-400 hover:text-red-500 ml-1 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Template
            </button>

            <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              Import
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Form (Add / Edit Popup Modal) */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {editingId ? 'Edit Performance Record' : 'New Performance Record'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Target Month: <span className="font-semibold text-orange-600">{MONTHS_2026.find(m => m.value === (form.performanceMonth || selectedMonth))?.label || selectedMonth}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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

                {/* Daily & Weekly Performance - Hidden for Tech and HR */}
                {showDailyWeeklyPerf && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Daily Performance *</label>
                      <input type="text" required value={form.dailyPerformance} onChange={(e) => setForm({ ...form, dailyPerformance: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Weekly Performance *</label>
                      <input type="text" required value={form.weeklyPerformance} onChange={(e) => setForm({ ...form, weeklyPerformance: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Performance *</label>
                  <input type="text" required value={form.monthlyPerformance} onChange={(e) => setForm({ ...form, monthlyPerformance: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>

                {/* Daily Revenue - ONLY for Sales */}
                {isSales && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Daily Revenue *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ₹10,000"
                      value={form.dailyRevenue}
                      onChange={(e) => setForm({ ...form, dailyRevenue: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}

                {/* Weekly & Monthly Revenue - For Sales and Operation */}
                {isRevenueDept && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Weekly Revenue *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ₹50,000"
                        value={form.weeklyRevenue}
                        onChange={(e) => setForm({ ...form, weeklyRevenue: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Revenue *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ₹2,00,000"
                        value={form.monthlyRevenue}
                        onChange={(e) => setForm({ ...form, monthlyRevenue: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">PIP Case *</label>
                  <select required value={form.pipCase} onChange={(e) => setForm({ ...form, pipCase: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Performance Month *</label>
                  <select
                    value={form.performanceMonth || selectedMonth}
                    onChange={(e) => setForm({ ...form, performanceMonth: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                  >
                    {MONTHS_2026.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Rating  <span className="text-slate-400 font-normal">(Grade)</span></label>
                  <input
                    type="text"
                    placeholder="e.g. 8.5/10, 6/10"
                    value={form.monthPerformance}
                    onChange={(e) => setForm({ ...form, monthPerformance: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Further Actions / Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Warning letter issued / Promoted / Mentorship"
                    value={form.furtherActions}
                    onChange={(e) => setForm({ ...form, furtherActions: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {form.pipCase === 'Yes' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-3 border-t border-slate-100 bg-red-50/50 p-3.5 rounded-xl">
                  <div>
                    <label className="block text-xs font-semibold text-red-700 mb-1">Reason for PIP *</label>
                    <input type="text" required value={form.reasonForPip} onChange={(e) => setForm({ ...form, reasonForPip: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-red-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-red-700 mb-1">Performance Gap *</label>
                    <input type="text" required value={form.performanceGap} onChange={(e) => setForm({ ...form, performanceGap: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-red-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-red-700 mb-1">Current Performance *</label>
                    <input type="text" required value={form.currentPerformance} onChange={(e) => setForm({ ...form, currentPerformance: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-red-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-red-700 mb-1">Improvement Action *</label>
                    <input type="text" required value={form.improvementAction} onChange={(e) => setForm({ ...form, improvementAction: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-red-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-red-700 mb-1">Manager Remark *</label>
                    <input type="text" required value={form.managerRemark} onChange={(e) => setForm({ ...form, managerRemark: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-red-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-red-700 mb-1">Final Remark *</label>
                    <input type="text" required value={form.finalRemark} onChange={(e) => setForm({ ...form, finalRemark: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-red-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                </div>
              )}

              {/* Sticky / Bottom Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {editingId ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              Showing Records for: <span className="text-orange-600">{MONTHS_2026.find(m => m.value === selectedMonth)?.label || selectedMonth}</span>
            </span>
            <span className="text-[11px] text-slate-400">({filteredRecords.length} employees)</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Click <strong>History</strong> to view full 12-month track record of any employee
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-bold text-slate-600">Status</th>
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
                <th className="px-4 py-3 text-left font-bold text-slate-600">Rating</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Further Actions</th>
                <th className="px-4 py-3 text-center font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-4 py-8 text-center text-slate-400">
                    No performance records found for {MONTHS_2026.find(m => m.value === selectedMonth)?.label}.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, idx) => (
                  <tr key={r.id || r._id || `placeholder-${r.employeeId}-${idx}`} className={`border-b border-slate-100 ${r._isPlaceholder ? 'bg-slate-50/40' : 'hover:bg-orange-50/30'}`}>
                    <td className="px-4 py-3">
                      {r._isPlaceholder ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-2.5 h-2.5" /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Evaluated
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.employeeName}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono text-[11px]">{r.employeeId}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.department === 'Sales' ? 'bg-blue-100 text-blue-700' :
                          r.department === 'Tech' ? 'bg-purple-100 text-purple-700' :
                            r.department === 'Operation' ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                        }`}>
                        {r.department || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.designation}</td>
                    <td className="px-4 py-3 text-slate-700">{r.kpi || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-slate-700">{r.dailyPerformance || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-slate-700">{r.weeklyPerformance || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-slate-700">{r.monthlyPerformance || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono">{r.dailyRevenue || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono">{r.weeklyRevenue || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono">{r.monthlyRevenue || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3">
                      {r.pipCase ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.pipCase === 'Yes' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {r.pipCase}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.monthPerformance || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[140px] truncate" title={r.furtherActions}>{r.furtherActions || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setHistoryEmp(r)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition cursor-pointer"
                          title="View 12-Month History"
                        >
                          <History className="w-3 h-3 text-slate-500" />
                          <span>History</span>
                        </button>

                        {r._isPlaceholder ? (
                          <button
                            onClick={() => handleEdit(r)}
                            className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold transition cursor-pointer"
                          >
                            + Fill
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(r)}
                              className="p-1 rounded-lg hover:bg-orange-100 text-orange-600 transition cursor-pointer"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(r.id || r._id)}
                              className="p-1 rounded-lg hover:bg-red-100 text-red-500 transition cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
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

      {/* Employee 12-Month History Modal */}
      {historyEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-orange-500" />
                  <span>2026 Month-Wise Performance History</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <strong className="text-slate-800">{historyEmp.employeeName}</strong> ({historyEmp.employeeId}) • {historyEmp.department} - {historyEmp.designation}
                </p>
              </div>
              <button
                onClick={() => setHistoryEmp(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="px-3 py-2 text-left">Month</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Monthly Perf</th>
                    <th className="px-3 py-2 text-left">Monthly Rev</th>
                    <th className="px-3 py-2 text-left">PIP</th>
                    <th className="px-3 py-2 text-left">Rating</th>
                    <th className="px-3 py-2 text-left">Remarks</th>
                    <th className="px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employeeHistoryData.map(({ month, record }) => (
                    <tr key={month.value} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-bold text-slate-800">{month.label}</td>
                      <td className="px-3 py-2.5">
                        {record ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Evaluated
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                            No Data
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{record?.monthlyPerformance || '—'}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-700">{record?.monthlyRevenue || '—'}</td>
                      <td className="px-3 py-2.5">
                        {record?.pipCase ? (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${record.pipCase === 'Yes' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {record.pipCase}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{record?.monthPerformance || '—'}</td>
                      <td className="px-3 py-2.5 text-slate-600 max-w-[200px] truncate" title={record?.furtherActions || ''}>
                        {record?.furtherActions || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {record ? (
                          <button
                            onClick={() => handleEdit(record, month.value)}
                            className="px-2.5 py-1 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 text-[10px] font-bold transition cursor-pointer"
                          >
                            Edit
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEdit({ ...historyEmp, _isPlaceholder: true }, month.value)}
                            className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold transition cursor-pointer"
                          >
                            + Fill {month.label.split(' ')[0]}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setHistoryEmp(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
