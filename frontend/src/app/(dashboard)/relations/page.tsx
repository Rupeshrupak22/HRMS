'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Pencil, Trash2, Users } from 'lucide-react';
import { nitishaApi } from '@/lib/nitisha-api';

export default function RelationsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeName: '',
    employeeId: '',
    joiningDate: '',
    rnrCertification: '',
    employeeActivities: '',
    employeeFeedback: '',
  });

  useEffect(() => {
    nitishaApi.getRelations().then(setRecords).catch(() => {});
  }, []);

  const resetForm = () => {
    setForm({
      employeeName: '', employeeId: '', joiningDate: '',
      rnrCertification: '', employeeActivities: '', employeeFeedback: '',
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
    await nitishaApi.deleteRelation(id);
    setRecords(records.filter((r) => (r.id || r._id) !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = await nitishaApi.updateRelation(editingId, form);
      setRecords(records.map((r) => (r.id || r._id) === editingId ? updated : r));
    } else {
      const created = await nitishaApi.createRelation(form);
      setRecords([created, ...records]);
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            <span>Employee Relations</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track employee engagement, R&R certifications, and feedback records
          </p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Relation Record'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Relation Record' : 'New Relation Record'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Name *</label>
              <input type="text" required value={form.employeeName} onChange={(e) => setForm({ ...form, employeeName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee ID *</label>
              <input type="text" required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Joining Date *</label>
              <input type="date" required value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">R&R Certification *</label>
              <select required value={form.rnrCertification} onChange={(e) => setForm({ ...form, rnrCertification: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select</option>
                <option value="Provided">Provided</option>
                <option value="Not Provided">Not Provided</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Activities *</label>
              <textarea required value={form.employeeActivities} onChange={(e) => setForm({ ...form, employeeActivities: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Feedback *</label>
              <textarea required value={form.employeeFeedback} onChange={(e) => setForm({ ...form, employeeFeedback: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer">
            {editingId ? 'Update Relation Record' : 'Save Relation Record'}
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
                <th className="px-4 py-3 text-left font-bold text-slate-600">Joining Date</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">R&R Certification</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Activities</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Feedback</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id || r._id} className="border-b border-slate-100 hover:bg-orange-50/30">
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.employeeName}</td>
                  <td className="px-4 py-3 text-slate-700">{r.employeeId}</td>
                  <td className="px-4 py-3 text-slate-700">{r.joiningDate}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.rnrCertification === 'Provided' ? 'bg-green-100 text-green-700' : r.rnrCertification === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {r.rnrCertification}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">{r.employeeActivities}</td>
                  <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">{r.employeeFeedback}</td>
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
