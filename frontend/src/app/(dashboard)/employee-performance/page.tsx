'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, X, Pencil, Trash2, TrendingUp, Search, Download, Upload, Calendar } from 'lucide-react';
import { nitishaApi } from '@/lib/nitisha-api';
import { Pagination } from '@/components/Pagination';
import * as XLSX from 'xlsx';

export default function EmployeePerformancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    nitishaApi.getPerformances().then(setRecords).catch(() => {});
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
      // Month filter - use performanceMonth field (the month when data was assigned)
      // Records without performanceMonth are shown in all months
      let matchesMonth = true;
      if (selectedMonth) {
        const recMonth = r.performanceMonth || '';
        matchesMonth = recMonth === selectedMonth || recMonth === '';
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
    // who have records in OTHER months but not specifically in this month
    if (selectedMonth && !selectedDate) {
      // Employees who already have a record with this specific month OR have no month set (shown in all)
      const existingEmpIds = new Set(
        monthRecords
          .filter(r => (r.performanceMonth === selectedMonth) || !r.performanceMonth)
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

      // Add skeleton rows for missing employees
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
      monthPerformance: '', performanceMonth: '',
      reasonForPip: '', performanceGap: '', currentPerformance: '', improvementAction: '',
      managerRemark: '', finalRemark: '',
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
      pipCase: rest.pipCase || '',
      furtherActions: rest.furtherActions || '',
      monthPerformance: rest.monthPerformance || '',
      performanceMonth: rest.performanceMonth || '',
      reasonForPip: rest.reasonForPip || '',
      performanceGap: rest.performanceGap || '',
      currentPerformance: rest.currentPerformance || '',
      improvementAction: rest.improvementAction || '',
      managerRemark: rest.managerRemark || '',
      finalRemark: rest.finalRemark || '',
    });
    setEditingId(record._isPlaceholder ? null : (id || _id));
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
      // Only Sales gets dailyRevenue
      dailyRevenue: form.department === 'Sales' ? form.dailyRevenue : '',
      // Sales and Operation get weekly and monthly revenue
      weeklyRevenue: form.department === 'Sales' || form.department === 'Operation' ? form.weeklyRevenue : '',
      monthlyRevenue: form.department === 'Sales' || form.department === 'Operation' ? form.monthlyRevenue : '',
      // Track which month this performance belongs to
      performanceMonth: form.performanceMonth || selectedMonth || '',
    };
    if (editingId) {
      let updated: any = { id: editingId, ...payload };
      try {
        updated = await nitishaApi.updatePerformance(editingId, payload);
      } catch {}
      setRecords(records.map((r) => (r.id || r._id) === editingId ? { ...r, ...updated, ...payload } : r));
    } else {
      let created: any = { id: `perf-${Date.now()}`, ...payload };
      try {
        created = await nitishaApi.createPerformance(payload);
      } catch {}
      setRecords([created, ...records]);
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
            reasonForPip: '', performanceGap: '', currentPerformance: '',
            improvementAction: '', managerRemark: '', finalRemark: '',
          };
          try {
            const created = await nitishaApi.createPerformance(payload);
            setRecords(prev => [created, ...prev]);
          } catch {}
        }
      } catch {
        alert('Failed to parse file. Please use the template format.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span>Employee Performance & Discipline</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track KPIs, performance reviews, PIP cases, and disciplinary actions
            </p>
          </div>
          <button
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Performance Record'}
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search performance..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs w-48"
            />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">MONTH:</span>
            <select
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setSelectedDate(''); setPage(1); }}
              className="border-none outline-none text-xs font-semibold text-slate-700 bg-transparent cursor-pointer"
            >
              <option value="">All Months</option>
              <option value="2026-01">January 2026</option>
              <option value="2026-02">February 2026</option>
              <option value="2026-03">March 2026</option>
              <option value="2026-04">April 2026</option>
              <option value="2026-05">May 2026</option>
              <option value="2026-06">June 2026</option>
              <option value="2026-07">July 2026</option>
              <option value="2026-08">August 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-10">October 2026</option>
              <option value="2026-11">November 2026</option>
              <option value="2026-12">December 2026</option>
              <option value="2025-01">January 2025</option>
              <option value="2025-02">February 2025</option>
              <option value="2025-03">March 2025</option>
              <option value="2025-04">April 2025</option>
              <option value="2025-05">May 2025</option>
              <option value="2025-06">June 2025</option>
              <option value="2025-07">July 2025</option>
              <option value="2025-08">August 2025</option>
              <option value="2025-09">September 2025</option>
              <option value="2025-10">October 2025</option>
              <option value="2025-11">November 2025</option>
              <option value="2025-12">December 2025</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">DATE:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
              className="border-none outline-none text-xs font-semibold text-slate-700 bg-transparent cursor-pointer"
            />
            {selectedDate && (
              <button onClick={() => setSelectedDate('')} className="text-slate-400 hover:text-red-500 ml-1 cursor-pointer"><X className="w-3 h-3" /></button>
            )}
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Template
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Import
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

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
              <label className="block text-xs font-semibold text-slate-600 mb-1">Further Actions *</label>
              <input
                type="text"
                required
                placeholder="e.g. Warning letter issued / Mentorship"
                value={form.furtherActions}
                onChange={(e) => setForm({ ...form, furtherActions: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Performance Month <span className="text-slate-400 font-normal">(Select month for this record)</span></label>
              <select
                value={form.performanceMonth || ''}
                onChange={(e) => setForm({ ...form, performanceMonth: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="">-- Select Month --</option>
                <option value="2026-01">January 2026</option>
                <option value="2026-02">February 2026</option>
                <option value="2026-03">March 2026</option>
                <option value="2026-04">April 2026</option>
                <option value="2026-05">May 2026</option>
                <option value="2026-06">June 2026</option>
                <option value="2026-07">July 2026</option>
                <option value="2026-08">August 2026</option>
                <option value="2026-09">September 2026</option>
                <option value="2026-10">October 2026</option>
                <option value="2026-11">November 2026</option>
                <option value="2026-12">December 2026</option>
                <option value="2025-01">January 2025</option>
                <option value="2025-02">February 2025</option>
                <option value="2025-03">March 2025</option>
                <option value="2025-04">April 2025</option>
                <option value="2025-05">May 2025</option>
                <option value="2025-06">June 2025</option>
                <option value="2025-07">July 2025</option>
                <option value="2025-08">August 2025</option>
                <option value="2025-09">September 2025</option>
                <option value="2025-10">October 2025</option>
                <option value="2025-11">November 2025</option>
                <option value="2025-12">December 2025</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Month Performance <span className="text-slate-400 font-normal">(Optional)</span></label>
              <input
                type="text"
                placeholder="e.g. Good, Average, Below Average"
                value={form.monthPerformance}
                onChange={(e) => setForm({ ...form, monthPerformance: e.target.value })}
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
                <th className="px-4 py-3 text-left font-bold text-slate-600">Month Performance</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Further Actions</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-8 text-center text-slate-400">
                    No performance records found. Click &quot;Add Performance Record&quot; to create one.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, idx) => (
                  <tr key={r.id || r._id || `placeholder-${r.employeeId}-${idx}`} className={`border-b border-slate-100 ${r._isPlaceholder ? 'bg-slate-50/50' : 'hover:bg-orange-50/30'}`}>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.employeeName}</td>
                    <td className="px-4 py-3 text-slate-700">{r.employeeId}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.department === 'Sales' ? 'bg-blue-100 text-blue-700' :
                        r.department === 'Tech' ? 'bg-purple-100 text-purple-700' :
                        r.department === 'Operation' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {r.department || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.designation}</td>
                    <td className="px-4 py-3 text-slate-700">{r.kpi}</td>
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
                    <td className="px-4 py-3 text-slate-700 max-w-[150px] truncate" title={r.furtherActions}>{r.furtherActions || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3">
                      {r._isPlaceholder ? (
                        <button onClick={() => handleEdit(r)} className="px-2 py-1 rounded-lg bg-orange-100 text-orange-700 text-[10px] font-bold hover:bg-orange-200 transition-colors cursor-pointer">
                          Fill Data
                        </button>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-orange-100 text-orange-600 transition-colors cursor-pointer" title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(r.id || r._id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors cursor-pointer" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
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
