'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { aravindApi } from '@/lib/aravind-api';

interface DailyReportRecord {
  id: string;
  reportDate: string;
  resignationReceived: number;
  retentionCases: number;
  employeeRetained: number;
  exitClearanceCompleted: number;
  fnfCompleted: number;
  fnfPending: number;
  openComplaints: number;
  closedComplaints: number;
  managerConfirmationPending: number;
  keyActions: string;
}

const initialData: DailyReportRecord[] = [
  {
    id: '1',
    reportDate: '2026-08-10',
    resignationReceived: 1,
    retentionCases: 2,
    employeeRetained: 1,
    exitClearanceCompleted: 1,
    fnfCompleted: 1,
    fnfPending: 1,
    openComplaints: 1,
    closedComplaints: 0,
    managerConfirmationPending: 1,
    keyActions: 'Processed Ishan F&F, initiated retention talk with Priya',
  },
  {
    id: '2',
    reportDate: '2026-08-09',
    resignationReceived: 0,
    retentionCases: 1,
    employeeRetained: 0,
    exitClearanceCompleted: 0,
    fnfCompleted: 0,
    fnfPending: 2,
    openComplaints: 2,
    closedComplaints: 1,
    managerConfirmationPending: 0,
    keyActions: 'Closed Suresh complaint, followed up on Ramesh clearances',
  },
];

export function AravindDailyReport() {
  const [records, setRecords] = useState<DailyReportRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    reportDate: '', resignationReceived: '', retentionCases: '',
    employeeRetained: '', exitClearanceCompleted: '', fnfCompleted: '',
    fnfPending: '', openComplaints: '', closedComplaints: '',
    managerConfirmationPending: '', keyActions: '',
  });

  const resetForm = () => {
    setForm({ reportDate: '', resignationReceived: '', retentionCases: '',
      employeeRetained: '', exitClearanceCompleted: '', fnfCompleted: '',
      fnfPending: '', openComplaints: '', closedComplaints: '',
      managerConfirmationPending: '', keyActions: '' });
    setEditingId(null);
    setShowForm(false);
  };

  useEffect(() => {
    aravindApi.getDailyReports().then(setRecords).catch(() => {});
  }, []);

  const handleEdit = (record: DailyReportRecord) => {
    const { id, ...rest } = record;
    setForm(rest);
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await aravindApi.deleteDailyReport(id);
    setRecords(records.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = await aravindApi.updateDailyReport(editingId, form);
      setRecords(records.map((r) => r.id === editingId ? updated : r));
    } else {
      const created = await aravindApi.createDailyReport(form);
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
            Daily summary of exit, resignation, retention, and complaint activities
          </p>
        </div>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Submit Daily Report'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Daily Report' : 'Submit Daily Report'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Report Date *</label>
              <input type="date" required value={form.reportDate}
                onChange={(e) => setForm({ ...form, reportDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            {[
              { label: 'Resignation Received', key: 'resignationReceived' },
              { label: 'Retention Cases', key: 'retentionCases' },
              { label: 'Employee Retained', key: 'employeeRetained' },
              { label: 'Exit Clearance Completed', key: 'exitClearanceCompleted' },
              { label: 'F&F Completed', key: 'fnfCompleted' },
              { label: 'F&F Pending', key: 'fnfPending' },
              { label: 'Open Complaints', key: 'openComplaints' },
              { label: 'Closed Complaints', key: 'closedComplaints' },
              { label: 'Manager Confirmation Pending', key: 'managerConfirmationPending' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{field.label} *</label>
                <input type="number" required min={0} value={(form as any)[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            ))}
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Key Actions *</label>
              <textarea required value={form.keyActions} rows={2}
                onChange={(e) => setForm({ ...form, keyActions: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer">
            {editingId ? 'Update Report' : 'Submit Report'}
          </button>
        </form>
      )}

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-3 text-left font-bold text-slate-600">Report Date</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Resignation Received</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Retention Cases</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Employee Retained</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Exit Clearance Completed</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">F&F Completed</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">F&F Pending</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Open Complaints</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Closed Complaints</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Mgr Confirm Pending</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Key Actions</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-orange-50/30">
                  <td className="px-3 py-3 font-semibold text-slate-800">{r.reportDate}</td>
                  <td className="px-3 py-3 text-slate-700">{r.resignationReceived}</td>
                  <td className="px-3 py-3 text-slate-700">{r.retentionCases}</td>
                  <td className="px-3 py-3 text-slate-700">{r.employeeRetained}</td>
                  <td className="px-3 py-3 text-slate-700">{r.exitClearanceCompleted}</td>
                  <td className="px-3 py-3 text-slate-700">{r.fnfCompleted}</td>
                  <td className="px-3 py-3 text-slate-700">{r.fnfPending}</td>
                  <td className="px-3 py-3 text-slate-700">{r.openComplaints}</td>
                  <td className="px-3 py-3 text-slate-700">{r.closedComplaints}</td>
                  <td className="px-3 py-3 text-slate-700">{r.managerConfirmationPending}</td>
                  <td className="px-3 py-3 text-slate-700 max-w-[250px] truncate">{r.keyActions}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-orange-100 text-orange-600 transition-colors cursor-pointer" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors cursor-pointer" title="Delete">
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
