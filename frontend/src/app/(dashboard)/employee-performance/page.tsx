'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { nitishaApi } from '@/lib/nitisha-api';

export default function EmployeePerformancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeName: '',
    joiningDate: '',
    employeeId: '',
    department: '',
    designation: '',
    kpi: '',
    dailyPerformance: '',
    weeklyPerformance: '',
    monthlyPerformance: '',
    monthlyRevenue: '',
    pipCase: '',
    // PIP Yes fields
    reasonForPip: '',
    performanceGap: '',
    currentPerformance: '',
    improvementAction: '',
    managerRemark: '',
    finalRemark: '',
    // PIP No fields
    furtherActions: '',
    employeeIssue: '',
    employeeExplanation: '',
    factFinding: '',
    managerExplanation: '',
    myExplanation: '',
  });

  useEffect(() => {
    nitishaApi.getPerformances().then(setRecords).catch(() => {});
  }, []);

  const resetForm = () => {
    setForm({
      employeeName: '', joiningDate: '', employeeId: '', department: '', designation: '',
      kpi: '', dailyPerformance: '', weeklyPerformance: '', monthlyPerformance: '',
      monthlyRevenue: '', pipCase: '', reasonForPip: '', performanceGap: '',
      currentPerformance: '', improvementAction: '', managerRemark: '', finalRemark: '',
      furtherActions: '', employeeIssue: '', employeeExplanation: '', factFinding: '',
      managerExplanation: '', myExplanation: '',
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
    await nitishaApi.deletePerformance(id);
    setRecords(records.filter((r) => (r.id || r._id) !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = await nitishaApi.updatePerformance(editingId, form);
      setRecords(records.map((r) => (r.id || r._id) === editingId ? updated : r));
    } else {
      const created = await nitishaApi.createPerformance(form);
      setRecords([created, ...records]);
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span>Employee Performance & Discipline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track KPIs, performance reviews, PIP cases, and disciplinary actions
          </p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Performance Record'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Performance Record' : 'New Performance Record'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Name *</label>
              <input type="text" required value={form.employeeName} onChange={(e) => setForm({ ...form, employeeName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Joining Date *</label>
              <input type="date" required value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee ID *</label>
              <input type="text" required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Department *</label>
              <input type="text" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Designation *</label>
              <input type="text" required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">KPI *</label>
              <input type="text" required value={form.kpi} onChange={(e) => setForm({ ...form, kpi: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Daily Performance *</label>
              <input type="text" required value={form.dailyPerformance} onChange={(e) => setForm({ ...form, dailyPerformance: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Weekly Performance *</label>
              <input type="text" required value={form.weeklyPerformance} onChange={(e) => setForm({ ...form, weeklyPerformance: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Performance *</label>
              <input type="text" required value={form.monthlyPerformance} onChange={(e) => setForm({ ...form, monthlyPerformance: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Revenue *</label>
              <input type="text" required value={form.monthlyRevenue} onChange={(e) => setForm({ ...form, monthlyRevenue: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">PIP Case *</label>
              <select required value={form.pipCase} onChange={(e) => setForm({ ...form, pipCase: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          {form.pipCase === 'Yes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for PIP *</label>
                <input type="text" required value={form.reasonForPip} onChange={(e) => setForm({ ...form, reasonForPip: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Performance Gap *</label>
                <input type="text" required value={form.performanceGap} onChange={(e) => setForm({ ...form, performanceGap: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Current Performance *</label>
                <input type="text" required value={form.currentPerformance} onChange={(e) => setForm({ ...form, currentPerformance: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Improvement Action *</label>
                <input type="text" required value={form.improvementAction} onChange={(e) => setForm({ ...form, improvementAction: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Manager Remark *</label>
                <input type="text" required value={form.managerRemark} onChange={(e) => setForm({ ...form, managerRemark: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Final Remark *</label>
                <input type="text" required value={form.finalRemark} onChange={(e) => setForm({ ...form, finalRemark: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Further Actions *</label>
              <input type="text" required value={form.furtherActions} onChange={(e) => setForm({ ...form, furtherActions: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Issue *</label>
              <input type="text" required value={form.employeeIssue} onChange={(e) => setForm({ ...form, employeeIssue: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Explanation *</label>
              <input type="text" required value={form.employeeExplanation} onChange={(e) => setForm({ ...form, employeeExplanation: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fact Finding *</label>
              <input type="text" required value={form.factFinding} onChange={(e) => setForm({ ...form, factFinding: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Manager Explanation *</label>
              <input type="text" required value={form.managerExplanation} onChange={(e) => setForm({ ...form, managerExplanation: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">My Explanation *</label>
              <input type="text" required value={form.myExplanation} onChange={(e) => setForm({ ...form, myExplanation: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>

          <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer">
            {editingId ? 'Update Performance Record' : 'Save Performance Record'}
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
                <th className="px-4 py-3 text-left font-bold text-slate-600">Department</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Designation</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">KPI</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Daily</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Weekly</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Monthly</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Revenue</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">PIP</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id || r._id} className="border-b border-slate-100 hover:bg-orange-50/30">
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.employeeName}</td>
                  <td className="px-4 py-3 text-slate-700">{r.employeeId}</td>
                  <td className="px-4 py-3 text-slate-700">{r.department}</td>
                  <td className="px-4 py-3 text-slate-700">{r.designation}</td>
                  <td className="px-4 py-3 text-slate-700">{r.kpi}</td>
                  <td className="px-4 py-3 text-slate-700">{r.dailyPerformance}</td>
                  <td className="px-4 py-3 text-slate-700">{r.weeklyPerformance}</td>
                  <td className="px-4 py-3 text-slate-700">{r.monthlyPerformance}</td>
                  <td className="px-4 py-3 text-slate-700">{r.monthlyRevenue}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.pipCase === 'Yes' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {r.pipCase}
                    </span>
                  </td>
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
