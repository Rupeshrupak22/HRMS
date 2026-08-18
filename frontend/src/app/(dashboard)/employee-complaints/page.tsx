'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquareWarning, Plus, X, Pencil, Trash2, Search, Download } from 'lucide-react';
import { aravindApi } from '@/lib/aravind-api';
import { Pagination } from '@/components/Pagination';

interface ComplaintRecord {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  dateReceived: string;
  manager: string;
  category: string;
  complaintSummary: string;
  assignedTo: string;
  actionTaken: string;
  status: string;
}

export default function EmployeeComplaintsPage() {
  const [records, setRecords] = useState<ComplaintRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [form, setForm] = useState<Omit<ComplaintRecord, 'id'>>({
    employeeId: '', name: '', department: '', dateReceived: '', manager: '',
    category: 'Work Environment', complaintSummary: '', assignedTo: 'Aravind', actionTaken: '', status: 'Open',
  });

  const resetForm = () => {
    setForm({
      employeeId: '', name: '', department: '', dateReceived: '', manager: '',
      category: 'Work Environment', complaintSummary: '', assignedTo: 'Aravind', actionTaken: '', status: 'Open',
    });
    setEditingId(null);
    setShowForm(false);
  };

  useEffect(() => {
    aravindApi.getComplaints().then((data) => setRecords(Array.isArray(data) ? data : [])).catch(() => setRecords([]));
  }, []);

  const handleEdit = (record: ComplaintRecord) => {
    const { id, ...rest } = record;
    setForm(rest);
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await aravindApi.deleteComplaint(id);
    setRecords(records.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = await aravindApi.updateComplaint(editingId, form);
      setRecords(records.map((r) => r.id === editingId ? { ...r, ...updated, ...form } : r));
    } else {
      const created = await aravindApi.createComplaint(form);
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
        (r.manager || '').toLowerCase().includes(q) ||
        (r.complaintSummary || '').toLowerCase().includes(q) ||
        (r.actionTaken || '').toLowerCase().includes(q);

      const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [records, searchTerm, categoryFilter]);

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
      'Date Received',
      'Manager',
      'Category',
      'Summary',
      'Assigned To',
      'Action Taken',
      'Status',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.employeeId || ''}"`,
      `"${r.name || ''}"`,
      `"${r.department || ''}"`,
      `"${r.dateReceived || ''}"`,
      `"${r.manager || ''}"`,
      `"${r.category || ''}"`,
      `"${(r.complaintSummary || '').replace(/"/g, '""')}"`,
      `"${r.assignedTo || ''}"`,
      `"${(r.actionTaken || '').replace(/"/g, '""')}"`,
      `"${r.status || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaints_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-orange-500" />
            <span>Employee Complaints</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track and manage employee grievances, complaints, and resolution status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer shadow-xs"
          >
            <option value="ALL">All Categories</option>
            <option value="Harassment">Harassment</option>
            <option value="Discrimination">Discrimination</option>
            <option value="Work Environment">Work Environment</option>
            <option value="Policy Violation">Policy Violation</option>
            <option value="Manager Issue">Manager Issue</option>
            <option value="Other">Other</option>
          </select>

          <button
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Complaint'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Complaint' : 'New Complaint'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Employee ID', key: 'employeeId' },
              { label: 'Name', key: 'name' },
              { label: 'Department', key: 'department' },
              { label: 'Manager', key: 'manager' },
              { label: 'Assigned To', key: 'assignedTo' },
              { label: 'Action Taken', key: 'actionTaken' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{field.label} *</label>
                <input type="text" required value={(form as any)[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date Received *</label>
              <input type="date" required value={form.dateReceived}
                onChange={(e) => setForm({ ...form, dateReceived: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category *</label>
              <select required value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer">
                <option value="Harassment">Harassment</option>
                <option value="Discrimination">Discrimination</option>
                <option value="Work Environment">Work Environment</option>
                <option value="Policy Violation">Policy Violation</option>
                <option value="Manager Issue">Manager Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Complaint Summary *</label>
              <textarea required value={form.complaintSummary} rows={2}
                onChange={(e) => setForm({ ...form, complaintSummary: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status *</label>
              <select required value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer">
                <option value="Open">Open</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer">
            {editingId ? 'Update Complaint' : 'Save Complaint'}
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
                <th className="px-3 py-3 text-left font-bold text-slate-600">Date Received</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Manager</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Category</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Complaint Summary</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Assigned To</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Action Taken</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Status</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                    No complaint records found.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-orange-50/30">
                    <td className="px-3 py-3 font-semibold text-slate-800 font-mono">{r.employeeId}</td>
                    <td className="px-3 py-3 text-slate-700 font-semibold">{r.name}</td>
                    <td className="px-3 py-3 text-slate-700">{r.department}</td>
                    <td className="px-3 py-3 text-slate-700">{r.dateReceived}</td>
                    <td className="px-3 py-3 text-slate-700">{r.manager}</td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">{r.category}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-700 max-w-[200px] truncate" title={r.complaintSummary}>{r.complaintSummary}</td>
                    <td className="px-3 py-3 text-slate-700">{r.assignedTo}</td>
                    <td className="px-3 py-3 text-slate-700">{r.actionTaken}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Resolved' || r.status === 'Closed' ? 'bg-green-100 text-green-700' : r.status === 'Under Investigation' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{r.status}</span>
                    </td>
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
