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
  AlertOctagon,
  Users,
} from 'lucide-react';
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

export default function AbscondPage() {
  const [records, setRecords] = useState<AbscondRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [form, setForm] = useState<Omit<AbscondRecord, 'id' | '_id'>>({
    employeeId: '',
    name: '',
    department: '',
    designation: '',
    manager: '',
  });

  const saveLocalRecords = (list: AbscondRecord[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adyapan_aravind_abscond', JSON.stringify(list));
    }
  };

  const loadData = async () => {
    try {
      const data = await aravindApi.getAbscond();
      const list = Array.isArray(data) ? data : [];
      const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('adyapan_aravind_abscond') : null;
      let localList: any[] = [];
      try { localList = savedLocal ? JSON.parse(savedLocal) : []; } catch { localList = []; }

      const existingIds = new Set(list.map((r: any) => r.id || r._id || r.employeeId));
      const uniqueLocal = localList.filter((r: any) => !existingIds.has(r.id || r._id || r.employeeId));
      const combined = [...list, ...uniqueLocal];
      setRecords(combined);
    } catch {
      const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('adyapan_aravind_abscond') : null;
      let localList: any[] = [];
      try { localList = savedLocal ? JSON.parse(savedLocal) : []; } catch { localList = []; }
      setRecords(localList);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    } catch {}
    const newTotal = records.filter((r) => (r.id || r._id) !== id);
    setRecords(newTotal);
    saveLocalRecords(newTotal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      let updated: any = { id: editingId, ...form };
      try {
        updated = await aravindApi.updateAbscond(editingId, form);
      } catch {}
      const newTotal = records.map((r) => ((r.id || r._id) === editingId ? { ...r, ...updated, ...form } : r));
      setRecords(newTotal);
      saveLocalRecords(newTotal);
    } else {
      let created: any = { id: `abs-${Date.now()}`, ...form };
      try {
        created = await aravindApi.createAbscond(form);
      } catch {}
      const newTotal = [created, ...records];
      setRecords(newTotal);
      saveLocalRecords(newTotal);
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
              className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs min-w-[260px]"
            />
          </div>

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
    </div>
  );
}
