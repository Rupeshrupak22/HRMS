'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  UserMinus,
  Plus,
  X,
  Pencil,
  Trash2,
  Search,
  Download,
  Upload,
  AlertOctagon,
  Users,
  RotateCw,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { aravindApi } from '@/lib/aravind-api';
import { Pagination } from '@/components/Pagination';

interface AbscondRecord {
  id?: string;
  _id?: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  manager: string;
}

function findRowValue(row: Record<string, any>, aliases: string[]): any {
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
}

export default function AbscondPage() {
  const [records, setRecords] = useState<AbscondRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Omit<AbscondRecord, 'id' | '_id'>>({
    employeeId: '',
    name: '',
    department: '',
    designation: '',
    manager: '',
  });

  const loadData = async () => {
    try {
      const data = await aravindApi.getAbscond();
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      setRecords([]);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adyapan_aravind_abscond');
    }
    loadData();
  }, []);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Emp ID': 'ADP0123',
        'Name': 'Suresh Raina',
        'Department': 'Sales',
        'Designation': 'Business Development Executive',
        'Manager': 'Aravind (Exit Specialist)',
      },
      {
        'Emp ID': 'ADP0456',
        'Name': 'Kavita Verma',
        'Department': 'Operation',
        'Designation': 'Operations Associate',
        'Manager': 'Nandini (HR Manager)',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Abscond Cases');
    XLSX.writeFile(wb, 'Abscond_Cases_Template.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!jsonData || jsonData.length === 0) {
          alert('File is empty or has no rows.');
          return;
        }

        const formatted = jsonData.map((row, idx) => ({
          employeeId: String(findRowValue(row, ['Emp ID', 'Employee ID', 'Employee Code', 'emp_id', 'ID', 'Id']) || `EMP-${Date.now().toString().slice(-4)}${idx}`).trim(),
          name: String(findRowValue(row, ['Name', 'Employee Name', 'Candidate Name', 'name', 'Employee']) || '').trim(),
          department: String(findRowValue(row, ['Department', 'Dept', 'department', 'DEPT']) || 'Sales').trim(),
          designation: String(findRowValue(row, ['Designation', 'Role', 'Position', 'designation']) || 'Executive').trim(),
          manager: String(findRowValue(row, ['Manager', 'Reporting Manager', 'manager', 'Manager Name']) || 'Aravind (Exit Specialist)').trim(),
        })).filter(r => r.name || r.employeeId);

        if (formatted.length === 0) {
          alert('No valid records found in uploaded file.');
          return;
        }

        setImportData(formatted);
        setShowImportModal(true);
      } catch {
        alert('Failed to parse Excel file. Please upload a valid .xlsx or .csv file.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      let count = 0;
      for (const item of importData) {
        try {
          await aravindApi.createAbscond(item);
          count++;
        } catch (err) {
          console.error('Failed to import item:', item, err);
        }
      }
      await loadData();
      setShowImportModal(false);
      setImportData([]);
      alert(`Successfully saved ${count} abscond case(s) directly to Database!`);
    } catch {
      await loadData();
      alert('Import completed.');
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setForm({
      employeeId: '',
      name: '',
      department: '',
      designation: '',
      manager: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (record: AbscondRecord) => {
    const { id, _id, ...rest } = record;
    setForm({
      employeeId: rest.employeeId || '',
      name: rest.name || '',
      department: rest.department || '',
      designation: rest.designation || '',
      manager: rest.manager || '',
    });
    setEditingId(id || _id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this abscond case?')) return;
    try {
      await aravindApi.deleteAbscond(id);
    } catch (e: any) {
      console.error('Delete error:', e);
    }
    await loadData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await aravindApi.updateAbscond(editingId, form);
      } else {
        await aravindApi.createAbscond(form);
      }
      await loadData();
    } catch (e: any) {
      console.error('Save error:', e);
    }
    resetForm();
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = ['Emp ID', 'Name', 'Department', 'Designation', 'Manager'];

    const rows = filteredRecords.map((r) => [
      `"${r.employeeId || ''}"`,
      `"${r.name || ''}"`,
      `"${r.department || ''}"`,
      `"${r.designation || ''}"`,
      `"${r.manager || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abscond_cases_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      return (
        (r.name || '').toLowerCase().includes(q) ||
        (r.employeeId || '').toLowerCase().includes(q) ||
        (r.department || '').toLowerCase().includes(q) ||
        (r.designation || '').toLowerCase().includes(q) ||
        (r.manager || '').toLowerCase().includes(q)
      );
    });
  }, [records, searchTerm]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, page]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserMinus className="w-5 h-5 text-rose-500" />
            <span>Abscond Tracker</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track and manage absconded employee records and manager assignments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, department, manager..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs min-w-[240px]"
            />
          </div>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-xs cursor-pointer"
            title="Refresh List"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-xs cursor-pointer" title="Import XLSX / CSV">
            <Upload className="w-3.5 h-3.5 text-rose-500" />
            <span>Import XLSX/CSV</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={handleDownloadTemplate}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-xs cursor-pointer"
            title="Download Excel Template"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          </button>

          <button
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Abscond Case'}
          </button>
        </div>
      </div>

      {/* Form Drawer / Modal */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-500" />
            <span>{editingId ? 'Edit Abscond Case' : 'New Abscond Case Record'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Emp ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Emp ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. ADP0123"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>

            {/* 2. Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Name *</label>
              <input
                type="text"
                required
                placeholder="Employee full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* 3. Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Department *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sales / Tech / HR"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* 4. Designation */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Designation *</label>
              <input
                type="text"
                required
                placeholder="e.g. Inside Sales Specialist"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* 5. Manager */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Manager *</label>
              <input
                type="text"
                required
                placeholder="e.g. Nandini / Vikram Sharma"
                value={form.manager}
                onChange={(e) => setForm({ ...form, manager: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              {editingId ? 'Update Record' : 'Save Record'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Main Table - Exactly 5 Fields */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-bold text-slate-600">Emp ID</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Name</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Department</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Designation</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Manager</th>
                <th className="px-4 py-3 text-center font-bold text-slate-600 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No abscond records found. Click &quot;Add Abscond Case&quot; to add a record.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr key={r.id || r._id} className="border-b border-slate-100 hover:bg-rose-50/30">
                    <td className="px-4 py-3 font-mono font-bold text-rose-700">{r.employeeId}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.name}</td>
                    <td className="px-4 py-3 text-slate-700">{r.department}</td>
                    <td className="px-4 py-3 text-slate-700">{r.designation}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{r.manager}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEdit(r)}
                          className="p-1.5 rounded-lg hover:bg-orange-100 text-orange-600 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id || r._id || '')}
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

      {/* Import Preview Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Preview Imported Abscond Cases</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Found {importData.length} records ready to import directly into Database
                </p>
              </div>
              <button
                onClick={() => { setShowImportModal(false); setImportData([]); }}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 border border-slate-100 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">Emp ID</th>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Department</th>
                    <th className="px-4 py-2.5">Designation</th>
                    <th className="px-4 py-2.5">Manager</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importData.slice(0, 15).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-mono font-bold text-rose-700">{row.employeeId}</td>
                      <td className="px-4 py-2 font-semibold text-slate-800">{row.name}</td>
                      <td className="px-4 py-2 text-slate-600">{row.department}</td>
                      <td className="px-4 py-2 text-slate-600">{row.designation}</td>
                      <td className="px-4 py-2 font-medium text-slate-700">{row.manager}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importData.length > 15 && (
                <div className="p-3 bg-slate-50 text-center text-xs text-slate-500 font-medium">
                  ...and {importData.length - 15} more records
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowImportModal(false); setImportData([]); }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {importing ? 'Importing...' : `Confirm & Save ${importData.length} Cases`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
