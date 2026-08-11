'use client';

import React, { useState, useEffect } from 'react';
import { LogOut, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { aravindApi } from '@/lib/aravind-api';

interface ExitRecord {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  manager: string;
  managerClearance: string;
  itClearance: string;
  adminClearance: string;
  financeClearance: string;
  hrClearance: string;
  assetReturn: string;
  overallClearance: string;
}

const initialData: ExitRecord[] = [
  {
    id: '1',
    employeeId: 'EMP-088',
    name: 'Ramesh Kumar',
    department: 'Sales',
    manager: 'Arjun Mehta',
    managerClearance: 'Cleared',
    itClearance: 'Cleared',
    adminClearance: 'Pending',
    financeClearance: 'Cleared',
    hrClearance: 'Pending',
    assetReturn: 'Laptop Returned',
    overallClearance: 'In Progress',
  },
  {
    id: '2',
    employeeId: 'EMP-056',
    name: 'Ishan Abhinav',
    department: 'Sales',
    manager: 'Arjun Mehta',
    managerClearance: 'Cleared',
    itClearance: 'Cleared',
    adminClearance: 'Cleared',
    financeClearance: 'Cleared',
    hrClearance: 'Cleared',
    assetReturn: 'No Assets',
    overallClearance: 'Completed',
  },
];

export default function ExitPage() {
  const [records, setRecords] = useState<ExitRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ExitRecord, 'id'>>({
    employeeId: '', name: '', department: '', manager: '',
    managerClearance: '', itClearance: '', adminClearance: '',
    financeClearance: '', hrClearance: '', assetReturn: '', overallClearance: '',
  });

  const resetForm = () => {
    setForm({ employeeId: '', name: '', department: '', manager: '',
      managerClearance: '', itClearance: '', adminClearance: '',
      financeClearance: '', hrClearance: '', assetReturn: '', overallClearance: '' });
    setEditingId(null);
    setShowForm(false);
  };

  useEffect(() => {
    aravindApi.getExitClearance().then(setRecords).catch(() => {});
  }, []);

  const handleEdit = (record: ExitRecord) => {
    const { id, ...rest } = record;
    setForm(rest);
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await aravindApi.deleteExitClearance(id);
    setRecords(records.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = await aravindApi.updateExitClearance(editingId, form);
      setRecords(records.map((r) => r.id === editingId ? updated : r));
    } else {
      const created = await aravindApi.createExitClearance(form);
      setRecords([created, ...records]);
    }
    resetForm();
  };

  const statusBadge = (val: string) => {
    const cls = val === 'Cleared' || val === 'Completed' ? 'bg-green-100 text-green-700'
      : val === 'In Progress' ? 'bg-blue-100 text-blue-700'
      : 'bg-amber-100 text-amber-700';
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{val}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <LogOut className="w-5 h-5 text-orange-500" />
            <span>Exit Clearance</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Department clearances, no-dues sign-offs, and asset return tracking
          </p>
        </div>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Exit Record'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Exit Clearance' : 'New Exit Clearance'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Employee ID', key: 'employeeId' },
              { label: 'Name', key: 'name' },
              { label: 'Department', key: 'department' },
              { label: 'Manager', key: 'manager' },
              { label: 'Asset Return', key: 'assetReturn' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{field.label} *</label>
                <input type="text" required value={(form as any)[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            ))}
            {['managerClearance', 'itClearance', 'adminClearance', 'financeClearance', 'hrClearance', 'overallClearance'].map((key) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-600 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')} *</label>
                <select required value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">Select</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Cleared">Cleared</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            ))}
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer">
            {editingId ? 'Update Exit Record' : 'Save Exit Record'}
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
                <th className="px-3 py-3 text-left font-bold text-slate-600">Manager</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Manager Clearance</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">IT Clearance</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Admin Clearance</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Finance Clearance</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">HR Clearance</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Asset Return</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Overall</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-orange-50/30">
                  <td className="px-3 py-3 font-semibold text-slate-800">{r.employeeId}</td>
                  <td className="px-3 py-3 text-slate-700">{r.name}</td>
                  <td className="px-3 py-3 text-slate-700">{r.department}</td>
                  <td className="px-3 py-3 text-slate-700">{r.manager}</td>
                  <td className="px-3 py-3">{statusBadge(r.managerClearance)}</td>
                  <td className="px-3 py-3">{statusBadge(r.itClearance)}</td>
                  <td className="px-3 py-3">{statusBadge(r.adminClearance)}</td>
                  <td className="px-3 py-3">{statusBadge(r.financeClearance)}</td>
                  <td className="px-3 py-3">{statusBadge(r.hrClearance)}</td>
                  <td className="px-3 py-3 text-slate-700">{r.assetReturn}</td>
                  <td className="px-3 py-3">{statusBadge(r.overallClearance)}</td>
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
