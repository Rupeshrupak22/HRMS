'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Pencil, Trash2, FileText } from 'lucide-react';
import { nitishaApi } from '@/lib/nitisha-api';

export function NitishaDailyReport() {
  const [records, setRecords] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeName: '',
    employeeIssue: '',
    pipCase: '',
    pipReason: '',
    employeeEngagement: '',
    performanceLow: '',
    performanceMedium: '',
    performanceHigh: '',
    disciplineCases: '',
  });

  useEffect(() => {
    nitishaApi.getDailyReports().then(setRecords).catch(() => {});
  }, []);

  const resetForm = () => {
    setForm({
      employeeName: '', employeeIssue: '', pipCase: '', pipReason: '',
      employeeEngagement: '', performanceLow: '', performanceMedium: '',
      performanceHigh: '', disciplineCases: '',
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
    await nitishaApi.deleteDailyReport(id);
    setRecords(records.filter((r) => (r.id || r._id) !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      let updated: any = { id: editingId, ...form };
      try {
        updated = await nitishaApi.updateDailyReport(editingId, form);
      } catch {}
      setRecords(records.map((r) => (r.id || r._id) === editingId ? { ...r, ...updated, ...form } : r));
    } else {
      let created: any = { id: `rep-${Date.now()}`, ...form, createdAt: new Date().toISOString() };
      try {
        created = await nitishaApi.createDailyReport(form);
      } catch {}
      setRecords([created, ...records]);
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            <span>Daily Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit and manage daily discipline & performance reports
          </p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Daily Report'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Daily Report' : 'New Daily Report'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Name *</label>
              <input type="text" required value={form.employeeName} onChange={(e) => setForm({ ...form, employeeName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Issue *</label>
              <input type="text" required value={form.employeeIssue} onChange={(e) => setForm({ ...form, employeeIssue: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">PIP Case *</label>
              <select required value={form.pipCase} onChange={(e) => setForm({ ...form, pipCase: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            {form.pipCase === 'Yes' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">PIP Reason *</label>
                <input type="text" required value={form.pipReason} onChange={(e) => setForm({ ...form, pipReason: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Engagement *</label>
              <input type="text" required value={form.employeeEngagement} onChange={(e) => setForm({ ...form, employeeEngagement: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Performance Low *</label>
              <input type="text" inputMode="numeric" required value={form.performanceLow} onChange={(e) => setForm({ ...form, performanceLow: e.target.value.replace(/\D/g, '') })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Performance Medium *</label>
              <input type="text" inputMode="numeric" required value={form.performanceMedium} onChange={(e) => setForm({ ...form, performanceMedium: e.target.value.replace(/\D/g, '') })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Performance High *</label>
              <input type="text" inputMode="numeric" required value={form.performanceHigh} onChange={(e) => setForm({ ...form, performanceHigh: e.target.value.replace(/\D/g, '') })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Discipline Cases *</label>
              <input type="text" required value={form.disciplineCases} onChange={(e) => setForm({ ...form, disciplineCases: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer">
            {editingId ? 'Update Daily Report' : 'Save Daily Report'}
          </button>
        </form>
      )}

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-bold text-slate-600">Employee Name</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Employee Issue</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">PIP Case</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">PIP Reason</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Engagement</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Low</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Medium</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">High</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Discipline</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id || r._id} className="border-b border-slate-100 hover:bg-orange-50/30">
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.employeeName}</td>
                  <td className="px-4 py-3 text-slate-700">{r.employeeIssue}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.pipCase === 'Yes' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {r.pipCase}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.pipReason || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{r.employeeEngagement}</td>
                  <td className="px-4 py-3 text-slate-700">{r.performanceLow}</td>
                  <td className="px-4 py-3 text-slate-700">{r.performanceMedium}</td>
                  <td className="px-4 py-3 text-slate-700">{r.performanceHigh}</td>
                  <td className="px-4 py-3 text-slate-700">{r.disciplineCases}</td>
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
