'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import { nitishaApi } from '@/lib/nitisha-api';

export default function DisciplinePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeId: '',
    name: '',
    department: '',
    caseType: '',
    description: '',
    status: '',
    actionTaken: '',
    dateOpened: '',
    dateClosed: '',
  });

  useEffect(() => {
    nitishaApi.getDiscipline().then(setRecords).catch(() => {});
  }, []);

  const resetForm = () => {
    setForm({
      employeeId: '', name: '', department: '', caseType: '',
      description: '', status: '', actionTaken: '', dateOpened: '', dateClosed: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (record: any) => {
    const { id, _id, ...rest } = record;
    setForm({ ...form, ...rest });
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
    if (editingId) {
      const updated = await nitishaApi.updateDiscipline(editingId, form);
      setRecords(records.map((r) => (r.id || r._id) === editingId ? updated : r));
    } else {
      const created = await nitishaApi.createDiscipline(form);
      setRecords([created, ...records]);
    }
    resetForm();
  };

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
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Discipline Case'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Discipline Case' : 'New Discipline Case'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee ID *</label>
              <input type="text" required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">Case Type *</label>
              <select required value={form.caseType} onChange={(e) => setForm({ ...form, caseType: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select</option>
                <option value="Code of Conduct">Code of Conduct</option>
                <option value="Attendance Violation">Attendance Violation</option>
                <option value="POSH">POSH</option>
                <option value="Insubordination">Insubordination</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description *</label>
              <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status *</label>
              <select required value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select</option>
                <option value="Open">Open</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Warning Issued">Warning Issued</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Action Taken *</label>
              <input type="text" required value={form.actionTaken} onChange={(e) => setForm({ ...form, actionTaken: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date Opened *</label>
              <input type="date" required value={form.dateOpened} onChange={(e) => setForm({ ...form, dateOpened: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date Closed</label>
              <input type="date" value={form.dateClosed} onChange={(e) => setForm({ ...form, dateClosed: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer">
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
              {records.map((r) => (
                <tr key={r.id || r._id} className="border-b border-slate-100 hover:bg-orange-50/30">
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.employeeId}</td>
                  <td className="px-4 py-3 text-slate-700">{r.name}</td>
                  <td className="px-4 py-3 text-slate-700">{r.department}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">{r.caseType}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">{r.description}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Closed' ? 'bg-slate-100 text-slate-600' : r.status === 'Open' ? 'bg-orange-100 text-orange-700' : r.status === 'Warning Issued' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.actionTaken}</td>
                  <td className="px-4 py-3 text-slate-700">{r.dateOpened}</td>
                  <td className="px-4 py-3 text-slate-700">{r.dateClosed || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-orange-100 text-orange-600 transition-colors cursor-pointer" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(r.id || r._id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors cursor-pointer" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
