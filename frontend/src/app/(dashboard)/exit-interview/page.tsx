'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { aravindApi } from '@/lib/aravind-api';

interface ExitInterviewRecord {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  reason: string;
  managerFeedback: string;
  employeeFeedback: string;
  interviewDate: string;
  rehireEligibility: string;
}

const initialData: ExitInterviewRecord[] = [
  {
    id: '1',
    employeeId: 'EMP-056',
    name: 'Ishan Abhinav',
    department: 'Sales',
    designation: 'Sales Intern',
    reason: 'Personal reasons',
    managerFeedback: 'Good performer, leaving for personal reasons',
    employeeFeedback: 'Positive work culture, need better stipend',
    interviewDate: '2026-08-05',
    rehireEligibility: 'Yes',
  },
  {
    id: '2',
    employeeId: 'EMP-088',
    name: 'Ramesh Kumar',
    department: 'Sales',
    designation: 'Sales Executive',
    reason: 'Higher education',
    managerFeedback: 'Consistent performer, relocating',
    employeeFeedback: 'Great team, wish I could continue remotely',
    interviewDate: '2026-08-08',
    rehireEligibility: 'Yes',
  },
];

export default function ExitInterviewPage() {
  const [records, setRecords] = useState<ExitInterviewRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ExitInterviewRecord, 'id'>>({
    employeeId: '', name: '', department: '', designation: '', reason: '',
    managerFeedback: '', employeeFeedback: '', interviewDate: '', rehireEligibility: '',
  });

  const resetForm = () => {
    setForm({ employeeId: '', name: '', department: '', designation: '', reason: '',
      managerFeedback: '', employeeFeedback: '', interviewDate: '', rehireEligibility: '' });
    setEditingId(null);
    setShowForm(false);
  };

  useEffect(() => {
    aravindApi.getExitInterview().then(setRecords).catch(() => {});
  }, []);

  const handleEdit = (record: ExitInterviewRecord) => {
    const { id, ...rest } = record;
    setForm(rest);
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await aravindApi.deleteExitInterview(id);
    setRecords(records.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = await aravindApi.updateExitInterview(editingId, form);
      setRecords(records.map((r) => r.id === editingId ? updated : r));
    } else {
      const created = await aravindApi.createExitInterview(form);
      setRecords([created, ...records]);
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-orange-500" />
            <span>Exit Interview</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Conduct and record exit interviews, feedback analysis, and rehire eligibility
          </p>
        </div>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Exit Interview'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Exit Interview' : 'New Exit Interview'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Employee ID', key: 'employeeId' },
              { label: 'Name', key: 'name' },
              { label: 'Department', key: 'department' },
              { label: 'Designation', key: 'designation' },
              { label: 'Reason', key: 'reason' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{field.label} *</label>
                <input type="text" required value={(form as any)[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Interview Date *</label>
              <input type="date" required value={form.interviewDate}
                onChange={(e) => setForm({ ...form, interviewDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Rehire Eligibility *</label>
              <select required value={form.rehireEligibility}
                onChange={(e) => setForm({ ...form, rehireEligibility: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Conditional">Conditional</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Manager Feedback *</label>
              <textarea required value={form.managerFeedback} rows={2}
                onChange={(e) => setForm({ ...form, managerFeedback: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Feedback *</label>
              <textarea required value={form.employeeFeedback} rows={2}
                onChange={(e) => setForm({ ...form, employeeFeedback: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer">
            {editingId ? 'Update Exit Interview' : 'Save Exit Interview'}
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
                <th className="px-3 py-3 text-left font-bold text-slate-600">Reason</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Manager Feedback</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Employee Feedback</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Interview Date</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Rehire Eligibility</th>
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
                  <td className="px-3 py-3 text-slate-700">{r.reason}</td>
                  <td className="px-3 py-3 text-slate-700 max-w-[180px] truncate">{r.managerFeedback}</td>
                  <td className="px-3 py-3 text-slate-700 max-w-[180px] truncate">{r.employeeFeedback}</td>
                  <td className="px-3 py-3 text-slate-700">{r.interviewDate}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.rehireEligibility === 'Yes' ? 'bg-green-100 text-green-700' : r.rehireEligibility === 'No' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{r.rehireEligibility}</span>
                  </td>
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
