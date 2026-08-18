'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Plus, X, Pencil, Trash2, Search, Download } from 'lucide-react';
import { aravindApi } from '@/lib/aravind-api';
import { Pagination } from '@/components/Pagination';

interface ExitInterviewRecord {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  reason: string;
  managerFeedback: string;
  employeeFeedback: string;
  interviewDate: string;
  rehireEligibility: string;
}

export default function ExitInterviewPage() {
  const [records, setRecords] = useState<ExitInterviewRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rehireFilter, setRehireFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [form, setForm] = useState<Omit<ExitInterviewRecord, 'id'>>({
    employeeId: '', name: '', department: '', designation: '', reason: '',
    managerFeedback: '', employeeFeedback: '', interviewDate: '', rehireEligibility: 'Yes',
  });

  const resetForm = () => {
    setForm({
      employeeId: '', name: '', department: '', designation: '', reason: '',
      managerFeedback: '', employeeFeedback: '', interviewDate: '', rehireEligibility: 'Yes',
    });
    setEditingId(null);
    setShowForm(false);
  };

  useEffect(() => {
    aravindApi.getExitInterview().then((data) => setRecords(Array.isArray(data) ? data : [])).catch(() => setRecords([]));
  }, []);

  const handleEdit = (record: ExitInterviewRecord) => {
    const { id, ...rest } = record;
    setForm(rest);
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await aravindApi.deleteExitInterview(id);
    setRecords(records.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = await aravindApi.updateExitInterview(editingId, form);
      setRecords(records.map((r) => r.id === editingId ? { ...r, ...updated, ...form } : r));
    } else {
      const created = await aravindApi.createExitInterview(form);
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
        (r.reason || '').toLowerCase().includes(q) ||
        (r.employeeFeedback || '').toLowerCase().includes(q);

      const matchesRehire = rehireFilter === 'ALL' || r.rehireEligibility === rehireFilter;
      return matchesSearch && matchesRehire;
    });
  }, [records, searchTerm, rehireFilter]);

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
      'Reason',
      'Manager Feedback',
      'Employee Feedback',
      'Interview Date',
      'Rehire Eligibility',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.employeeId || ''}"`,
      `"${r.name || ''}"`,
      `"${r.department || ''}"`,
      `"${r.designation || ''}"`,
      `"${(r.reason || '').replace(/"/g, '""')}"`,
      `"${(r.managerFeedback || '').replace(/"/g, '""')}"`,
      `"${(r.employeeFeedback || '').replace(/"/g, '""')}"`,
      `"${r.interviewDate || ''}"`,
      `"${r.rehireEligibility || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exit_interviews_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-orange-500" />
            <span>Exit Interview</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Conduct and record exit interviews, feedback analysis, and rehire eligibility
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search exit interviews..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
            />
          </div>

          <select
            value={rehireFilter}
            onChange={(e) => {
              setRehireFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer shadow-xs"
          >
            <option value="ALL">All Rehire</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Conditional">Conditional</option>
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
            {showForm ? 'Cancel' : 'Add Exit Interview'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Exit Interview' : 'New Exit Interview'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Employee ID', key: 'employeeId' },
              { label: 'Name', key: 'name' },
              { label: 'Department', key: 'department' },
              { label: 'Designation', key: 'designation' },
              { label: 'Reason', key: 'reason' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{field.label} *</label>
                <input type="text" required value={(form as any)[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Interview Date *</label>
              <input type="date" required value={form.interviewDate}
                onChange={(e) => setForm({ ...form, interviewDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Rehire Eligibility *</label>
              <select required value={form.rehireEligibility}
                onChange={(e) => setForm({ ...form, rehireEligibility: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer">
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Conditional">Conditional</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Manager Feedback *</label>
              <textarea required value={form.managerFeedback} rows={2}
                onChange={(e) => setForm({ ...form, managerFeedback: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Feedback *</label>
              <textarea required value={form.employeeFeedback} rows={2}
                onChange={(e) => setForm({ ...form, employeeFeedback: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer">
            {editingId ? 'Update Exit Interview' : 'Save Exit Interview'}
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
                <th className="px-3 py-3 text-left font-bold text-slate-600">Reason</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Manager Feedback</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Employee Feedback</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Interview Date</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Rehire Eligibility</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    No exit interview records found.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-orange-50/30">
                    <td className="px-3 py-3 font-semibold text-slate-800 font-mono">{r.employeeId}</td>
                    <td className="px-3 py-3 text-slate-700 font-semibold">{r.name}</td>
                    <td className="px-3 py-3 text-slate-700">{r.department}</td>
                    <td className="px-3 py-3 text-slate-700">{r.designation}</td>
                    <td className="px-3 py-3 text-slate-700">{r.reason}</td>
                    <td className="px-3 py-3 text-slate-700 max-w-[180px] truncate" title={r.managerFeedback}>{r.managerFeedback}</td>
                    <td className="px-3 py-3 text-slate-700 max-w-[180px] truncate" title={r.employeeFeedback}>{r.employeeFeedback}</td>
                    <td className="px-3 py-3 text-slate-700">{r.interviewDate}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.rehireEligibility === 'Yes' ? 'bg-green-100 text-green-700' : r.rehireEligibility === 'No' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{r.rehireEligibility}</span>
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
