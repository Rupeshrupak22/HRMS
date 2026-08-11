'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { aravindApi } from '@/lib/aravind-api';

interface RetentionRecord {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  manager: string;
  resignationDate: string;
  reason: string;
  employeeConcern: string;
  action: string;
  managerInvolved: string;
  retentionOutcome: string;
  status: string;
  remarks: string;
}

const initialData: RetentionRecord[] = [
  {
    id: '1',
    employeeId: 'EMP-045',
    name: 'Priya Sharma',
    department: 'Technology',
    manager: 'Vikram Sharma',
    resignationDate: '2026-07-25',
    reason: 'Better opportunity',
    employeeConcern: 'Salary not competitive',
    action: 'Counter offer with 25% hike',
    managerInvolved: 'Yes',
    retentionOutcome: 'Retained',
    status: 'Closed',
    remarks: 'Employee accepted revised offer',
  },
  {
    id: '2',
    employeeId: 'EMP-072',
    name: 'Rahul Verma',
    department: 'Sales',
    manager: 'Arjun Mehta',
    resignationDate: '2026-08-02',
    reason: 'Relocation',
    employeeConcern: 'Cannot work remotely',
    action: 'Offered WFH flexibility',
    managerInvolved: 'Yes',
    retentionOutcome: 'Not Retained',
    status: 'Closed',
    remarks: 'Employee declined, personal reasons',
  },
];

export default function RetentionPage() {
  const [records, setRecords] = useState<RetentionRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    aravindApi.getRetention().then(setRecords).catch(() => {});
  }, []);
  const [form, setForm] = useState<Omit<RetentionRecord, 'id'>>({
    employeeId: '',
    name: '',
    department: '',
    manager: '',
    resignationDate: '',
    reason: '',
    employeeConcern: '',
    action: '',
    managerInvolved: '',
    retentionOutcome: '',
    status: '',
    remarks: '',
  });

  const resetForm = () => {
    setForm({ employeeId: '', name: '', department: '', manager: '', resignationDate: '', reason: '', employeeConcern: '', action: '', managerInvolved: '', retentionOutcome: '', status: '', remarks: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (record: RetentionRecord) => {
    const { id, ...rest } = record;
    setForm(rest);
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await aravindApi.deleteRetention(id);
    setRecords(records.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = await aravindApi.updateRetention(editingId, form);
      setRecords(records.map((r) => r.id === editingId ? updated : r));
    } else {
      const created = await aravindApi.createRetention(form);
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
            <span>Retention Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track at-risk employees, retention strategies, and intervention records
          </p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Retention Case'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Retention Case' : 'New Retention Case'}</h2>
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">Manager *</label>
              <input type="text" required value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Resignation Date *</label>
              <input type="date" required value={form.resignationDate} onChange={(e) => setForm({ ...form, resignationDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Reason *</label>
              <input type="text" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Concern *</label>
              <input type="text" required value={form.employeeConcern} onChange={(e) => setForm({ ...form, employeeConcern: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Action *</label>
              <input type="text" required value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Manager Involved *</label>
              <select required value={form.managerInvolved} onChange={(e) => setForm({ ...form, managerInvolved: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Retention Outcome *</label>
              <select required value={form.retentionOutcome} onChange={(e) => setForm({ ...form, retentionOutcome: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select</option>
                <option value="Retained">Retained</option>
                <option value="Not Retained">Not Retained</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status *</label>
              <select required value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks *</label>
              <input type="text" required value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer">
            {editingId ? 'Update Retention Case' : 'Save Retention Case'}
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
                <th className="px-4 py-3 text-left font-bold text-slate-600">Manager</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Resignation Date</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Reason</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Employee Concern</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Action</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Manager Involved</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Outcome</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Remarks</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-orange-50/30">
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.employeeId}</td>
                  <td className="px-4 py-3 text-slate-700">{r.name}</td>
                  <td className="px-4 py-3 text-slate-700">{r.department}</td>
                  <td className="px-4 py-3 text-slate-700">{r.manager}</td>
                  <td className="px-4 py-3 text-slate-700">{r.resignationDate}</td>
                  <td className="px-4 py-3 text-slate-700">{r.reason}</td>
                  <td className="px-4 py-3 text-slate-700">{r.employeeConcern}</td>
                  <td className="px-4 py-3 text-slate-700">{r.action}</td>
                  <td className="px-4 py-3 text-slate-700">{r.managerInvolved}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.retentionOutcome === 'Retained' ? 'bg-green-100 text-green-700' : r.retentionOutcome === 'Not Retained' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.retentionOutcome}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Closed' ? 'bg-slate-100 text-slate-600' : r.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.remarks}</td>
                  <td className="px-4 py-3">
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
