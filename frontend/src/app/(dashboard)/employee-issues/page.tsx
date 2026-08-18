'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Pencil, Trash2, AlertCircle, Search, Download, CheckCircle2, Clock } from 'lucide-react';
import { nitishaApi } from '@/lib/nitisha-api';
import { Pagination } from '@/components/Pagination';

export default function EmployeeIssuesPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [form, setForm] = useState({
    employeeId: '',
    employeeName: '',
    email: '',
    contact: '',
    employeeIssue: '',
    employeeExplanation: '',
    factFinding: '',
    managerExplanation: '',
    myExplanation: '',
    status: 'OPEN',
    date: new Date().toISOString().split('T')[0],
  });

  const loadData = () => {
    nitishaApi.getIssues().then((res) => {
      setIssues(Array.isArray(res) ? res : []);
    }).catch(() => setIssues([]));
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({
      employeeId: '',
      employeeName: '',
      email: '',
      contact: '',
      employeeIssue: '',
      employeeExplanation: '',
      factFinding: '',
      managerExplanation: '',
      myExplanation: '',
      status: 'OPEN',
      date: new Date().toISOString().split('T')[0],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (record: any) => {
    const { id, _id, ...rest } = record;
    setForm({
      employeeId: rest.employeeId || '',
      employeeName: rest.employeeName || '',
      email: rest.email || '',
      contact: rest.contact || '',
      employeeIssue: rest.employeeIssue || '',
      employeeExplanation: rest.employeeExplanation || '',
      factFinding: rest.factFinding || '',
      managerExplanation: rest.managerExplanation || '',
      myExplanation: rest.myExplanation || '',
      status: rest.status || 'OPEN',
      date: rest.date || new Date().toISOString().split('T')[0],
    });
    setEditingId(id || _id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this issue record?')) return;
    try {
      await nitishaApi.deleteIssue(id);
      setIssues((prev) => prev.filter((r) => (r.id || r._id) !== id));
    } catch {
      setIssues((prev) => prev.filter((r) => (r.id || r._id) !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const updated = await nitishaApi.updateIssue(editingId, form);
        setIssues((prev) => prev.map((r) => ((r.id || r._id) === editingId ? { ...r, ...updated, ...form } : r)));
      } else {
        const created = await nitishaApi.createIssue(form);
        setIssues((prev) => [created, ...prev]);
      }
      resetForm();
    } catch {
      const localRecord = {
        id: editingId || `iss-${Date.now()}`,
        ...form,
        createdAt: new Date().toISOString(),
      };
      if (editingId) {
        setIssues((prev) => prev.map((r) => ((r.id || r._id) === editingId ? localRecord : r)));
      } else {
        setIssues((prev) => [localRecord, ...prev]);
      }
      resetForm();
    }
  };

  const filteredIssues = useMemo(() => {
    return issues.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (r.employeeName || '').toLowerCase().includes(q) ||
        (r.employeeId || '').toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        (r.contact || '').toLowerCase().includes(q) ||
        (r.employeeIssue || '').toLowerCase().includes(q) ||
        (r.factFinding || '').toLowerCase().includes(q);

      const matchesStatus =
        selectedStatus === 'ALL' || (r.status || 'OPEN').toUpperCase() === selectedStatus.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [issues, searchTerm, selectedStatus]);

  const paginatedIssues = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredIssues.slice(start, start + PAGE_SIZE);
  }, [filteredIssues, page]);

  const exportCSV = () => {
    const headers = [
      'Employee ID',
      'Employee Name',
      'Email',
      'Contact',
      'Employee Issue',
      'Employee Explanation',
      'Fact Finding',
      'Manager Explanation',
      'My Explanation',
      'Status',
      'Date',
    ];
    const rows = filteredIssues.map((r) => [
      `"${r.employeeId || ''}"`,
      `"${r.employeeName || ''}"`,
      `"${r.email || ''}"`,
      `"${r.contact || ''}"`,
      `"${(r.employeeIssue || '').replace(/"/g, '""')}"`,
      `"${(r.employeeExplanation || '').replace(/"/g, '""')}"`,
      `"${(r.factFinding || '').replace(/"/g, '""')}"`,
      `"${(r.managerExplanation || '').replace(/"/g, '""')}"`,
      `"${(r.myExplanation || '').replace(/"/g, '""')}"`,
      `"${r.status || 'OPEN'}"`,
      `"${r.date || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Employee_Issues_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-orange-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            <span>Employee Issues Management & Resolution</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Log employee issues, capture explanations, fact findings, manager reviews, and HR determinations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'New Employee Issue'}
          </button>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span>{editingId ? 'Edit Employee Issue Record' : 'Log New Employee Issue'}</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Fields marked with * are required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Employee ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. EMP-101"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Employee Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={form.employeeName}
                onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mail ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. rahul@adyapan.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 9876543210"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Employee Issue <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe the issue or incident reported..."
                value={form.employeeIssue}
                onChange={(e) => setForm({ ...form, employeeIssue: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Employee Explanation <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Explanation or statement provided by the employee..."
                value={form.employeeExplanation}
                onChange={(e) => setForm({ ...form, employeeExplanation: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fact Finding <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Findings discovered through HR inquiry / POSH / logs..."
                value={form.factFinding}
                onChange={(e) => setForm({ ...form, factFinding: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Manager Explanation <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Reporting manager's input or review..."
                value={form.managerExplanation}
                onChange={(e) => setForm({ ...form, managerExplanation: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                My Explanation (HR) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Nitisha's official assessment and recommendations..."
                value={form.myExplanation}
                onChange={(e) => setForm({ ...form, myExplanation: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="OPEN">OPEN (Under Review)</option>
                <option value="IN_PROGRESS">IN PROGRESS (Inquiry Ongoing)</option>
                <option value="RESOLVED">RESOLVED (Action Taken)</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer"
              >
                {editingId ? 'Update Issue Record' : 'Save Issue Record'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Employee ID, Name, Email, Issue, or Fact Finding..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="text-xs font-bold text-slate-500">
          Total Issues: <span className="text-orange-600 font-extrabold">{filteredIssues.length}</span>
        </div>
      </div>

      {/* Issues Table */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-extrabold">
                <th className="px-4 py-3.5">Emp ID</th>
                <th className="px-4 py-3.5">Employee Name</th>
                <th className="px-4 py-3.5">Mail ID</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5 min-w-[200px]">Employee Issue</th>
                <th className="px-4 py-3.5 min-w-[200px]">Employee Explanation</th>
                <th className="px-4 py-3.5 min-w-[200px]">Fact Finding</th>
                <th className="px-4 py-3.5 min-w-[180px]">Manager Explanation</th>
                <th className="px-4 py-3.5 min-w-[180px]">My Explanation</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedIssues.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-slate-400 font-semibold">
                    No employee issues found. Click &quot;New Employee Issue&quot; above to log an issue.
                  </td>
                </tr>
              ) : (
                paginatedIssues.map((r) => (
                  <tr key={r.id || r._id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{r.employeeId}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{r.employeeName}</td>
                    <td className="px-4 py-3 text-slate-600">{r.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{r.contact || '—'}</td>
                    <td className="px-4 py-3 text-slate-800 leading-relaxed">{r.employeeIssue}</td>
                    <td className="px-4 py-3 text-slate-700 leading-relaxed">{r.employeeExplanation || '—'}</td>
                    <td className="px-4 py-3 text-slate-700 leading-relaxed">{r.factFinding || '—'}</td>
                    <td className="px-4 py-3 text-slate-700 leading-relaxed">{r.managerExplanation || '—'}</td>
                    <td className="px-4 py-3 text-slate-700 leading-relaxed">{r.myExplanation || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          r.status === 'RESOLVED' || r.status === 'CLOSED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : r.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {r.status === 'RESOLVED' || r.status === 'CLOSED' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{r.status || 'OPEN'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(r)}
                        className="p-1.5 rounded-lg hover:bg-orange-100 text-orange-600 transition-colors cursor-pointer mr-1"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id || r._id)}
                        className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalItems={filteredIssues.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
