'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Pencil, Trash2, ShieldAlert, Search } from 'lucide-react';
import { nitishaApi } from '@/lib/nitisha-api';
import { Pagination } from '@/components/Pagination';

export const DISCIPLINE_CASE_TYPES = [
  'Code of Conduct Violation',
  'Attendance Violation',
  'Insubordination',
  'POSH / Sexual Harassment',
  'Workplace Misconduct',
  'Policy Violation',
  'Unauthorised Leave / Absence',
  'Data / Confidentiality Violation',
  'IT / System Misuse',
  'Harassment / Bullying',
  'Other',
];

export default function DisciplinePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [form, setForm] = useState({
    employeeId: '',
    name: '',
    department: '',
    selectedCaseType: '',
    customCaseType: '',
    description: '',
    status: '',
    actionTaken: '',
    dateOpened: new Date().toISOString().split('T')[0],
    dateClosed: '',
  });

  useEffect(() => {
    nitishaApi.getDiscipline().then(setRecords).catch(() => {});
  }, []);

  const resetForm = () => {
    setForm({
      employeeId: '',
      name: '',
      department: '',
      selectedCaseType: '',
      customCaseType: '',
      description: '',
      status: '',
      actionTaken: '',
      dateOpened: new Date().toISOString().split('T')[0],
      dateClosed: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (record: any) => {
    const { id, _id, ...rest } = record;
    const isStandard = DISCIPLINE_CASE_TYPES.includes(rest.caseType) && rest.caseType !== 'Other';
    setForm({
      employeeId: rest.employeeId || '',
      name: rest.name || '',
      department: rest.department || '',
      selectedCaseType: isStandard ? rest.caseType : 'Other',
      customCaseType: isStandard ? '' : (rest.caseType || ''),
      description: rest.description || '',
      status: rest.status || '',
      actionTaken: rest.actionTaken || '',
      dateOpened: rest.dateOpened || '',
      dateClosed: rest.dateClosed || '',
    });
    setEditingId(id || _id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await nitishaApi.deleteDiscipline(id);
    setRecords(records.filter((r) => (r.id || r._id) !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCaseType =
      form.selectedCaseType === 'Other'
        ? form.customCaseType.trim() || 'Other'
        : form.selectedCaseType;

    const payload = {
      employeeId: form.employeeId,
      name: form.name,
      department: form.department,
      caseType: finalCaseType,
      description: form.description,
      status: form.status,
      actionTaken: form.actionTaken,
      dateOpened: form.dateOpened,
      dateClosed: form.dateClosed,
    };

    if (editingId) {
      const updated = await nitishaApi.updateDiscipline(editingId, payload);
      setRecords(records.map((r) => ((r.id || r._id) === editingId ? { ...r, ...updated, ...payload } : r)));
    } else {
      const created = await nitishaApi.createDiscipline(payload);
      setRecords([created, ...records]);
    }
    resetForm();
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      return (
        (r.name || '').toLowerCase().includes(q) ||
        (r.employeeId || '').toLowerCase().includes(q) ||
        (r.department || '').toLowerCase().includes(q) ||
        (r.caseType || '').toLowerCase().includes(q) ||
        (r.status || '').toLowerCase().includes(q) ||
        (r.actionTaken || '').toLowerCase().includes(q)
      );
    });
  }, [records, searchTerm]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-500" />
            <span>Discipline Cases</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage employee conduct violations, POSH cases, and disciplinary actions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search discipline cases..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
            />
          </div>
          <button
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Discipline Case'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">
            {editingId ? 'Edit Discipline Case' : 'New Discipline Case'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee ID *</label>
              <input
                type="text"
                required
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Department *</label>
              <input
                type="text"
                required
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className={form.selectedCaseType === 'Other' ? '' : 'sm:col-span-1'}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Case Type *</label>
              <select
                required
                value={form.selectedCaseType}
                onChange={(e) => setForm({ ...form, selectedCaseType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="">Select Case Type</option>
                <option value="Code of Conduct Violation">Code of Conduct Violation</option>
                <option value="Attendance Violation">Attendance Violation</option>
                <option value="Insubordination">Insubordination</option>
                <option value="POSH / Sexual Harassment">POSH / Sexual Harassment</option>
                <option value="Workplace Misconduct">Workplace Misconduct</option>
                <option value="Policy Violation">Policy Violation</option>
                <option value="Unauthorised Leave / Absence">Unauthorised Leave / Absence</option>
                <option value="Data / Confidentiality Violation">Data / Confidentiality Violation</option>
                <option value="IT / System Misuse">IT / System Misuse</option>
                <option value="Harassment / Bullying">Harassment / Bullying</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Custom Case Type Input when "Other" is chosen */}
            {form.selectedCaseType === 'Other' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Specify Custom Case Type *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter specific case type..."
                  value={form.customCaseType}
                  onChange={(e) => setForm({ ...form, customCaseType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description *</label>
              <textarea
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Detailed description of the incident / violation..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status *</label>
              <select
                required
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="">Select</option>
                <option value="Open">Open</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Warning Issued">Warning Issued</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Action Taken *</label>
              <input
                type="text"
                required
                placeholder="e.g. Verbal warning / Formal inquiry"
                value={form.actionTaken}
                onChange={(e) => setForm({ ...form, actionTaken: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date Opened *</label>
              <input
                type="date"
                required
                value={form.dateOpened}
                onChange={(e) => setForm({ ...form, dateOpened: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date Closed</label>
              <input
                type="date"
                value={form.dateClosed}
                onChange={(e) => setForm({ ...form, dateClosed: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {editingId ? 'Update Discipline Case' : 'Save Discipline Case'}
          </button>
        </form>
      )}

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-bold text-slate-600">Emp ID</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Name</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Department</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Case Type</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Description</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Action Taken</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Date Opened</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Date Closed</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    No discipline cases found. Click &quot;Add Discipline Case&quot; to log one.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr key={r.id || r._id} className="border-b border-slate-100 hover:bg-orange-50/30">
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.employeeId}</td>
                    <td className="px-4 py-3 text-slate-700">{r.name}</td>
                    <td className="px-4 py-3 text-slate-700">{r.department}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                        {r.caseType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate" title={r.description}>
                      {r.description}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'Closed'
                            ? 'bg-slate-100 text-slate-600'
                            : r.status === 'Open'
                            ? 'bg-orange-100 text-orange-700'
                            : r.status === 'Warning Issued'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.actionTaken}</td>
                    <td className="px-4 py-3 text-slate-700">{r.dateOpened}</td>
                    <td className="px-4 py-3 text-slate-700">{r.dateClosed || '—'}</td>
                    <td className="px-4 py-3">
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

