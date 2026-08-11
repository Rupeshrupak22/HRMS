'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { aravindApi } from '@/lib/aravind-api';

interface FnFRecord {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  fnfInitiateDate: string;
  financeConfirmation: string;
  fnfAmount: string;
  paymentStatus: string;
  paymentDate: string;
  pending: string;
}

const initialData: FnFRecord[] = [
  {
    id: '1',
    employeeId: 'EMP-056',
    name: 'Ishan Abhinav',
    department: 'Sales',
    fnfInitiateDate: '2026-08-01',
    financeConfirmation: 'Confirmed',
    fnfAmount: '₹1,45,000',
    paymentStatus: 'Processed',
    paymentDate: '2026-08-10',
    pending: 'None',
  },
  {
    id: '2',
    employeeId: 'EMP-088',
    name: 'Ramesh Kumar',
    department: 'Sales',
    fnfInitiateDate: '2026-08-05',
    financeConfirmation: 'Pending',
    fnfAmount: '₹2,10,000',
    paymentStatus: 'Pending',
    paymentDate: '-',
    pending: 'Finance sign-off',
  },
];

export default function FnFPage() {
  const [records, setRecords] = useState<FnFRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<FnFRecord, 'id'>>({
    employeeId: '', name: '', department: '', fnfInitiateDate: '',
    financeConfirmation: '', fnfAmount: '', paymentStatus: '', paymentDate: '', pending: '',
  });

  const resetForm = () => {
    setForm({ employeeId: '', name: '', department: '', fnfInitiateDate: '',
      financeConfirmation: '', fnfAmount: '', paymentStatus: '', paymentDate: '', pending: '' });
    setEditingId(null);
    setShowForm(false);
  };

  useEffect(() => {
    aravindApi.getFnF().then(setRecords).catch(() => {});
  }, []);

  const handleEdit = (record: FnFRecord) => {
    const { id, ...rest } = record;
    setForm(rest);
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await aravindApi.deleteFnF(id);
    setRecords(records.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = await aravindApi.updateFnF(editingId, form);
      setRecords(records.map((r) => r.id === editingId ? updated : r));
    } else {
      const created = await aravindApi.createFnF(form);
      setRecords([created, ...records]);
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-500" />
            <span>Full &amp; Final Settlement</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            F&amp;F calculations, finance confirmation, and payout tracking
          </p>
        </div>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add F&F Record'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit F&F Entry' : 'New F&F Entry'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Employee ID', key: 'employeeId' },
              { label: 'Name', key: 'name' },
              { label: 'Department', key: 'department' },
              { label: 'F&F Amount', key: 'fnfAmount' },
              { label: 'Pending', key: 'pending' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{field.label} *</label>
                <input type="text" required value={(form as any)[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">F&F Initiate Date *</label>
              <input type="date" required value={form.fnfInitiateDate}
                onChange={(e) => setForm({ ...form, fnfInitiateDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Date *</label>
              <input type="date" required value={form.paymentDate}
                onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Finance Confirmation *</label>
              <select required value={form.financeConfirmation}
                onChange={(e) => setForm({ ...form, financeConfirmation: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Status *</label>
              <select required value={form.paymentStatus}
                onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select</option>
                <option value="Pending">Pending</option>
                <option value="Processed">Processed</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer">
            {editingId ? 'Update F&F Record' : 'Save F&F Record'}
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
                <th className="px-3 py-3 text-left font-bold text-slate-600">F&F Initiate Date</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Finance Confirmation</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">F&F Amount</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Payment Status</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Payment Date</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Pending</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-orange-50/30">
                  <td className="px-3 py-3 font-semibold text-slate-800">{r.employeeId}</td>
                  <td className="px-3 py-3 text-slate-700">{r.name}</td>
                  <td className="px-3 py-3 text-slate-700">{r.department}</td>
                  <td className="px-3 py-3 text-slate-700">{r.fnfInitiateDate}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.financeConfirmation === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.financeConfirmation}</span>
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-800">{r.fnfAmount}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.paymentStatus === 'Processed' ? 'bg-green-100 text-green-700' : r.paymentStatus === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{r.paymentStatus}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{r.paymentDate}</td>
                  <td className="px-3 py-3 text-slate-700">{r.pending}</td>
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
