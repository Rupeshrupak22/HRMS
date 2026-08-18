'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UserX, Plus, X, Pencil, Trash2, Search, Download } from 'lucide-react';
import { aravindApi } from '@/lib/aravind-api';
import { Pagination } from '@/components/Pagination';

interface ResignationRecord {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  manager: string;
  dateOfResignation: string;
  reason: string;
  noticePeriod: string;
  managerConfirmation: string;
  exitInterview: string;
  exitClearance: string;
  fnf: string;
  overall: string;
  lwd: string;
}

export default function ResignationPage() {
  const [records, setRecords] = useState<ResignationRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [form, setForm] = useState<Omit<ResignationRecord, 'id'>>({
    employeeId: '', name: '', department: '', designation: '', manager: '',
    dateOfResignation: '', reason: '', noticePeriod: '', managerConfirmation: 'Confirmed',
    exitInterview: 'Pending', exitClearance: 'Pending', fnf: 'Pending', overall: 'In Progress', lwd: '',
  });

  const resetForm = () => {
    setForm({
      employeeId: '', name: '', department: '', designation: '', manager: '',
      dateOfResignation: '', reason: '', noticePeriod: '', managerConfirmation: 'Confirmed',
      exitInterview: 'Pending', exitClearance: 'Pending', fnf: 'Pending', overall: 'In Progress', lwd: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  useEffect(() => {
    aravindApi.getResignation().then((data) => setRecords(Array.isArray(data) ? data : [])).catch(() => setRecords([]));
  }, []);

  const handleEdit = (record: ResignationRecord) => {
    const { id, ...rest } = record;
    setForm(rest);
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await aravindApi.deleteResignation(id);
    setRecords(records.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = await aravindApi.updateResignation(editingId, form);
      setRecords(records.map((r) => r.id === editingId ? { ...r, ...updated, ...form } : r));
    } else {
      const created = await aravindApi.createResignation(form);
      setRecords([created, ...records]);
    }
    resetForm();
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (r.name || '').toLowerCase().includes(q) ||
        (r.employeeId || '').toLowerCase().includes(q) ||
        (r.department || '').toLowerCase().includes(q) ||
        (r.designation || '').toLowerCase().includes(q) ||
        (r.manager || '').toLowerCase().includes(q) ||
        (r.reason || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || r.overall === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, page]);

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = [
      'Emp ID',
      'Name',
      'Department',
      'Designation',
      'Manager',
      'Date of Resignation',
      'Reason',
      'Notice Period',
      'Manager Confirmation',
      'Exit Interview',
      'Exit Clearance',
      'FnF',
      'Overall',
      'LWD',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.employeeId || ''}"`,
      `"${r.name || ''}"`,
      `"${r.department || ''}"`,
      `"${r.designation || ''}"`,
      `"${r.manager || ''}"`,
      `"${r.dateOfResignation || ''}"`,
      `"${(r.reason || '').replace(/"/g, '""')}"`,
      `"${r.noticePeriod || ''}"`,
      `"${r.managerConfirmation || ''}"`,
      `"${r.exitInterview || ''}"`,
      `"${r.exitClearance || ''}"`,
      `"${r.fnf || ''}"`,
      `"${r.overall || ''}"`,
      `"${r.lwd || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resignations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserX className="w-5 h-5 text-orange-500" />
            <span>Resignation Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Process resignation notices, notice period tracking, and approvals
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search resignations..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer shadow-xs"
          >
            <option value="ALL">All Status</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>

          <button
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Resignation'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Resignation' : 'New Resignation Entry'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee ID *</label>
              <input type="text" required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Department *</label>
              <input type="text" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Designation *</label>
              <input type="text" required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Manager *</label>
              <input type="text" required value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Reason *</label>
              <input type="text" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Notice Period *</label>
              <input type="text" required value={form.noticePeriod} onChange={(e) => setForm({ ...form, noticePeriod: e.target.value })} placeholder="e.g. 30 Days" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">LWD (Last Working Day) *</label>
              <input type="date" required value={form.lwd} onChange={(e) => setForm({ ...form, lwd: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Resignation *</label>
              <input type="date" required value={form.dateOfResignation} onChange={(e) => setForm({ ...form, dateOfResignation: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Manager Confirmation *</label>
              <select required value={form.managerConfirmation} onChange={(e) => setForm({ ...form, managerConfirmation: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer">
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Exit Interview *</label>
              <select required value={form.exitInterview} onChange={(e) => setForm({ ...form, exitInterview: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer">
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Exit Clearance *</label>
              <select required value={form.exitClearance} onChange={(e) => setForm({ ...form, exitClearance: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer">
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">F&F Settlement *</label>
              <select required value={form.fnf} onChange={(e) => setForm({ ...form, fnf: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer">
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Overall Status *</label>
              <select required value={form.overall} onChange={(e) => setForm({ ...form, overall: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer">
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer">
            {editingId ? 'Update Resignation' : 'Save Resignation'}
          </button>
        </form>
      )}

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-3 text-left font-bold text-slate-600">Emp ID</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Name</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Department</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Designation</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Manager</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Date of Resignation</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Reason</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Notice Period</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Manager Confirmation</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Exit Interview</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Exit Clearance</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">F&F</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Overall</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">LWD</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-8 text-center text-slate-400">
                    No resignation records found.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-orange-50/30">
                    <td className="px-3 py-3 font-semibold text-slate-800 font-mono">{r.employeeId}</td>
                    <td className="px-3 py-3 text-slate-700 font-semibold">{r.name}</td>
                    <td className="px-3 py-3 text-slate-700">{r.department}</td>
                    <td className="px-3 py-3 text-slate-700">{r.designation}</td>
                    <td className="px-3 py-3 text-slate-700">{r.manager}</td>
                    <td className="px-3 py-3 text-slate-700">{r.dateOfResignation}</td>
                    <td className="px-3 py-3 text-slate-700">{r.reason}</td>
                    <td className="px-3 py-3 text-slate-700">{r.noticePeriod}</td>
                    <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.managerConfirmation === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.managerConfirmation}</span></td>
                    <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.exitInterview === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.exitInterview}</span></td>
                    <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.exitClearance === 'Completed' ? 'bg-green-100 text-green-700' : r.exitClearance === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{r.exitClearance}</span></td>
                    <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.fnf === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.fnf}</span></td>
                    <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.overall === 'Completed' ? 'bg-green-100 text-green-700' : r.overall === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{r.overall}</span></td>
                    <td className="px-3 py-3 text-slate-700">{r.lwd}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-orange-100 text-orange-600 transition-colors cursor-pointer" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors cursor-pointer" title="Delete">
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
