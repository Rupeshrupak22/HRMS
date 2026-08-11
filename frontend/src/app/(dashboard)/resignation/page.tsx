'use client';

import React, { useState, useEffect } from 'react';
import { UserX, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { aravindApi } from '@/lib/aravind-api';

interface ResignationRecord {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  manager: string;
  dateOfResignation: string;
  reason: string;
  noticePeriod: string;
  managerConfirmation: string;
  exitInterview: string;
  exitClearance: string;
  fnf: string;
  overall: string;
  lwd: string;
}

const initialData: ResignationRecord[] = [
  {
    id: '1',
    employeeId: 'EMP-088',
    name: 'Ramesh Kumar',
    department: 'Sales',
    designation: 'Sales Executive',
    manager: 'Arjun Mehta',
    dateOfResignation: '2026-07-15',
    reason: 'Relocating for higher education',
    noticePeriod: '60 Days',
    managerConfirmation: 'Confirmed',
    exitInterview: 'Completed',
    exitClearance: 'In Progress',
    fnf: 'Pending',
    overall: 'In Progress',
    lwd: '2026-09-15',
  },
  {
    id: '2',
    employeeId: 'EMP-056',
    name: 'Ishan Abhinav',
    department: 'Sales',
    designation: 'Sales Intern',
    manager: 'Arjun Mehta',
    dateOfResignation: '2026-07-13',
    reason: 'Personal reasons',
    noticePeriod: '30 Days',
    managerConfirmation: 'Confirmed',
    exitInterview: 'Completed',
    exitClearance: 'Completed',
    fnf: 'Completed',
    overall: 'Completed',
    lwd: '2026-08-13',
  },
];

export default function ResignationPage() {
  const [records, setRecords] = useState<ResignationRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ResignationRecord, 'id'>>({
    employeeId: '', name: '', department: '', designation: '', manager: '',
    dateOfResignation: '', reason: '', noticePeriod: '', managerConfirmation: '',
    exitInterview: '', exitClearance: '', fnf: '', overall: '', lwd: '',
  });

  const resetForm = () => {
    setForm({ employeeId: '', name: '', department: '', designation: '', manager: '',
      dateOfResignation: '', reason: '', noticePeriod: '', managerConfirmation: '',
      exitInterview: '', exitClearance: '', fnf: '', overall: '', lwd: '' });
    setEditingId(null);
    setShowForm(false);
  };

  useEffect(() => {
    aravindApi.getResignation().then(setRecords).catch(() => {});
  }, []);

  const handleEdit = (record: ResignationRecord) => {
    const { id, ...rest } = record;
    setForm(rest);
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await aravindApi.deleteResignation(id);
    setRecords(records.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = await aravindApi.updateResignation(editingId, form);
      setRecords(records.map((r) => r.id === editingId ? updated : r));
    } else {
      const created = await aravindApi.createResignation(form);
      setRecords([created, ...records]);
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserX className="w-5 h-5 text-orange-500" />
            <span>Resignation Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Process resignation notices, notice period tracking, and approvals
          </p>
        </div>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Resignation'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Resignation' : 'New Resignation Entry'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Employee ID', key: 'employeeId' },
              { label: 'Name', key: 'name' },
              { label: 'Department', key: 'department' },
              { label: 'Designation', key: 'designation' },
              { label: 'Manager', key: 'manager' },
              { label: 'Reason', key: 'reason' },
              { label: 'Notice Period', key: 'noticePeriod' },
              { label: 'LWD', key: 'lwd', type: 'date' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{field.label} *</label>
                <input type={field.type || 'text'} required value={(form as any)[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Resignation *</label>
              <input type="date" required value={form.dateOfResignation}
                onChange={(e) => setForm({ ...form, dateOfResignation: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            {['managerConfirmation', 'exitInterview', 'exitClearance', 'fnf', 'overall'].map((key) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-600 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')} *</label>
                <select required value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">Select</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Confirmed">Confirmed</option>
                </select>
              </div>
            ))}
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer">
            {editingId ? 'Update Resignation' : 'Save Resignation'}
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
                <th className="px-3 py-3 text-left font-bold text-slate-600">Manager</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Date of Resignation</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Reason</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Notice Period</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Manager Confirmation</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Exit Interview</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Exit Clearance</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">F&F</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Overall</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">LWD</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-orange-50/30">
                  <td className="px-3 py-3 font-semibold text-slate-800">{r.employeeId}</td>
                  <td className="px-3 py-3 text-slate-700">{r.name}</td>
                  <td className="px-3 py-3 text-slate-700">{r.department}</td>
                  <td className="px-3 py-3 text-slate-700">{r.designation}</td>
                  <td className="px-3 py-3 text-slate-700">{r.manager}</td>
                  <td className="px-3 py-3 text-slate-700">{r.dateOfResignation}</td>
                  <td className="px-3 py-3 text-slate-700">{r.reason}</td>
                  <td className="px-3 py-3 text-slate-700">{r.noticePeriod}</td>
                  <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.managerConfirmation === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.managerConfirmation}</span></td>
                  <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.exitInterview === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.exitInterview}</span></td>
                  <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.exitClearance === 'Completed' ? 'bg-green-100 text-green-700' : r.exitClearance === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{r.exitClearance}</span></td>
                  <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.fnf === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.fnf}</span></td>
                  <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.overall === 'Completed' ? 'bg-green-100 text-green-700' : r.overall === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{r.overall}</span></td>
                  <td className="px-3 py-3 text-slate-700">{r.lwd}</td>
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
